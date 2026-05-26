/**
 * Strapi Client wrapper with client authentication integration
 */

import { STRAPI_BASE_URL } from '@/config/api';

class StrapiClient {
    constructor() {
        this.baseURL = STRAPI_BASE_URL;
        this.apiPath = '/api';
        this.useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' && process.env.NODE_ENV === 'development';
    }

    /**
     * Get client authentication token from session
     * @returns {string|null}
     */
    getAuthToken() {
        if (typeof window === 'undefined') return null;

        // Get client token from localStorage
        const token = localStorage.getItem('client_token') || localStorage.getItem('auth_token');

        if (!token && !this.useMocks) {
            console.warn('No client token available for Strapi requests');
        }

        return token || (this.useMocks ? 'mock-jwt-token' : null);
    }

    /**
     * Build request headers with Firebase token
     * @returns {Headers}
     */
    getHeaders() {
        const headers = new Headers({
            'Content-Type': 'application/json',
        });

        const token = this.getAuthToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        return headers;
    }

    /**
     * Build URL with query parameters
     * @param {string} endpoint 
     * @param {Record<string, any>} params 
     * @returns {string}
     */
    buildURL(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${this.apiPath}${endpoint}`);

        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        });

        return url.toString();
    }

    /**
     * Build Strapi query string from filters, populate, and pagination
     * @param {Object} options
     * @param {Object} options.filters - Strapi filters object
     * @param {string|Array} options.populate - Fields to populate
     * @param {Object} options.pagination - Pagination options
     * @returns {string}
     */
    buildQueryString({ filters = {}, populate = [], pagination = {} }) {
        const params = new URLSearchParams();

        // Add filters
        if (Object.keys(filters).length > 0) {
            Object.entries(filters).forEach(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    Object.entries(value).forEach(([subKey, subValue]) => {
                        if (typeof subValue === 'object' && subValue !== null) {
                            Object.entries(subValue).forEach(([opKey, opValue]) => {
                                params.append(`filters[${key}][${subKey}][${opKey}]`, opValue);
                            });
                        } else {
                            params.append(`filters[${key}][${subKey}]`, subValue);
                        }
                    });
                } else {
                    params.append(`filters[${key}]`, value);
                }
            });
        }

        // Add populate
        if (Array.isArray(populate) && populate.length > 0) {
            populate.forEach((field) => {
                params.append('populate[]', field);
            });
        } else if (typeof populate === 'string' && populate) {
            params.append('populate', populate);
        }

        // Add pagination
        if (Object.keys(pagination).length > 0) {
            Object.entries(pagination).forEach(([key, value]) => {
                params.append(`pagination[${key}]`, value);
            });
        }

        return params.toString();
    }

    /**
     * Make HTTP request with error handling
     * @param {string} url 
     * @param {RequestInit} options 
     * @returns {Promise<any>}
     */
    async request(url, options = {}) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Strapi request failed:', error);
            throw error;
        }
    }

    /**
     * GET request with schema validation
     * @param {string} endpoint 
     * @param {Record<string, any>} params 
     * @param {z.ZodSchema} schema 
     * @returns {Promise<any>}
     */
    async get(endpoint, params = {}, schema = null) {
        const url = this.buildURL(endpoint, params);
        const data = await this.request(url);

        if (schema) {
            return schema.parse(data);
        }
        return data;
    }

    /**
     * POST request with schema validation
     * @param {string} endpoint 
     * @param {any} body 
     * @param {z.ZodSchema} schema 
     * @returns {Promise<any>}
     */
    async post(endpoint, body, schema = null) {
        const url = this.buildURL(endpoint);
        const data = await this.request(url, {
            method: 'POST',
            body: JSON.stringify(body),
        });

        if (schema) {
            return schema.parse(data);
        }
        return data;
    }

    /**
     * PUT request with schema validation
     * @param {string} endpoint 
     * @param {any} body 
     * @param {z.ZodSchema} schema 
     * @returns {Promise<any>}
     */
    async put(endpoint, body, schema = null) {
        const url = this.buildURL(endpoint);
        const data = await this.request(url, {
            method: 'PUT',
            body: JSON.stringify(body),
        });

        if (schema) {
            return schema.parse(data);
        }
        return data;
    }

    /**
     * DELETE request
     * @param {string} endpoint 
     * @returns {Promise<any>}
     */
    async delete(endpoint) {
        const url = this.buildURL(endpoint);
        return this.request(url, {
            method: 'DELETE',
        });
    }

    // Convenience methods for common patterns

    /**
     * Get paginated results
     * @param {string} endpoint 
     * @param {Record<string, any>} params 
     * @param {z.ZodSchema} itemSchema 
     * @returns {Promise<any>}
     */
    async getPaginated(endpoint, params = {}, itemSchema = null) {
        const schema = itemSchema ? paginatedResponseSchema(itemSchema) : null;
        return this.get(endpoint, params, schema);
    }

    /**
     * Get single item with API response wrapper
     * @param {string} endpoint 
     * @param {Record<string, any>} params 
     * @param {z.ZodSchema} itemSchema 
     * @returns {Promise<any>}
     */
    async getOne(endpoint, params = {}, itemSchema = null) {
        const schema = itemSchema ? apiResponseSchema(itemSchema) : null;
        return this.get(endpoint, params, schema);
    }

    /**
     * Create item with API response wrapper
     * @param {string} endpoint 
     * @param {any} body 
     * @param {z.ZodSchema} itemSchema 
     * @returns {Promise<any>}
     */
    async create(endpoint, body, itemSchema = null) {
        const schema = itemSchema ? apiResponseSchema(itemSchema) : null;
        return this.post(endpoint, body, schema);
    }

    /**
     * Update item with API response wrapper
     * @param {string} endpoint 
     * @param {any} body 
     * @param {z.ZodSchema} itemSchema 
     * @returns {Promise<any>}
     */
    async update(endpoint, body, itemSchema = null) {
        const schema = itemSchema ? apiResponseSchema(itemSchema) : null;
        return this.put(endpoint, body, schema);
    }

    /**
     * Client login
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<any>}
     */
    async clientLogin(email, password) {
        try {
            const response = await fetch(`${this.baseURL}${this.apiPath}/onboarding/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Store authentication data
            if (typeof window !== 'undefined') {
                localStorage.setItem('client_token', data.token);
                if (data.account) {
                    localStorage.setItem('client_account', JSON.stringify(data.account));
                }
            }

            return data;
        } catch (error) {
            console.error('Client login failed:', error);
            throw error;
        }
    }

    /**
     * Complete onboarding and create account
     * @param {Object} onboardingData 
     * @returns {Promise<any>}
     */
    async completeOnboarding(onboardingData) {
        try {

            const response = await fetch(`${this.baseURL}${this.apiPath}/onboarding/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(onboardingData),
            });


            // Get response text first to handle empty responses
            const responseText = await response.text();

            if (!responseText || responseText.trim() === '') {
                console.error('Strapi returned empty response:', {
                    status: response.status,
                    statusText: response.statusText
                });
                throw new Error(`Server returned empty response: ${response.status} ${response.statusText}`);
            }

            let errorData;
            try {
                errorData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse Strapi response as JSON:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseText: responseText.substring(0, 500)
                });
                throw new Error(`Server returned non-JSON response: ${response.status} ${response.statusText}`);
            }

            if (!response.ok) {
                const errorMessage = errorData.error?.message || errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                console.error('Strapi API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData
                });
                throw new Error(errorMessage);
            }

            // Log the full response structure to debug

            // Store authentication data
            if (typeof window !== 'undefined') {
                if (errorData.token) {
                    localStorage.setItem('client_token', errorData.token);
                }
                if (errorData.account) {
                    // FORCE onboardingCompleted to true after completion
                    // This ensures localStorage always has the correct value regardless of backend response
                    const accountToStore = {
                        ...errorData.account,
                        onboardingCompleted: true,  // Always true after completion
                        onboardingCompletedAt: errorData.account.onboardingCompletedAt || new Date().toISOString()
                    };

                    localStorage.setItem('client_account', JSON.stringify(accountToStore));

                    // Verify it was stored correctly
                    const stored = localStorage.getItem('client_account');
                    if (stored) {
                        const parsed = JSON.parse(stored);
                    }
                }
                if (errorData.primaryContact) {
                    localStorage.setItem('client_contacts', JSON.stringify([errorData.primaryContact]));
                }
            }

            return errorData;
        } catch (error) {
            console.error('Onboarding completion failed:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            throw error;
        }
    }

    /**
     * Add contact to account
     * @param {Object} contactData 
     * @returns {Promise<any>}
     */
    async addContact(contactData) {
        try {
            const response = await fetch(`${this.baseURL}${this.apiPath}/onboarding/add-contact`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(contactData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Add contact failed:', error);
            throw error;
        }
    }

    /**
     * Get account contacts
     * @returns {Promise<any>}
     */
    async getAccountContacts() {
        try {
            const response = await fetch(`${this.baseURL}${this.apiPath}/onboarding/contacts`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get account contacts failed:', error);
            throw error;
        }
    }

    /**
     * Get current client account and contacts
     * @returns {Promise<any>}
     */
    async getCurrentUser() {
        try {
            if (this.useMocks) {
                return {
                    account: {
                        id: 1,
                        email: 'demo@company.com',
                        companyName: 'Demo Company',
                        industry: 'Technology',
                    },
                    contacts: [
                        {
                            id: 1,
                            firstName: 'Demo',
                            lastName: 'User',
                            email: 'demo@company.com',
                            role: 'PRIMARY_CONTACT',
                            portalAccessLevel: 'FULL_ACCESS'
                        }
                    ]
                };
            }

            // Get stored account and contacts data
            if (typeof window !== 'undefined') {
                const accountData = localStorage.getItem('client_account');
                const contactsData = localStorage.getItem('client_contacts');

                if (accountData && contactsData) {
                    return {
                        account: JSON.parse(accountData),
                        contacts: JSON.parse(contactsData)
                    };
                }
            }

            // Fetch from API if not in localStorage
            const response = await fetch(`${this.baseURL}${this.apiPath}/auth/me`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error('Failed to get current user');
            }

            const data = await response.json();

            // Store in localStorage for future use
            if (typeof window !== 'undefined' && data.type === 'client') {
                localStorage.setItem('client_account', JSON.stringify(data.account));
                localStorage.setItem('client_contacts', JSON.stringify(data.contacts));
            }

            return data.type === 'client' ? {
                account: data.account,
                contacts: data.contacts
            } : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Logout client
     */
    logout() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('client_token');
            localStorage.removeItem('client_account');
            localStorage.removeItem('client_contacts');
        }
    }

    /**
     * Check if client is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        if (typeof window === 'undefined') return false;
        const token = localStorage.getItem('client_token');
        const account = localStorage.getItem('client_account');
        return !!(token && account);
    }

    /**
     * Save onboarding basics
     * @param {Object} basicsData 
     * @returns {Promise<any>}
     */
    async saveOnboardingBasics(basicsData) {
        try {
            // Get account email from localStorage or current user
            let email = null;
            if (typeof window !== 'undefined') {
                const accountData = localStorage.getItem('client_account');
                if (accountData) {
                    try {
                        const account = JSON.parse(accountData);
                        email = account.email;
                    } catch (e) {
                        console.error('Error parsing account data:', e);
                    }
                }
            }

            const accountId = this.getCurrentAccountId();
            const response = await fetch(`${this.baseURL}${this.apiPath}/onboarding/basics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    accountId: accountId || null,
                    email: email,
                    basics: basicsData
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Save onboarding basics failed:', error);
            throw error;
        }
    }

    /**
     * Save communities selection
     * @param {Array} selectedCommunities 
     * @returns {Promise<any>}
     */
    async saveCommunitiesSelection(selectedCommunities) {
        try {
            const accountId = this.getCurrentAccountId();
            const response = await fetch(`${this.baseURL}${this.apiPath}/onboarding/communities`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountId, selectedCommunities }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Save communities selection failed:', error);
            throw error;
        }
    }

    /**
     * Submit community application
     * @param {string} community 
     * @param {Object} submissionData 
     * @returns {Promise<any>}
     */
    async submitCommunityApplication(community, submissionData) {
        try {
            const accountId = this.getCurrentAccountId();
            const response = await fetch(`${this.baseURL}${this.apiPath}/onboarding/submission`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accountId, community, submissionData }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Submit community application failed:', error);
            throw error;
        }
    }

    /**
     * Get account data for onboarding
     * @param {string} email 
     * @returns {Promise<any>}
     */
    async getAccountData(email) {
        try {
            const response = await fetch(`${this.baseURL}${this.apiPath}/onboarding/account?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Get account data failed:', error);
            throw error;
        }
    }

    /**
     * Get current account ID from localStorage
     * @returns {string|null}
     */
    getCurrentAccountId() {
        if (typeof window === 'undefined') return null;

        const accountData = localStorage.getItem('client_account');
        if (accountData) {
            try {
                const account = JSON.parse(accountData);
                if (account.id != null && account.id !== '') {
                    return account.id;
                }
                if (account.documentId != null && account.documentId !== '') {
                    return account.documentId;
                }
            } catch (error) {
                console.error('Error parsing client account data:', error);
            }
        }

        return null;
    }
}

// Export singleton instance
export const strapiClient = new StrapiClient();
export default strapiClient;


