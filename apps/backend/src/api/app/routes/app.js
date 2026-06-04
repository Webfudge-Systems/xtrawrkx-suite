'use strict';

/**
 * app router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::app.app', {
  config: {
    find: {
      auth: false, // Allow public access to list apps
      policies: [],
      middlewares: [],
    },
    findOne: {
      auth: false, // Allow public access to get single app
      policies: [],
      middlewares: [],
    }
  }
});
