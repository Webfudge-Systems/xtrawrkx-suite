'use strict';

/**
 * organization router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::organization.organization', {
  config: {
    create: {
      auth: false, // Use custom JWT middleware instead
    },
    find: {
      auth: false,
    },
    findOne: {
      auth: false,
    },
    update: {
      auth: false,
    },
    delete: {
      auth: false,
    },
  },
});
