'use strict';

/**
 * REST routes for Deal (Strapi 5 content API).
 * Same pattern as contact / lead-company — explicit routes, auth via middleware.
 */
const UID = 'api::deal.deal';

const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/deals', handler: `${UID}.find`, config: authFalse },
    { method: 'GET', path: '/deals/:id', handler: `${UID}.findOne`, config: authFalse },
    { method: 'POST', path: '/deals', handler: `${UID}.create`, config: authFalse },
    { method: 'PUT', path: '/deals/:id', handler: `${UID}.update`, config: authFalse },
    { method: 'DELETE', path: '/deals/:id', handler: `${UID}.delete`, config: authFalse },
  ],
};
