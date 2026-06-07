'use strict';

/**
 * contact controller
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
const { attachRelationsToContacts } = require('../../../utils/crm-relation-attach');

const UID = 'api::contact.contact';

const POPULATE_FALLBACK = ['assignedTo', 'organization', 'leadCompany', 'clientAccount'];
const sanitizePopulate = createPopulateSanitizer(
  new Set(['assignedTo', 'organization', 'leadCompany', 'clientAccount']),
  POPULATE_FALLBACK
);

/** Merge client filters while always enforcing tenant org scope. */
function buildContactListFilters(orgId, extra) {
  const orgFilter = { organization: orgId };
  if (!extra || typeof extra !== 'object' || Array.isArray(extra)) return orgFilter;

  const merged = { ...extra };
  delete merged.organization;

  const keys = Object.keys(merged).filter((k) => merged[k] != null && merged[k] !== '');
  if (!keys.length) return orgFilter;

  if (!merged.$or && !merged.$and && keys.length <= 8) {
    return { ...orgFilter, ...merged };
  }

  return { $and: [orgFilter, merged] };
}

module.exports = createCoreController(UID, ({ strapi }) => ({
  async stats(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'crm', 'contacts', 'read');
    if (denied) return denied;

    const orgId = ctx.state.orgId;
    const base = { organization: orgId };

    const [total, withEmail, withPhone, withCompany] = await Promise.all([
      safeCount(strapi, UID, base, 0),
      safeCount(strapi, UID, { ...base, email: { $notNull: true } }, 0),
      safeCount(strapi, UID, { ...base, phone: { $notNull: true } }, 0),
      safeCount(
        strapi,
        UID,
        {
          $and: [
            base,
            {
              $or: [
                { companyName: { $notNull: true } },
                { leadCompany: { id: { $notNull: true } } },
              ],
            },
          ],
        },
        0
      ),
    ]);

    let facets = { sources: [], preferredContactMethods: [] };
    try {
      const rows = await strapi.entityService.findMany(UID, {
        filters: base,
        fields: ['source', 'preferredContactMethod'],
        limit: 5000,
      });
      const sources = new Set();
      const methods = new Set();
      for (const row of rows || []) {
        if (row?.source) sources.add(String(row.source).toUpperCase());
        if (row?.preferredContactMethod) {
          methods.add(String(row.preferredContactMethod).toUpperCase());
        }
      }
      facets = {
        sources: [...sources].sort((a, b) => a.localeCompare(b)),
        preferredContactMethods: [...methods].sort((a, b) => a.localeCompare(b)),
      };
    } catch (err) {
      strapi.log.warn('contact stats facets: %s', err?.message || String(err));
    }

    return { data: { total, withEmail, withPhone, withCompany, facets } };
  },

  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'crm', 'contacts', 'read');
    if (denied) return denied;

    const { query, page, pageSize, sort } = readListQuery(ctx, {
      maxPageSize: 500,
      defaultPageSize: 100,
    });

    const filters = buildContactListFilters(ctx.state.orgId, query.filters);

    let results = await strapi.entityService.findMany(UID, {
      filters,
      start: (page - 1) * pageSize,
      limit: pageSize,
      sort,
      populate: sanitizePopulate(query.populate),
    });

    if (results.length > 0) {
      results = await attachRelationsToContacts(strapi, ctx.state.orgId, results);
    }

    const total = await safeCount(strapi, UID, filters, results.length);
    const pageCount = Math.ceil(Math.max(total, 1) / pageSize);
    return { data: results, meta: { pagination: { page, pageSize, pageCount, total } } };
  },

  async findOne(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'crm', 'contacts', 'read');
    if (denied) return denied;

    const { id } = ctx.params;
    let entry = await strapi.entityService.findOne(UID, id, {
      populate: sanitizePopulate(ctx.query?.populate),
    });
    if (!entry) return ctx.notFound();
    if (orgIdFromRelation(entry.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    [entry] = await attachRelationsToContacts(strapi, ctx.state.orgId, [entry]);
    return { data: entry };
  },

  async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'crm', 'contacts', 'write');
    if (denied) return denied;

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};

    data.organization = ctx.state.orgId;
    if (!canAccess(ctx, 'crm', 'contacts', 'manage') && ctx.state.user?.id) {
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
        forLog = await strapi.entityService.findOne(UID, forLog.id, { populate: ['leadCompany'] });
      }
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'create',
        subjectType: 'contact',
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
    const denied = requireModuleAccess(ctx, 'crm', 'contacts', 'write');
    if (denied) return denied;
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne(UID, id, {
      populate: ['organization', 'leadCompany', 'assignedTo'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    const ownershipDenied = requireOwnerOrModuleManage(
      ctx,
      'crm',
      'contacts',
      existing,
      'You can only edit contacts assigned to you'
    );
    if (ownershipDenied) return ownershipDenied;

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};
    delete data.organization;
    if (!canAccess(ctx, 'crm', 'contacts', 'manage')) {
      delete data.assignedTo;
    }

    const entry = await strapi.entityService.update(UID, id, { data });
    const changedKeys = collectChangedKeys(data);
    try {
      const forLog =
        entry?.id != null
          ? await strapi.entityService.findOne(UID, entry.id, { populate: ['leadCompany', 'assignedTo'] })
          : entry;
      const actorName = await actorDisplayName(strapi, ctx.state.user?.id);
      const contactName =
        [forLog?.firstName, forLog?.lastName].filter(Boolean).join(' ').trim() ||
        forLog?.email ||
        'Contact';
      await emitUpdateNotifications(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'contact',
        subjectId: Number(id),
        entityName: contactName,
        changedKeys,
        stakeholderIds: assignedStakeholderIds(forLog || existing),
        previousEntity: existing,
        patch: data,
      });
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'update',
        subjectType: 'contact',
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
    const denied = requireModuleAccess(ctx, 'crm', 'contacts', 'manage');
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
        subjectType: 'contact',
        entity: existing,
        changedKeys: null,
      });
    } catch (_) {
      /* best-effort */
    }
    return { data: entry };
  },
}));
