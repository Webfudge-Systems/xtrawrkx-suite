'use strict';

const { makeBooksCrudController, relId } = require('../../../utils/books-crud');
const { generateSequence } = require('../../../utils/sequence');
const { createAutoJournal, EXPENSE_CATEGORY_TO_ACCOUNT } = require('../../../utils/auto-journal');

const UID = 'api::expense.expense';

const base = makeBooksCrudController(UID, { defaultPopulate: ['vendor', 'project', 'customer'] });

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
    if (q.category) filters.category = q.category;
    if (q.billable !== undefined) filters.billable = q.billable === 'true';
    if (q.invoiced !== undefined) filters.invoiced = q.invoiced === 'true';
    if (q.project) filters.project = q.project;
    if (q.vendor) filters.vendor = q.vendor;
    if (q.from) filters.expenseDate = { ...filters.expenseDate, $gte: q.from };
    if (q.to) filters.expenseDate = { ...filters.expenseDate, $lte: q.to };

    const [results, total] = await Promise.all([
      strapi.entityService.findMany(UID, { filters, start: (page - 1) * limit, limit, sort: { createdAt: 'desc' }, populate: ['vendor', 'project'] }),
      strapi.db.query(UID).count({ where: filters }),
    ]);
    return { data: results, meta: { pagination: { page, limit, total, pageCount: Math.ceil(total / limit) } } };
    },

    async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const expenseNumber = await generateSequence(ctx.state.orgId, 'expenseSequence', 'EXP');

    const expense = await strapi.entityService.create(UID, {
      data: { ...payload, expenseNumber, status: 'draft',
        submittedBy: ctx.state.user.id,
        organization: ctx.state.orgId, createdByUser: ctx.state.user.id },
    });

    // Auto-journal: DR expense account, CR bank/cash
    try {
      const expenseAccountCode = EXPENSE_CATEGORY_TO_ACCOUNT[payload.category] || '6010';
      const today = payload.expenseDate || new Date().toISOString().split('T')[0];
      await createAutoJournal({
        organizationId: ctx.state.orgId,
        userId: ctx.state.user.id,
        sourceType: 'expense',
        sourceId: expense.id,
        journalDate: today,
        lines: [
          { accountCode: expenseAccountCode, accountName: 'Expense', description: payload.description || expense.expenseNumber, debit: parseInt(payload.amount, 10), credit: 0 },
          { accountCode: '1001', accountName: 'Cash', description: payload.description || expense.expenseNumber, debit: 0, credit: parseInt(payload.amount, 10) },
        ],
      });
    } catch (err) {
      console.warn('[expense] Auto-journal failed:', err.message);
    }

    return { data: expense };
    },

    async addToInvoice(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const expense = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization'] });
    if (!expense) return ctx.notFound();
    if (relId(expense.organization) !== ctx.state.orgId) return ctx.forbidden();
    if (expense.invoiced) return ctx.badRequest('Expense already invoiced');

    const body = ctx.request?.body || {};
    const { invoiceId } = body.data || body;
    if (!invoiceId) return ctx.badRequest('invoiceId required');

    const invoice = await strapi.entityService.findOne('api::invoice.invoice', invoiceId, { populate: ['organization'] });
    if (!invoice || relId(invoice.organization) !== ctx.state.orgId) return ctx.notFound();

    // Add as line item
    await strapi.entityService.create('api::invoice-line-item.invoice-line-item', {
      data: {
        description: expense.description || expense.category,
        quantity: 1,
        rate: expense.amount,
        amount: expense.amount,
        discountPercent: 0, taxRate: 0, taxAmount: 0, total: expense.amount,
        invoice: invoiceId,
        organization: ctx.state.orgId,
      },
    });

    // Recompute invoice total
    const allLi = await strapi.entityService.findMany('api::invoice-line-item.invoice-line-item', {
      filters: { invoice: invoiceId },
    });
    const newTotal = allLi.reduce((s, li) => s + (li.total || 0), 0);
    await strapi.entityService.update('api::invoice.invoice', invoiceId, {
      data: { subtotal: newTotal, total: newTotal, balanceDue: newTotal - (invoice.paidAmount || 0) },
    });

    await strapi.entityService.update(UID, ctx.params.id, {
      data: { invoiced: true, invoicedOn: new Date().toISOString(), invoice: invoiceId },
    });

    return { data: { success: true } };
    },
  };
};
