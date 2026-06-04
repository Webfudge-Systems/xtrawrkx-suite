'use strict';

const { makeBooksCrudController, relId } = require('../../../utils/books-crud');
const { generateSequence } = require('../../../utils/sequence');
const { createAutoJournal } = require('../../../utils/auto-journal');

const UID = 'api::payment-received.payment-received';

const base = makeBooksCrudController(UID, { defaultPopulate: ['customer', 'invoice', 'bankAccount'] });

module.exports = (params) => {
  const core = base(params);

  return {
    ...core,

    async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized();
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const paymentNumber = await generateSequence(ctx.state.orgId, 'paymentSequence', 'PAY');

    const payment = await strapi.entityService.create(UID, {
      data: {
        ...payload,
        paymentNumber,
        organization: ctx.state.orgId,
        createdByUser: ctx.state.user.id,
      },
    });

    // Update invoice
    if (payload.invoice) {
      const invoice = await strapi.entityService.findOne('api::invoice.invoice', payload.invoice, {
        populate: ['customer'],
      });
      if (invoice) {
        const newPaidAmount = (invoice.paidAmount || 0) + parseInt(payload.amount, 10);
        const newBalanceDue = invoice.total - newPaidAmount;
        const excessAmount = newBalanceDue < 0 ? Math.abs(newBalanceDue) : 0;
        const actualBalanceDue = Math.max(newBalanceDue, 0);

        let newStatus = invoice.status;
        const now = new Date().toISOString();
        let paidAt = invoice.paidAt;
        if (actualBalanceDue === 0) { newStatus = 'paid'; paidAt = now; }
        else if (newPaidAmount > 0) newStatus = 'partial';

        await strapi.entityService.update('api::invoice.invoice', invoice.id, {
          data: { paidAmount: newPaidAmount, balanceDue: actualBalanceDue, status: newStatus, paidAt },
        });

        // Handle overpayment as unused credits on customer
        if (excessAmount > 0 && relId(invoice.customer)) {
          const customer = await strapi.entityService.findOne('api::contact.contact', relId(invoice.customer));
          if (customer) {
            await strapi.entityService.update('api::contact.contact', customer.id, {
              data: { unusedCredits: (customer.unusedCredits || 0) + excessAmount },
            });
          }
          await strapi.entityService.update(UID, payment.id, { data: { excessAmount } });
        }

        // Auto-journal: DR Bank, CR 1100 AR
        try {
          const bankAcctCode = payload.bankAccount ? '1001' : '1001'; // default cash if no bank
          let bankAccountCode = '1001';
          if (payload.bankAccount) {
            // Use account code 1001 (Cash) as default; ideally link to bank account's chart code
            bankAccountCode = '1001';
          }
          await createAutoJournal({
            organizationId: ctx.state.orgId,
            userId: ctx.state.user.id,
            sourceType: 'payment-received',
            sourceId: payment.id,
            journalDate: payload.paymentDate || new Date().toISOString().split('T')[0],
            lines: [
              { accountCode: bankAccountCode, accountName: 'Cash', description: `Payment for invoice ${invoice.invoiceNumber}`, debit: parseInt(payload.amount, 10), credit: 0 },
              { accountCode: '1100', accountName: 'Accounts Receivable', description: `Payment for invoice ${invoice.invoiceNumber}`, debit: 0, credit: parseInt(payload.amount, 10) },
            ],
          });
        } catch (err) {
          console.warn('[payment-received] Auto-journal failed:', err.message);
        }
      }
    }

    // Auto bank transaction
    if (payload.bankAccount) {
      try {
        await strapi.entityService.create('api::bank-transaction.bank-transaction', {
          data: {
            transactionDate: payload.paymentDate || new Date().toISOString().split('T')[0],
            description: `Payment received - ${paymentNumber}`,
            amount: parseInt(payload.amount, 10),
            transactionType: 'credit',
            status: 'categorized',
            source: 'auto_receipt',
            bankAccount: payload.bankAccount,
            paymentReceived: payment.id,
            organization: ctx.state.orgId,
          },
        });
      } catch (err) {
        console.warn('[payment-received] Bank transaction creation failed:', err.message);
      }
    }

    return { data: payment };
    },
  };
};
