'use strict';

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::client-portal-document.client-portal-document', {
    config: {
        find: { auth: false, middlewares: [] },
        findOne: { auth: false, middlewares: [] },
        create: { auth: false, middlewares: [] },
        update: { auth: false, middlewares: [] },
        delete: { auth: false, middlewares: [] },
    },
});
