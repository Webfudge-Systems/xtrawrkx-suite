// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
// const API_BASE_URL = 'https://xtrawrkxsuits-production.up.railway.app';
class StrapiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.token = null;
    }

    /**
     * Set authentication token
     */
    setToken(token) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('strapi_token', token);
        }
    }

    /**
     * Get authentication token
     */
    getToken() {
        if (this.token) return this.token;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('strapi_token');
        }
        return this.token;
    }

    /**
     * Remove authentication token
     */
    removeToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('strapi_token');
        }
    }

    /**
     * Make authenticated request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        const token = this.getToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }


        try {
            // Debug log to help trace unexpected API calls (prints caller stack)
            try {
                // Visible log with marker to ensure it appears in browser console
                console.log('[API_TRACE] StrapiClient.request ->', { url, method: config.method || 'GET', config, stack: new Error().stack });
            } catch (e) {
                // swallow logging errors
            }
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`API Error ${response.status} for ${url}:`, errorData);
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return response;
        } catch (error) {
            console.error(`Strapi API Error (${endpoint}):`, error);
            throw error;
        }
    }

    /**
     * Helper function to build Strapi query string from nested objects
     */
    buildQueryString(params, prefix = '') {
        const parts = [];

        for (const key in params) {
            if (params.hasOwnProperty(key)) {
                const value = params[key];
                const paramKey = prefix ? `${prefix}[${key}]` : key;

                if (value === null || value === undefined) {
                    continue;
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    // Recursively build nested objects
                    parts.push(this.buildQueryString(value, paramKey));
                } else if (Array.isArray(value)) {
                    // Handle arrays
                    value.forEach((item, index) => {
                        if (typeof item === 'object') {
                            parts.push(this.buildQueryString(item, `${paramKey}[${index}]`));
                        } else {
                            parts.push(`${paramKey}[${index}]=${encodeURIComponent(item)}`);
                        }
                    });
                } else {
                    parts.push(`${paramKey}=${encodeURIComponent(value)}`);
                }
            }
        }

        return parts.filter(Boolean).join('&');
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = this.buildQueryString(params);
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data,
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data,
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    /**
     * Login user
     */
    async login(email, password) {
        try {
            const response = await this.post('/auth/local', {
                data: { identifier: email, password }
            });

            if (response.jwt) {
                this.setToken(response.jwt);
            }

            return response;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Get current user
     */
    async getCurrentUser() {
        try {
            const token = this.getToken();
            if (!token) return null;

            const response = await this.get('/users/me', {
                populate: ['role', 'department']
            });

            return response;
        } catch (error) {
            console.error('Get current user error:', error);
            this.removeToken();
            return null;
        }
    }

    /**
     * Logout user
     */
    logout() {
        this.removeToken();
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    // Lead Companies API
    async getLeadCompanies(params = {}) {
        return this.get('/lead-companies', params);
    }

    async getLeadCompany(id, params = {}) {
        try {
            console.log('[API_TRACE] StrapiClient.getLeadCompany called', { id, params, stack: new Error().stack });
        } catch (e) {
            // noop
        }
        return this.get(`/lead-companies/${id}`, params);
    }

    async createLeadCompany(data) {
        return this.post('/lead-companies', { data });
    }

    async updateLeadCompany(id, data) {
        return this.put(`/lead-companies/${id}`, { data });
    }

    async deleteLeadCompany(id) {
        return this.delete(`/lead-companies/${id}`);
    }

    async convertLeadToClient(id) {
        return this.post(`/lead-companies/${id}/convert`);
    }

    async getLeadCompanyStats() {
        return this.get('/lead-companies/stats');
    }

    // Client Accounts API
    async getClientAccounts(params = {}) {
        return this.get('/client-accounts', params);
    }

    async getClientAccount(id, params = {}) {
        return this.get(`/client-accounts/${id}`, params);
    }

    async createClientAccount(data) {
        return this.post('/client-accounts', { data });
    }

    async updateClientAccount(id, data) {
        return this.put(`/client-accounts/${id}`, { data });
    }

    async deleteClientAccount(id) {
        return this.delete(`/client-accounts/${id}`);
    }

    async getClientAccountStats() {
        return this.get('/client-accounts/stats');
    }

    async getClientAccountHealth(id) {
        return this.get(`/client-accounts/${id}/health`);
    }

    // Contacts API
    async getContacts(params = {}) {
        return this.get('/contacts', params);
    }

    async getContact(id, params = {}) {
        return this.get(`/contacts/${id}`, params);
    }

    async createContact(data) {
        return this.post('/contacts', { data });
    }

    async updateContact(id, data) {
        return this.put(`/contacts/${id}`, { data });
    }

    async deleteContact(id) {
        return this.delete(`/contacts/${id}`);
    }

    // Deals API
    async getDeals(params = {}) {
        return this.get('/deals', params);
    }

    async getDeal(id, params = {}) {
        return this.get(`/deals/${id}`, params);
    }

    async createDeal(data) {
        return this.post('/deals', { data });
    }

    async updateDeal(id, data) {
        return this.put(`/deals/${id}`, { data });
    }

    async deleteDeal(id) {
        return this.delete(`/deals/${id}`);
    }

    // Invoices API
    async getInvoices(params = {}) {
        return this.get('/invoices', params);
    }

    async getInvoice(id, params = {}) {
        return this.get(`/invoices/${id}`, params);
    }

    async createInvoice(data) {
        return this.post('/invoices', { data });
    }

    async updateInvoice(id, data) {
        return this.put(`/invoices/${id}`, { data });
    }

    async deleteInvoice(id) {
        return this.delete(`/invoices/${id}`);
    }

    // Proposals API
    async getProposals(params = {}) {
        return this.get('/proposals', params);
    }

    async getProposal(id, params = {}) {
        return this.get(`/proposals/${id}`, params);
    }

    async createProposal(data) {
        return this.post('/proposals', { data });
    }

    async updateProposal(id, data) {
        return this.put(`/proposals/${id}`, { data });
    }

    async deleteProposal(id) {
        return this.delete(`/proposals/${id}`);
    }

    // Activities API
    async getActivities(params = {}) {
        return this.get('/activities', params);
    }

    async getActivity(id, params = {}) {
        return this.get(`/activities/${id}`, params);
    }

    async createActivity(data) {
        return this.post('/activities', { data });
    }

    async updateActivity(id, data) {
        return this.put(`/activities/${id}`, { data });
    }

    async deleteActivity(id) {
        return this.delete(`/activities/${id}`);
    }

    // Proposals API
    async getProposals(params = {}) {
        return this.get('/proposals', params);
    }

    async getProposal(id, params = {}) {
        return this.get(`/proposals/${id}`, params);
    }

    async createProposal(data) {
        return this.post('/proposals', { data });
    }

    async updateProposal(id, data) {
        return this.put(`/proposals/${id}`, { data });
    }

    async deleteProposal(id) {
        return this.delete(`/proposals/${id}`);
    }

    // Users API
    async getUsers(params = {}) {
        return this.get('/users', params);
    }

    async getUser(id, params = {}) {
        return this.get(`/users/${id}`, params);
    }

    // Xtrawrkx Users API
    async getXtrawrkxUsers(params = {}) {
        return this.get('/xtrawrkx-users', params);
    }

    async getXtrawrkxUser(id, params = {}) {
        return this.get(`/xtrawrkx-users/${id}`, params);
    }

    // Deal Groups API
    async getDealGroups(params = {}) {
        return this.get('/deal-groups', params);
    }

    async getDealGroup(id, params = {}) {
        return this.get(`/deal-groups/${id}`, params);
    }

    async createDealGroup(data) {
        return this.post('/deal-groups', { data });
    }

    async updateDealGroup(id, data) {
        return this.put(`/deal-groups/${id}`, { data });
    }

    async deleteDealGroup(id) {
        return this.delete(`/deal-groups/${id}`);
    }
}

export default new StrapiClient();
