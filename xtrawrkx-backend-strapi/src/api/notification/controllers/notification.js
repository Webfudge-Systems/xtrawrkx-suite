'use strict';

/**
 * notification controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::notification.notification', ({ strapi }) => ({
    /**
     * Get all notifications with proper user filtering
     */
    async find(ctx) {
        try {
            // Allow requests with or without authentication
            // If authenticated, filter by user. If not, use query filter
            const { query } = ctx;
            
            // Get user from token if available (optional auth - don't fail if token is invalid)
            let authenticatedUserId = null;
            try {
                // Check if user is in state (set by auth middleware if token is valid)
                if (ctx.state && ctx.state.user && ctx.state.user.id) {
                    authenticatedUserId = ctx.state.user.id;
                }
            } catch (authError) {
                // Auth is optional, continue without user
            }

            // Parse filters from query
            let filters = {};
            
            // Handle user filter - support both id and documentId
            // Priority: query filter > authenticated user
            if (query['filters[user][id][$eq]']) {
                const userId = parseInt(query['filters[user][id][$eq]'], 10);
                if (!isNaN(userId) && userId > 0) {
                    filters.user = { id: userId };
                }
            } else if (query['filters[user][documentId][$eq]']) {
                const documentId = String(query['filters[user][documentId][$eq]']);
                // Try to find user by documentId and use their numeric id
                try {
                    const userByDocId = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                        where: { documentId: documentId, isActive: true }
                    });
                    if (userByDocId && userByDocId.id) {
                        filters.user = { id: userByDocId.id };
                    } else {
                        filters.user = { documentId: documentId };
                    }
                } catch (docIdError) {
                    console.error('Error looking up user by documentId:', docIdError);
                    filters.user = { documentId: documentId };
                }
            } else if (authenticatedUserId) {
                // If no query filter but user is authenticated, use authenticated user
                filters.user = { id: authenticatedUserId };
            }
            
            // If no user filter at all, return empty (security: don't return all notifications)
            if (!filters.user) {
                return {
                    data: [],
                    meta: {
                        pagination: {
                            page: 1,
                            pageSize: 100,
                            pageCount: 0,
                            total: 0
                        }
                    }
                };
            }

            // Parse pagination
            const page = parseInt(query['pagination[page]'] || query.page || '1', 10);
            const pageSize = parseInt(query['pagination[pageSize]'] || query.pageSize || '100', 10);

            // Parse sort
            const sortStr = query.sort || 'createdAt:desc';

            // Parse populate
            let populate = {};
            if (query.populate) {
                const populateFields = typeof query.populate === 'string'
                    ? query.populate.split(',')
                    : Array.isArray(query.populate)
                        ? query.populate
                        : [];
                
                populateFields.forEach(field => {
                    const trimmedField = field.trim();
                    if (trimmedField) {
                        populate[trimmedField] = true;
                    }
                });
            } else {
                populate = { user: true };
            }


            // Build query options
            const queryOptions = {
                filters,
                pagination: { page, pageSize },
                sort: sortStr,
                populate
            };

            // Use entityService to find notifications
            const { results, pagination: paginationInfo } = await strapi.entityService.findPage(
                'api::notification.notification',
                queryOptions
            );


            return {
                data: results,
                meta: {
                    pagination: paginationInfo
                }
            };
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return ctx.internalServerError(`Failed to fetch notifications: ${error.message}`);
        }
    },

    /**
     * Get a single notification
     */
    async findOne(ctx) {
        try {
            const { id } = ctx.params;
            const { query } = ctx;

            // Parse populate
            let populate = {};
            if (query.populate) {
                const populateFields = typeof query.populate === 'string'
                    ? query.populate.split(',')
                    : Array.isArray(query.populate)
                        ? query.populate
                        : [];
                
                populateFields.forEach(field => {
                    const trimmedField = field.trim();
                    if (trimmedField) {
                        populate[trimmedField] = true;
                    }
                });
            } else {
                populate = { user: true };
            }

            const notification = await strapi.entityService.findOne(
                'api::notification.notification',
                id,
                { populate }
            );

            if (!notification) {
                return ctx.notFound('Notification not found');
            }

            return { data: notification };
        } catch (error) {
            console.error('Error fetching notification:', error);
            return ctx.internalServerError(`Failed to fetch notification: ${error.message}`);
        }
    },

    /**
     * Update a notification (e.g., mark as read)
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { data } = ctx.request.body;

            const updatedNotification = await strapi.entityService.update(
                'api::notification.notification',
                id,
                { data }
            );

            return { data: updatedNotification };
        } catch (error) {
            console.error('Error updating notification:', error);
            return ctx.internalServerError(`Failed to update notification: ${error.message}`);
        }
    },

    /**
     * Delete a notification
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;

            await strapi.entityService.delete('api::notification.notification', id);

            return { data: null };
        } catch (error) {
            console.error('Error deleting notification:', error);
            return ctx.internalServerError(`Failed to delete notification: ${error.message}`);
        }
    }
}));

