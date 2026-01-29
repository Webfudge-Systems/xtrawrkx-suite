import strapiClient from '../strapiClient';

class LeadCompanyService {
    /**
     * Get all lead companies with filtering and pagination
     */
    async getAll(params = {}) {
        try {

            // Include contacts, assignedTo, and deals in population to get accurate counts and values
            const queryParams = {
                populate: 'contacts,assignedTo,deals',
                ...params
            };

            const response = await strapiClient.getLeadCompanies(queryParams);

            // Handle both array response (direct data) and object response (with meta)
            if (Array.isArray(response)) {
                return { data: response, meta: { pagination: { total: response.length } } };
            }

            return response;
        } catch (error) {
            console.error('Error fetching lead companies:', error);
            // Return empty data instead of throwing error for better UX
            return { data: [], meta: { pagination: { total: 0 } } };
        }
    }

    /**
     * Get a single lead company by ID
     */
    async getById(id, params = {}) {
        try {

            // Include contacts by default and merge with any additional params
            // Populate assignedTo with primaryRole for role display
            const queryParams = {
                populate: {
                    contacts: true,
                    assignedTo: {
                        populate: {
                            primaryRole: true
                        }
                    },
                    deals: true,
                    convertedAccount: true
                },
                ...params
            };

            const response = await strapiClient.getLeadCompany(id, queryParams);

            // Handle both direct object response and wrapped response
            if (response?.data) {
                return { data: response.data };
            } else if (response?.id) {
                return { data: response };
            } else {
                console.warn('Unexpected response format for getById:', response);
                return { data: null };
            }
        } catch (error) {
            console.error(`Error fetching lead company ${id}:`, error);
            return { data: null }; // Return null instead of throwing for better UX
        }
    }

    /**
     * Create a new lead company
     */
    async create(data) {
        try {
            const response = await strapiClient.createLeadCompany(data);
            return response.data;
        } catch (error) {
            console.error('Error creating lead company:', error);
            throw error;
        }
    }

    /**
     * Update a lead company
     */
    async update(id, data) {
        try {
            const response = await strapiClient.updateLeadCompany(id, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating lead company ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a lead company
     */
    async delete(id) {
        try {
            await strapiClient.deleteLeadCompany(id);
            return true;
        } catch (error) {
            console.error(`Error deleting lead company ${id}:`, error);
            throw error;
        }
    }

    /**
     * Convert lead company to client account
     */
    async convertToClient(id) {
        try {
            const response = await strapiClient.convertLeadToClient(id);
            return response.data;
        } catch (error) {
            console.error(`Error converting lead company ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get lead company statistics
     */
    async getStats() {
        try {
            const response = await strapiClient.getLeadCompanyStats();
            return response.data;
        } catch (error) {
            console.error('Error fetching lead company stats:', error);
            // Return default stats if API fails
            return {
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
                averageScore: 0
            };
        }
    }

    /**
     * Search lead companies
     */
    async search(searchTerm, filters = {}) {
        try {
            const params = {
                search: searchTerm,
                ...filters,
                populate: ['assignedTo', 'contacts']
            };

            const response = await strapiClient.getLeadCompanies(params);
            return response;
        } catch (error) {
            console.error('Error searching lead companies:', error);
            throw error;
        }
    }

    /**
     * Get lead companies by status
     */
    async getByStatus(status, params = {}) {
        try {
            const queryParams = {
                status,
                populate: ['assignedTo', 'contacts', 'activities'],
                ...params
            };

            const response = await strapiClient.getLeadCompanies(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching lead companies by status ${status}:`, error);
            throw error;
        }
    }

    /**
     * Get lead companies by segment
     */
    async getBySegment(segment, params = {}) {
        try {
            const queryParams = {
                segment,
                populate: ['assignedTo', 'contacts'],
                ...params
            };

            const response = await strapiClient.getLeadCompanies(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching lead companies by segment ${segment}:`, error);
            throw error;
        }
    }

    /**
     * Get lead companies assigned to a user
     */
    async getByAssignee(userId, params = {}) {
        try {
            const queryParams = {
                assignedTo: userId,
                populate: ['assignedTo', 'contacts', 'activities'],
                ...params
            };

            const response = await strapiClient.getLeadCompanies(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching lead companies for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Update lead company status
     */
    async updateStatus(id, status) {
        try {
            const response = await strapiClient.updateLeadCompany(id, { status });
            return response.data;
        } catch (error) {
            console.error(`Error updating lead company ${id} status:`, error);
            throw error;
        }
    }

    /**
     * Update lead company segment
     */
    async updateSegment(id, segment) {
        try {
            const response = await strapiClient.updateLeadCompany(id, { segment });
            return response.data;
        } catch (error) {
            console.error(`Error updating lead company ${id} segment:`, error);
            throw error;
        }
    }

    /**
     * Update lead company score
     */
    async updateScore(id, score) {
        try {
            const response = await strapiClient.updateLeadCompany(id, { score });
            return response.data;
        } catch (error) {
            console.error(`Error updating lead company ${id} score:`, error);
            throw error;
        }
    }

    /**
     * Add note to lead company
     */
    async addNote(id, note) {
        try {
            const leadCompany = await this.getById(id);
            const existingNotes = leadCompany.notes || '';
            const timestamp = new Date().toISOString();
            const newNotes = `${existingNotes}\n\n[${timestamp}] ${note}`.trim();

            const response = await strapiClient.updateLeadCompany(id, { notes: newNotes });
            return response.data;
        } catch (error) {
            console.error(`Error adding note to lead company ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get lead companies with upcoming follow-ups
     */
    async getUpcomingFollowUps(days = 7) {
        try {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);

            const params = {
                nextFollowUpDate: {
                    $lte: futureDate.toISOString()
                },
                populate: ['assignedTo', 'contacts']
            };

            const response = await strapiClient.getLeadCompanies(params);
            return response;
        } catch (error) {
            console.error('Error fetching upcoming follow-ups:', error);
            throw error;
        }
    }

    /**
     * Bulk update lead companies
     */
    async bulkUpdate(ids, data) {
        try {
            const promises = ids.map(id => this.update(id, data));
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Error bulk updating lead companies:', error);
            throw error;
        }
    }

    /**
     * Get lead company conversion funnel data
     */
    async getConversionFunnel() {
        try {
            const stats = await this.getStats();

            const funnel = {
                new: stats.byStatus?.NEW || 0,
                contacted: stats.byStatus?.CONTACTED || 0,
                qualified: stats.byStatus?.QUALIFIED || 0,
                proposal: stats.byStatus?.PROPOSAL_SENT || 0,
                negotiation: stats.byStatus?.NEGOTIATION || 0,
                converted: stats.byStatus?.CONVERTED || 0,
                lost: stats.byStatus?.LOST || 0,
                conversionRate: stats.conversionRate || 0
            };

            return funnel;
        } catch (error) {
            console.error('Error fetching conversion funnel:', error);
            throw error;
        }
    }
}

export default new LeadCompanyService();
