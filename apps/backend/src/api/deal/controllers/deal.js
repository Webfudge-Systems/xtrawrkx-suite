'use strict';

/**
 * deal controller
 * - Requires ctx.state.user + ctx.state.orgId (global jwt-auth).
 * - CRUD is scoped to organization (tenant isolation).
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { logCrmActivity, collectChangedKeys, actorDisplayName } = require('../../../utils/crm-activity-log');
const { emitUpdateNotifications, assignedStakeholderIds } = require('../../../utils/notification-emitter');
const {
  orgIdFromRelation,
  readListQuery,
  createPopulateSanitizer,
  safeCount,
} = require('../../../utils/content-api-helpers');
const { canAccess, requireModuleAccess, requireOwnerOrModuleManage } = require('../../../utils/rbac');

const UID = 'api::deal.deal';
const PROJECT_UID = 'api::project.project';

const DEAL_POPULATE_FALLBACK = [
  'assignedTo',
  'organization',
  'leadCompany',
  'clientAccount',
  'contact',
  'deliveryProject',
];
const sanitizePopulate = createPopulateSanitizer(
  new Set([
    'assignedTo',
    'organization',
    'leadCompany',
    'clientAccount',
    'contact',
    'deliveryProject',
  ]),
  DEAL_POPULATE_FALLBACK
);

module.exports = createCoreController(UID, ({ strapi }) => ({
  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'crm', 'deals', 'read');
    if (denied) return denied;

    const { query, page, pageSize, sort } = readListQuery(ctx);

    const filters = { organization: ctx.state.orgId };
    const extra = query.filters;
    if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
      if (extra.leadCompany) filters.leadCompany = extra.leadCompany;
      if (extra.clientAccount) filters.clientAccount = extra.clientAccount;
      if (extra.stage) filters.stage = extra.stage;
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
    const denied = requireModuleAccess(ctx, 'crm', 'deals', 'read');
    if (denied) return denied;

    const { id } = ctx.params;
    const entry = await strapi.entityService.findOne(UID, id, {
      populate: sanitizePopulate(ctx.query?.populate),
    });
    if (!entry) return ctx.notFound();
    if (orgIdFromRelation(entry.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    return { data: entry };
  },

  async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'crm', 'deals', 'write');
    if (denied) return denied;

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};

    data.organization = ctx.state.orgId;
    if (!canAccess(ctx, 'crm', 'deals', 'manage') && ctx.state.user?.id) {
      data.assignedTo = ctx.state.user.id;
    } else if (data.assignedTo == null && ctx.state.user?.id) {
      data.assignedTo = ctx.state.user.id;
    }

    delete data.id;
    delete data.documentId;

    const entry = await strapi.entityService.create(UID, { data });
    let forLog = entry;
    try {
      if (forLog?.id != null) {
        forLog = await strapi.entityService.findOne(UID, forLog.id, {
          populate: ['leadCompany', 'clientAccount', 'contact', 'assignedTo'],
        });
      }
      try {
        const { seedDealTasks } = require('../../../utils/deal-task-seed');
        await seedDealTasks(strapi, forLog, ctx.state.orgId);
      } catch (seedErr) {
        strapi.log.warn('[deal.create] seedDealTasks:', seedErr?.message || seedErr);
      }
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'create',
        subjectType: 'deal',
        entity: forLog,
        changedKeys: null,
      });
    } catch (_) {
      /* logging is best-effort */
    }
    return { data: entry };
  },

  async update(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'crm', 'deals', 'write');
    if (denied) return denied;
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne(UID, id, {
      populate: ['organization', 'leadCompany', 'contact', 'assignedTo'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    const ownershipDenied = requireOwnerOrModuleManage(
      ctx,
      'crm',
      'deals',
      existing,
      'You can only edit deals assigned to you'
    );
    if (ownershipDenied) return ownershipDenied;

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};
    delete data.organization;
    if (!canAccess(ctx, 'crm', 'deals', 'manage')) {
      delete data.assignedTo;
    }

    let entry = await strapi.entityService.update(UID, id, { data });
    const changedKeys = collectChangedKeys(data);

    // When a deal is won, link an existing client account converted from the same lead (Clients module).
    try {
      const fresh = await strapi.entityService.findOne(UID, id, {
        populate: ['clientAccount', 'leadCompany', 'organization'],
      });
      const stageNow = fresh?.stage;
      const caId = orgIdFromRelation(fresh?.clientAccount);
      const lcRel = fresh?.leadCompany;
      const lcId =
        lcRel == null ? null : typeof lcRel === 'object' ? lcRel.id ?? null : parseInt(String(lcRel), 10);
      if (stageNow === 'won' && !caId && lcId && !Number.isNaN(lcId)) {
        const matches = await strapi.entityService.findMany('api::client-account.client-account', {
          filters: { organization: ctx.state.orgId, convertedFromLead: lcId },
          limit: 1,
        });
        if (matches.length) {
          entry = await strapi.entityService.update(UID, id, {
            data: { clientAccount: matches[0].id },
          });
        }
      }
    } catch (_) {
      /* non-blocking */
    }

    try {
      const forLog =
        entry?.id != null
          ? await strapi.entityService.findOne(UID, entry.id, {
              populate: ['leadCompany', 'contact', 'assignedTo'],
            })
          : entry;
      const actorName = await actorDisplayName(strapi, ctx.state.user?.id);
      await emitUpdateNotifications(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'deal',
        subjectId: Number(id),
        entityName: (forLog?.name || 'Deal').trim() || 'Deal',
        changedKeys,
        stakeholderIds: assignedStakeholderIds(forLog || existing),
        previousEntity: existing,
        patch: data,
      });
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'update',
        subjectType: 'deal',
        entity: forLog,
        changedKeys,
        previousEntity: existing,
        patch: data,
      });
    } catch (_) {
      /* best-effort */
    }
    return { data: entry };
  },

  async delete(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'crm', 'deals', 'manage');
    if (denied) return denied;
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne(UID, id, {
      populate: ['organization', 'leadCompany'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }

    const entry = await strapi.entityService.delete(UID, id);
    try {
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'delete',
        subjectType: 'deal',
        entity: existing,
        changedKeys: null,
      });
    } catch (_) {
      /* best-effort */
    }
    return { data: entry };
  },

  /**
   * POST /deals/:id/delivery-project — create a project linked to a won deal (one-to-one via project.sourceDeal).
   */
  async createDeliveryProject(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const { id } = ctx.params;
    const dealId = parseInt(id, 10);
    if (Number.isNaN(dealId)) return ctx.badRequest('Invalid deal id');

    const deal = await strapi.entityService.findOne(UID, dealId, {
      populate: ['organization', 'deliveryProject', 'leadCompany', 'assignedTo'],
    });
    if (!deal) return ctx.notFound();
    if (orgIdFromRelation(deal.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    const ownershipDenied = requireOwnerOrModuleManage(
      ctx,
      'crm',
      'deals',
      deal,
      'You can only create delivery projects for deals assigned to you'
    );
    if (ownershipDenied) return ownershipDenied;
    if (deal.stage !== 'won') {
      return ctx.badRequest('Deal must be won before creating a delivery project');
    }

    const existing = deal.deliveryProject;
    if (existing != null) {
      const pid = typeof existing === 'object' ? existing.id ?? null : parseInt(String(existing), 10);
      if (pid != null && !Number.isNaN(pid)) {
        const project = await strapi.entityService.findOne(PROJECT_UID, pid);
        if (project) return { data: project };
      }
    }

    const name = (deal.name && String(deal.name).trim()) || 'Delivery project';
    const data = {
      name,
      description: deal.description || undefined,
      organization: ctx.state.orgId,
      sourceDeal: dealId,
      status: 'PLANNING',
    };
    const pmId = orgIdFromRelation(deal.assignedTo);
    if (pmId) data.projectManager = pmId;
    const leadId = orgIdFromRelation(deal.leadCompany);
    if (leadId) data.clientAccount = leadId;

    const project = await strapi.entityService.create(PROJECT_UID, { data });
    return { data: project };
  },
}));
