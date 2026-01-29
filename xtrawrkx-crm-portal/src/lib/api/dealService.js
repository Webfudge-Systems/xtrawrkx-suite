import strapiClient from '../strapiClient';

class DealService {
    /**
     * Get all deals with filtering and pagination
     */
    async getAll(params = {}) {
        try {
            const response = await strapiClient.getDeals(params);

            // Handle both array and object responses from Strapi
            if (Array.isArray(response)) {
                return {
                    data: response,
                    meta: {
                        pagination: {
                            total: response.length,
                            page: 1,
                            pageSize: response.length,
                            pageCount: 1
                        }
                    }
                };
            }

            return response;
        } catch (error) {
            console.error('Error fetching deals:', error);
            // Return fallback data instead of throwing
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
    }

    /**
     * Get a single deal by ID
     */
    async getById(id, params = {}) {
        try {

            const response = await strapiClient.getDeal(id, params);

            // Handle both direct object and { data: object } formats
            if (response?.data) {
                return { data: response.data };
            } else if (response?.id) {
                return { data: response };
            } else {
                console.warn('Unexpected response format for getById:', response);
                return { data: null };
            }
        } catch (error) {
            console.error(`Error fetching deal ${id}:`, error);
            return { data: null };
        }
    }

    /**
     * Create a new deal
     */
    async create(data) {
        try {
            const response = await strapiClient.createDeal(data);

            // Handle both direct object and { data: object } formats
            if (response.data) {
                return response.data;
            }

            return response;
        } catch (error) {
            console.error('Error creating deal:', error);
            throw error;
        }
    }

    /**
     * Update a deal
     */
    async update(id, data) {
        try {
            const response = await strapiClient.updateDeal(id, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating deal ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a deal
     */
    async delete(id) {
        try {
            await strapiClient.deleteDeal(id);
            return true;
        } catch (error) {
            console.error(`Error deleting deal ${id}:`, error);
            throw error;
        }
    }

    /**
     * Search deals
     */
    async search(searchTerm, filters = {}) {
        try {
            const params = {
                search: searchTerm,
                ...filters,
                populate: ['account', 'contact', 'leadCompany', 'clientAccount', 'assignedTo']
            };

            const response = await strapiClient.getDeals(params);
            return response;
        } catch (error) {
            console.error('Error searching deals:', error);
            throw error;
        }
    }

    /**
     * Get deals by stage
     */
    async getByStage(stage, params = {}) {
        try {
            const queryParams = {
                stage,
                populate: ['account', 'contact', 'assignedTo'],
                ...params
            };

            const response = await strapiClient.getDeals(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching deals by stage ${stage}:`, error);
            throw error;
        }
    }

    /**
     * Get deals by priority
     */
    async getByPriority(priority, params = {}) {
        try {
            const queryParams = {
                priority,
                populate: ['account', 'contact', 'assignedTo'],
                ...params
            };

            const response = await strapiClient.getDeals(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching deals by priority ${priority}:`, error);
            throw error;
        }
    }

    /**
     * Get deals for a lead company
     */
    async getByLeadCompany(leadCompanyId, params = {}) {
        try {
            // Use the custom endpoint for lead company deals
            const response = await strapiClient.get(`/deals/lead-company/${leadCompanyId}`, params);
            return response;
        } catch (error) {
            console.error(`Error fetching deals for lead company ${leadCompanyId}:`, error);
            // Return fallback data instead of throwing
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
    }

    /**
     * Get deals for a client account
     */
    async getByClientAccount(clientAccountId, params = {}) {
        try {
            // Use the custom endpoint for client account deals
            const response = await strapiClient.get(`/deals/client-account/${clientAccountId}`, params);
            return response;
        } catch (error) {
            console.error(`Error fetching deals for client account ${clientAccountId}:`, error);
            throw error;
        }
    }

    /**
     * Get deals assigned to a user
     */
    async getByAssignee(userId, params = {}) {
        try {
            const queryParams = {
                assignedTo: userId,
                populate: ['account', 'contact', 'leadCompany', 'clientAccount'],
                ...params
            };

            const response = await strapiClient.getDeals(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching deals for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Update deal stage
     */
    async updateStage(id, stage) {
        try {
            const response = await strapiClient.updateDeal(id, { stage });
            return response.data;
        } catch (error) {
            console.error(`Error updating deal ${id} stage:`, error);
            throw error;
        }
    }

    /**
     * Update deal value
     */
    async updateValue(id, value) {
        try {
            const response = await strapiClient.updateDeal(id, { value });
            return response.data;
        } catch (error) {
            console.error(`Error updating deal ${id} value:`, error);
            throw error;
        }
    }

    /**
     * Update deal probability
     */
    async updateProbability(id, probability) {
        try {
            const response = await strapiClient.updateDeal(id, { probability });
            return response.data;
        } catch (error) {
            console.error(`Error updating deal ${id} probability:`, error);
            throw error;
        }
    }

    /**
     * Get deals closing soon
     */
    async getClosingSoon(days = 30) {
        try {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);

            const params = {
                closeDate: {
                    $lte: futureDate.toISOString()
                },
                stage: {
                    $notIn: ['CLOSED_WON', 'CLOSED_LOST']
                },
                populate: ['account', 'contact', 'assignedTo']
            };

            const response = await strapiClient.getDeals(params);
            return response;
        } catch (error) {
            console.error('Error fetching deals closing soon:', error);
            throw error;
        }
    }

    /**
     * Get overdue deals
     */
    async getOverdue() {
        try {
            const today = new Date();

            const params = {
                closeDate: {
                    $lt: today.toISOString()
                },
                stage: {
                    $notIn: ['CLOSED_WON', 'CLOSED_LOST']
                },
                populate: ['account', 'contact', 'assignedTo']
            };

            const response = await strapiClient.getDeals(params);
            return response;
        } catch (error) {
            console.error('Error fetching overdue deals:', error);
            throw error;
        }
    }

    /**
     * Get deal pipeline data
     */
    async getPipelineData() {
        try {
            const allDeals = await this.getAll({ pagination: { pageSize: 1000 } });

            const pipeline = {
                stages: {},
                totalValue: 0,
                totalDeals: 0,
                averageDealSize: 0,
                conversionRates: {}
            };

            if (allDeals.data) {
                allDeals.data.forEach(deal => {
                    const stage = deal.stage || 'UNKNOWN';

                    if (!pipeline.stages[stage]) {
                        pipeline.stages[stage] = {
                            count: 0,
                            value: 0,
                            deals: []
                        };
                    }

                    pipeline.stages[stage].count++;
                    pipeline.stages[stage].value += deal.value || 0;
                    pipeline.stages[stage].deals.push(deal);

                    pipeline.totalValue += deal.value || 0;
                    pipeline.totalDeals++;
                });

                pipeline.averageDealSize = pipeline.totalDeals > 0
                    ? pipeline.totalValue / pipeline.totalDeals
                    : 0;
            }

            return pipeline;
        } catch (error) {
            console.error('Error fetching pipeline data:', error);
            throw error;
        }
    }

    /**
     * Get deal statistics
     */
    async getStats() {
        try {
            const allDeals = await this.getAll({ pagination: { pageSize: 1000 } });

            const stats = {
                total: allDeals.meta?.pagination?.total || 0,
                byStage: {},
                byPriority: {},
                totalValue: 0,
                averageValue: 0,
                wonDeals: 0,
                lostDeals: 0,
                winRate: 0
            };

            if (allDeals.data) {
                allDeals.data.forEach(deal => {
                    // Count by stage
                    stats.byStage[deal.stage] = (stats.byStage[deal.stage] || 0) + 1;

                    // Count by priority
                    stats.byPriority[deal.priority] = (stats.byPriority[deal.priority] || 0) + 1;

                    // Calculate totals
                    stats.totalValue += deal.value || 0;

                    if (deal.stage === 'CLOSED_WON') {
                        stats.wonDeals++;
                    } else if (deal.stage === 'CLOSED_LOST') {
                        stats.lostDeals++;
                    }
                });

                stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;

                const closedDeals = stats.wonDeals + stats.lostDeals;
                stats.winRate = closedDeals > 0 ? (stats.wonDeals / closedDeals) * 100 : 0;
            }

            return stats;
        } catch (error) {
            console.error('Error fetching deal stats:', error);
            throw error;
        }
    }

    /**
     * Bulk update deals
     */
    async bulkUpdate(ids, data) {
        try {
            const promises = ids.map(id => this.update(id, data));
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Error bulk updating deals:', error);
            throw error;
        }
    }

    /**
     * Move deal to next stage
     */
    async moveToNextStage(id) {
        try {
            const deal = await this.getById(id);

            const stageProgression = {
                'PROSPECTING': 'QUALIFICATION',
                'QUALIFICATION': 'PROPOSAL',
                'PROPOSAL': 'NEGOTIATION',
                'NEGOTIATION': 'CLOSED_WON'
            };

            const nextStage = stageProgression[deal.stage];

            if (nextStage) {
                return await this.updateStage(id, nextStage);
            } else {
                throw new Error(`Cannot move deal from stage ${deal.stage}`);
            }
        } catch (error) {
            console.error(`Error moving deal ${id} to next stage:`, error);
            throw error;
        }
    }

    /**
     * Close deal as won
     */
    async closeAsWon(id, closeDate = null) {
        try {
            const data = {
                stage: 'CLOSED_WON',
                closeDate: closeDate || new Date().toISOString()
            };

            const response = await strapiClient.updateDeal(id, data);
            return response.data;
        } catch (error) {
            console.error(`Error closing deal ${id} as won:`, error);
            throw error;
        }
    }

    /**
     * Close deal as lost
     */
    async closeAsLost(id, reason = null, closeDate = null) {
        try {
            const data = {
                stage: 'CLOSED_LOST',
                closeDate: closeDate || new Date().toISOString()
            };

            if (reason) {
                data.description = `${data.description || ''}\n\nLost Reason: ${reason}`.trim();
            }

            const response = await strapiClient.updateDeal(id, data);
            return response.data;
        } catch (error) {
            console.error(`Error closing deal ${id} as lost:`, error);
            throw error;
        }
    }

    /**
     * Get deal forecast
     */
    async getForecast(period = 'month') {
        try {
            const today = new Date();
            let startDate, endDate;

            if (period === 'month') {
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            } else if (period === 'quarter') {
                const quarter = Math.floor(today.getMonth() / 3);
                startDate = new Date(today.getFullYear(), quarter * 3, 1);
                endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
            } else if (period === 'year') {
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31);
            }

            const params = {
                closeDate: {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString()
                },
                stage: {
                    $notIn: ['CLOSED_LOST']
                },
                populate: ['assignedTo']
            };

            const deals = await strapiClient.getDeals(params);

            const forecast = {
                period,
                startDate,
                endDate,
                totalValue: 0,
                weightedValue: 0,
                dealCount: deals.data?.length || 0,
                byStage: {}
            };

            if (deals.data) {
                deals.data.forEach(deal => {
                    const value = deal.value || 0;
                    const probability = deal.probability || 0;

                    forecast.totalValue += value;
                    forecast.weightedValue += (value * probability / 100);

                    if (!forecast.byStage[deal.stage]) {
                        forecast.byStage[deal.stage] = {
                            count: 0,
                            value: 0,
                            weightedValue: 0
                        };
                    }

                    forecast.byStage[deal.stage].count++;
                    forecast.byStage[deal.stage].value += value;
                    forecast.byStage[deal.stage].weightedValue += (value * probability / 100);
                });
            }

            return forecast;
        } catch (error) {
            console.error(`Error fetching ${period} forecast:`, error);
            throw error;
        }
    }
}

export default new DealService();
