'use strict';

const UID = 'api::crm-activity.crm-activity';
const authFalse = { auth: false };

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/crm-activities/timeline',
      handler: `${UID}.timeline`,
      config: authFalse,
    },
    {
      method: 'GET',
      path: '/crm-activities/feed',
      handler: `${UID}.feed`,
      config: authFalse,
    },
    {
      method: 'POST',
      path: '/crm-activities/comments',
      handler: `${UID}.addComment`,
      config: authFalse,
    },
    {
      method: 'GET',
      path: '/crm-activities/comment-counts',
      handler: `${UID}.commentCounts`,
      config: authFalse,
    },
  ],
};
