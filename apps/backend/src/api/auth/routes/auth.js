'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/signup',
      handler: 'auth.signup',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'POST',
      path: '/auth/login',
      handler: 'auth.login',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'POST',
      path: '/auth/platform-login',
      handler: 'auth.platformLogin',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'GET',
      path: '/auth/me',
      handler: 'auth.me',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    }
  ]
};
