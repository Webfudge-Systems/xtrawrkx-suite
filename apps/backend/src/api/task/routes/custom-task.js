'use strict';

/**
 * Custom task routes (sidebar “My work” summary).
 * CRUD lives in `task.js`; keep auth via JWT middleware (auth: false on route, org from header).
 */
const UID = 'api::task.task';

const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    { method: 'GET', path: '/tasks/my-work', handler: `${UID}.myWork`, config: authFalse },
  ],
};
