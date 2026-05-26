'use strict';

/**
 * lead-company controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::lead-company.lead-company', ({ strapi }) => ({
    /**
     * Create a new lead company
     */
    async create(ctx) {
        try {
            const { data } = ctx.request.body;

            if (!data) {
                return ctx.badRequest('No data provided');
            }


            const entity = await strapi.entityService.create('api::lead-company.lead-company', {
                data,
                populate: {
                    assignedTo: true,
                    contacts: true,
                    activities: true,
                    deals: true
                }
            });


            return { data: entity };
        } catch (error) {
            console.error('Lead company creation error:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            return ctx.badRequest(`Failed to create lead company: ${error.message}`);
        }
    },

    /**
     * Find lead companies with advanced filtering
     */
    async find(ctx) {
        try {
            const { query } = ctx;

            // Build filters
            const filters = {};

            if (query.status) {
                filters.status = query.status;
            }

            if (query.segment) {
                filters.segment = query.segment;
            }

            if (query.assignedTo) {
                filters.assignedTo = query.assignedTo;
            }

            if (query.search) {
                filters.$or = [
                    { companyName: { $containsi: query.search } },
                    { industry: { $containsi: query.search } },
                    { email: { $containsi: query.search } }
                ];
            }


            // Include contacts and assignedTo in population
            const entities = await strapi.entityService.findMany('api::lead-company.lead-company', {
                filters,
                sort: query.sort || 'createdAt:desc',
                pagination: {
                    page: parseInt(query.page) || 1,
                    pageSize: parseInt(query.pageSize) || 25
                },
                populate: {
                    contacts: true,
                    assignedTo: true,
                    deals: true,
                    convertedAccount: true
                }
            });


            return entities;
        } catch (error) {
            console.error('Lead companies fetch error:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            // Return empty result instead of error for development
            return { data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } };
        }
    },

    /**
     * Find one lead company with full details
     */
    async findOne(ctx) {
        try {
            const { id } = ctx.params;

            // Log incoming production requests to help trace unexpected calls
            try {
                const referer = ctx.request.header.referer || ctx.request.header.origin || 'unknown';
                const userAgent = ctx.request.header['user-agent'] || 'unknown';
                const remoteUser = ctx.state?.user?.id || 'anonymous';
                console.log(`[STRAPI_TRACE] findOne lead-company called id=${id} referer=${referer} user=${remoteUser} ua=${userAgent}`);
            } catch (e) {
                // swallow
            }

            // Include convertedAccount relation for converted leads
            // Populate assignedTo with primaryRole for role display
            const entity = await strapi.entityService.findOne('api::lead-company.lead-company', id, {
                populate: {
                    convertedAccount: true,
                    assignedTo: {
                        populate: {
                            primaryRole: true
                        }
                    },
                    contacts: true,
                    deals: true
                }
            });

            if (!entity) {
                console.warn(`[STRAPI_TRACE] lead-company not found id=${id}`);
                return ctx.notFound('Lead company not found');
            }

            return { data: entity };
        } catch (error) {
            console.error('Lead company findOne error:', error);
            console.error('Error details:', error.message);
            console.error('Error stack:', error.stack);
            return ctx.badRequest(`Failed to fetch lead company: ${error.message}`);
        }
    },

    /**
     * Update lead company
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { data } = ctx.request.body;

            const entity = await strapi.entityService.update('api::lead-company.lead-company', id, {
                data,
                populate: {
                    assignedTo: true,
                    contacts: true,
                    activities: true,
                    deals: true
                }
            });

            // Log activity
            await strapi.entityService.create('api::activity.activity', {
                data: {
                    type: 'LEAD',
                    activityType: 'NOTE',
                    title: 'Lead Company Updated',
                    description: `Lead company "${entity.companyName}" was updated`,
                    status: 'COMPLETED',
                    createdBy: ctx.state.user?.id,
                    leadCompany: entity.id
                }
            });

            return { data: entity };
        } catch (error) {
            console.error('Lead company update error:', error);
            return ctx.badRequest('Failed to update lead company');
        }
    },

    /**
     * Convert lead company to client account
     */
    async convertToClient(ctx) {
        try {
            const { id } = ctx.params;

            // Get the lead company
            const leadCompany = await strapi.entityService.findOne('api::lead-company.lead-company', id, {
                populate: {
                    contacts: true,
                    activities: true,
                    deals: true,
                    proposals: true,
                    assignedTo: true
                }
            });

            if (!leadCompany) {
                return ctx.notFound('Lead company not found');
            }

            if (leadCompany.status === 'CONVERTED') {
                return ctx.badRequest('Lead company already converted');
            }

            // Create client account
            const clientAccountData = {
                companyName: leadCompany.companyName,
                industry: leadCompany.industry,
                companyType: leadCompany.type, // Copy type from leadCompany
                subType: leadCompany.subType, // Copy subType from leadCompany
                website: leadCompany.website,
                phone: leadCompany.phone,
                email: leadCompany.email,
                address: leadCompany.address,
                city: leadCompany.city,
                state: leadCompany.state,
                country: leadCompany.country,
                zipCode: leadCompany.zipCode,
                employees: leadCompany.employees,
                founded: leadCompany.founded,
                description: leadCompany.description,
                linkedIn: leadCompany.linkedIn,
                twitter: leadCompany.twitter,
                notes: leadCompany.notes,
                conversionDate: new Date(),
                healthScore: leadCompany.healthScore,
                accountManager: leadCompany.assignedTo?.id,
                convertedFromLead: leadCompany.id,
                source: 'MANUAL',
                status: 'COMMUNITY_MEMBER'
            };

            const clientAccount = await strapi.entityService.create('api::client-account.client-account', {
                data: clientAccountData
            });

            // Update lead company status and link to client account
            await strapi.entityService.update('api::lead-company.lead-company', id, {
                data: {
                    status: 'CONVERTED',
                    convertedAt: new Date(),
                    convertedAccount: clientAccount.id
                }
            });

            // Link contacts to client account (maintain lead company link)
            if (leadCompany.contacts && leadCompany.contacts.length > 0) {
                for (const contact of leadCompany.contacts) {
                    await strapi.entityService.update('api::contact.contact', contact.id, {
                        data: {
                            clientAccount: clientAccount.id
                            // Keep leadCompany relationship intact
                        }
                    });
                }
            }

            // Transfer deals to client account
            if (leadCompany.deals && leadCompany.deals.length > 0) {
                for (const deal of leadCompany.deals) {
                    await strapi.entityService.update('api::deal.deal', deal.id, {
                        data: {
                            clientAccount: clientAccount.id,
                            leadCompany: null
                        }
                    });
                }
            }

            // Transfer activities to client account
            if (leadCompany.activities && leadCompany.activities.length > 0) {
                for (const activity of leadCompany.activities) {
                    await strapi.entityService.update('api::activity.activity', activity.id, {
                        data: {
                            clientAccount: clientAccount.id,
                            leadCompany: null
                        }
                    });
                }
            }

            // Log conversion activity
            await strapi.entityService.create('api::activity.activity', {
                data: {
                    type: 'ACCOUNT',
                    activityType: 'NOTE',
                    title: 'Lead Converted to Client',
                    description: `Lead company "${leadCompany.companyName}" was successfully converted to client account`,
                    status: 'COMPLETED',
                    createdBy: ctx.state.user?.id,
                    clientAccount: clientAccount.id
                }
            });

            return {
                data: {
                    leadCompany: await strapi.entityService.findOne('api::lead-company.lead-company', id, {
                        populate: { convertedAccount: true }
                    }),
                    clientAccount
                }
            };
        } catch (error) {
            console.error('Lead conversion error:', error);
            return ctx.badRequest('Failed to convert lead company');
        }
    },

    /**
     * Get lead company statistics
     */
    async getStats(ctx) {
        try {

            // Get all lead companies first
            const result = await strapi.entityService.findMany('api::lead-company.lead-company');
            const leadCompanies = result?.data || result || [];


            const stats = {
                byStatus: {
                    NEW: 0,
                    CONTACTED: 0,
                    QUALIFIED: 0,
                    PROPOSAL_SENT: 0,
                    CONVERTED: 0,
                    LOST: 0
                },
                totalDealValue: 0,
                conversionRate: 0,
                totalCount: Array.isArray(leadCompanies) ? leadCompanies.length : 0
            };

            // Count by status and calculate totals
            if (Array.isArray(leadCompanies)) {
                leadCompanies.forEach(company => {
                    const status = company.status || 'NEW';
                    if (stats.byStatus[status] !== undefined) {
                        stats.byStatus[status]++;
                    }

                    if (company.dealValue) {
                        stats.totalDealValue += company.dealValue;
                    }
                });
            }

            // Calculate conversion rate
            const totalCount = Array.isArray(leadCompanies) ? leadCompanies.length : 0;
            stats.conversionRate = totalCount > 0
                ? (stats.byStatus.CONVERTED / totalCount) * 100
                : 0;

            return { data: stats };
        } catch (error) {
            console.error('Lead stats error:', error);
            // Return default stats on error
            return {
                data: {
                    byStatus: {
                        NEW: 0,
                        CONTACTED: 0,
                        QUALIFIED: 0,
                        PROPOSAL_SENT: 0,
                        CONVERTED: 0,
                        LOST: 0
                    },
                    totalDealValue: 0,
                    conversionRate: 0,
                    totalCount: 0
                }
            };
        }
    },

    /**
     * Delete a lead company with cascade deletion of linked data
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;

            // First, get the lead company with all relations
            const leadCompany = await strapi.entityService.findOne('api::lead-company.lead-company', id, {
                populate: {
                    contacts: true,
                    deals: true,
                    activities: true,
                    proposals: true
                }
            });

            if (!leadCompany) {
                return ctx.notFound('Lead company not found');
            }

            // Delete related contacts
            if (leadCompany.contacts && leadCompany.contacts.length > 0) {
                for (const contact of leadCompany.contacts) {
                    await strapi.entityService.delete('api::contact.contact', contact.id);
                }
            }

            // Delete related deals
            if (leadCompany.deals && leadCompany.deals.length > 0) {
                for (const deal of leadCompany.deals) {
                    await strapi.entityService.delete('api::deal.deal', deal.id);
                }
            }

            // Delete related activities
            if (leadCompany.activities && leadCompany.activities.length > 0) {
                for (const activity of leadCompany.activities) {
                    await strapi.entityService.delete('api::activity.activity', activity.id);
                }
            }

            // Delete related proposals
            if (leadCompany.proposals && leadCompany.proposals.length > 0) {
                for (const proposal of leadCompany.proposals) {
                    await strapi.entityService.delete('api::proposal.proposal', proposal.id);
                }
            }

            // Finally, delete the lead company itself
            await strapi.entityService.delete('api::lead-company.lead-company', id);

            return { data: { id, deleted: true } };
        } catch (error) {
            console.error('Lead company deletion error:', error);
            return ctx.badRequest(`Failed to delete lead company: ${error.message}`);
        }
    }
}));
