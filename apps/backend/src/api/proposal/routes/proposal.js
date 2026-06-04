'use strict';

const UID = 'api::proposal.proposal';
const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET',    path: '/proposals',     handler: `${UID}.find`,    config: authFalse },
    { method: 'GET',    path: '/proposals/:id', handler: `${UID}.findOne`, config: authFalse },
    { method: 'POST',   path: '/proposals',     handler: `${UID}.create`,  config: authFalse },
    { method: 'PUT',    path: '/proposals/:id', handler: `${UID}.update`,  config: authFalse },
    { method: 'DELETE', path: '/proposals/:id', handler: `${UID}.delete`,  config: authFalse },
  ],
};
