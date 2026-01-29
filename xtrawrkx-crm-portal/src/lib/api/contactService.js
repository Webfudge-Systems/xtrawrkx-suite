import strapiClient from '../strapiClient';

class ContactService {
    /**
     * Get all contacts with filtering and pagination
     */
    async getAll(params = {}) {
        try {

            const response = await strapiClient.getContacts(params);

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
            console.error('Error fetching contacts:', error);
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
     * Get a single contact by ID
     */
    async getById(id, params = {}) {
        try {

            const response = await strapiClient.getContact(id, params);

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
            console.error(`Error fetching contact ${id}:`, error);
            return { data: null };
        }
    }

    /**
     * Create a new contact
     */
    async create(data) {
        try {

            const response = await strapiClient.createContact(data);

            // Handle both direct object and { data: object } formats
            if (response.data) {
                return response.data;
            }

            return response;
        } catch (error) {
            console.error('Error creating contact:', error);
            throw error;
        }
    }

    /**
     * Update a contact
     */
    async update(id, data) {
        try {
            const response = await strapiClient.updateContact(id, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating contact ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a contact
     */
    async delete(id) {
        try {
            await strapiClient.deleteContact(id);
            return true;
        } catch (error) {
            console.error(`Error deleting contact ${id}:`, error);
            throw error;
        }
    }

    /**
     * Search contacts
     */
    async search(searchTerm, filters = {}) {
        try {
            const params = {
                search: searchTerm,
                ...filters,
                populate: ['leadCompany', 'clientAccount']
            };

            const response = await strapiClient.getContacts(params);
            return response;
        } catch (error) {
            console.error('Error searching contacts:', error);
            throw error;
        }
    }

    /**
     * Get contacts by role
     */
    async getByRole(role, params = {}) {
        try {
            const queryParams = {
                role,
                populate: ['leadCompany', 'clientAccount', 'activities'],
                ...params
            };

            const response = await strapiClient.getContacts(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching contacts by role ${role}:`, error);
            throw error;
        }
    }

    /**
     * Get contacts by status
     */
    async getByStatus(status, params = {}) {
        try {
            const queryParams = {
                status,
                populate: ['leadCompany', 'clientAccount'],
                ...params
            };

            const response = await strapiClient.getContacts(queryParams);
            return response;
        } catch (error) {
            console.error(`Error fetching contacts by status ${status}:`, error);
            throw error;
        }
    }

    /**
     * Get contacts for a lead company
     */
    async getByLeadCompany(leadCompanyId, params = {}) {
        try {

            // Use the custom endpoint for lead company contacts
            const response = await strapiClient.get(`/contacts/lead-company/${leadCompanyId}`, params);

            return response;
        } catch (error) {
            console.error(`Error fetching contacts for lead company ${leadCompanyId}:`, error);
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
     * Get contacts for a client account
     */
    async getByClientAccount(clientAccountId, params = {}) {
        try {

            const response = await strapiClient.get(`/contacts/client-account/${clientAccountId}`, params);
            return response;
        } catch (error) {
            console.error(`Error fetching contacts for client account ${clientAccountId}:`, error);
            throw error;
        }
    }

    /**
     * Get decision makers
     */
    async getDecisionMakers(params = {}) {
        try {
            return this.getByRole('DECISION_MAKER', params);
        } catch (error) {
            console.error('Error fetching decision makers:', error);
            throw error;
        }
    }

    /**
     * Get primary contacts
     */
    async getPrimaryContacts(params = {}) {
        try {
            return this.getByRole('PRIMARY_CONTACT', params);
        } catch (error) {
            console.error('Error fetching primary contacts:', error);
            throw error;
        }
    }

    /**
     * Update contact role
     */
    async updateRole(id, role) {
        try {
            const response = await strapiClient.updateContact(id, { role });
            return response.data;
        } catch (error) {
            console.error(`Error updating contact ${id} role:`, error);
            throw error;
        }
    }

    /**
     * Update contact status
     */
    async updateStatus(id, status) {
        try {
            const response = await strapiClient.updateContact(id, { status });
            return response.data;
        } catch (error) {
            console.error(`Error updating contact ${id} status:`, error);
            throw error;
        }
    }

    /**
     * Transfer contact from lead company to client account
     */
    async transferToClientAccount(id, clientAccountId) {
        try {
            const response = await strapiClient.updateContact(id, {
                clientAccount: clientAccountId,
                leadCompany: null
            });
            return response.data;
        } catch (error) {
            console.error(`Error transferring contact ${id} to client account:`, error);
            throw error;
        }
    }

    /**
     * Get contact activity timeline
     */
    async getActivityTimeline(id, params = {}) {
        try {
            const contact = await this.getById(id);

            const queryParams = {
                contact: id,
                sort: 'createdAt:desc',
                populate: ['createdBy', 'leadCompany', 'clientAccount'],
                ...params
            };

            const activities = await strapiClient.getActivities(queryParams);

            return {
                contact,
                activities: activities.data || []
            };
        } catch (error) {
            console.error(`Error fetching activity timeline for contact ${id}:`, error);
            throw error;
        }
    }

    /**
     * Get contacts with upcoming birthdays
     */
    async getUpcomingBirthdays(days = 30) {
        try {
            const today = new Date();
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);

            // Note: This is a simplified version. In a real implementation,
            // you'd need to handle birthday matching across years
            const params = {
                birthday: {
                    $gte: today.toISOString().split('T')[0],
                    $lte: futureDate.toISOString().split('T')[0]
                },
                populate: ['leadCompany', 'clientAccount']
            };

            const response = await strapiClient.getContacts(params);
            return response;
        } catch (error) {
            console.error('Error fetching upcoming birthdays:', error);
            throw error;
        }
    }

    /**
     * Get contact statistics
     */
    async getStats() {
        try {
            // Since there's no dedicated stats endpoint for contacts,
            // we'll fetch and calculate stats client-side
            const allContacts = await this.getAll({ pagination: { pageSize: 1000 } });

            const stats = {
                total: allContacts.meta?.pagination?.total || 0,
                byRole: {},
                byStatus: {},
                byCompanyType: {
                    leadCompany: 0,
                    clientAccount: 0
                }
            };

            if (allContacts.data) {
                allContacts.data.forEach(contact => {
                    // Count by role
                    stats.byRole[contact.role] = (stats.byRole[contact.role] || 0) + 1;

                    // Count by status
                    stats.byStatus[contact.status] = (stats.byStatus[contact.status] || 0) + 1;

                    // Count by company type
                    if (contact.leadCompany) {
                        stats.byCompanyType.leadCompany++;
                    } else if (contact.clientAccount) {
                        stats.byCompanyType.clientAccount++;
                    }
                });
            }

            return stats;
        } catch (error) {
            console.error('Error fetching contact stats:', error);
            throw error;
        }
    }

    /**
     * Bulk update contacts
     */
    async bulkUpdate(ids, data) {
        try {
            const promises = ids.map(id => this.update(id, data));
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Error bulk updating contacts:', error);
            throw error;
        }
    }

    /**
     * Bulk transfer contacts to client account
     */
    async bulkTransferToClientAccount(ids, clientAccountId) {
        try {
            const promises = ids.map(id => this.transferToClientAccount(id, clientAccountId));
            const results = await Promise.all(promises);
            return results;
        } catch (error) {
            console.error('Error bulk transferring contacts:', error);
            throw error;
        }
    }

    /**
     * Get contact engagement score
     */
    async getEngagementScore(id) {
        try {
            const timeline = await this.getActivityTimeline(id, { pagination: { pageSize: 100 } });

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentActivities = timeline.activities.filter(
                activity => new Date(activity.createdAt) >= thirtyDaysAgo
            );

            // Simple engagement scoring based on activity frequency and types
            let score = 0;

            recentActivities.forEach(activity => {
                switch (activity.activityType) {
                    case 'MEETING':
                        score += 10;
                        break;
                    case 'CALL':
                        score += 8;
                        break;
                    case 'EMAIL':
                        score += 5;
                        break;
                    case 'NOTE':
                        score += 3;
                        break;
                    default:
                        score += 2;
                }
            });

            // Normalize to 0-100 scale
            const normalizedScore = Math.min(score, 100);

            return {
                score: normalizedScore,
                recentActivities: recentActivities.length,
                lastActivity: recentActivities[0] || null
            };
        } catch (error) {
            console.error(`Error calculating engagement score for contact ${id}:`, error);
            throw error;
        }
    }

    /**
     * Find duplicate contacts
     */
    async findDuplicates() {
        try {
            const allContacts = await this.getAll({ pagination: { pageSize: 1000 } });

            const duplicates = [];
            const emailMap = new Map();

            if (allContacts.data) {
                allContacts.data.forEach(contact => {
                    if (contact.email) {
                        const email = contact.email.toLowerCase();
                        if (emailMap.has(email)) {
                            const existing = emailMap.get(email);
                            duplicates.push({
                                email,
                                contacts: [existing, contact]
                            });
                        } else {
                            emailMap.set(email, contact);
                        }
                    }
                });
            }

            return duplicates;
        } catch (error) {
            console.error('Error finding duplicate contacts:', error);
            throw error;
        }
    }
}

export default new ContactService();
