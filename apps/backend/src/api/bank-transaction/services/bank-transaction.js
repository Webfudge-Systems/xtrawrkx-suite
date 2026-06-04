'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
module.exports = createCoreService('api::bank-transaction.bank-transaction');
