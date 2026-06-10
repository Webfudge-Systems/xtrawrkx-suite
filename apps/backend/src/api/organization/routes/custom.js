'use strict';

/**
 * organization custom router
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/organizations/current',
      handler: 'organization.current',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'PATCH',
      path: '/organizations/:id/settings',
      handler: 'organization.updateSettings',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'GET',
      path: '/organizations/:id/app-access',
      handler: 'organization.getAppAccess',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'GET',
      path: '/organizations/:id/users',
      handler: 'organization.getUsers',
      config: {
        auth: false, // Use custom JWT middleware
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'POST',
      path: '/organizations/:id/invite-users',
      handler: 'organization.inviteUsers',
      config: {
        auth: false, // Use custom JWT middleware
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'PATCH',
      path: '/organizations/:id/users/:membershipId',
      handler: 'organization.updateUserMembership',
      config: {
        auth: false, // Use custom JWT middleware
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'DELETE',
      path: '/organizations/:id/users/:membershipId',
      handler: 'organization.deleteUserMembership',
      config: {
        auth: false, // Use custom JWT middleware
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'POST',
      path: '/organizations/:id/add-app',
      handler: 'organization.addApp',
      config: {
        auth: false, // Use custom JWT middleware
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'GET',
      path: '/organizations/:id/roles',
      handler: 'organization.getOrganizationRoles',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'POST',
      path: '/organizations/:id/roles',
      handler: 'organization.createOrganizationRole',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'PATCH',
      path: '/organizations/:id/roles/:roleId',
      handler: 'organization.updateOrganizationRole',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'DELETE',
      path: '/organizations/:id/roles/:roleId',
      handler: 'organization.deleteOrganizationRole',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'GET',
      path: '/organizations/:id/security-settings',
      handler: 'organization.getSecuritySettings',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    },
    {
      method: 'PATCH',
      path: '/organizations/:id/security-settings',
      handler: 'organization.updateSecuritySettings',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      }
    }
  ]
};
