'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/billing/overview',
      handler: 'billing.overview',
      config: { auth: false },
    },
  ],
};
