'use strict';

const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('bank-accounts', 'api::bank-account.bank-account', [
  { method: 'GET', path: '/bank-accounts/:id/transactions', handler: 'api::bank-account.bank-account.transactions', config: { auth: false } },
]);
