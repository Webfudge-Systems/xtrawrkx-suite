'use strict';

const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('expenses', 'api::expense.expense', [
  { method: 'POST', path: '/expenses/:id/invoice', handler: 'api::expense.expense.addToInvoice', config: { auth: false } },
]);
