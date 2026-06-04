'use strict';

const UID = 'api::invoice.invoice';
const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET',    path: '/invoices',     handler: `${UID}.find`,    config: authFalse },
    { method: 'GET',    path: '/invoices/:id', handler: `${UID}.findOne`, config: authFalse },
    { method: 'POST',   path: '/invoices',     handler: `${UID}.create`,  config: authFalse },
    { method: 'PUT',    path: '/invoices/:id', handler: `${UID}.update`,  config: authFalse },
    { method: 'DELETE', path: '/invoices/:id', handler: `${UID}.delete`,  config: authFalse },
  ],
};
