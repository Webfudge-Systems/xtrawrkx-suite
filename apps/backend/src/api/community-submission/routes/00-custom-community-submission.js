'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/community-submissions/list-for-client',
      handler: 'community-submission.listForClient',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/community-submissions/join',
      handler: 'community-submission.join',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/community-submissions/approve',
      handler: 'community-submission.approve',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/community-submissions/reject',
      handler: 'community-submission.reject',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
