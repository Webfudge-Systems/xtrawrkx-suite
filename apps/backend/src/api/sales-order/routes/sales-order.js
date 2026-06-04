'use strict';
const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('sales-orders', 'api::sales-order.sales-order');
