'use strict';

/**
 * user-role router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Create the core router
const defaultRouter = createCoreRouter('api::user-role.user-role');

// Custom routes
const customRoutes = {
    routes: [
        {
            method: 'GET',
            path: '/user-roles',
            handler: 'user-role.find',
            config: {
                auth: false
            }
        },
        {
            method: 'GET',
            path: '/user-roles/:id',
            handler: 'user-role.findOne',
            config: {
                auth: false
            }
        },
        {
            method: 'POST',
            path: '/user-roles',
            handler: 'user-role.create',
            config: {
                auth: false
            }
        },
        {
            method: 'PUT',
            path: '/user-roles/:id',
            handler: 'user-role.update',
            config: {
                auth: false
            }
        },
        {
            method: 'DELETE',
            path: '/user-roles/:id',
            handler: 'user-role.delete',
            config: {
                auth: false
            }
        },
        {
            method: 'POST',
            path: '/user-roles/:id/assign-users',
            handler: 'user-role.assignUsers',
            config: {
                auth: false
            }
        },
        {
            method: 'GET',
            path: '/user-roles/permissions/:userId',
            handler: 'user-role.getUserPermissions',
            config: {
                auth: false
            }
        }
    ]
};

module.exports = customRoutes;
