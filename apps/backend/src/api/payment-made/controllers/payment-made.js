'use strict';

const { makeBooksCrudController } = require('../../../utils/books-crud');
const { generateSequence } = require('../../../utils/sequence');
const { createAutoJournal } = require('../../../utils/auto-journal');

const UID = 'api::payment-made.payment-made';

const base = makeBooksCrudController(UID, { defaultPopulate: ['vendor', 'bill', 'bankAccount'] });

module.exports = (params) => {
  const core = base(params);

  return {
    ...core,

    async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const paymentNumber = await generateSequence(ctx.state.orgId, 'paymentSequence', 'PMADE');

    const payment = await strapi.entityService.create(UID, {
      data: { ...payload, paymentNumber, organization: ctx.state.orgId, createdByUser: ctx.state.user.id },
    });

    // Update bill
    if (payload.bill) {
      const bill = await strapi.entityService.findOne('api::bill.bill', payload.bill);
      if (bill) {
        const newPaidAmount = (bill.paidAmount || 0) + parseInt(payload.amount, 10);
        const newBalanceDue = Math.max(bill.total - newPaidAmount, 0);
        const newStatus = newBalanceDue === 0 ? 'paid' : 'partial';
        await strapi.entityService.update('api::bill.bill', bill.id, {
          data: { paidAmount: newPaidAmount, balanceDue: newBalanceDue, status: newStatus },
        });
      }
    }

    // Auto-journal: DR 2001 AP, CR Bank
    try {
      const today = payload.paymentDate || new Date().toISOString().split('T')[0];
      await createAutoJournal({
        organizationId: ctx.state.orgId,
        userId: ctx.state.user.id,
        sourceType: 'payment-made',
        sourceId: payment.id,
        journalDate: today,
        lines: [
          { accountCode: '2001', accountName: 'Accounts Payable', description: `Payment ${paymentNumber}`, debit: parseInt(payload.amount, 10), credit: 0 },
          { accountCode: '1001', accountName: 'Cash', description: `Payment ${paymentNumber}`, debit: 0, credit: parseInt(payload.amount, 10) },
        ],
      });
    } catch (err) {
      console.warn('[payment-made] Auto-journal failed:', err.message);
    }

    // Auto bank transaction (debit)
    if (payload.bankAccount) {
      try {
        await strapi.entityService.create('api::bank-transaction.bank-transaction', {
          data: {
            transactionDate: payload.paymentDate || new Date().toISOString().split('T')[0],
            description: `Payment made - ${paymentNumber}`,
            amount: -parseInt(payload.amount, 10),
            transactionType: 'debit',
            status: 'categorized',
            source: 'auto_payment',
            bankAccount: payload.bankAccount,
            paymentMade: payment.id,
            organization: ctx.state.orgId,
          },
        });
      } catch (err) {
        console.warn('[payment-made] Bank transaction creation failed:', err.message);
      }
    }

    return { data: payment };
    },
  };
};
