'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/community-memberships/list-for-client',
      handler: 'community-membership.listForClient',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/community-memberships/ensure',
      handler: 'community-membership.ensure',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
