'use strict';

const { createCoreService } = require('@strapi/strapi').factories;
module.exports = createCoreService('api::payment-received.payment-received');
