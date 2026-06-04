'use strict';

/**
 * Deal custom actions (won deal → delivery project).
 * Standard CRUD lives in `deal.js`.
 */
const UID = 'api::deal.deal';

const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'POST',
      path: '/deals/:id/delivery-project',
      handler: `${UID}.createDeliveryProject`,
      config: authFalse,
    },
  ],
};
