'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const defaultPopulate = {
    clientAccount: true,
    createdBy: true,
    documents: true,
};

module.exports = createCoreController(
    'api::client-portal-document.client-portal-document',
    ({ strapi }) => ({
        async create(ctx) {
            try {
                const { data } = ctx.request.body;
                if (!data) {
                    return ctx.badRequest('No data provided');
                }
                const entity = await strapi.entityService.create(
                    'api::client-portal-document.client-portal-document',
                    { data, populate: defaultPopulate }
                );
                return { data: entity };
            } catch (error) {
                console.error('Client portal document create error:', error);
                return ctx.badRequest(
                    `Failed to create document: ${error.message}`
                );
            }
        },

        async find(ctx) {
            try {
                const { query } = ctx;
                const entities = await strapi.entityService.findMany(
                    'api::client-portal-document.client-portal-document',
                    { ...query, populate: defaultPopulate }
                );
                if (Array.isArray(entities)) {
                    return {
                        data: entities,
                        meta: {
                            pagination: {
                                total: entities.length,
                                page: 1,
                                pageSize: entities.length,
                                pageCount: 1,
                            },
                        },
                    };
                }
                return entities;
            } catch (error) {
                console.error('Client portal document find error:', error);
                return {
                    data: [],
                    meta: {
                        pagination: {
                            total: 0,
                            page: 1,
                            pageSize: 0,
                            pageCount: 0,
                        },
                    },
                };
            }
        },

        async findOne(ctx) {
            try {
                const { id } = ctx.params;
                const entity = await strapi.entityService.findOne(
                    'api::client-portal-document.client-portal-document',
                    id,
                    { populate: defaultPopulate }
                );
                if (!entity) {
                    return ctx.notFound('Document not found');
                }
                return { data: entity };
            } catch (error) {
                console.error('Client portal document findOne error:', error);
                return ctx.notFound('Document not found');
            }
        },

        async update(ctx) {
            try {
                const { id } = ctx.params;
                const { data } = ctx.request.body;
                if (!data) {
                    return ctx.badRequest('No data provided');
                }
                const entity = await strapi.entityService.update(
                    'api::client-portal-document.client-portal-document',
                    id,
                    { data, populate: defaultPopulate }
                );
                return { data: entity };
            } catch (error) {
                console.error('Client portal document update error:', error);
                return ctx.badRequest(
                    `Failed to update document: ${error.message}`
                );
            }
        },

        async delete(ctx) {
            try {
                const { id } = ctx.params;
                const entity = await strapi.entityService.delete(
                    'api::client-portal-document.client-portal-document',
                    id
                );
                return { data: entity };
            } catch (error) {
                console.error('Client portal document delete error:', error);
                return ctx.badRequest(
                    `Failed to delete document: ${error.message}`
                );
            }
        },
    })
);
