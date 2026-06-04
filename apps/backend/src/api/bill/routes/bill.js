'use strict';

const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('bills', 'api::bill.bill', [
  { method: 'PUT', path: '/bills/:id/status', handler: 'api::bill.bill.updateStatus', config: { auth: false } },
]);
