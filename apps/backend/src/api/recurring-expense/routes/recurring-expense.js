'use strict';
const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('recurring-expenses', 'api::recurring-expense.recurring-expense');
