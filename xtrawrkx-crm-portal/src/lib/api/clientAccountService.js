import strapiClient from '../strapiClient';

class ClientAccountService {
    /**
     * Get all client accounts with filtering and pagination
     */
    async getAll(params = {}) {
        try {
            // Start with basic query without complex population
            const queryParams = {
                sort: 'createdAt:desc',
                pagination: {
                    pageSize: 100
                },
                ...params
            };

            const response = await strapiClient.getClientAccounts(queryParams);

            // Return the response as-is since the API returns data directly
            return response;
        } catch (error) {
            console.error('Error fetching client accounts:', error);
            console.error('Error details:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get a single client account by ID
     */
    async getById(id, params = {}) {
        try {
            // Populate accountManager with primaryRole for role display
            const queryParams = {
                populate: {
                    accountManager: {
                        populate: {
                            primaryRole: true,
                            department: true,
                            avatar: true,
                        }
                    },
                    pocAssignedBy: {
                        populate: {
                            primaryRole: true,
                        }
                    },
                    contacts: true
                },
                ...params
            };
            const response = await strapiClient.getClientAccount(id, queryParams);
            return response.data;
        } catch (error) {
            console.error(`Error fetching client account ${id}:`, error);
            throw error;
        }
    }

    /**
     * Create a new client account
     */
    async create(data) {
        try {
            const response = await strapiClient.createClientAccount(data);
            return response.data;
        } catch (error) {
            console.error('Error creating client account:', error);
            throw error;
        }
    }

    /**
     * Update a client account
     */
    async update(id, data) {
        try {
            const response = await strapiClient.updateClientAccount(id, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating client account ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a client account
     */
    async delete(id) {
        try {
            await strapiClient.deleteClientAccount(id);
            return true;
        } catch (error) {
            console.error(`Error deleting client account ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get client account statistics
     */
    async getStats() {
        try {
            const response = await strapiClient.getClientAccountStats();
            return response.data || response;
        } catch (error) {
            console.error('Error fetching client account stats:', error);
            console.error('Stats error details:', error.response?.data || error.message);
            // Return default stats if API fails
            return {
                byStatus: {
                    ACTIVE: 0,
                    INACTIVE: 0,
                    CHURNED: 0,
                    ON_HOLD: 0,
                    REGISTERED: 0,
                    COMMUNITY_MEMBER: 0,
                    COMMUNITY_PAID: 0,
                    COMMUNITY_NON_PAID: 0,
                    LOST: 0,
                    STOPPED: 0
                },
                totalRevenue: 0,
                averageHealthScore: 0,
                recentConversions: 0
            };
        }
    }

    /**
     * Get client account health details
     */
    async getHealthDetails(id) {
        try {
            const response = await strapiClient.getClientAccountHealth(id);
            return response.data;
        } catch (error) {
            console.error(`Error fetching client account ${id} health:`, error);
            throw error;
        }
    }

    /**
     * Search client accounts
     */
    async search(searchTerm, filters = {}) {
        try {
            const params = {
                search: searchTerm,
                ...filters,
                populate: ['accountManager', 'contacts']
            };

            const response = await strapiClient.getClientAccounts(params);
            return response;
        } catch (error) {
            console.error('Error searching client accounts:', error);
            throw error;
        }
    }

    /**
     * Get client accounts by status
     */
    async getByStatus(status, params = {}) {
        try {
            const queryParams = {
                status,
                populate: ['accountManager', 'contacts', 'activities'],
                ...params
            };

            const response = await strapiClient.getClientAccounts(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching client accounts by status ${status}:`, error);
            throw error;
        }
    }

    /**
     * Get client accounts by type
     */
    async getByType(type, params = {}) {
        try {
            const queryParams = {
                type,
                populate: ['accountManager', 'contacts'],
                ...params
            };

            const response = await strapiClient.getClientAccounts(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching client accounts by type ${type}:`, error);
            throw error;
        }
    }

    /**
     * Get client accounts managed by a user
     */
    async getByAccountManager(userId, params = {}) {
        try {
            const queryParams = {
                accountManager: userId,
                populate: ['accountManager', 'contacts', 'activities'],
                ...params
            };

            const response = await strapiClient.getClientAccounts(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching client accounts for manager ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Update client account health score
     */
    async updateHealthScore(id, healthScore) {
        try {
            const response = await strapiClient.updateClientAccount(id, { healthScore });
            return response.data;
        } catch (error) {
            console.error(`Error updating client account ${id} health score:`, error);
            throw error;
        }
    }

    /**
     * Update client account status
     */
    async updateStatus(id, status) {
        try {
            const response = await strapiClient.updateClientAccount(id, { status });
            return response.data;
        } catch (error) {
            console.error(`Error updating client account ${id} status:`, error);
            throw error;
        }
    }

    /**
     * Add note to client account
     */
    async addNote(id, note) {
        try {
            const clientAccount = await this.getById(id);
            const existingNotes = clientAccount.notes || '';
            const timestamp = new Date().toISOString();
            const newNotes = `${existingNotes}\n\n[${timestamp}] ${note}`.trim();

            const response = await strapiClient.updateClientAccount(id, { notes: newNotes });
            return response.data;
        } catch (error) {
            console.error(`Error adding note to client account ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get client accounts with low health scores
     */
    async getAtRiskAccounts(threshold = 50) {
        try {
            const params = {
                healthScore: {
                    $lt: threshold
                },
                status: 'ACTIVE',
                populate: ['accountManager', 'contacts', 'activities']
            };

            const response = await strapiClient.getClientAccounts(params);
            return response;
        } catch (error) {
            console.error('Error fetching at-risk accounts:', error);
            throw error;
        }
    }

    /**
     * Get recently converted accounts
     */
    async getRecentConversions(days = 30) {
        try {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - days);

            const params = {
                conversionDate: {
                    $gte: pastDate.toISOString()
                },
                populate: ['accountManager', 'convertedFromLead']
            };

            const response = await strapiClient.getClientAccounts(params);
            return response;
        } catch (error) {
            console.error('Error fetching recent conversions:', error);
            throw error;
        }
    }

    /**
     * Get top revenue accounts
     */
    async getTopRevenueAccounts(limit = 10) {
        try {
            const params = {
                sort: 'revenue:desc',
                pagination: {
                    pageSize: limit
                },
                populate: ['accountManager', 'contacts']
            };

            const response = await strapiClient.getClientAccounts(params);
            return response;
        } catch (error) {
            console.error('Error fetching top revenue accounts:', error);
            throw error;
        }
    }

    /**
     * Get account activity summary
     */
    async getActivitySummary(id, days = 30) {
        try {
            const account = await this.getById(id);
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - days);

            const recentActivities = account.activities?.filter(
                activity => new Date(activity.createdAt) >= pastDate
            ) || [];

            const summary = {
                totalActivities: recentActivities.length,
                byType: {},
                lastActivity: recentActivities[0] || null,
                averagePerWeek: Math.round((recentActivities.length / days) * 7)
            };

            recentActivities.forEach(activity => {
                summary.byType[activity.activityType] = (summary.byType[activity.activityType] || 0) + 1;
            });

            return summary;
        } catch (error) {
            console.error(`Error fetching activity summary for account ${id}:`, error);
            throw error;
        }
    }

    /**
     * Bulk update client accounts
     */
    async bulkUpdate(ids, data) {
        try {
            const promises = ids.map(id => this.update(id, data));
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Error bulk updating client accounts:', error);
            throw error;
        }
    }

    /**
     * Get account portfolio overview
     */
    async getPortfolioOverview() {
        try {
            const stats = await this.getStats();

            const overview = {
                totalAccounts: Object.values(stats.byStatus || {}).reduce((sum, count) => sum + count, 0),
                activeAccounts: stats.byStatus?.ACTIVE || 0,
                totalRevenue: stats.totalRevenue || 0,
                averageHealthScore: stats.averageHealthScore || 0,
                recentConversions: stats.recentConversions || 0,
                byType: stats.byType || {},
                byStatus: stats.byStatus || {}
            };

            return overview;
        } catch (error) {
            console.error('Error fetching portfolio overview:', error);
            throw error;
        }
    }
}

export default new ClientAccountService();
