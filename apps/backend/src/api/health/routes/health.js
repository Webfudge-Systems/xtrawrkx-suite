'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/health/redis',
      handler: 'health.redis',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
