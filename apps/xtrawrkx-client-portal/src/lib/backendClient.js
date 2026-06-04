/**
 * Backend API Client for NextJS API
 * Replaces Strapi client to connect to our NextJS backend
 */

class BackendClient {
    constructor() {
        this.baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3004';
        this.apiPath = '/api';
    }

    /**
     * Get authentication token from localStorage
     * @returns {string|null}
     */
    getAuthToken() {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('auth_token');
    }

    /**
     * Build request headers
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
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Backend request failed:', error);
            throw error;
        }
    }

    /**
     * GET request
     * @param {string} endpoint 
     * @param {Record<string, any>} params 
     * @returns {Promise<any>}
     */
    async get(endpoint, params = {}) {
        const url = this.buildURL(endpoint, params);
        return this.request(url);
    }

    /**
     * POST request
     * @param {string} endpoint 
     * @param {any} body 
     * @returns {Promise<any>}
     */
    async post(endpoint, body) {
        const url = this.buildURL(endpoint);
        return this.request(url, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    /**
     * PUT request
     * @param {string} endpoint 
     * @param {any} body 
     * @returns {Promise<any>}
     */
    async put(endpoint, body) {
        const url = this.buildURL(endpoint);
        return this.request(url, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
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
}

// Export singleton instance
export const backendClient = new BackendClient();
export default backendClient;
