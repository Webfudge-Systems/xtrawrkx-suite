'use strict';

/**
 * invitation custom router
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/invitations/accept',
      handler: 'invitation.accept',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'GET',
      path: '/invitations/validate/:token',
      handler: 'invitation.validate',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    }
  ]
};
