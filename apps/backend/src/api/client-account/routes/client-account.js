'use strict';

/**
 * REST routes for Client Account (Strapi 5 content API).
 * Same pattern as contact / deal / task — explicit routes, auth via JWT middleware.
 */
const UID = 'api::client-account.client-account';

const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/client-accounts', handler: `${UID}.find`, config: authFalse },
    { method: 'GET', path: '/client-accounts/:id', handler: `${UID}.findOne`, config: authFalse },
    { method: 'POST', path: '/client-accounts', handler: `${UID}.create`, config: authFalse },
    { method: 'PUT', path: '/client-accounts/:id', handler: `${UID}.update`, config: authFalse },
    { method: 'DELETE', path: '/client-accounts/:id', handler: `${UID}.delete`, config: authFalse },
  ],
};
