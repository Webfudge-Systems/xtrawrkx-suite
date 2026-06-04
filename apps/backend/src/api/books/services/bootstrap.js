'use strict';

/**
 * Seeds the default Chart of Accounts for an organization — called once on Books activation.
 * Idempotent: checks booksActivated flag and existing accounts before creating.
 */
const DEFAULT_ACCOUNTS = [
  // ASSETS
  { accountCode: '1001', accountName: 'Cash',                   accountType: 'asset',              accountSubType: 'current_asset',        isSystem: true  },
  { accountCode: '1002', accountName: 'Petty Cash',             accountType: 'asset',              accountSubType: 'current_asset',        isSystem: false },
  { accountCode: '1100', accountName: 'Accounts Receivable',    accountType: 'asset',              accountSubType: 'accounts_receivable',  isSystem: true  },
  { accountCode: '1200', accountName: 'Prepaid Expenses',       accountType: 'asset',              accountSubType: 'current_asset',        isSystem: false },
  { accountCode: '1500', accountName: 'Furniture & Equipment',  accountType: 'asset',              accountSubType: 'fixed_asset',          isSystem: false },
  // LIABILITIES
  { accountCode: '2001', accountName: 'Accounts Payable',       accountType: 'liability',          accountSubType: 'accounts_payable',     isSystem: true  },
  { accountCode: '2100', accountName: 'GST Payable',            accountType: 'liability',          accountSubType: 'tax_payable',          isSystem: true  },
  { accountCode: '2200', accountName: 'Salary Payable',         accountType: 'liability',          accountSubType: 'current_liability',    isSystem: false },
  { accountCode: '2300', accountName: 'Credit Card',            accountType: 'liability',          accountSubType: 'credit_card',          isSystem: false },
  // EQUITY
  { accountCode: '3001', accountName: "Owner's Equity",         accountType: 'equity',             accountSubType: 'equity',               isSystem: false },
  { accountCode: '3100', accountName: 'Retained Earnings',      accountType: 'equity',             accountSubType: 'retained_earnings',    isSystem: true  },
  // INCOME
  { accountCode: '4001', accountName: 'Service Revenue',        accountType: 'income',             accountSubType: 'income',               isSystem: true  },
  { accountCode: '4002', accountName: 'Retainer Revenue',       accountType: 'income',             accountSubType: 'income',               isSystem: false },
  { accountCode: '4003', accountName: 'Consulting Revenue',     accountType: 'income',             accountSubType: 'income',               isSystem: false },
  { accountCode: '4004', accountName: 'Other Income',           accountType: 'other_income',       accountSubType: 'other_income',         isSystem: false },
  // COGS
  { accountCode: '5001', accountName: 'Subcontractor Costs',    accountType: 'cost_of_goods_sold', accountSubType: 'cogs',                 isSystem: false },
  { accountCode: '5002', accountName: 'Software & SaaS',        accountType: 'cost_of_goods_sold', accountSubType: 'cogs',                 isSystem: false },
  // EXPENSES
  { accountCode: '6001', accountName: 'Salaries & Wages',       accountType: 'expense',            accountSubType: 'payroll_expense',      isSystem: false },
  { accountCode: '6002', accountName: 'Rent',                   accountType: 'expense',            accountSubType: 'rent_expense',         isSystem: false },
  { accountCode: '6003', accountName: 'Travel',                 accountType: 'expense',            accountSubType: 'travel_expense',       isSystem: false },
  { accountCode: '6004', accountName: 'Meals & Entertainment',  accountType: 'expense',            accountSubType: 'meals',                isSystem: false },
  { accountCode: '6005', accountName: 'Marketing & Advertising',accountType: 'expense',            accountSubType: 'marketing',            isSystem: false },
  { accountCode: '6006', accountName: 'Office Supplies',        accountType: 'expense',            accountSubType: 'office',               isSystem: false },
  { accountCode: '6007', accountName: 'Training & Development', accountType: 'expense',            accountSubType: 'training',             isSystem: false },
  { accountCode: '6008', accountName: 'Utilities',              accountType: 'expense',            accountSubType: 'utilities',            isSystem: false },
  { accountCode: '6009', accountName: 'Depreciation',           accountType: 'expense',            accountSubType: 'depreciation',         isSystem: false },
  { accountCode: '6010', accountName: 'Bank Charges',           accountType: 'expense',            accountSubType: 'bank_charges',         isSystem: false },
];

async function bootstrapBooksOrg(organizationId) {
  const org = await strapi.entityService.findOne('api::organization.organization', organizationId);
  if (!org) throw new Error(`Organization ${organizationId} not found`);
  if (org.booksActivated) return { alreadyActivated: true };

  const existingAccounts = await strapi.entityService.findMany('api::chart-of-account.chart-of-account', {
    filters: { organization: organizationId },
    limit: 1,
  });

  if (existingAccounts.length === 0) {
    for (const account of DEFAULT_ACCOUNTS) {
      await strapi.entityService.create('api::chart-of-account.chart-of-account', {
        data: {
          ...account,
          organization: organizationId,
          currency: org.baseCurrency || 'INR',
          openingBalance: 0,
          currentBalance: 0,
          isActive: true,
        },
      });
    }
  }

  await strapi.entityService.update('api::organization.organization', organizationId, {
    data: { booksActivated: true },
  });

  return { activated: true, accountsSeeded: existingAccounts.length === 0 ? DEFAULT_ACCOUNTS.length : 0 };
}

module.exports = { bootstrapBooksOrg };
