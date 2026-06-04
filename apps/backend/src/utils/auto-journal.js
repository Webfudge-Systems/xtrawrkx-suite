'use strict';

/**
 * Creates an auto-generated, published journal entry (double-entry accounting).
 * Always balanced: sum(debit) MUST equal sum(credit).
 *
 * Also updates chart-of-account.currentBalance for each line:
 *   Assets/Expenses:    DR increases, CR decreases
 *   Liabilities/Income/Equity: CR increases, DR decreases
 *
 * @param {object} params
 * @param {number} params.organizationId
 * @param {number} params.userId
 * @param {string} params.sourceType  — 'invoice' | 'payment-received' | 'bill' | 'payment-made' | 'expense'
 * @param {number} params.sourceId
 * @param {string} params.journalDate — YYYY-MM-DD
 * @param {Array}  params.lines       — [{ accountCode, accountName, description, debit, credit }]
 * @returns {object} created manual-journal
 */
async function createAutoJournal({ organizationId, userId, sourceType, sourceId, journalDate, lines }) {
  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

  if (totalDebit !== totalCredit) {
    throw new Error(
      `Journal entry is not balanced: debit=${totalDebit}, credit=${totalCredit}`
    );
  }

  // Generate sequence number for the journal
  const { generateSequence } = require('./sequence');
  const journalNumber = await generateSequence(organizationId, 'journalSequence', 'JRN');

  const journal = await strapi.entityService.create('api::manual-journal.manual-journal', {
    data: {
      journalNumber,
      status: 'published',
      journalDate,
      source: `auto_${sourceType.replace(/-/g, '_')}`,
      sourceType,
      sourceId: String(sourceId),
      totalDebit,
      totalCredit,
      isBalanced: true,
      lines,
      notes: `Auto-generated from ${sourceType} #${sourceId}`,
      organization: organizationId,
      createdByUser: userId,
    },
  });

  // Update chart-of-account balances
  for (const line of lines) {
    try {
      const accounts = await strapi.entityService.findMany('api::chart-of-account.chart-of-account', {
        filters: { accountCode: line.accountCode, organization: organizationId },
        limit: 1,
      });

      if (!accounts || accounts.length === 0) continue;

      const account = accounts[0];
      const accountType = account.accountType;

      // DR increases: asset, expense, cost_of_goods_sold, other_expense
      // CR increases: liability, equity, income, other_income
      const drIncreasesTypes = ['asset', 'expense', 'cost_of_goods_sold', 'other_expense'];
      const isDrIncrease = drIncreasesTypes.includes(accountType);

      let balanceDelta = 0;
      if (isDrIncrease) {
        balanceDelta = (line.debit || 0) - (line.credit || 0);
      } else {
        balanceDelta = (line.credit || 0) - (line.debit || 0);
      }

      await strapi.entityService.update('api::chart-of-account.chart-of-account', account.id, {
        data: { currentBalance: (account.currentBalance || 0) + balanceDelta },
      });
    } catch (err) {
      console.warn(`[auto-journal] Failed to update balance for account ${line.accountCode}:`, err.message);
    }
  }

  return journal;
}

/**
 * Maps expense category to chart-of-account code.
 */
const EXPENSE_CATEGORY_TO_ACCOUNT = {
  subcontractor: '5001',
  software_saas: '5002',
  travel: '6003',
  office: '6006',
  meals: '6004',
  training: '6007',
  marketing: '6005',
  utilities: '6008',
  rent: '6002',
  salaries: '6001',
  other: '6010',
};

/**
 * Maps bill type to chart-of-account code.
 */
const BILL_TYPE_TO_ACCOUNT = {
  regular: '6010',
  subcontractor: '5001',
  software_saas: '5002',
  travel: '6003',
  other: '6010',
};

module.exports = { createAutoJournal, EXPENSE_CATEGORY_TO_ACCOUNT, BILL_TYPE_TO_ACCOUNT };
