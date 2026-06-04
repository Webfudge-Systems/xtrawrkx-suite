'use strict';

/**
 * REST routes for Project (Strapi 5 content API).
 * Same pattern as contact / deal / task — explicit routes, auth via JWT middleware.
 */
const UID = 'api::project.project';

const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/projects', handler: `${UID}.find`, config: authFalse },
    { method: 'GET', path: '/projects/client-options', handler: `${UID}.clientOptions`, config: authFalse },
    { method: 'GET', path: '/projects/:id', handler: `${UID}.findOne`, config: authFalse },
    { method: 'GET', path: '/projects/:id/summary', handler: `${UID}.summary`, config: authFalse },
    { method: 'POST', path: '/projects', handler: `${UID}.create`, config: authFalse },
    { method: 'PUT', path: '/projects/:id', handler: `${UID}.update`, config: authFalse },
    { method: 'DELETE', path: '/projects/:id', handler: `${UID}.delete`, config: authFalse },
  ],
};
