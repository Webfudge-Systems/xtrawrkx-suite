'use strict';

/**
 * chat-message controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

async function resolveClientAccountDbId(strapi, rawId) {
    const s = String(rawId ?? '').trim();
    if (!s) return null;
    let row = await strapi.db.query('api::client-account.client-account').findOne({
        where: { documentId: s },
    });
    if (row) return row.id;
    const n = Number.parseInt(s, 10);
    if (!Number.isNaN(n)) {
        row = await strapi.db.query('api::client-account.client-account').findOne({
            where: { id: n },
        });
        if (row) return row.id;
    }
    return null;
}

async function resolveEntityDbId(strapi, entityType, rawId) {
    const entityModelMap = {
        leadCompany: 'api::lead-company.lead-company',
        clientAccount: 'api::client-account.client-account',
        contact: 'api::contact.contact',
        deal: 'api::deal.deal',
    };
    const model = entityModelMap[entityType];
    if (!model) return null;
    if (entityType === 'clientAccount') {
        return resolveClientAccountDbId(strapi, rawId);
    }
    const n = Number.parseInt(String(rawId), 10);
    if (Number.isNaN(n)) return null;
    const row = await strapi.db.query(model).findOne({ where: { id: n } });
    return row?.id ?? null;
}

/**
 * `global::authenticate` is often disabled in dev; core routes use auth:false.
 * Resolve internal user or client account from Bearer JWT so portal + CRM chat still work.
 */
async function resolveChatCaller(strapi, ctx) {
    if (ctx.state?.user?.type) {
        return ctx.state.user;
    }
    const authHeader = ctx.request.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
        return null;
    }

    let decoded;
    try {
        const upJwt = strapi.plugins['users-permissions']?.services?.jwt;
        if (upJwt) {
            decoded = upJwt.verify(token);
        } else {
            throw new Error('fallback-jwt');
        }
    } catch (e) {
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_SECRET || 'myJwtSecret123456789012345678901234567890';
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch {
            return null;
        }
    }

    if (decoded.type === 'internal') {
        const user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
            where: { id: decoded.id, isActive: true },
        });
        if (!user) {
            return null;
        }
        return { ...user, type: 'internal' };
    }
    if (decoded.type === 'client') {
        const account = await strapi.db.query('api::client-account.client-account').findOne({
            where: { id: decoded.id, isActive: true },
        });
        if (!account) {
            return null;
        }
        return { ...account, type: 'client' };
    }
    return null;
}

module.exports = createCoreController('api::chat-message.chat-message', ({ strapi }) => ({
    /**
     * Get messages by entity
     */
    async findByEntity(ctx) {
        try {
            const { entityType, entityId } = ctx.params;

            if (!entityType || !entityId) {
                return ctx.badRequest('Entity type and ID are required');
            }

            const entityFieldMap = {
                leadCompany: 'leadCompany',
                clientAccount: 'clientAccount',
                contact: 'contact',
                deal: 'deal'
            };

            const entityField = entityFieldMap[entityType];
            if (!entityField) {
                return ctx.badRequest('Invalid entity type');
            }

            const resolvedEntityId = await resolveEntityDbId(strapi, entityType, entityId);
            if (resolvedEntityId == null) {
                return ctx.badRequest('Invalid entity ID');
            }

            const channelKey =
                ctx.query.channelKey !== undefined && ctx.query.channelKey !== null
                    ? String(ctx.query.channelKey)
                    : '';

            const allChannels =
                ctx.query.allChannels === 'true' || ctx.query.allChannels === '1';

            const channelFilter =
                channelKey === ''
                    ? {
                          $or: [
                              { channelKey: { $eq: '' } },
                              { channelKey: { $null: true } },
                          ],
                      }
                    : { channelKey: { $eq: channelKey } };

            const andFilters = [
                { [entityField]: { id: { $eq: resolvedEntityId } } },
                { isDeleted: { $eq: false } },
            ];

            if (!allChannels) {
                andFilters.push(channelFilter);
                if (channelKey.startsWith('community:')) {
                    andFilters.push({ parentMessage: { $null: true } });
                }
            }

            const messages = await strapi.entityService.findMany('api::chat-message.chat-message', {
                filters: {
                    $and: andFilters,
                },
                populate: {
                    authorUser: {
                        populate: {
                            avatar: true,
                        },
                    },
                    authorClientAccount: {
                        fields: ['id', 'documentId', 'companyName'],
                    },
                },
                sort: {
                    createdAt: 'asc',
                },
            });

            return { data: messages };
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            return ctx.badRequest(`Failed to fetch chat messages: ${error.message}`);
        }
    },

    /**
     * Get all threads (thread starter messages) for lead companies and client accounts
     */
    async findThreads(ctx) {
        try {
            const { entityType, entityId } = ctx.query;

            const entityFieldMap = {
                leadCompany: 'leadCompany',
                clientAccount: 'clientAccount',
                contact: 'contact',
                deal: 'deal'
            };

            const filters = {
                isDeleted: { $eq: false },
                parentMessage: { $null: true } // Only thread starters (no parent)
            };

            // If entityType and entityId are provided, filter by entity
            if (entityType && entityId) {
                const entityField = entityFieldMap[entityType];
                if (entityField) {
                    filters[entityField] = {
                        id: { $eq: parseInt(entityId) }
                    };
                }
            } else {
                // Get threads from all lead companies and client accounts
                filters.$or = [
                    { leadCompany: { $notNull: true } },
                    { clientAccount: { $notNull: true } }
                ];
            }

            const threads = await strapi.entityService.findMany('api::chat-message.chat-message', {
                filters,
                populate: {
                    authorUser: true,
                    leadCompany: {
                        fields: ['id', 'companyName']
                    },
                    clientAccount: {
                        fields: ['id', 'companyName']
                    },
                    replies: {
                        populate: {
                            authorUser: true
                        },
                        sort: {
                            createdAt: 'asc'
                        }
                    }
                },
                sort: {
                    createdAt: 'desc'
                }
            });

            return { data: threads };
        } catch (error) {
            console.error('Error fetching threads:', error);
            return ctx.badRequest(`Failed to fetch threads: ${error.message}`);
        }
    },

    /**
     * Get a single thread with all replies
     */
    async findThread(ctx) {
        try {
            const { id } = ctx.params;

            const thread = await strapi.entityService.findOne('api::chat-message.chat-message', id, {
                populate: {
                    authorUser: true,
                    leadCompany: {
                        fields: ['id', 'companyName']
                    },
                    clientAccount: {
                        fields: ['id', 'companyName']
                    },
                    replies: {
                        populate: {
                            authorUser: true
                        },
                        sort: {
                            createdAt: 'asc'
                        }
                    },
                    parentMessage: {
                        populate: {
                            authorUser: true
                        }
                    }
                }
            });

            if (!thread) {
                return ctx.notFound('Thread not found');
            }

            return { data: thread };
        } catch (error) {
            console.error('Error fetching thread:', error);
            return ctx.badRequest(`Failed to fetch thread: ${error.message}`);
        }
    },

    /**
     * Create a new chat message
     */
    async create(ctx) {
        try {
            const { data } = ctx.request.body;

            if (!data || !data.message) {
                return ctx.badRequest('Message is required');
            }

            const entityFieldMap = {
                leadCompany: 'leadCompany',
                clientAccount: 'clientAccount',
                contact: 'contact',
                deal: 'deal'
            };

            const entityField = entityFieldMap[data.entityType];
            if (!entityField) {
                return ctx.badRequest('Invalid entity type');
            }

            if (!data.entityId) {
                return ctx.badRequest('Entity ID is required');
            }

            const channelKey =
                data.channelKey !== undefined && data.channelKey !== null ? String(data.channelKey) : '';

            const resolvedEntityId = await resolveEntityDbId(strapi, data.entityType, data.entityId);
            if (resolvedEntityId == null) {
                return ctx.badRequest(`Entity ${entityField} not found or invalid ID`);
            }

            const isReply = !!data.parentMessageId;
            const caller = await resolveChatCaller(strapi, ctx);
            const isClientCaller = caller?.type === 'client';
            const clientAccountId = isClientCaller ? Number.parseInt(String(caller.id), 10) : null;

            let messageData;

            if (isClientCaller) {
                if (data.entityType !== 'clientAccount') {
                    return ctx.forbidden('Clients may only post to client account conversations');
                }
                if (resolvedEntityId !== clientAccountId) {
                    return ctx.forbidden('Cannot post to another account');
                }

                messageData = {
                    message: data.message,
                    [entityField]: resolvedEntityId,
                    channelKey,
                    fromClient: true,
                    authorClientAccount: clientAccountId,
                    isDeleted: false,
                    isEdited: false,
                    isThreadStarter: data.isThreadStarter === true,
                };
            } else {
                let userId = data.authorUser || data.createdBy || (caller?.type === 'internal' ? caller.id : null);
                if (!userId) {
                    return ctx.badRequest('User ID is required to create a message');
                }

                let userRecord = null;
                try {
                    userRecord = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                        where: { documentId: userId, isActive: true },
                    });

                    if (!userRecord) {
                        userRecord = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                            where: { id: userId, isActive: true },
                        });
                    }

                    if (!userRecord) {
                        return ctx.badRequest('User not found or inactive');
                    }
                } catch (userError) {
                    console.error('Error finding user:', userError);
                    return ctx.badRequest('Failed to verify user');
                }

                const userRelationIdNum = userRecord.id || parseInt(userRecord.documentId, 10) || parseInt(userId, 10);

                messageData = {
                    message: data.message,
                    authorUser: userRelationIdNum,
                    [entityField]: resolvedEntityId,
                    channelKey,
                    fromClient: false,
                    isDeleted: false,
                    isEdited: false,
                    isThreadStarter: !isReply && (data.isThreadStarter !== undefined ? data.isThreadStarter : true),
                };
            }

            if (isReply) {
                messageData.parentMessage = parseInt(data.parentMessageId, 10);
                messageData.isThreadStarter = false;
            }

            const message = await strapi.entityService.create('api::chat-message.chat-message', {
                data: messageData,
            });

            const populatedMessage = await strapi.entityService.findOne('api::chat-message.chat-message', message.id, {
                populate: {
                    authorUser: {
                        populate: {
                            avatar: true,
                        },
                    },
                    authorClientAccount: {
                        fields: ['id', 'documentId', 'companyName'],
                    },
                },
            });

            return { data: populatedMessage };
        } catch (error) {
            console.error('Error creating chat message:', error);

            if (error.message?.includes('relation') || error.message?.includes('admin::user')) {
                return ctx.badRequest(
                    `Failed to create chat message. Please ensure Strapi has been restarted after creating the chat-message schema. Error: ${error.message}`
                );
            }

            return ctx.badRequest(`Failed to create chat message: ${error.message}`);
        }
    },

    /**
     * Update a chat message
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { data } = ctx.request.body;

            if (!data || !data.message) {
                return ctx.badRequest('Message is required');
            }

            const existingMessage = await strapi.entityService.findOne('api::chat-message.chat-message', id, {
                populate: ['authorUser', 'authorClientAccount'],
            });

            if (!existingMessage) {
                return ctx.notFound('Message not found');
            }

            const caller = await resolveChatCaller(strapi, ctx);
            const userId = caller?.id;
            const userType = caller?.type;
            const authorUserRow = existingMessage['authorUser'] || {};
            const authorUserId = authorUserRow.id || authorUserRow.documentId;
            const authorAcc = existingMessage['authorClientAccount'];
            const authorAccId =
                authorAcc && typeof authorAcc === 'object' ? authorAcc.id : authorAcc;

            let canModify = false;
            if (!caller) {
                return ctx.unauthorized('Authentication required');
            }
            if (userType === 'client') {
                canModify =
                    existingMessage.fromClient === true &&
                    authorAccId != null &&
                    Number(authorAccId) === Number(userId);
            } else {
                canModify = authorUserId != null && Number(authorUserId) === Number(userId);
            }

            if (!canModify) {
                return ctx.forbidden('You can only edit your own messages');
            }

            const updatedMessage = await strapi.entityService.update('api::chat-message.chat-message', id, {
                data: {
                    message: data.message,
                    isEdited: true,
                    editedAt: new Date().toISOString()
                },
                populate: {
                    authorUser: true
                }
            });

            return { data: updatedMessage };
        } catch (error) {
            console.error('Error updating chat message:', error);
            return ctx.badRequest(`Failed to update chat message: ${error.message}`);
        }
    },

    /**
     * Delete a chat message (soft delete)
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;

            const existingMessage = await strapi.entityService.findOne('api::chat-message.chat-message', id, {
                populate: ['authorUser', 'authorClientAccount'],
            });

            if (!existingMessage) {
                return ctx.notFound('Message not found');
            }

            const caller = await resolveChatCaller(strapi, ctx);
            const userId = caller?.id;
            const userType = caller?.type;
            const authorUserRow = existingMessage['authorUser'] || {};
            const authorUserRowId = authorUserRow.id || authorUserRow.documentId;
            const authorAcc = existingMessage['authorClientAccount'];
            const authorAccId =
                authorAcc && typeof authorAcc === 'object' ? authorAcc.id : authorAcc;

            let canModify = false;
            if (!caller) {
                return ctx.unauthorized('Authentication required');
            }
            if (userType === 'client') {
                canModify =
                    existingMessage.fromClient === true &&
                    authorAccId != null &&
                    Number(authorAccId) === Number(userId);
            } else {
                canModify = authorUserRowId != null && Number(authorUserRowId) === Number(userId);
            }

            if (!canModify) {
                return ctx.forbidden('You can only delete your own messages');
            }

            // Soft delete
            await strapi.entityService.update('api::chat-message.chat-message', id, {
                data: {
                    isDeleted: true
                }
            });

            return { data: { id } };
        } catch (error) {
            console.error('Error deleting chat message:', error);
            return ctx.badRequest(`Failed to delete chat message: ${error.message}`);
        }
    },
}));
