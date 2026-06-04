'use strict';

/**
 * Explicit REST routes for Lead Company (Strapi 5 content API).
 * Same pattern as contact routes — avoids createCoreRouter lazy registration edge cases.
 */
const UID = 'api::lead-company.lead-company';

const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET',    path: '/lead-companies',               handler: `${UID}.find`,            config: authFalse },
    { method: 'GET',    path: '/lead-companies/statuses',      handler: `${UID}.statuses`,        config: authFalse },
    { method: 'GET',    path: '/lead-companies/:id',           handler: `${UID}.findOne`,         config: authFalse },
    { method: 'POST',   path: '/lead-companies',               handler: `${UID}.create`,          config: authFalse },
    { method: 'PUT',    path: '/lead-companies/:id',           handler: `${UID}.update`,          config: authFalse },
    { method: 'DELETE', path: '/lead-companies/:id',           handler: `${UID}.delete`,          config: authFalse },
    { method: 'POST',   path: '/lead-companies/:id/convert',   handler: `${UID}.convertToClient`, config: authFalse },
  ],
};
