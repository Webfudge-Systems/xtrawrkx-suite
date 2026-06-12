'use strict';

const authFalse = {
  auth: false,
  policies: [],
  middlewares: [],
};

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/signup',
      handler: 'auth.signup',
      config: authFalse,
    },
    {
      method: 'POST',
      path: '/auth/login',
      handler: 'auth.login',
      config: authFalse,
    },
    {
      method: 'GET',
      path: '/auth/me',
      handler: 'auth.me',
      config: authFalse,
    },
    {
      method: 'POST',
      path: '/auth/client/login',
      handler: 'auth.clientLogin',
      config: authFalse,
    },
    {
      method: 'POST',
      path: '/auth/client/signup',
      handler: 'auth.clientSignup',
      config: authFalse,
    },
    {
      method: 'POST',
      path: '/auth/client/verify-otp',
      handler: 'auth.clientVerifyOtp',
      config: authFalse,
    },
    {
      method: 'GET',
      path: '/auth/client/check-email',
      handler: 'auth.clientCheckEmail',
      config: authFalse,
    },
    {
      method: 'GET',
      path: '/auth/client/dedicated-poc',
      handler: 'auth.clientDedicatedPoc',
      config: authFalse,
    },
    {
      method: 'POST',
      path: '/auth/website/signup',
      handler: 'auth.websiteSignup',
      config: authFalse,
    },
    {
      method: 'GET',
      path: '/auth/website/similar-companies',
      handler: 'auth.websiteSimilarCompanies',
      config: authFalse,
    },
  ],
};
