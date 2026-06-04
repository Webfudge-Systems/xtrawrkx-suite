'use strict';
const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('retainer-invoices', 'api::retainer-invoice.retainer-invoice');
