'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'POST', path: '/books/activate',                   handler: 'api::books.books.activate',          config: { auth: false } },
    { method: 'GET',  path: '/books/dashboard/kpis',             handler: 'api::books.books.dashboard',         config: { auth: false } },
    { method: 'GET',  path: '/books/dashboard/profit-loss',      handler: 'api::books.books.profitLoss',        config: { auth: false } },
    { method: 'GET',  path: '/books/dashboard/cash-flow',        handler: 'api::books.books.cashFlow',          config: { auth: false } },
    { method: 'GET',  path: '/books/dashboard/recent-activities',handler: 'api::books.books.recentActivities',  config: { auth: false } },
    { method: 'GET',  path: '/books/dashboard/top-expenses',     handler: 'api::books.books.topExpenses',       config: { auth: false } },
    { method: 'GET',  path: '/books/banking/overview',           handler: 'api::books.books.bankingOverview',   config: { auth: false } },
    { method: 'GET',  path: '/books/accountant/posting-trend',   handler: 'api::books.books.postingTrend',      config: { auth: false } },
    { method: 'GET',  path: '/books/timesheet/weekly',           handler: 'api::books.books.weeklyTimesheet',   config: { auth: false } },
  ],
};
