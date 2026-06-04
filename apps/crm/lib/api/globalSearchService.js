import strapiClient from '../strapiClient';
import dealService from './dealService';
import contactService from './contactService';
import leadCompanyService from './leadCompanyService';
import clientAccountService from './clientAccountService';

class GlobalSearchService {
    /**
     * Search across all entities (leads, deals, contacts, clients)
     */
    async search(query, options = {}) {
        if (!query || query.trim().length === 0) {
            return {
                leads: { data: [], total: 0 },
                deals: { data: [], total: 0 },
                contacts: { data: [], total: 0 },
                clients: { data: [], total: 0 }
            };
        }

        const searchTerm = query.trim();
        const maxResults = options.maxResults || 5; // Limit results per category

        try {
            // Perform parallel searches across all entities
            const [leadsResponse, dealsResponse, contactsResponse, clientsResponse] = await Promise.allSettled([
                this.searchLeadCompanies(searchTerm, maxResults),
                this.searchDeals(searchTerm, maxResults),
                this.searchContacts(searchTerm, maxResults),
                this.searchClientAccounts(searchTerm, maxResults)
            ]);

            return {
                leads: this.handleResponse(leadsResponse, 'leadCompany'),
                deals: this.handleResponse(dealsResponse, 'deal'),
                contacts: this.handleResponse(contactsResponse, 'contact'),
                clients: this.handleResponse(clientsResponse, 'clientAccount')
            };
        } catch (error) {
            console.error('Error in global search:', error);
            return {
                leads: { data: [], total: 0 },
                deals: { data: [], total: 0 },
                contacts: { data: [], total: 0 },
                clients: { data: [], total: 0 }
            };
        }
    }

    /**
     * Search lead companies
     */
    async searchLeadCompanies(query, maxResults = 5) {
        try {
            const response = await leadCompanyService.getAll({
                'filters[$or][0][name][$containsi]': query,
                'filters[$or][1][companyName][$containsi]': query,
                'filters[$or][2][email][$containsi]': query,
                'filters[$or][3][phone][$containsi]': query,
                'filters[$or][4][industry][$containsi]': query,
                populate: ['assignedTo', 'deals'],
                'pagination[pageSize]': maxResults,
                'pagination[page]': 1
            });

            const data = Array.isArray(response?.data) ? response.data : [];
            const total = response?.meta?.pagination?.total || data.length;

            return {
                data: data.map(item => ({
                    id: item.id || item.documentId,
                    type: 'lead',
                    title: item.name || item.companyName || 'Unnamed Lead',
                    subtitle: item.companyName || item.email || '',
                    description: item.industry || '',
                    href: `/sales/lead-companies/${item.id || item.documentId}`,
                    metadata: {
                        email: item.email,
                        phone: item.phone,
                        status: item.status,
                        assignedTo: item.assignedTo
                    }
                })),
                total
            };
        } catch (error) {
            console.error('Error searching lead companies:', error);
            return { data: [], total: 0 };
        }
    }

    /**
     * Search deals
     */
    async searchDeals(query, maxResults = 5) {
        try {
            const response = await dealService.getAll({
                'filters[$or][0][name][$containsi]': query,
                'filters[$or][1][description][$containsi]': query,
                'filters[$or][2][stage][$containsi]': query,
                populate: ['leadCompany', 'clientAccount', 'contact', 'assignedTo'],
                'pagination[pageSize]': maxResults,
                'pagination[page]': 1
            });

            const data = Array.isArray(response?.data) ? response.data : [];
            const total = response?.meta?.pagination?.total || data.length;

            return {
                data: data.map(item => ({
                    id: item.id || item.documentId,
                    type: 'deal',
                    title: item.name || 'Unnamed Deal',
                    subtitle: item.leadCompany?.name || item.clientAccount?.name || item.contact?.name || '',
                    description: item.description || item.stage || '',
                    href: `/sales/deals/${item.id || item.documentId}`,
                    metadata: {
                        value: item.value,
                        stage: item.stage,
                        probability: item.probability,
                        assignedTo: item.assignedTo
                    }
                })),
                total
            };
        } catch (error) {
            console.error('Error searching deals:', error);
            return { data: [], total: 0 };
        }
    }

    /**
     * Search contacts
     */
    async searchContacts(query, maxResults = 5) {
        try {
            const response = await contactService.getAll({
                'filters[$or][0][firstName][$containsi]': query,
                'filters[$or][1][lastName][$containsi]': query,
                'filters[$or][2][email][$containsi]': query,
                'filters[$or][3][phone][$containsi]': query,
                'filters[$or][4][company][$containsi]': query,
                populate: ['leadCompany', 'clientAccount'],
                'pagination[pageSize]': maxResults,
                'pagination[page]': 1
            });

            const data = Array.isArray(response?.data) ? response.data : [];
            const total = response?.meta?.pagination?.total || data.length;

            return {
                data: data.map(item => {
                    const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.name || 'Unnamed Contact';
                    return {
                        id: item.id || item.documentId,
                        type: 'contact',
                        title: fullName,
                        subtitle: item.company || item.leadCompany?.name || item.clientAccount?.name || '',
                        description: item.email || item.phone || '',
                        href: `/sales/contacts/${item.id || item.documentId}`,
                        metadata: {
                            email: item.email,
                            phone: item.phone,
                            company: item.company,
                            role: item.role
                        }
                    };
                }),
                total
            };
        } catch (error) {
            console.error('Error searching contacts:', error);
            return { data: [], total: 0 };
        }
    }

    /**
     * Search client accounts
     */
    async searchClientAccounts(query, maxResults = 5) {
        try {
            const response = await clientAccountService.getAll({
                'filters[$or][0][name][$containsi]': query,
                'filters[$or][1][companyName][$containsi]': query,
                'filters[$or][2][email][$containsi]': query,
                'filters[$or][3][phone][$containsi]': query,
                populate: ['assignedTo', 'deals'],
                'pagination[pageSize]': maxResults,
                'pagination[page]': 1
            });

            const data = Array.isArray(response?.data) ? response.data : [];
            const total = response?.meta?.pagination?.total || data.length;

            return {
                data: data.map(item => ({
                    id: item.id || item.documentId,
                    type: 'client',
                    title: item.name || item.companyName || 'Unnamed Client',
                    subtitle: item.companyName || item.email || '',
                    description: item.industry || item.status || '',
                    href: `/clients/accounts/${item.id || item.documentId}`,
                    metadata: {
                        email: item.email,
                        phone: item.phone,
                        status: item.status,
                        assignedTo: item.assignedTo
                    }
                })),
                total
            };
        } catch (error) {
            console.error('Error searching client accounts:', error);
            return { data: [], total: 0 };
        }
    }

    /**
     * Handle promise response
     */
    handleResponse(response, entityType) {
        if (response.status === 'fulfilled') {
            return response.value;
        } else {
            console.error(`Error searching ${entityType}:`, response.reason);
            return { data: [], total: 0 };
        }
    }
}

export default new GlobalSearchService();
