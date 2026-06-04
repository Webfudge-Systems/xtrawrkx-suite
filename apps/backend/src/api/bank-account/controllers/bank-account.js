'use strict';

const { makeBooksCrudController, relId } = require('../../../utils/books-crud');
const UID = 'api::bank-account.bank-account';
const TXN_UID = 'api::bank-transaction.bank-transaction';

const base = makeBooksCrudController(UID, { defaultPopulate: ['organization'] });

module.exports = (params) => {
  const core = base(params);

  return {
    ...core,

    async transactions(ctx) {
      if (!ctx.state.user) return ctx.unauthorized();
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');

      const acct = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
      if (!acct) return ctx.notFound();
      if (relId(acct.organization) !== ctx.state.orgId) return ctx.forbidden();

      const q = ctx.query || {};
      const page = parseInt(q.page || '1', 10);
      const limit = Math.min(parseInt(q.limit || '20', 10), 200);
      const filters = { bankAccount: ctx.params.id, organization: ctx.state.orgId };
      if (q.status) filters.status = q.status;
      if (q.from) filters.transactionDate = { ...filters.transactionDate, $gte: q.from };
      if (q.to) filters.transactionDate = { ...filters.transactionDate, $lte: q.to };

      const [results, total] = await Promise.all([
        strapi.entityService.findMany(TXN_UID, {
          filters, start: (page - 1) * limit, limit, sort: { transactionDate: 'desc' },
        }),
        strapi.db.query(TXN_UID).count({ where: filters }),
      ]);

      return { data: results, meta: { pagination: { page, limit, total, pageCount: Math.ceil(total / limit) } } };
    },
  };
};
