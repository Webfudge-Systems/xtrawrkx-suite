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
    { method: 'GET', path: '/tasks/list-for-client-account', handler: `${UID}.listForClientAccount`, config: authFalse },
    { method: 'GET', path: '/tasks/list-for-client', handler: `${UID}.listForClient`, config: authFalse },
    { method: 'GET', path: '/tasks/:id/client-view', handler: `${UID}.getForClient`, config: authFalse },
    { method: 'GET', path: '/tasks/:id/client-timeline', handler: `${UID}.clientTimeline`, config: authFalse },
    { method: 'POST', path: '/tasks/:id/client-comment', handler: `${UID}.clientComment`, config: authFalse },
    { method: 'POST', path: '/tasks/client-create', handler: `${UID}.clientCreate`, config: authFalse },
    { method: 'POST', path: '/tasks/:id/client-action', handler: `${UID}.clientAction`, config: authFalse },
    { method: 'PATCH', path: '/tasks/:id/share-with-client', handler: `${UID}.shareWithClient`, config: authFalse },
    { method: 'PATCH', path: '/tasks/:id/advance-client-stage', handler: `${UID}.advanceClientStage`, config: authFalse },
  ],
};
