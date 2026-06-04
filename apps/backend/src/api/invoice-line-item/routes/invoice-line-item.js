'use strict';
const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('invoice-line-items', 'api::invoice-line-item.invoice-line-item');
