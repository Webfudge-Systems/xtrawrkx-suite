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
    },
    {
      method: 'POST',
      path: '/auth/client/login',
      handler: 'auth.clientLogin',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/client/signup',
      handler: 'auth.clientSignup',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/client/verify-otp',
      handler: 'auth.clientVerifyOtp',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/auth/client/check-email',
      handler: 'auth.clientCheckEmail',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/auth/client/dedicated-poc',
      handler: 'auth.clientDedicatedPoc',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/auth/website/similar-companies',
      handler: 'auth.websiteSimilarCompanies',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ]
};
