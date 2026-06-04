'use strict';

const { makeBooksCrudController, relId } = require('../../../utils/books-crud');
const { generateSequence } = require('../../../utils/sequence');
const { createAutoJournal, BILL_TYPE_TO_ACCOUNT } = require('../../../utils/auto-journal');

const UID = 'api::bill.bill';
const LI_UID = 'api::bill-line-item.bill-line-item';

const base = makeBooksCrudController(UID, { defaultPopulate: ['vendor', 'organization'] });

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
    if (q.vendor) filters.vendor = q.vendor;
    if (q.from) filters.billDate = { ...filters.billDate, $gte: q.from };
    if (q.to) filters.billDate = { ...filters.billDate, $lte: q.to };

    const [results, total] = await Promise.all([
      strapi.entityService.findMany(UID, { filters, start: (page - 1) * limit, limit, sort: { createdAt: 'desc' }, populate: ['vendor'] }),
      strapi.db.query(UID).count({ where: filters }),
    ]);
    return { data: results, meta: { pagination: { page, limit, total, pageCount: Math.ceil(total / limit) } } };
    },

    async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const { lineItems: liData = [], ...data } = payload;

    const billNumber = await generateSequence(ctx.state.orgId, 'billSequence', 'BILL');
    const subtotal = liData.reduce((s, li) => s + Math.round(parseFloat(li.quantity || 1) * parseInt(li.rate || 0, 10)), 0);
    const taxAmount = liData.reduce((s, li) => {
      const amt = Math.round(parseFloat(li.quantity || 1) * parseInt(li.rate || 0, 10));
      return s + Math.round(amt * parseFloat(li.taxRate || 0) / 100);
    }, 0);
    const total = subtotal + taxAmount - parseInt(data.discountAmount || 0, 10);

    const bill = await strapi.entityService.create(UID, {
      data: { ...data, billNumber, status: 'draft', subtotal, taxAmount, total, balanceDue: total, paidAmount: 0,
        organization: ctx.state.orgId, createdByUser: ctx.state.user.id },
    });

    for (let i = 0; i < liData.length; i++) {
      const li = liData[i];
      const qty = parseFloat(li.quantity || 1);
      const rate = parseInt(li.rate || 0, 10);
      const amount = Math.round(qty * rate);
      const taxAmt = Math.round(amount * parseFloat(li.taxRate || 0) / 100);
      await strapi.entityService.create(LI_UID, {
        data: { description: li.description, quantity: qty, rate, amount, discountPercent: li.discountPercent || 0,
          taxRate: li.taxRate || 0, taxAmount: taxAmt, total: amount + taxAmt, sortOrder: i,
          bill: bill.id, item: li.item || null, organization: ctx.state.orgId },
      });
    }
    return { data: bill };
    },

    async updateStatus(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const bill = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['organization', 'vendor'] });
    if (!bill) return ctx.notFound();
    if (relId(bill.organization) !== ctx.state.orgId) return ctx.forbidden();

    const body = ctx.request?.body || {};
    const { status } = body.data || body;
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (status === 'approved') {
      await strapi.entityService.update(UID, ctx.params.id, { data: { status: 'approved' } });

      // Auto-journal: DR Expense Account, CR 2001 AP
      try {
        const expenseAccountCode = BILL_TYPE_TO_ACCOUNT[bill.billType] || '6010';
        await createAutoJournal({
          organizationId: ctx.state.orgId,
          userId: ctx.state.user.id,
          sourceType: 'bill',
          sourceId: bill.id,
          journalDate: today,
          lines: [
            { accountCode: expenseAccountCode, accountName: 'Expense', description: `Bill ${bill.billNumber}`, debit: bill.total, credit: 0 },
            { accountCode: '2001', accountName: 'Accounts Payable', description: `Bill ${bill.billNumber}`, debit: 0, credit: bill.total },
          ],
        });
      } catch (err) {
        console.warn('[bill] Auto-journal failed:', err.message);
      }

    } else if (status === 'void') {
      const payments = await strapi.entityService.findMany('api::payment-made.payment-made', {
        filters: { bill: ctx.params.id },
      });
      if (payments.length > 0) return ctx.badRequest('Cannot void bill that has payments');
      await strapi.entityService.update(UID, ctx.params.id, { data: { status: 'void' } });
    } else {
      await strapi.entityService.update(UID, ctx.params.id, { data: { status } });
    }

    const updated = await strapi.entityService.findOne(UID, ctx.params.id, { populate: ['vendor'] });
    return { data: updated };
    },
  };
};
