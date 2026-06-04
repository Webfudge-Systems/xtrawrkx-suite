'use strict';
const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('bill-line-items', 'api::bill-line-item.bill-line-item');
