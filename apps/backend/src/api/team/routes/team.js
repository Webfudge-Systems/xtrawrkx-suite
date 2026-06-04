'use strict';

const UID = 'api::team.team';
const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/teams', handler: `${UID}.find`, config: authFalse },
    { method: 'GET', path: '/teams/:id', handler: `${UID}.findOne`, config: authFalse },
    { method: 'POST', path: '/teams', handler: `${UID}.create`, config: authFalse },
    { method: 'PUT', path: '/teams/:id', handler: `${UID}.update`, config: authFalse },
    { method: 'DELETE', path: '/teams/:id', handler: `${UID}.delete`, config: authFalse },
  ],
};
