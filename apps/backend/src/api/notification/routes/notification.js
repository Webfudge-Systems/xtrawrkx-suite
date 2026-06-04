'use strict';

/**
 * notification router
 * auth: false — relies on global jwt-auth middleware + manual user check in controller.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::notification.notification', {
  config: {
    find:    { auth: false },
    findOne: { auth: false },
    create:  { auth: false },
    update:  { auth: false },
    delete:  { auth: false },
  },
});
