'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const UID = 'api::chart-of-account.chart-of-account';

function orgId(ctx) { return ctx.state.orgId; }
function relId(rel) { return rel == null ? null : (typeof rel === 'object' ? rel.id : rel); }

module.exports = createCoreController(UID, ({ strapi }) => ({
  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!orgId(ctx)) return ctx.forbidden('No active organization');

    const q = ctx.query || {};
    const page = parseInt(q.page || '1', 10);
    const limit = Math.min(parseInt(q.limit || '100', 10), 200);
    const filters = { organization: orgId(ctx) };
    if (q.type) filters.accountType = q.type;
    if (q.isActive !== undefined) filters.isActive = q.isActive === 'true' || q.isActive === true;
    if (q.search) filters.accountName = { $containsi: q.search };

    const results = await strapi.entityService.findMany(UID, {
      filters,
      start: (page - 1) * limit,
      limit,
      sort: { accountCode: 'ASC' },
    });
    const total = await strapi.db.query(UID).count({ where: filters });
    return { data: results, meta: { pagination: { page, limit, total, pageCount: Math.ceil(total / limit) } } };
  },

  async findOne(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!orgId(ctx)) return ctx.forbidden('No active organization');
    const entry = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
    if (!entry) return ctx.notFound();
    if (relId(entry.organization) !== orgId(ctx)) return ctx.forbidden();
    return { data: entry };
  },

  async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!orgId(ctx)) return ctx.forbidden('No active organization');
    const body = ctx.request?.body || {};
    const data = { ...(body.data || body), organization: orgId(ctx), createdByUser: ctx.state.user.id };
    delete data.id;
    const entry = await strapi.entityService.create(UID, { data });
    return { data: entry };
  },

  async update(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!orgId(ctx)) return ctx.forbidden('No active organization');
    const existing = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
    if (!existing) return ctx.notFound();
    if (relId(existing.organization) !== orgId(ctx)) return ctx.forbidden();
    if (existing.isSystem) return ctx.forbidden('System accounts cannot be modified');
    const body = ctx.request?.body || {};
    const data = { ...(body.data || body) };
    delete data.organization;
    delete data.isSystem;
    const entry = await strapi.entityService.update(UID, ctx.params.id, { data });
    return { data: entry };
  },

  async delete(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!orgId(ctx)) return ctx.forbidden('No active organization');
    const existing = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
    if (!existing) return ctx.notFound();
    if (relId(existing.organization) !== orgId(ctx)) return ctx.forbidden();
    if (existing.isSystem) return ctx.forbidden('System accounts cannot be deleted');
    const entry = await strapi.entityService.delete(UID, ctx.params.id);
    return { data: entry };
  },

  async trialBalance(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!orgId(ctx)) return ctx.forbidden('No active organization');

    const accounts = await strapi.entityService.findMany(UID, {
      filters: { organization: orgId(ctx), isActive: true },
      sort: { accountCode: 'ASC' },
      limit: 500,
    });

    const rows = accounts.map((acc) => {
      const bal = acc.currentBalance || 0;
      const drTypes = ['asset', 'expense', 'cost_of_goods_sold', 'other_expense'];
      const isDebitNormal = drTypes.includes(acc.accountType);
      return {
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        debitTotal: isDebitNormal && bal > 0 ? bal : 0,
        creditTotal: !isDebitNormal && bal > 0 ? bal : 0,
        balance: bal,
      };
    });

    return { data: rows };
  },
}));
