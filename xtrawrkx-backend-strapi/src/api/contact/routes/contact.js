'use strict';

/**
 * contact router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

// Create the default router
const defaultRouter = createCoreRouter('api::contact.contact', {
    config: {
        find: { auth: false },
        findOne: { auth: false },
        create: { auth: false },
        update: { auth: false },
        delete: { auth: false }
    }
});

// Custom routes
const myExtraRoutes = [
    {
        method: 'GET',
        path: '/contacts/stats',
        handler: 'contact.getStats',
        config: {
            auth: false,
        },
    },
    {
        method: 'GET',
        path: '/contacts/lead-company/:leadCompanyId',
        handler: 'contact.getByLeadCompany',
        config: {
            auth: false,
        },
    },
    {
        method: 'GET',
        path: '/contacts/client-account/:clientAccountId',
        handler: 'contact.getByClientAccount',
        config: {
            auth: false,
        },
    },
    {
        method: 'POST',
        path: '/contacts/sync-linkedin-enriched',
        handler: 'contact.syncLinkedInEnriched',
        config: {
            auth: false,
        },
    },
    {
        method: 'POST',
        path: '/contacts/generate-linkedin-outreach',
        handler: 'contact.generateLinkedInOutreach',
        config: {
            auth: false,
        },
    },
];

// Custom router function to combine default and custom routes
const customRouter = (innerRouter, extraRoutes = []) => {
    let routes;

    return {
        get prefix() {
            return innerRouter.prefix;
        },
        get routes() {
            if (!routes) {
                // Combine custom routes with default routes, prioritizing custom routes
                routes = extraRoutes.concat(innerRouter.routes);
            }
            return routes;
        },
    };
};

// Export the combined router
module.exports = customRouter(defaultRouter, myExtraRoutes);
