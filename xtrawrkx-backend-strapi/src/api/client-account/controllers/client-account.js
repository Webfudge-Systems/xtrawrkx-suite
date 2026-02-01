'use strict';

/**
 * client-account controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::client-account.client-account', ({ strapi }) => ({
    /**
     * Create a new client account
     */
    async create(ctx) {
        try {
            const { data } = ctx.request.body;

            // Add current user as account manager if not specified
            if (!data.accountManager && ctx.state.user) {
                data.accountManager = ctx.state.user.id;
            }

            const entity = await strapi.entityService.create('api::client-account.client-account', {
                data,
                populate: {
                    accountManager: true,
                    contacts: true,
                    activities: true,
                    deals: true,
                    projects: true
                }
            });

            // Log activity
            await strapi.entityService.create('api::activity.activity', {
                data: {
                    type: 'ACCOUNT',
                    activityType: 'NOTE',
                    title: 'Client Account Created',
                    description: `Client account "${data.companyName}" was created`,
                    status: 'COMPLETED',
                    createdBy: ctx.state.user?.id,
                    clientAccount: entity.id
                }
            });

            return { data: entity };
        } catch (error) {
            console.error('Client account creation error:', error);
            return ctx.badRequest('Failed to create client account');
        }
    },

    /**
     * Find client accounts with advanced filtering
     */
    async find(ctx) {
        try {
            const { query } = ctx;

            // Build filters
            const filters = {};

            if (query.status) {
                filters.status = query.status;
            }

            if (query.type) {
                filters.type = query.type;
            }

            if (query.accountManager) {
                filters.accountManager = query.accountManager;
            }

            if (query.search) {
                filters.$or = [
                    { companyName: { $containsi: query.search } },
                    { industry: { $containsi: query.search } },
                    { email: { $containsi: query.search } }
                ];
            }

            const entities = await strapi.entityService.findMany('api::client-account.client-account', {
                filters,
                sort: query.sort || 'createdAt:desc',
                pagination: {
                    page: query.page || 1,
                    pageSize: query.pageSize || 25
                },
                populate: {
                    accountManager: true,
                    contacts: true,
                    deals: true
                }
            });

            return entities;
        } catch (error) {
            console.error('Client accounts fetch error:', error);
            return ctx.badRequest('Failed to fetch client accounts');
        }
    },

    /**
     * Find one client account with full details
     */
    async findOne(ctx) {
        try {
            const { id } = ctx.params;

            // First try with basic population
            const entity = await strapi.entityService.findOne('api::client-account.client-account', id, {
                populate: {
                    accountManager: {
                        populate: {
                            primaryRole: true
                        }
                    },
                    contacts: true,
                    activities: true,
                    deals: true,
                    projects: true,
                    invoices: true,
                    convertedFromLead: true
                }
            });

            if (!entity) {
                return ctx.notFound('Client account not found');
            }

            return { data: entity };
        } catch (error) {
            console.error('Client account fetch error:', error);
            console.error('Error details:', error.message);

            // Try without population as fallback
            try {
                const basicEntity = await strapi.entityService.findOne('api::client-account.client-account', id);
                if (basicEntity) {
                    return { data: basicEntity };
                }
            } catch (fallbackError) {
                console.error('Fallback fetch also failed:', fallbackError);
            }

            return ctx.badRequest('Failed to fetch client account');
        }
    },

    /**
     * Update client account
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { data } = ctx.request.body;

            const entity = await strapi.entityService.update('api::client-account.client-account', id, {
                data,
                populate: {
                    accountManager: true,
                    contacts: true,
                    activities: true,
                    deals: true,
                    projects: true
                }
            });

            // Log activity
            await strapi.entityService.create('api::activity.activity', {
                data: {
                    type: 'ACCOUNT',
                    activityType: 'NOTE',
                    title: 'Client Account Updated',
                    description: `Client account "${entity.companyName}" was updated`,
                    status: 'COMPLETED',
                    createdBy: ctx.state.user?.id,
                    clientAccount: entity.id
                }
            });

            return { data: entity };
        } catch (error) {
            console.error('Client account update error:', error);
            return ctx.badRequest('Failed to update client account');
        }
    },

    /**
     * Get client account statistics
     */
    async getStats(ctx) {
        try {

            // Get all client accounts first
            const result = await strapi.entityService.findMany('api::client-account.client-account');
            const clientAccounts = result?.data || result || [];


            const stats = {
                byStatus: {
                    ACTIVE: 0,
                    INACTIVE: 0,
                    CHURNED: 0,
                    ON_HOLD: 0
                },
                totalRevenue: 0,
                averageHealthScore: 0,
                recentConversions: 0,
                totalCount: Array.isArray(clientAccounts) ? clientAccounts.length : 0
            };

            let totalHealthScore = 0;
            let healthScoreCount = 0;

            // Count by status and calculate totals
            if (Array.isArray(clientAccounts)) {
                clientAccounts.forEach(account => {
                    const status = account.status || 'ACTIVE';
                    if (stats.byStatus[status] !== undefined) {
                        stats.byStatus[status]++;
                    }

                    if (account.revenue) {
                        stats.totalRevenue += account.revenue;
                    }

                    if (account.healthScore) {
                        totalHealthScore += account.healthScore;
                        healthScoreCount++;
                    }
                });
            }

            // Calculate average health score
            stats.averageHealthScore = healthScoreCount > 0
                ? Math.round(totalHealthScore / healthScoreCount)
                : 0;

            return { data: stats };
        } catch (error) {
            console.error('Client account stats error:', error);
            // Return default stats on error
            return {
                data: {
                    byStatus: {
                        ACTIVE: 0,
                        INACTIVE: 0,
                        CHURNED: 0,
                        ON_HOLD: 0
                    },
                    totalRevenue: 0,
                    averageHealthScore: 0,
                    recentConversions: 0,
                    totalCount: 0
                }
            };
        }
    },

    /**
     * Get account health details
     */
    async getHealthDetails(ctx) {
        try {
            const { id } = ctx.params;

            // First get basic account info
            const account = await strapi.entityService.findOne('api::client-account.client-account', id);

            if (!account) {
                return ctx.notFound('Client account not found');
            }

            // Try to get related data with basic population
            let accountWithRelations;
            try {
                accountWithRelations = await strapi.entityService.findOne('api::client-account.client-account', id, {
                    populate: {
                        activities: true,
                        deals: true,
                        projects: true,
                        invoices: true
                    }
                });
            } catch (populateError) {
                console.warn('Failed to populate relations, using basic account data:', populateError);
                accountWithRelations = account;
            }

            // Calculate health factors
            const healthFactors = {
                activityLevel: 0,
                dealProgress: 0,
                projectHealth: 0,
                paymentHealth: 0,
                overallScore: account.healthScore || 0
            };

            // Activity level (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const activities = accountWithRelations.activities || [];
            const recentActivities = activities.filter(
                activity => new Date(activity.createdAt) >= thirtyDaysAgo
            );

            healthFactors.activityLevel = Math.min((recentActivities.length / 10) * 100, 100);

            // Deal progress
            const deals = accountWithRelations.deals || [];
            if (deals.length > 0) {
                const activeDeals = deals.filter(deal =>
                    !['CLOSED_WON', 'CLOSED_LOST'].includes(deal.stage)
                );
                healthFactors.dealProgress = activeDeals.length > 0 ? 75 : 50;
            }

            // Project health
            const projects = accountWithRelations.projects || [];
            if (projects.length > 0) {
                const avgProgress = projects.reduce((sum, project) =>
                    sum + (project.progress || 0), 0
                ) / projects.length;
                healthFactors.projectHealth = avgProgress;
            }

            // Payment health
            const invoices = accountWithRelations.invoices || [];
            if (invoices.length > 0) {
                const paidInvoices = invoices.filter(invoice =>
                    invoice.status === 'PAID'
                );
                healthFactors.paymentHealth = (paidInvoices.length / invoices.length) * 100;
            }

            return { data: healthFactors };
        } catch (error) {
            console.error('Account health details error:', error);
            console.error('Error details:', error.message);

            // Return basic health data as fallback
            try {
                const basicAccount = await strapi.entityService.findOne('api::client-account.client-account', id);
                if (basicAccount) {
                    return {
                        data: {
                            activityLevel: 0,
                            dealProgress: 0,
                            projectHealth: 0,
                            paymentHealth: 0,
                            overallScore: basicAccount.healthScore || 0
                        }
                    };
                }
            } catch (fallbackError) {
                console.error('Fallback health fetch failed:', fallbackError);
            }

            return ctx.badRequest('Failed to fetch account health details');
        }
    },

    /**
     * Delete a client account with cascade deletion of linked data
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;

            // First, get the client account with all relations
            const clientAccount = await strapi.entityService.findOne('api::client-account.client-account', id, {
                populate: {
                    contacts: true,
                    projects: true,
                    invoices: true,
                    activities: true,
                    convertedFromLead: true
                }
            });

            if (!clientAccount) {
                return ctx.notFound('Client account not found');
            }

            // Delete related contacts (only if they're not linked to lead companies)
            if (clientAccount.contacts && clientAccount.contacts.length > 0) {
                for (const contact of clientAccount.contacts) {
                    // Get full contact data to check if it's linked to a lead company
                    const fullContact = await strapi.entityService.findOne('api::contact.contact', contact.id, {
                        populate: { leadCompany: true, clientAccount: true }
                    });

                    if (fullContact.leadCompany) {
                        // Contact is linked to a lead company, just remove client account link
                        await strapi.entityService.update('api::contact.contact', contact.id, {
                            data: { clientAccount: null }
                        });
                    } else {
                        // Contact is only linked to this client account, delete it
                        await strapi.entityService.delete('api::contact.contact', contact.id);
                    }
                }
            }

            // Delete related projects
            if (clientAccount.projects && clientAccount.projects.length > 0) {
                for (const project of clientAccount.projects) {
                    await strapi.entityService.delete('api::project.project', project.id);
                }
            }

            // Delete related invoices
            if (clientAccount.invoices && clientAccount.invoices.length > 0) {
                for (const invoice of clientAccount.invoices) {
                    await strapi.entityService.delete('api::invoice.invoice', invoice.id);
                }
            }

            // Delete related activities
            if (clientAccount.activities && clientAccount.activities.length > 0) {
                for (const activity of clientAccount.activities) {
                    await strapi.entityService.delete('api::activity.activity', activity.id);
                }
            }

            // If this account was converted from a lead, update the lead company
            if (clientAccount.convertedFromLead) {
                await strapi.entityService.update('api::lead-company.lead-company', clientAccount.convertedFromLead.id, {
                    data: {
                        status: 'QUALIFIED', // Reset to qualified status
                        convertedAccount: null,
                        convertedAt: null
                    }
                });
            }

            // Finally, delete the client account itself
            await strapi.entityService.delete('api::client-account.client-account', id);

            return { data: { id, deleted: true } };
        } catch (error) {
            console.error('Client account deletion error:', error);
            return ctx.badRequest(`Failed to delete client account: ${error.message}`);
        }
    }
}));
