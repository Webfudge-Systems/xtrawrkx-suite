'use strict';

const UID = 'api::department.department';
const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/departments', handler: `${UID}.find`, config: authFalse },
    { method: 'GET', path: '/departments/:id', handler: `${UID}.findOne`, config: authFalse },
    { method: 'POST', path: '/departments', handler: `${UID}.create`, config: authFalse },
    { method: 'PUT', path: '/departments/:id', handler: `${UID}.update`, config: authFalse },
    { method: 'DELETE', path: '/departments/:id', handler: `${UID}.delete`, config: authFalse },
  ],
};
