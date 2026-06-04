'use strict';

const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('estimates', 'api::estimate.estimate', [
  { method: 'PUT',  path: '/estimates/:id/status',            handler: 'api::estimate.estimate.updateStatus',      config: { auth: false } },
  { method: 'POST', path: '/estimates/:id/convert-to-invoice',handler: 'api::estimate.estimate.convertToInvoice',  config: { auth: false } },
]);
