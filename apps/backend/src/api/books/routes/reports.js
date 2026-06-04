'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/books/reports/profit-loss',          handler: 'api::books.reports.profitLoss',        config: { auth: false } },
    { method: 'GET', path: '/books/reports/balance-sheet',        handler: 'api::books.reports.balanceSheet',      config: { auth: false } },
    { method: 'GET', path: '/books/reports/cash-flow',            handler: 'api::books.reports.cashFlow',          config: { auth: false } },
    { method: 'GET', path: '/books/reports/sales-by-customer',    handler: 'api::books.reports.salesByCustomer',   config: { auth: false } },
    { method: 'GET', path: '/books/reports/expenses-by-category', handler: 'api::books.reports.expensesByCategory',config: { auth: false } },
    { method: 'GET', path: '/books/reports/receivables-aging',    handler: 'api::books.reports.receivablesAging',  config: { auth: false } },
    { method: 'GET', path: '/books/reports/payables-aging',       handler: 'api::books.reports.payablesAging',     config: { auth: false } },
    { method: 'GET', path: '/books/reports/utilization',          handler: 'api::books.reports.utilization',       config: { auth: false } },
  ],
};
