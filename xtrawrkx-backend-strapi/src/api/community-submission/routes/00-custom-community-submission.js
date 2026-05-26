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
  ],
};
