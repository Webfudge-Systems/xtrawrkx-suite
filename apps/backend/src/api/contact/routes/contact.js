'use strict';

/**
 * Explicit REST routes for Contact (Strapi 5 content API).
 * Same pattern as lead-company routes — avoids createCoreRouter lazy registration edge cases.
 */
const UID = 'api::contact.contact';

const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/contacts', handler: `${UID}.find`, config: authFalse },
    { method: 'GET', path: '/contacts/:id', handler: `${UID}.findOne`, config: authFalse },
    { method: 'POST', path: '/contacts', handler: `${UID}.create`, config: authFalse },
    { method: 'PUT', path: '/contacts/:id', handler: `${UID}.update`, config: authFalse },
    { method: 'DELETE', path: '/contacts/:id', handler: `${UID}.delete`, config: authFalse },
  ],
};
