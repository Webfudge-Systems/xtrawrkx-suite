'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/platform/stats',
      handler: 'platform.stats',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/platform/organizations',
      handler: 'platform.listOrganizations',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/platform/organizations',
      handler: 'platform.createOrganization',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/platform/organizations/:id',
      handler: 'platform.getOrganization',
      config: { auth: false },
    },
    {
      method: 'PATCH',
      path: '/platform/organizations/:id',
      handler: 'platform.updateOrganization',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/platform/organizations/:id/activities',
      handler: 'platform.getOrganizationActivities',
      config: { auth: false },
    },
    {
      method: 'DELETE',
      path: '/platform/organizations/:id',
      handler: 'platform.deleteOrganization',
      config: { auth: false },
    },
  ],
};
