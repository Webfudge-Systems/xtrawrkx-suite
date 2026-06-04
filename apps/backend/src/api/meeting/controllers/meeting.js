'use strict';

/**
 * meeting controller
 * - Requires ctx.state.user + ctx.state.orgId (global jwt-auth).
 * - CRUD is scoped to organization (tenant isolation).
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { logCrmActivity, collectChangedKeys, buildFieldChanges } = require('../../../utils/crm-activity-log');
const {
  orgIdFromRelation,
  readListQuery,
  createPopulateSanitizer,
  safeCount,
} = require('../../../utils/content-api-helpers');

const UID = 'api::meeting.meeting';
const DEAL_UID = 'api::deal.deal';

/** @param {unknown} v */
function relationIdFromPayload(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'object' && v !== null && 'id' in v) {
    const n = parseInt(String(/** @type {{ id?: unknown }} */(v).id), 10);
    return Number.isNaN(n) ? null : n;
  }
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
}

const MEETING_POPULATE_FALLBACK = [
  'organizer',
  'assignedTo',
  'organization',
  'deal',
  'clientAccount',
  'leadCompany',
  'contact',
  'attendees',
];

const sanitizePopulate = createPopulateSanitizer(
  new Set([
    'organizer',
    'assignedTo',
    'organization',
    'deal',
    'clientAccount',
    'leadCompany',
    'contact',
    'attendees',
  ]),
  MEETING_POPULATE_FALLBACK
);

module.exports = createCoreController(UID, ({ strapi }) => ({
  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const { query, page, pageSize, sort } = readListQuery(ctx, { defaultSort: 'startTime:asc' });

    const filters = { organization: ctx.state.orgId };
    const extra = query.filters;
    if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
      if (extra.status) filters.status = extra.status;
      if (extra.meetingType) filters.meetingType = extra.meetingType;
      if (extra.deal) filters.deal = extra.deal;
      if (extra.clientAccount) filters.clientAccount = extra.clientAccount;
      if (extra.leadCompany) filters.leadCompany = extra.leadCompany;
      if (extra.assignedTo) filters.assignedTo = extra.assignedTo;
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

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};

    data.organization = ctx.state.orgId;
    if (data.organizer == null && ctx.state.user?.id) {
      data.organizer = ctx.state.user.id;
    }
    if (data.assignedTo == null && ctx.state.user?.id) {
      data.assignedTo = ctx.state.user.id;
    }

    delete data.id;
    delete data.documentId;

    const caId = relationIdFromPayload(data.clientAccount);
    const lcId = relationIdFromPayload(data.leadCompany);
    const dealId = relationIdFromPayload(data.deal);
    if (!caId && !lcId) {
      return ctx.badRequest('Link the meeting to a client account or a lead company.');
    }
    if (dealId) {
      const deal = await strapi.entityService.findOne(DEAL_UID, dealId, {
        populate: ['organization', 'leadCompany', 'clientAccount'],
      });
      if (!deal) return ctx.badRequest('Deal not found');
      if (orgIdFromRelation(deal.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }
      const dLc = orgIdFromRelation(deal.leadCompany);
      const dCa = orgIdFromRelation(deal.clientAccount);
      const matchesLead = Boolean(lcId && dLc === lcId);
      const matchesAccount = Boolean(caId && dCa === caId);
      if (dLc != null || dCa != null) {
        if (!matchesLead && !matchesAccount) {
          return ctx.badRequest(
            'The selected deal must be linked to the chosen client account or lead company.'
          );
        }
      }
    }

    const entry = await strapi.entityService.create(UID, { data });
    let forLog = entry;
    try {
      if (forLog?.id != null) {
        forLog = await strapi.entityService.findOne(UID, forLog.id, {
          populate: ['organizer', 'assignedTo', 'deal', 'clientAccount', 'leadCompany', 'contact'],
        });
      }
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'create',
        subjectType: 'meeting',
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
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne(UID, id, {
      populate: ['organization', 'organizer', 'assignedTo', 'deal', 'clientAccount', 'leadCompany', 'contact'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};
    delete data.organization;

    const nextCa =
      data.clientAccount !== undefined
        ? relationIdFromPayload(data.clientAccount)
        : orgIdFromRelation(existing.clientAccount);
    const nextLc =
      data.leadCompany !== undefined
        ? relationIdFromPayload(data.leadCompany)
        : orgIdFromRelation(existing.leadCompany);
    const nextDeal =
      data.deal !== undefined ? relationIdFromPayload(data.deal) : orgIdFromRelation(existing.deal);

    if (!nextCa && !nextLc) {
      return ctx.badRequest('Link the meeting to a client account or a lead company.');
    }
    if (nextDeal) {
      const deal = await strapi.entityService.findOne(DEAL_UID, nextDeal, {
        populate: ['organization', 'leadCompany', 'clientAccount'],
      });
      if (!deal) return ctx.badRequest('Deal not found');
      if (orgIdFromRelation(deal.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }
      const dLc = orgIdFromRelation(deal.leadCompany);
      const dCa = orgIdFromRelation(deal.clientAccount);
      const matchesLead = Boolean(nextLc && dLc === nextLc);
      const matchesAccount = Boolean(nextCa && dCa === nextCa);
      if (dLc != null || dCa != null) {
        if (!matchesLead && !matchesAccount) {
          return ctx.badRequest(
            'The selected deal must be linked to the chosen client account or lead company.'
          );
        }
      }
    }

    const entry = await strapi.entityService.update(UID, id, { data });
    const changedKeys = collectChangedKeys(data);

    try {
      const forLog =
        entry?.id != null
          ? await strapi.entityService.findOne(UID, entry.id, {
            populate: ['organizer', 'assignedTo', 'deal', 'leadCompany', 'contact'],
          })
          : entry;
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'update',
        subjectType: 'meeting',
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
        subjectType: 'meeting',
        entity: existing,
        changedKeys: null,
      });
    } catch (_) {
      /* best-effort */
    }
    return { data: entry };
  },
}));
