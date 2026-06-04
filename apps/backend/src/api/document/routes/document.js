'use strict';
const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('documents', 'api::document.document');
