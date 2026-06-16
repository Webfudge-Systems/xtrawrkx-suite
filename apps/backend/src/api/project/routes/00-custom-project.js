'use strict';

/**
 * Client-portal project routes (bearer client JWT, not org staff JWT).
 */
const UID = 'api::project.project';

const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/projects/list-for-client',
      handler: `${UID}.listForClient`,
      config: authFalse,
    },
    {
      method: 'GET',
      path: '/projects/get-for-client/:id',
      handler: `${UID}.getForClient`,
      config: authFalse,
    },
    {
      method: 'GET',
      path: '/projects/client-comment-counts',
      handler: `${UID}.clientCommentCounts`,
      config: authFalse,
    },
    {
      method: 'GET',
      path: '/projects/:id/client-timeline',
      handler: `${UID}.clientTimeline`,
      config: authFalse,
    },
    {
      method: 'POST',
      path: '/projects/:id/client-comment',
      handler: `${UID}.clientComment`,
      config: authFalse,
    },
    {
      method: 'POST',
      path: '/projects/client-create',
      handler: `${UID}.clientCreate`,
      config: authFalse,
    },
  ],
};
