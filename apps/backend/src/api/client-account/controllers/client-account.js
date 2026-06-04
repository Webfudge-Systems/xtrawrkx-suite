'use strict';

/**
 * client-account controller
 * - Requires authenticated user (ctx.state.user set by global jwt-auth middleware).
 * - All data is scoped to ctx.state.orgId (tenant isolation).
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
const { requireModuleAccess } = require('../../../utils/rbac');

const UID = 'api::client-account.client-account';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CLIENT_ACCOUNT_POPULATE_FALLBACK = [
  'assignedTo',
  'organization',
  'convertedFromLead',
  'contacts',
];
const sanitizePopulate = createPopulateSanitizer(
  new Set(['assignedTo', 'organization', 'convertedFromLead', 'contacts']),
  CLIENT_ACCOUNT_POPULATE_FALLBACK
);

function parseOptionalDate(value) {
  if (value == null || value === '') return undefined;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

module.exports = createCoreController(UID, ({ strapi }) => ({
  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'crm', 'client_accounts', 'read');
    if (denied) return denied;

    const { query, page, pageSize, sort } = readListQuery(ctx);

    const filters = { organization: ctx.state.orgId };

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
    const denied = requireModuleAccess(ctx, 'crm', 'client_accounts', 'read');
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
    const denied = requireModuleAccess(ctx, 'crm', 'client_accounts', 'write');
    if (denied) return denied;

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};

    const companyName = typeof data.companyName === 'string' ? data.companyName.trim() : '';
    const industry =
      data.industry != null && String(data.industry).trim() !== ''
        ? String(data.industry).trim()
        : '';
    const emailRaw = typeof data.email === 'string' ? data.email.trim() : '';
    if (!companyName) {
      return ctx.badRequest('Company name is required');
    }
    if (!industry) {
      return ctx.badRequest('Industry is required');
    }
    if (!emailRaw) {
      return ctx.badRequest('Company email is required');
    }
    if (!EMAIL_RE.test(emailRaw)) {
      return ctx.badRequest('Company email must be a valid email address');
    }
    data.companyName = companyName;
    data.industry = industry;
    data.email = emailRaw;

    for (const key of ['onboardingDate', 'contractStartDate', 'contractEndDate']) {
      if (data[key] != null && data[key] !== '') {
        const parsed = parseOptionalDate(data[key]);
        data[key] = parsed != null ? parsed : null;
      } else {
        delete data[key];
      }
    }

    if (data.healthScore != null && data.healthScore !== '') {
      const n = parseInt(String(data.healthScore), 10);
      if (!Number.isNaN(n)) data.healthScore = Math.min(100, Math.max(0, n));
    }
    if (data.dealValue != null && data.dealValue !== '') {
      const n = parseFloat(String(data.dealValue));
      if (!Number.isNaN(n)) data.dealValue = n;
    }

    if (data.assignedTo === '' || data.assignedTo == null) {
      delete data.assignedTo;
    } else {
      const aid = parseInt(String(data.assignedTo), 10);
      if (!Number.isNaN(aid)) data.assignedTo = aid;
      else delete data.assignedTo;
    }

    data.organization = ctx.state.orgId;
    if (!data.assignedTo && ctx.state.user?.id) {
      data.assignedTo = ctx.state.user.id;
    }

    const entry = await strapi.entityService.create(UID, { data });
    try {
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'create',
        subjectType: 'client_account',
        entity: entry,
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
    const denied = requireModuleAccess(ctx, 'crm', 'client_accounts', 'write');
    if (denied) return denied;
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne(UID, id, {
      populate: ['organization', 'assignedTo'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};
    delete data.organization;

    const entry = await strapi.entityService.update(UID, id, { data });
    const changedKeys = collectChangedKeys(data);
    try {
      const forLog =
        entry?.id != null
          ? await strapi.entityService.findOne(UID, entry.id, { populate: ['assignedTo'] })
          : entry;
      const actorName = await actorDisplayName(strapi, ctx.state.user?.id);
      const accountName =
        (forLog?.companyName || forLog?.name || 'Client account').trim() || 'Client account';
      await emitUpdateNotifications(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'client_account',
        subjectId: Number(id),
        entityName: accountName,
        changedKeys,
        stakeholderIds: assignedStakeholderIds(forLog || existing),
        previousEntity: existing,
        patch: data,
      });
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'update',
        subjectType: 'client_account',
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
    const denied = requireModuleAccess(ctx, 'crm', 'client_accounts', 'manage');
    if (denied) return denied;
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne(UID, id, {
      populate: ['organization'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }

    await strapi.entityService.delete(UID, id);
    return { data: { id } };
  },
}));
