'use strict';
const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('purchase-orders', 'api::purchase-order.purchase-order');
