'use strict';

/**
 * app custom router
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/apps/:slug/modules',
      handler: 'app.getModules',
      config: {
        auth: false, // Allow public access
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'POST',
      path: '/apps/calculate-pricing',
      handler: 'app.calculatePricing',
      config: {
        auth: false, // Allow public access
        policies: [],
        middlewares: [],
      }
    }
  ]
};
