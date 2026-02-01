'use strict';

/**
 * deal controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::deal.deal', ({ strapi }) => ({
    /**
     * Create a new deal
     */
    async create(ctx) {
        try {
            const { data } = ctx.request.body;

            if (!data) {
                return ctx.badRequest('No data provided');
            }

            const entity = await strapi.entityService.create('api::deal.deal', {
                data,
                populate: {
                    leadCompany: true,
                    clientAccount: true,
                    contact: true,
                    assignedTo: true,
                    activities: true,
                    proposals: true,
                    dealGroup: true,
                    visibleTo: true
                }
            });


            return { data: entity };
        } catch (error) {
            console.error('Deal creation error:', error);
            console.error('Error details:', error.message);
            return ctx.badRequest(`Failed to create deal: ${error.message}`);
        }
    },

    /**
     * Find deals with advanced filtering and visibility control
     */
    async find(ctx) {
        try {

            const { query } = ctx;
            
            // Get current user ID from request (if available)
            // This could come from auth token, query param, or header
            const userId = ctx.query.userId || ctx.state?.user?.id || null;

            const populate = {
                leadCompany: true,
                clientAccount: true,
                contact: true,
                assignedTo: true,
                dealGroup: true,
                visibleTo: true
            };

            // Fetch all deals first
            let entities = await strapi.entityService.findMany('api::deal.deal', {
                ...query,
                populate
            });

            // Filter deals based on visibility
            if (Array.isArray(entities)) {
                entities = entities.filter(deal => {
                    // Public deals are visible to everyone
                    if (deal.visibility === 'PUBLIC' || !deal.visibility) {
                        return true;
                    }
                    
                    // Private deals: only visible to assigned user, users in visibleTo, or if no userId provided (show all for admin)
                    if (deal.visibility === 'PRIVATE') {
                        if (!userId) {
                            // If no user context, show all (for admin/stats purposes)
                            return true;
                        }
                        
                        // Check if user is assigned to the deal
                        const assignedUserId = deal.assignedTo?.id || deal.assignedTo?.documentId;
                        if (assignedUserId && (assignedUserId.toString() === userId.toString())) {
                            return true;
                        }
                        
                        // Check if user is in visibleTo list
                        if (deal.visibleTo && Array.isArray(deal.visibleTo)) {
                            const hasAccess = deal.visibleTo.some(user => {
                                const uid = user.id || user.documentId;
                                return uid && uid.toString() === userId.toString();
                            });
                            if (hasAccess) {
                                return true;
                            }
                        }
                        
                        return false;
                    }
                    
                    return true;
                });
            }


            if (Array.isArray(entities)) {
                return {
                    data: entities,
                    meta: {
                        pagination: {
                            total: entities.length,
                            page: 1,
                            pageSize: entities.length,
                            pageCount: 1
                        }
                    }
                };
            }

            return entities;
        } catch (error) {
            console.error('Deal find error:', error);
            return {
                data: [],
                meta: {
                    pagination: {
                        total: 0,
                        page: 1,
                        pageSize: 0,
                        pageCount: 0
                    }
                }
            };
        }
    },

    /**
     * Find one deal by ID with visibility check
     */
    async findOne(ctx) {
        try {
            const { id } = ctx.params;

            const userId = ctx.query.userId || ctx.state?.user?.id || null;

            const entity = await strapi.entityService.findOne('api::deal.deal', id, {
                populate: {
                    leadCompany: true,
                    clientAccount: true,
                    contact: true,
                    assignedTo: {
                        populate: {
                            primaryRole: true
                        }
                    },
                    activities: true,
                    proposals: true,
                    projects: true,
                    dealGroup: true,
                    visibleTo: true
                }
            });

            if (!entity) {
                return ctx.notFound(`Deal with ID ${id} not found`);
            }

            // Check visibility for private deals
            if (entity.visibility === 'PRIVATE' && userId) {
                const assignedUserId = entity.assignedTo?.id || entity.assignedTo?.documentId;
                const isAssigned = assignedUserId && assignedUserId.toString() === userId.toString();
                
                const hasAccess = entity.visibleTo && Array.isArray(entity.visibleTo) && 
                    entity.visibleTo.some(user => {
                        const uid = user.id || user.documentId;
                        return uid && uid.toString() === userId.toString();
                    });
                
                if (!isAssigned && !hasAccess) {
                    return ctx.forbidden('You do not have access to this private deal');
                }
            }

            return { data: entity };
        } catch (error) {
            console.error(`Deal findOne error for ID ${ctx.params.id}:`, error);
            return ctx.badRequest(`Failed to fetch deal: ${error.message}`);
        }
    },

    /**
     * Update a deal
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { data } = ctx.request.body;


            const entity = await strapi.entityService.update('api::deal.deal', id, {
                data,
                populate: {
                    leadCompany: true,
                    clientAccount: true,
                    contact: true,
                    assignedTo: true,
                    activities: true,
                    proposals: true,
                    dealGroup: true,
                    visibleTo: true
                }
            });

            return { data: entity };
        } catch (error) {
            console.error(`Deal update error for ID ${ctx.params.id}:`, error);
            return ctx.badRequest(`Failed to update deal: ${error.message}`);
        }
    },

    /**
     * Delete a deal
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;

            const entity = await strapi.entityService.delete('api::deal.deal', id);

            return { data: entity };
        } catch (error) {
            console.error(`Deal delete error for ID ${ctx.params.id}:`, error);
            return ctx.badRequest(`Failed to delete deal: ${error.message}`);
        }
    },

    /**
     * Get deals by lead company
     */
    async getByLeadCompany(ctx) {
        try {
            const { leadCompanyId } = ctx.params;

            const entities = await strapi.entityService.findMany('api::deal.deal', {
                filters: {
                    leadCompany: {
                        id: leadCompanyId
                    }
                },
                populate: {
                    leadCompany: true,
                    contact: true,
                    assignedTo: true,
                    activities: true,
                    proposals: true
                }
            });


            return {
                data: entities || [],
                meta: {
                    pagination: {
                        total: entities?.length || 0,
                        page: 1,
                        pageSize: entities?.length || 0,
                        pageCount: 1
                    }
                }
            };
        } catch (error) {
            console.error(`Error fetching deals for lead company ${ctx.params.leadCompanyId}:`, error);
            return {
                data: [],
                meta: {
                    pagination: {
                        total: 0,
                        page: 1,
                        pageSize: 0,
                        pageCount: 0
                    }
                }
            };
        }
    },

    /**
     * Get deals by client account
     */
    async getByClientAccount(ctx) {
        try {
            const { clientAccountId } = ctx.params;

            // Convert to number if it's a numeric string
            const accountId = isNaN(clientAccountId) ? clientAccountId : parseInt(clientAccountId, 10);

            // Try to find deals with the client account
            // First try with id
            let entities = await strapi.entityService.findMany('api::deal.deal', {
                filters: {
                    clientAccount: {
                        id: accountId
                    }
                },
                populate: {
                    clientAccount: true,
                    contact: true,
                    assignedTo: true,
                    activities: true,
                    proposals: true
                }
            });

            // If no results and accountId is a number, also try documentId
            if ((!entities || entities.length === 0) && typeof accountId === 'number') {
                entities = await strapi.entityService.findMany('api::deal.deal', {
                    filters: {
                        clientAccount: {
                            documentId: accountId
                        }
                    },
                    populate: {
                        clientAccount: true,
                        contact: true,
                        assignedTo: true,
                        activities: true,
                        proposals: true
                    }
                });
            }


            return {
                data: entities || [],
                meta: {
                    pagination: {
                        total: entities?.length || 0,
                        page: 1,
                        pageSize: entities?.length || 0,
                        pageCount: 1
                    }
                }
            };
        } catch (error) {
            console.error(`Error fetching deals for client account ${ctx.params.clientAccountId}:`, error);
            return {
                data: [],
                meta: {
                    pagination: {
                        total: 0,
                        page: 1,
                        pageSize: 0,
                        pageCount: 0
                    }
                }
            };
        }
    },

    /**
     * Get deal statistics
     */
    async getStats(ctx) {
        try {

            const deals = await strapi.entityService.findMany('api::deal.deal', {
                populate: {
                    leadCompany: true,
                    clientAccount: true
                }
            });

            const dealsArray = Array.isArray(deals) ? deals : [];

            const stats = {
                total: dealsArray.length,
                byStage: {
                    DISCOVERY: 0,
                    PROPOSAL: 0,
                    NEGOTIATION: 0,
                    CLOSED_WON: 0,
                    CLOSED_LOST: 0
                },
                byPriority: {
                    LOW: 0,
                    MEDIUM: 0,
                    HIGH: 0
                },
                totalValue: 0,
                averageValue: 0,
                wonDeals: 0,
                lostDeals: 0
            };

            dealsArray.forEach(deal => {
                // Count by stage
                if (deal.stage && stats.byStage.hasOwnProperty(deal.stage)) {
                    stats.byStage[deal.stage]++;
                }

                // Count by priority
                if (deal.priority && stats.byPriority.hasOwnProperty(deal.priority)) {
                    stats.byPriority[deal.priority]++;
                }

                // Calculate totals
                if (deal.value) {
                    stats.totalValue += parseFloat(deal.value);
                }

                if (deal.stage === 'CLOSED_WON') {
                    stats.wonDeals++;
                } else if (deal.stage === 'CLOSED_LOST') {
                    stats.lostDeals++;
                }
            });

            stats.averageValue = dealsArray.length > 0 ? stats.totalValue / dealsArray.length : 0;


            return { data: stats };
        } catch (error) {
            console.error('Deal stats error:', error);

            return {
                data: {
                    total: 0,
                    byStage: {
                        DISCOVERY: 0,
                        PROPOSAL: 0,
                        NEGOTIATION: 0,
                        CLOSED_WON: 0,
                        CLOSED_LOST: 0
                    },
                    byPriority: {
                        LOW: 0,
                        MEDIUM: 0,
                        HIGH: 0
                    },
                    totalValue: 0,
                    averageValue: 0,
                    wonDeals: 0,
                    lostDeals: 0
                }
            };
        }
    }
}));
