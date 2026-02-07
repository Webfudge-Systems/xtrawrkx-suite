import strapiClient from '../strapiClient';
import dealService from './dealService';
import contactService from './contactService';
import leadCompanyService from './leadCompanyService';

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
            // Search across most useful lead company fields + assignedTo name
            const params = {
                'q': query, // Strapi full-text fallback if supported
                'filters[$or][0][companyName][$containsi]': query,
                'filters[$or][1][email][$containsi]': query,
                'filters[$or][2][phone][$containsi]': query,
                'filters[$or][3][industry][$containsi]': query,
                'filters[$or][4][website][$containsi]': query,
                'filters[$or][5][address][$containsi]': query,
                'filters[$or][6][city][$containsi]': query,
                'filters[$or][7][state][$containsi]': query,
                'filters[$or][8][country][$containsi]': query,
                'filters[$or][9][zipCode][$containsi]': query,
                'filters[$or][10][description][$containsi]': query,
                'filters[$or][11][notes][$containsi]': query,
                // search assignedTo relation fields
                'filters[$or][12][assignedTo][firstName][$containsi]': query,
                'filters[$or][13][assignedTo][lastName][$containsi]': query,
                populate: 'assignedTo,deals',
                'pagination[pageSize]': maxResults,
                'pagination[page]': 1
            };

            const response = await strapiClient.getLeadCompanies(params);
            
            // Normalize response format
            const data = Array.isArray(response) ? response : (response?.data || []);
            const total = Array.isArray(response) ? response.length : (response?.meta?.pagination?.total || data.length);

            return {
                data: data.map(item => ({
                    id: item.id || item.documentId,
                    type: 'lead',
                    title: item.companyName || item.name || 'Unnamed Lead',
                    subtitle: item.industry || item.email || '',
                    description: item.website || item.phone || item.city || '',
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
            console.error('Search error details:', error?.message || error);
            return { data: [], total: 0 };
        }
    }

    /**
     * Search deals
     */
    async searchDeals(query, maxResults = 5) {
        try {
            const params = {
                q: query,
                'filters[$or][0][name][$containsi]': query,
                'filters[$or][1][description][$containsi]': query,
                'filters[$or][2][stage][$containsi]': query,
                'filters[$or][3][value][$containsi]': query,
                'filters[$or][4][notes][$containsi]': query,
                'filters[$or][5][leadCompany][companyName][$containsi]': query,
                'filters[$or][6][clientAccount][companyName][$containsi]': query,
                'filters[$or][7][contact][firstName][$containsi]': query,
                'filters[$or][8][contact][lastName][$containsi]': query,
                'filters[$or][9][assignedTo][firstName][$containsi]': query,
                'filters[$or][10][assignedTo][lastName][$containsi]': query,
                populate: ['leadCompany', 'clientAccount', 'contact', 'assignedTo'],
                'pagination[pageSize]': maxResults,
                'pagination[page]': 1
            };

            const response = await dealService.getAll(params);
            
            const data = Array.isArray(response?.data) ? response.data : [];
            const total = response?.meta?.pagination?.total || data.length;

            return {
                data: data.map(item => ({
                    id: item.id || item.documentId,
                    type: 'deal',
                    title: item.name || 'Unnamed Deal',
                    subtitle: item.leadCompany?.companyName || item.clientAccount?.companyName || 
                             `${item.contact?.firstName || ''} ${item.contact?.lastName || ''}`.trim() || '',
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
            console.error('Search error details:', error.message);
            return { data: [], total: 0 };
        }
    }

    /**
     * Search contacts
     */
    async searchContacts(query, maxResults = 5) {
        try {
            const params = {
                q: query,
                'filters[$or][0][firstName][$containsi]': query,
                'filters[$or][1][lastName][$containsi]': query,
                'filters[$or][2][email][$containsi]': query,
                'filters[$or][3][phone][$containsi]': query,
                'filters[$or][4][title][$containsi]': query,
                'filters[$or][5][department][$containsi]': query,
                'filters[$or][6][company][$containsi]': query,
                'filters[$or][7][role][$containsi]': query,
                'filters[$or][8][notes][$containsi]': query,
                'filters[$or][9][leadCompany][companyName][$containsi]': query,
                'filters[$or][10][clientAccount][companyName][$containsi]': query,
                populate: ['leadCompany', 'clientAccount'],
                'pagination[pageSize]': maxResults,
                'pagination[page]': 1
            };

            const response = await contactService.getAll(params);
            
            const data = Array.isArray(response?.data) ? response.data : [];
            const total = response?.meta?.pagination?.total || data.length;

            return {
                data: data.map(item => {
                    const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unnamed Contact';
                    return {
                        id: item.id || item.documentId,
                        type: 'contact',
                        title: fullName,
                        subtitle: item.title || item.leadCompany?.companyName || item.clientAccount?.companyName || '',
                        description: item.email || item.phone || '',
                        href: `/sales/contacts/${item.id || item.documentId}`,
                        metadata: {
                            email: item.email,
                            phone: item.phone,
                            company: item.leadCompany?.companyName || item.clientAccount?.companyName,
                            role: item.role
                        }
                    };
                }),
                total
            };
        } catch (error) {
            console.error('Error searching contacts:', error);
            console.error('Search error details:', error.message);
            return { data: [], total: 0 };
        }
    }

    /**
     * Search client accounts
     */
    async searchClientAccounts(query, maxResults = 5) {
        try {
            const params = {
                q: query,
                'filters[$or][0][companyName][$containsi]': query,
                'filters[$or][1][email][$containsi]': query,
                'filters[$or][2][phone][$containsi]': query,
                'filters[$or][3][industry][$containsi]': query,
                'filters[$or][4][website][$containsi]': query,
                'filters[$or][5][address][$containsi]': query,
                'filters[$or][6][city][$containsi]': query,
                'filters[$or][7][state][$containsi]': query,
                'filters[$or][8][country][$containsi]': query,
                'filters[$or][9][zipCode][$containsi]': query,
                'filters[$or][10][description][$containsi]': query,
                'filters[$or][11][notes][$containsi]': query,
                'filters[$or][12][assignedTo][firstName][$containsi]': query,
                'filters[$or][13][assignedTo][lastName][$containsi]': query,
                populate: 'assignedTo,deals',
                'pagination[pageSize]': maxResults,
                'pagination[page]': 1
            };

            const response = await strapiClient.getClientAccounts(params);
            
            // Normalize response format
            const data = Array.isArray(response) ? response : (response?.data || []);
            const total = Array.isArray(response) ? response.length : (response?.meta?.pagination?.total || data.length);

            return {
                data: data.map(item => ({
                    id: item.id || item.documentId,
                    type: 'client',
                    title: item.companyName || 'Unnamed Client',
                    subtitle: item.industry || item.email || '',
                    description: item.website || item.phone || '',
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
            console.error('Search error details:', error.message);
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

