'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET',    path: '/chart-of-accounts',                  handler: 'api::chart-of-account.chart-of-account.find',         config: { auth: false } },
    { method: 'GET',    path: '/chart-of-accounts/trial-balance',    handler: 'api::chart-of-account.chart-of-account.trialBalance',  config: { auth: false } },
    { method: 'GET',    path: '/chart-of-accounts/:id',              handler: 'api::chart-of-account.chart-of-account.findOne',       config: { auth: false } },
    { method: 'POST',   path: '/chart-of-accounts',                  handler: 'api::chart-of-account.chart-of-account.create',        config: { auth: false } },
    { method: 'PUT',    path: '/chart-of-accounts/:id',              handler: 'api::chart-of-account.chart-of-account.update',        config: { auth: false } },
    { method: 'DELETE', path: '/chart-of-accounts/:id',              handler: 'api::chart-of-account.chart-of-account.delete',        config: { auth: false } },
  ],
};
