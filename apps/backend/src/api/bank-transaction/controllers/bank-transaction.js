'use strict';

const { makeBooksCrudController, relId } = require('../../../utils/books-crud');
const UID = 'api::bank-transaction.bank-transaction';

const base = makeBooksCrudController(UID, { defaultPopulate: ['bankAccount', 'organization'] });

module.exports = (params) => {
  const core = base(params);

  return {
    ...core,

    async find(ctx) {
      if (!ctx.state.user) return ctx.unauthorized();
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const q = ctx.query || {};
      const page = parseInt(q.page || '1', 10);
      const limit = Math.min(parseInt(q.limit || '20', 10), 200);
      const filters = { organization: ctx.state.orgId };
      if (q.status) filters.status = q.status;
      if (q.bankAccount) filters.bankAccount = q.bankAccount;
      if (q.from) filters.transactionDate = { ...filters.transactionDate, $gte: q.from };
      if (q.to) filters.transactionDate = { ...filters.transactionDate, $lte: q.to };

      const [results, total] = await Promise.all([
        strapi.entityService.findMany(UID, { filters, start: (page - 1) * limit, limit, sort: { transactionDate: 'desc' }, populate: ['bankAccount'] }),
        strapi.db.query(UID).count({ where: filters }),
      ]);
      return { data: results, meta: { pagination: { page, limit, total, pageCount: Math.ceil(total / limit) } } };
    },

    async uncategorized(ctx) {
      if (!ctx.state.user) return ctx.unauthorized();
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const q = ctx.query || {};
      const page = parseInt(q.page || '1', 10);
      const limit = Math.min(parseInt(q.limit || '20', 10), 200);
      const filters = { organization: ctx.state.orgId, status: 'uncategorized' };
      const [results, total] = await Promise.all([
        strapi.entityService.findMany(UID, { filters, start: (page - 1) * limit, limit, sort: { transactionDate: 'desc' }, populate: ['bankAccount'] }),
        strapi.db.query(UID).count({ where: filters }),
      ]);
      return { data: results, meta: { pagination: { page, limit, total, pageCount: Math.ceil(total / limit) } } };
    },

    async categorize(ctx) {
      if (!ctx.state.user) return ctx.unauthorized();
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const existing = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
      if (!existing) return ctx.notFound();
      if (relId(existing.organization) !== ctx.state.orgId) return ctx.forbidden();

      const body = ctx.request?.body || {};
      const { category, paymentReceivedId, paymentMadeId, expenseId } = body.data || body;
      const updateData = { status: 'categorized', category };
      if (paymentReceivedId) updateData.paymentReceived = paymentReceivedId;
      if (paymentMadeId) updateData.paymentMade = paymentMadeId;
      if (expenseId) updateData.expense = expenseId;

      const entry = await strapi.entityService.update(UID, ctx.params.id, { data: updateData });
      return { data: entry };
    },

    async bulkCategorize(ctx) {
      if (!ctx.state.user) return ctx.unauthorized();
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const body = ctx.request?.body || {};
      const { ids, category } = body.data || body;
      if (!ids || !Array.isArray(ids)) return ctx.badRequest('ids must be an array');

      const success = [];
      const failed = [];
      for (const id of ids) {
        try {
          const existing = await strapi.entityService.findOne(UID, id, { populate: ['organization'] });
          if (!existing || relId(existing.organization) !== ctx.state.orgId) {
            failed.push(id);
            continue;
          }
          await strapi.entityService.update(UID, id, { data: { status: 'categorized', category } });
          success.push(id);
        } catch (_) {
          failed.push(id);
        }
      }
      return ctx.send({ data: { success: success.length, failed } });
    },
  };
};
