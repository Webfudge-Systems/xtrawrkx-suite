'use strict';

/**
 * project controller
 * - Requires ctx.state.user + ctx.state.orgId (global jwt-auth).
 * - CRUD is scoped to organization (tenant isolation).
 */

const { createCoreController } = require('@strapi/strapi').factories;
const {
  orgIdFromRelation,
  readListQuery,
  createPopulateSanitizer,
  safeCount,
  resolveEntityPkForRouteParam,
} = require('../../../utils/content-api-helpers');
const { logCrmActivity, collectChangedKeys, actorDisplayName } = require('../../../utils/crm-activity-log');
const { emitUpdateNotifications, projectStakeholderIds } = require('../../../utils/notification-emitter');
const {
  requireModuleAccess,
  isPmOrgAdminRole,
  isPmOrgManagerRole,
  isPmOrgMemberRole,
  buildProjectListFiltersForUser,
  userCanAccessProjectRow,
  userCanViewProjectRow,
} = require('../../../utils/rbac');

const { relId } = require('../../../utils/books-crud');
const { buildCommentMeta } = require('../../../utils/entity-attachments');
const {
  resolveClientPortalSession,
  clientAccountIdFromSession,
} = require('../../../utils/client-portal-request');

const CRM_ACTIVITY_UID = 'api::crm-activity.crm-activity';

function buildClientProjectSlug(name) {
  const base =
    String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'project';
  return `${base}-${Date.now()}`;
}

const UID = 'api::project.project';
const TASK_UID = 'api::task.task';
const CLIENT_ACCOUNT_UID = 'api::client-account.client-account';

function clientActorFromSession(session, accountId) {
  const contact = session?.contact || {};
  const email = contact.email || session.user?.email || session.account?.email || '';
  const firstName = (contact.firstName || '').trim();
  const lastName = (contact.lastName || '').trim();
  const name =
    [firstName, lastName].filter(Boolean).join(' ') ||
    session.account?.companyName ||
    (email ? email.split('@')[0] : '') ||
    'Client';
  return {
    id: contact.id != null ? `contact-${contact.id}` : `client-${accountId}`,
    username: name,
    name,
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    email,
  };
}

function mapClientActivityRow(row) {
  if (!row) return row;
  const meta = row.meta || {};
  if (!row.actor && meta.clientActor) {
    return { ...row, actor: meta.clientActor };
  }
  return row;
}

function projectSubjectId(project) {
  if (!project) return null;
  const raw = project.id ?? project.documentId;
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function resolveProjectSubjectId(strapi, project, routeParam) {
  const direct = projectSubjectId(project);
  if (direct != null) return direct;
  if (routeParam == null || String(routeParam).trim() === '') return null;
  return resolveEntityPkForRouteParam(strapi, UID, routeParam);
}

async function fetchProjectCrmActivities(strapi, { subjectId, type, limit }) {
  const sid = Number(subjectId);
  if (!Number.isFinite(sid) || sid <= 0) return { rows: [], total: 0 };

  const baseWhere = { subjectType: 'project', subjectId: sid };

  if (type === 'comment') {
    const where = { ...baseWhere, action: 'comment' };
    const [rows, total] = await Promise.all([
      strapi.db.query(CRM_ACTIVITY_UID).findMany({
        where,
        orderBy: { createdAt: 'desc' },
        limit,
        populate: ['actor'],
      }),
      strapi.db.query(CRM_ACTIVITY_UID).count({ where }),
    ]);
    return { rows: Array.isArray(rows) ? rows : [], total: Number(total) || 0 };
  }

  if (type === 'activity') {
    const rows = await strapi.db.query(CRM_ACTIVITY_UID).findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      limit: Math.min(Math.max(limit * 4, limit), 400),
      populate: ['actor'],
    });
    const filtered = (Array.isArray(rows) ? rows : []).filter(
      (row) => String(row?.action || '').toLowerCase() !== 'comment'
    );
    let total = filtered.length;
    try {
      total = await strapi.db.query(CRM_ACTIVITY_UID).count({
        where: { ...baseWhere, action: { $ne: 'comment' } },
      });
    } catch (_) {
      /* fall back to filtered length */
    }
    return { rows: filtered.slice(0, limit), total: Number(total) || filtered.length };
  }

  const [rows, total] = await Promise.all([
    strapi.db.query(CRM_ACTIVITY_UID).findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      limit,
      populate: ['actor'],
    }),
    strapi.db.query(CRM_ACTIVITY_UID).count({ where: baseWhere }),
  ]);
  return { rows: Array.isArray(rows) ? rows : [], total: Number(total) || 0 };
}

async function resolveClientProjectOrgId(strapi, project, accountId) {
  let orgId = orgIdFromRelation(project?.organization) ?? relId(project?.organization);
  if (orgId) return orgId;

  if (accountId) {
    const account = await strapi.entityService.findOne(CLIENT_ACCOUNT_UID, accountId, {
      populate: ['organization'],
    });
    orgId = orgIdFromRelation(account?.organization) ?? relId(account?.organization);
    if (orgId) return orgId;
  }

  return null;
}

async function ensureProjectBootstrapActivity(strapi, { project, orgId, routeParam }) {
  const subjectId = await resolveProjectSubjectId(strapi, project, routeParam);
  if (!subjectId) return;

  const existing = await strapi.db.query(CRM_ACTIVITY_UID).count({
    where: { subjectType: 'project', subjectId },
  });
  if (existing > 0) return;

  const projectName = (project.name || 'Project').trim() || 'Project';
  try {
    await strapi.entityService.create(CRM_ACTIVITY_UID, {
      data: {
        ...(orgId ? { organization: orgId } : {}),
        actor: null,
        action: 'create',
        subjectType: 'project',
        subjectId,
        summary: `Project "${projectName}" was created`,
        meta: { kind: 'bootstrap_project_activity' },
      },
    });
  } catch (_) {
    /* best-effort */
  }
}

async function resolveClientProject(strapi, ctx) {
  const session = await resolveClientPortalSession(strapi, ctx);
  if (!session) return { error: ctx.unauthorized('Client authentication required') };

  const accountId = clientAccountIdFromSession(session);
  if (!accountId) return { error: ctx.badRequest('Client account not found in session') };

  const rawId = ctx.params?.id;
  if (!rawId) return { error: ctx.badRequest('Project id is required') };

  const isNumeric = /^\d+$/.test(String(rawId));
  let project = null;

  if (isNumeric) {
    project = await strapi.entityService.findOne(UID, Number(rawId), {
      populate: ['clientAccount', 'organization'],
    });
  } else {
    const rows = await strapi.entityService.findMany(UID, {
      filters: { slug: String(rawId) },
      limit: 1,
      populate: ['clientAccount', 'organization'],
    });
    project = rows?.[0] || null;
  }

  if (!project) return { error: ctx.notFound('Project not found') };

  const projectAccountId = relId(project.clientAccount);
  if (projectAccountId == null || Number(projectAccountId) !== Number(accountId)) {
    return { error: ctx.forbidden('Access denied') };
  }

  const orgId = await resolveClientProjectOrgId(strapi, project, accountId);
  return { session, project, accountId, orgId };
}

async function recomputeFinancials(projectId) {
  const tasks = await strapi.entityService.findMany(TASK_UID, {
    filters: { timeProject: projectId },
    limit: 10000,
  });

  const totalLoggedHours = tasks.reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0);
  const billableHours = tasks
    .filter((t) => t.billable && !t.invoiced)
    .reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0);

  const project = await strapi.entityService.findOne(UID, projectId);
  const unbilledAmount = Math.round(billableHours * (project?.hourlyRate || 0));

  await strapi.entityService.update(UID, projectId, {
    data: {
      totalLoggedHours: Math.round(totalLoggedHours * 100) / 100,
      billableHours: Math.round(billableHours * 100) / 100,
      unbilledAmount,
    },
  });
}

const ALLOWED_POPULATE = new Set([
  'projectManager',
  'teamMembers',
  'tasks',
  'clientAccount',
  'organization',
  'sourceDeal',
]);

const sanitizePopulate = createPopulateSanitizer(ALLOWED_POPULATE, [
  'projectManager',
  'clientAccount',
  'organization',
  'sourceDeal',
]);

async function assertClientAccountInOrg(strapi, clientAccountId, orgId) {
  if (clientAccountId == null || clientAccountId === '') return null;
  const id =
    typeof clientAccountId === 'object'
      ? clientAccountId.id ?? clientAccountId.documentId
      : Number(clientAccountId);
  if (!id || Number.isNaN(id)) return 'Invalid client account';
  const row = await strapi.entityService.findOne(CLIENT_ACCOUNT_UID, id, {
    populate: ['organization'],
  });
  if (!row || orgIdFromRelation(row.organization) !== orgId) {
    return 'Client account not found in this organization';
  }
  return null;
}

module.exports = createCoreController(UID, ({ strapi }) => ({
  /**
   * Org client accounts for PM project client picker (PM projects read; no CRM module required on client).
   */
  async clientOptions(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'projects', 'read');
    if (denied) return denied;

    const rows = await strapi.entityService.findMany(CLIENT_ACCOUNT_UID, {
      filters: { organization: ctx.state.orgId },
      fields: ['companyName', 'status'],
      sort: { companyName: 'asc' },
      limit: 500,
    });

    const data = (rows || []).map((row) => ({
      id: row.id,
      companyName: row.companyName || '',
      status: row.status || null,
      label: row.companyName || `Account ${row.id}`,
    }));

    return { data };
  },

  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'projects', 'read');
    if (denied) return denied;

    const { query, page, pageSize, sort } = readListQuery(ctx, {
      maxPageSize: 500,
      defaultPageSize: 25,
      defaultSort: 'updatedAt:desc',
    });

    const baseFilters = buildProjectListFiltersForUser(ctx, ctx.state.orgId, ctx.state.user?.id);
    const filters = { ...baseFilters };
    const extra = query.filters;
    if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
      if (extra.clientAccount) filters.clientAccount = extra.clientAccount;
      if (extra.status) filters.status = extra.status;
      if (extra.sourceDeal) filters.sourceDeal = extra.sourceDeal;
    }

    const results = await strapi.entityService.findMany(UID, {
      filters,
      start: (page - 1) * pageSize,
      limit: pageSize,
      sort,
      populate: sanitizePopulate(query.populate),
    });

    const total = await safeCount(strapi, UID, filters, results.length);
    const pageCount = Math.ceil(Math.max(total, 1) / pageSize);
    return { data: results, meta: { pagination: { page, pageSize, pageCount, total } } };
  },

  async findOne(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'projects', 'read');
    if (denied) return denied;

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const sanitized = sanitizePopulate(ctx.query?.populate);
    const populate = [...new Set([...(Array.isArray(sanitized) ? sanitized : []), 'organization'])];
    const entry = await strapi.entityService.findOne(UID, pk, {
      populate,
    });
    if (!entry) return ctx.notFound();
    if (orgIdFromRelation(entry.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    if (!isPmOrgAdminRole(ctx) && ctx.state.user?.id) {
      const gate = await strapi.entityService.findOne(UID, pk, {
        populate: ['teamMembers', 'projectManager'],
        fields: ['isPrivate'],
      });
      if (!userCanViewProjectRow(ctx, gate, ctx.state.user.id)) {
        return ctx.forbidden('Access denied');
      }
    }
    return { data: entry };
  },

  async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'projects', 'write');
    if (denied) return denied;
    if (isPmOrgMemberRole(ctx)) {
      return ctx.forbidden('Members cannot create projects');
    }

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};

    data.organization = ctx.state.orgId;
    if (data.projectManager == null && ctx.state.user?.id) {
      data.projectManager = ctx.state.user.id;
    }

    delete data.id;
    delete data.documentId;

    if (data.clientAccount != null && data.clientAccount !== '') {
      const clientErr = await assertClientAccountInOrg(strapi, data.clientAccount, ctx.state.orgId);
      if (clientErr) return ctx.badRequest(clientErr);
    }

    const entry = await strapi.entityService.create(UID, { data });
    try {
      const lookupKey = entry?.id ?? entry?.documentId;
      const forLog =
        lookupKey != null
          ? await strapi.entityService.findOne(UID, lookupKey, {
              populate: ['projectManager', 'clientAccount', 'teamMembers'],
            })
          : entry;
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'create',
        subjectType: 'project',
        entity: forLog,
        changedKeys: null,
      });
    } catch (_) {
      /* best-effort */
    }
    return { data: entry };
  },

  async update(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'projects', 'write');
    if (denied) return denied;

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const existing = await strapi.entityService.findOne(UID, pk, {
      populate: ['organization', 'projectManager', 'clientAccount', 'teamMembers'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    if (isPmOrgMemberRole(ctx)) {
      return ctx.forbidden('Members cannot edit project settings');
    }
    if (
      isPmOrgManagerRole(ctx) &&
      !isPmOrgAdminRole(ctx) &&
      ctx.state.user?.id &&
      !userCanAccessProjectRow(existing, ctx.state.user.id)
    ) {
      return ctx.forbidden('You can only edit projects you are assigned to manage');
    }

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};
    delete data.organization;

    if (Object.prototype.hasOwnProperty.call(data, 'clientAccount') && data.clientAccount !== '') {
      const clientErr = await assertClientAccountInOrg(strapi, data.clientAccount, ctx.state.orgId);
      if (clientErr) return ctx.badRequest(clientErr);
    }

    await strapi.entityService.update(UID, pk, { data });
    const changedKeys = collectChangedKeys(data);

    // Reload full row for response + timeline — Strapi 5 update() may omit numeric `id` on the
    // returned entry, which caused logCrmActivity to skip so name edits never appeared.
    const forLog = await strapi.entityService.findOne(UID, pk, {
      populate: ['projectManager', 'clientAccount', 'teamMembers'],
    });

    try {
      const actorName = await actorDisplayName(strapi, ctx.state.user?.id);
      await emitUpdateNotifications(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'project',
        subjectId: pk,
        entityName: (forLog?.name || 'Project').trim() || 'Project',
        changedKeys,
        stakeholderIds: projectStakeholderIds(existing),
        previousEntity: existing,
        patch: data,
      });
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'update',
        subjectType: 'project',
        entity: forLog,
        subjectId: pk,
        changedKeys,
        previousEntity: existing,
        patch: data,
      });
    } catch (_) {
      /* best-effort */
    }
    return { data: forLog };
  },

  async delete(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'projects', 'manage');
    if (denied) return denied;

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const existing = await strapi.entityService.findOne(UID, pk, {
      populate: ['organization'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    if (
      isPmOrgManagerRole(ctx) &&
      !isPmOrgAdminRole(ctx) &&
      ctx.state.user?.id &&
      !userCanAccessProjectRow(existing, ctx.state.user.id)
    ) {
      return ctx.forbidden('You can only delete projects you are assigned to manage');
    }

    const entry = await strapi.entityService.delete(UID, pk);
    try {
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'delete',
        subjectType: 'project',
        entity: existing,
        changedKeys: null,
      });
    } catch (_) {
      /* best-effort */
    }
    return { data: entry };
  },

  async summary(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const project = await strapi.entityService.findOne(UID, pk, {
      populate: ['organization', 'customer'],
    });
    if (!project) return ctx.notFound();
    if (orgIdFromRelation(project.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    if (!isPmOrgAdminRole(ctx) && ctx.state.user?.id) {
      const gate = await strapi.entityService.findOne(UID, pk, {
        populate: ['teamMembers', 'projectManager'],
        fields: ['isPrivate'],
      });
      if (!userCanViewProjectRow(ctx, gate, ctx.state.user.id)) {
        return ctx.forbidden('Access denied');
      }
    }

    const tasks = await strapi.entityService
      .findMany(TASK_UID, {
        filters: { timeProject: pk, organization: ctx.state.orgId },
        limit: 10000,
      })
      .catch(() => []);

    const totalLoggedHours = tasks.reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0);
    const billableHours = tasks
      .filter((t) => t.billable && !t.invoiced)
      .reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0);

    const invoices = await strapi.entityService
      .findMany('api::invoice.invoice', {
        filters: { project: pk, organization: ctx.state.orgId },
        limit: 1000,
      })
      .catch(() => []);

    const paymentsReceived = await strapi.entityService
      .findMany('api::payment-received.payment-received', {
        filters: { organization: ctx.state.orgId },
        populate: ['invoice'],
        limit: 5000,
      })
      .catch(() => []);

    const invoiceIds = new Set(invoices.map((i) => i.id));
    const totalRevenue = paymentsReceived
      .filter((p) => p.invoice && invoiceIds.has(relId(p.invoice)))
      .reduce((s, p) => s + (p.amount || 0), 0);

    const expenses = await strapi.entityService
      .findMany('api::expense.expense', {
        filters: { project: pk, organization: ctx.state.orgId },
        limit: 1000,
      })
      .catch(() => []);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

    return ctx.send({
      data: {
        totalLoggedHours: Math.round(totalLoggedHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        unbilledHours: Math.round(
          (totalLoggedHours -
            tasks
              .filter((t) => t.invoiced)
              .reduce((s, t) => s + (parseFloat(t.hoursLogged) || 0), 0)) *
            100
        ) / 100,
        totalRevenue,
        totalExpenses,
        profitability: totalRevenue - totalExpenses,
        budgetBurnPercent: project.budgetAmount
          ? Math.round((totalExpenses / project.budgetAmount) * 100)
          : 0,
        invoiceCount: invoices.length,
        paidInvoiceCount: invoices.filter((i) => i.status === 'paid' || i.status === 'PAID').length,
      },
    });
  },

  /**
   * GET /projects/list-for-client?clientAccountId=
   * Returns projects linked to the authenticated client's account.
   */
  async listForClient(ctx) {
    const raw =
      ctx.query.clientAccountId ?? ctx.query.accountId ?? ctx.query.id;
    if (!raw) return ctx.badRequest('clientAccountId is required');

    const session = await resolveClientPortalSession(strapi, ctx);
    const idStr = String(raw).trim();
    const isNumeric = /^\d+$/.test(idStr);
    const account = await strapi.db.query(CLIENT_ACCOUNT_UID).findOne({
      where: isNumeric ? { id: Number(idStr) } : { documentId: idStr },
      select: ['id'],
    });

    if (!account) {
      return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
    }

    if (session) {
      const sessionAccountId = clientAccountIdFromSession(session);
      if (sessionAccountId != null && Number(sessionAccountId) !== Number(account.id)) {
        return ctx.forbidden('Access denied');
      }
    }

    const pageSize = Math.min(Math.max(Number(ctx.query.pageSize) || 100, 1), 200);

    const rows = await strapi.entityService.findMany(UID, {
      filters: { clientAccount: account.id },
      limit: pageSize,
      sort: { updatedAt: 'desc' },
      populate: sanitizePopulate(
        ctx.query?.populate || ['projectManager', 'teamMembers', 'clientAccount', 'tasks']
      ),
    });

    return ctx.send({
      data: rows,
      meta: { pagination: { total: rows.length, pageSize: rows.length } },
    });
  },

  /**
   * POST /projects/client-create
   * Client portal project creation — scoped to the authenticated client account.
   */
  async clientCreate(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) return ctx.unauthorized('Client authentication required');

    const accountId = clientAccountIdFromSession(session);
    if (!accountId) return ctx.badRequest('Client account not found in session');

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const name = (payload.name || '').trim();
    if (!name) return ctx.badRequest('Project name is required');

    const account = await strapi.entityService.findOne(CLIENT_ACCOUNT_UID, accountId, {
      populate: ['organization'],
    });
    if (!account) return ctx.notFound('Client account not found');

    const orgId = orgIdFromRelation(account.organization);
    if (!orgId) return ctx.badRequest('Client account is not linked to an organization');

    const allowedStatuses = new Set([
      'PLANNING',
      'PLANNED',
      'ACTIVE',
      'IN_PROGRESS',
      'ON_HOLD',
      'COMPLETED',
      'CANCELLED',
    ]);
    const status = String(payload.status || 'PLANNING').toUpperCase();

    const data = {
      name,
      slug: (payload.slug || '').trim() || buildClientProjectSlug(name),
      description: payload.description || null,
      status: allowedStatuses.has(status) ? status : 'PLANNING',
      clientAccount: account.id,
      organization: orgId,
      icon: (payload.icon || name.charAt(0).toUpperCase() || 'P').slice(0, 1),
    };

    if (payload.startDate) data.startDate = payload.startDate;
    if (payload.endDate) data.endDate = payload.endDate;

    const entry = await strapi.entityService.create(UID, { data });
    try {
      const clientActor = clientActorFromSession(session, accountId);
      const actorName = clientActor.username || clientActor.email || 'Client';
      const subjectId = projectSubjectId(entry) ?? (await resolveEntityPkForRouteParam(strapi, UID, entry?.documentId));
      if (subjectId) {
        await strapi.entityService.create(CRM_ACTIVITY_UID, {
          data: {
            ...(orgId ? { organization: orgId } : {}),
            actor: null,
            action: 'create',
            subjectType: 'project',
            subjectId,
            summary: `${actorName} created project "${name}"`,
            meta: {
              clientActor,
              kind: 'client_project_created',
            },
          },
        });
      }
    } catch (_) {
      /* best-effort activity log */
    }
    return ctx.send({ data: entry });
  },

  /**
   * GET /projects/get-for-client/:id
   * Single project for client portal (id or slug), scoped to session account.
   */
  async getForClient(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) return ctx.unauthorized('Client authentication required');

    const accountId = clientAccountIdFromSession(session);
    if (!accountId) return ctx.badRequest('Client account not found in session');

    const identifier = ctx.params.id || ctx.query.id;
    if (!identifier) return ctx.badRequest('Project id is required');

    const populate = sanitizePopulate(
      ctx.query?.populate || [
        'projectManager',
        'teamMembers',
        'clientAccount',
        'tasks',
        'tasks.assignee',
      ]
    );

    const isNumeric = /^\d+$/.test(String(identifier));
    let project = null;

    if (isNumeric) {
      project = await strapi.entityService.findOne(UID, Number(identifier), { populate });
    } else {
      const rows = await strapi.entityService.findMany(UID, {
        filters: { slug: String(identifier) },
        limit: 1,
        populate,
      });
      project = rows?.[0] || null;
    }

    if (!project) return ctx.notFound();

    const projectAccountId = relId(project.clientAccount);
    if (projectAccountId == null || Number(projectAccountId) !== Number(accountId)) {
      return ctx.forbidden('Access denied');
    }

    return ctx.send({ data: project });
  },

  /**
   * GET /projects/:id/client-timeline
   */
  async clientTimeline(ctx) {
    const resolved = await resolveClientProject(strapi, ctx);
    if (resolved.error) return resolved.error;

    const { project, orgId } = resolved;
    const routeParam = ctx.params?.id;
    const subjectId = await resolveProjectSubjectId(strapi, project, routeParam);
    if (!subjectId) return ctx.badRequest('Invalid project id');

    await ensureProjectBootstrapActivity(strapi, { project, orgId, routeParam });

    const q = ctx.query || {};
    const limit = Math.min(Math.max(Number(q.limit) || 80, 1), 100);
    const type = String(q.type || '').trim().toLowerCase();

    const { rows, total } = await fetchProjectCrmActivities(strapi, {
      subjectId,
      type,
      limit,
    });
    const data = rows.map(mapClientActivityRow);
    return ctx.send({ data, meta: { total } });
  },

  /**
   * POST /projects/:id/client-comment
   */
  async clientComment(ctx) {
    const resolved = await resolveClientProject(strapi, ctx);
    if (resolved.error) return resolved.error;

    const { session, project, accountId, orgId } = resolved;
    const comment = String(ctx.request.body?.comment || '').trim();
    if (!comment) return ctx.badRequest('comment is required');

    const subjectId = await resolveProjectSubjectId(strapi, project, ctx.params?.id);
    if (!subjectId) return ctx.badRequest('Invalid project id');

    const resolvedOrgId = orgId ?? (await resolveClientProjectOrgId(strapi, project, accountId));
    const clientActor = clientActorFromSession(session, accountId);
    const actorName = clientActor.username || clientActor.email || 'Client';
    const projectName = (project.name || 'Project').trim() || 'Project';

    const entry = await strapi.entityService.create(CRM_ACTIVITY_UID, {
      data: {
        ...(resolvedOrgId ? { organization: resolvedOrgId } : {}),
        actor: null,
        action: 'comment',
        subjectType: 'project',
        subjectId,
        summary: `${actorName} commented on project "${projectName}"`,
        meta: {
          ...buildCommentMeta({ comment }),
          clientActor,
        },
      },
      populate: ['actor'],
    });

    return ctx.send({ data: mapClientActivityRow(entry) });
  },

  /**
   * GET /projects/client-comment-counts?projectIds=1,2,3
   */
  async clientCommentCounts(ctx) {
    const session = await resolveClientPortalSession(strapi, ctx);
    if (!session) return ctx.unauthorized('Client authentication required');

    const accountId = clientAccountIdFromSession(session);
    if (!accountId) return ctx.badRequest('Client account not found in session');

    const raw = ctx.query.projectIds ?? ctx.query['projectIds'];
    const list = Array.isArray(raw)
      ? raw
      : String(raw || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    if (!list.length) return ctx.send({ data: {} });

    const ids = [];
    for (const idRaw of list) {
      const n = Number(idRaw);
      if (Number.isFinite(n) && n > 0) ids.push(n);
    }
    if (!ids.length) return ctx.send({ data: {} });

    const projects = await strapi.entityService.findMany(UID, {
      filters: { id: { $in: ids }, clientAccount: accountId },
      fields: ['id'],
      limit: ids.length,
    });
    const allowedIds = (projects || []).map((p) => p.id).filter(Boolean);
    if (!allowedIds.length) return ctx.send({ data: {} });

    const counts = {};
    await Promise.all(
      allowedIds.map(async (projectId) => {
        const count = await strapi.db.query(CRM_ACTIVITY_UID).count({
          where: {
            subjectType: 'project',
            subjectId: projectId,
            action: 'comment',
          },
        });
        counts[String(projectId)] = count;
      })
    );

    return ctx.send({ data: counts });
  },
}));

module.exports.recomputeFinancials = recomputeFinancials;
