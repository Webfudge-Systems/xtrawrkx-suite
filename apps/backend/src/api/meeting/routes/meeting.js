'use strict';

/**
 * REST routes for Meeting (Strapi 5 content API).
 * Same pattern as deal / contact — explicit routes, auth via middleware.
 */
const UID = 'api::meeting.meeting';

const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/meetings', handler: `${UID}.find`, config: authFalse },
    { method: 'GET', path: '/meetings/:id', handler: `${UID}.findOne`, config: authFalse },
    { method: 'POST', path: '/meetings', handler: `${UID}.create`, config: authFalse },
    { method: 'PUT', path: '/meetings/:id', handler: `${UID}.update`, config: authFalse },
    { method: 'DELETE', path: '/meetings/:id', handler: `${UID}.delete`, config: authFalse },
  ],
};
