'use strict';

const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('bank-transactions', 'api::bank-transaction.bank-transaction', [
  { method: 'GET',  path: '/bank-transactions/uncategorized',     handler: 'api::bank-transaction.bank-transaction.uncategorized',   config: { auth: false } },
  { method: 'PUT',  path: '/bank-transactions/:id/categorize',    handler: 'api::bank-transaction.bank-transaction.categorize',      config: { auth: false } },
  { method: 'POST', path: '/bank-transactions/bulk-categorize',   handler: 'api::bank-transaction.bank-transaction.bulkCategorize',  config: { auth: false } },
]);
