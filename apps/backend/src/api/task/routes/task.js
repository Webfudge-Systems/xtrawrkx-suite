'use strict';

/**
 * REST routes for Task (Strapi 5 content API).
 * Same pattern as contact / deal / client-account — explicit routes, auth via JWT middleware.
 */
const UID = 'api::task.task';

const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/tasks', handler: `${UID}.find`, config: authFalse },
    { method: 'GET', path: '/tasks/:id', handler: `${UID}.findOne`, config: authFalse },
    { method: 'POST', path: '/tasks', handler: `${UID}.create`, config: authFalse },
    { method: 'PUT', path: '/tasks/:id', handler: `${UID}.update`, config: authFalse },
    { method: 'POST', path: '/tasks/:id/approve-assignment', handler: `${UID}.approveAssignment`, config: authFalse },
    { method: 'POST', path: '/tasks/:id/reject-assignment', handler: `${UID}.rejectAssignment`, config: authFalse },
    { method: 'POST', path: '/tasks/:id/timer/start', handler: `${UID}.timerStart`, config: authFalse },
    { method: 'POST', path: '/tasks/:id/timer/stop', handler: `${UID}.timerStop`, config: authFalse },
    { method: 'DELETE', path: '/tasks/:id', handler: `${UID}.delete`, config: authFalse },
  ],
};
