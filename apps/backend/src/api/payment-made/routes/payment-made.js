'use strict';

const { makeCoreRoutes } = require('../../../utils/books-crud');
module.exports = makeCoreRoutes('payments-made', 'api::payment-made.payment-made');
