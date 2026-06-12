'use strict';

/**
 * Custom client-account routes that must not be captured by /client-accounts/:id.
 */
module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/client-accounts/website-signup',
      handler: 'client-account.websiteSignup',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
