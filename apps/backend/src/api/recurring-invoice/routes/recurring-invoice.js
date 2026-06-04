'use strict';
const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('recurring-invoices', 'api::recurring-invoice.recurring-invoice');
