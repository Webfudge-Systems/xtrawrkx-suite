'use strict';
const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('credit-notes', 'api::credit-note.credit-note');
