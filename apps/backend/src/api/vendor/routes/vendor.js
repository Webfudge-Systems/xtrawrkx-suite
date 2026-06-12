'use strict';

const { makeCoreRoutes } = require('../../../utils/books-crud');

module.exports = makeCoreRoutes('vendors', 'api::vendor.vendor');
