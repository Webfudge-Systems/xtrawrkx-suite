'use strict';

/**
 * Daily cron tasks for Books module:
 *  1. Generate invoices from active recurring profiles due today
 *  2. Generate expenses from active recurring expense profiles due today
 *  3. Mark overdue invoices and bills
 */

function addFrequencyDays(dateStr, frequency) {
  const d = new Date(dateStr);
  if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (frequency === 'quarterly') d.setMonth(d.getMonth() + 3);
  else if (frequency === 'yearly') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}

module.exports = {
  booksRecurringAndOverdue: {
    task: async ({ strapi }) => {
      const today = new Date().toISOString().split('T')[0];
      console.log(`[CRON] Books daily job running for ${today}`);

      // 1. Recurring invoices
      try {
        const dueRecurring = await strapi.entityService.findMany('api::recurring-invoice.recurring-invoice', {
          filters: { status: 'active', nextInvoiceDate: { $lte: today } },
          populate: ['customer', 'project'],
          limit: 200,
        });

        for (const profile of dueRecurring) {
          try {
            // Generate sequence
            const orgId = profile.organization?.id || (typeof profile.organization === 'number' ? profile.organization : null);
            if (!orgId) continue;

            const org = await strapi.db.query('api::organization.organization').findOne({
              where: { id: orgId }, select: ['invoiceSequence', 'invoicePrefix'],
            });
            const newSeq = (org?.invoiceSequence || 0) + 1;
            await strapi.db.query('api::organization.organization').update({
              where: { id: orgId }, data: { invoiceSequence: newSeq },
            });
            const invoiceNumber = `${org?.invoicePrefix || 'INV'}-${String(newSeq).padStart(4, '0')}`;

            const lineItems = profile.lineItems || [];
            const total = lineItems.reduce((s, li) => s + Math.round((li.quantity || 1) * (li.rate || 0)), 0);

            const invoice = await strapi.entityService.create('api::invoice.invoice', {
              data: {
                invoiceNumber,
                status: 'draft',
                invoiceDate: today,
                currency: profile.currency || 'INR',
                subtotal: total, total, balanceDue: total, paidAmount: 0,
                discountAmount: 0, taxAmount: 0,
                customer: profile.customer?.id || null,
                project: profile.project?.id || null,
                notes: profile.notes,
                organization: orgId,
              },
            });

            for (let i = 0; i < lineItems.length; i++) {
              const li = lineItems[i];
              const amount = Math.round((li.quantity || 1) * (li.rate || 0));
              await strapi.entityService.create('api::invoice-line-item.invoice-line-item', {
                data: { description: li.description, quantity: li.quantity || 1, rate: li.rate || 0,
                  amount, discountPercent: 0, taxRate: 0, taxAmount: 0, total: amount,
                  sortOrder: i, invoice: invoice.id, organization: orgId },
              });
            }

            const nextDate = addFrequencyDays(today, profile.frequency);
            const expired = profile.endDate && nextDate > profile.endDate;
            await strapi.entityService.update('api::recurring-invoice.recurring-invoice', profile.id, {
              data: {
                nextInvoiceDate: nextDate,
                lastSentAt: new Date().toISOString(),
                totalInvoicesSent: (profile.totalInvoicesSent || 0) + 1,
                status: expired ? 'expired' : 'active',
              },
            });
          } catch (err) {
            console.error(`[CRON] Failed to generate invoice for recurring profile ${profile.id}:`, err.message);
          }
        }
      } catch (err) {
        console.error('[CRON] Recurring invoices error:', err.message);
      }

      // 2. Recurring expenses
      try {
        const dueExpenses = await strapi.entityService.findMany('api::recurring-expense.recurring-expense', {
          filters: { status: 'active', nextExpenseDate: { $lte: today } },
          populate: ['vendor', 'project'],
          limit: 200,
        });

        for (const profile of dueExpenses) {
          try {
            const orgId = profile.organization?.id || (typeof profile.organization === 'number' ? profile.organization : null);
            if (!orgId) continue;

            const org = await strapi.db.query('api::organization.organization').findOne({
              where: { id: orgId }, select: ['expenseSequence'],
            });
            const newSeq = (org?.expenseSequence || 0) + 1;
            await strapi.db.query('api::organization.organization').update({
              where: { id: orgId }, data: { expenseSequence: newSeq },
            });
            const expenseNumber = `EXP-${String(newSeq).padStart(4, '0')}`;

            await strapi.entityService.create('api::expense.expense', {
              data: {
                expenseNumber,
                expenseDate: today,
                amount: profile.amount || 0,
                category: profile.category || 'other',
                billable: profile.billable || false,
                status: 'draft',
                vendor: profile.vendor?.id || null,
                project: profile.project?.id || null,
                organization: orgId,
              },
            });

            const nextDate = addFrequencyDays(today, profile.frequency);
            const expired = profile.endDate && nextDate > profile.endDate;
            await strapi.entityService.update('api::recurring-expense.recurring-expense', profile.id, {
              data: { nextExpenseDate: nextDate, lastCreatedAt: new Date().toISOString(), status: expired ? 'expired' : 'active' },
            });
          } catch (err) {
            console.error(`[CRON] Failed to generate expense for recurring profile ${profile.id}:`, err.message);
          }
        }
      } catch (err) {
        console.error('[CRON] Recurring expenses error:', err.message);
      }

      // 3. Mark overdue invoices
      try {
        const overdueInvoices = await strapi.entityService.findMany('api::invoice.invoice', {
          filters: { status: { $in: ['sent', 'viewed', 'partial'] }, dueDate: { $lt: today } },
          limit: 5000,
        });
        for (const inv of overdueInvoices) {
          await strapi.entityService.update('api::invoice.invoice', inv.id, { data: { status: 'overdue' } });
        }
        if (overdueInvoices.length > 0) console.log(`[CRON] Marked ${overdueInvoices.length} invoices as overdue`);
      } catch (err) {
        console.error('[CRON] Overdue invoices error:', err.message);
      }

      // 4. Mark overdue bills
      try {
        const overdueBills = await strapi.entityService.findMany('api::bill.bill', {
          filters: { status: { $in: ['approved', 'partial'] }, dueDate: { $lt: today } },
          limit: 5000,
        });
        for (const bill of overdueBills) {
          await strapi.entityService.update('api::bill.bill', bill.id, { data: { status: 'overdue' } });
        }
        if (overdueBills.length > 0) console.log(`[CRON] Marked ${overdueBills.length} bills as overdue`);
      } catch (err) {
        console.error('[CRON] Overdue bills error:', err.message);
      }

      console.log('[CRON] Books daily job complete');
    },
    options: {
      rule: '1 0 * * *', // daily at 00:01
    },
  },
};
