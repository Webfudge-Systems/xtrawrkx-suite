// Base API client for Strapi backend communication
// Handles authentication, error management, and request/response interceptors

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    /**
     * Get authentication token from localStorage
     * @returns {string|null} - Auth token
     */
    getAuthToken() {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('xtrawrkx-authToken') ||
            localStorage.getItem('fluxx-authToken') ||
            localStorage.getItem('auth_token');
    }

    /**
     * Get default headers for API requests
     * @returns {Object} - Headers object
     */
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };

        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Handle API response
     * @param {Response} response - Fetch response
     * @returns {Promise<Object>} - Parsed response data
     */
    async handleResponse(response) {
        // Get content type to determine if response is JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        let data = {};
        let responseText = '';

        // Read response text first
        try {
            responseText = await response.text();
        } catch (error) {
            console.error('Error reading response:', error);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            throw new Error('Failed to read response');
        }

        // Try to parse as JSON only if content-type indicates JSON or if response is OK
        if (isJson || response.ok) {
            if (responseText) {
                try {
                    data = JSON.parse(responseText);
                } catch (error) {
                    // If parsing fails but response is OK, return empty object
                    if (response.ok) {
                        console.warn('Response is not valid JSON, but status is OK');
                        return {};
                    }
                    // If parsing fails and response is not OK, use the text as error message
                    console.error('Error parsing JSON response:', error);
                    data = { message: responseText || response.statusText };
                }
            }
        } else if (responseText) {
            // Non-JSON error response
            data = { message: responseText };
        }

        // Handle error responses
        if (!response.ok) {
            const errorMessage = data.message ||
                data.error?.message ||
                data.error?.error?.message ||
                responseText ||
                `HTTP ${response.status}: ${response.statusText}`;

            // Log error details for debugging
            console.error('API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                endpoint: response.url,
                errorData: data,
                responseText: responseText
            });

            // Handle specific error cases
            if (response.status === 401) {
                // Token expired or invalid
                this.handleAuthError();
                throw new Error('Authentication required. Please log in again.');
            } else if (response.status === 403) {
                throw new Error('Access denied. You do not have permission to perform this action.');
            } else if (response.status === 404) {
                throw new Error('Resource not found.');
            } else if (response.status === 405) {
                throw new Error('Method not allowed. The requested endpoint does not support this HTTP method.');
            } else if (response.status >= 500) {
                // Preserve actual error message from server if available, otherwise use generic message
                const serverErrorMessage = errorMessage && errorMessage !== `HTTP ${response.status}: ${response.statusText}`
                    ? `Server error: ${errorMessage}`
                    : 'Server error. Please try again later.';
                throw new Error(serverErrorMessage);
            }

            throw new Error(errorMessage);
        }

        return data;
    }

    /**
     * Handle authentication errors
     */
    handleAuthError() {
        // Clear stored auth data
        if (typeof window !== 'undefined') {
            localStorage.removeItem('xtrawrkx-authToken');
            localStorage.removeItem('xtrawrkx-user');
            localStorage.removeItem('xtrawrkx-user-role');
            localStorage.removeItem('fluxx-authToken');
            localStorage.removeItem('fluxx-user');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');

            // Clear cookie
            document.cookie = 'xtrawrkx-authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
    }

    /**
     * Make GET request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>} - Response data
     */
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);

        // Add query parameters
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                if (typeof params[key] === 'object') {
                    url.searchParams.append(key, JSON.stringify(params[key]));
                } else {
                    url.searchParams.append(key, params[key]);
                }
            }
        });

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        } catch (error) {
            // Log more details for debugging
            console.error('API GET Error:', {
                url: url.toString(),
                endpoint,
                baseURL: this.baseURL,
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack
            });

            if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
                const corsError = error.message?.includes('CORS') ||
                    error.message?.includes('Access-Control');
                if (corsError) {
                    throw new Error(`CORS error: The backend at ${this.baseURL} is blocking requests. Please check CORS configuration in Strapi.`);
                }
                throw new Error(
                    `Cannot reach the server at ${this.baseURL}. Often DNS or local network (e.g. ERR_NAME_NOT_RESOLVED), not CORS or a global outage. Try another network or DNS.`
                );
            }
            throw error;
        }
    }

    /**
     * Make POST request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise<Object>} - Response data
     */
    async post(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });

            return await this.handleResponse(response);
        } catch (error) {
            if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error(`Network error: Cannot connect to the server at ${this.baseURL}. Please ensure the backend API is running.`);
            }
            throw error;
        }
    }

    /**
     * Make PUT request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise<Object>} - Response data
     */
    async put(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });

            return await this.handleResponse(response);
        } catch (error) {
            if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error(`Network error: Cannot connect to the server at ${this.baseURL}. Please ensure the backend API is running.`);
            }
            throw error;
        }
    }

    /**
     * Make DELETE request
     * @param {string} endpoint - API endpoint
     * @returns {Promise<Object>} - Response data
     */
    async delete(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });

            return await this.handleResponse(response);
        } catch (error) {
            if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error(`Network error: Cannot connect to the server at ${this.baseURL}. Please ensure the backend API is running.`);
            }
            throw error;
        }
    }

    /**
     * Make PATCH request
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @returns {Promise<Object>} - Response data
     */
    async patch(endpoint, data = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });

            return await this.handleResponse(response);
        } catch (error) {
            if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error(`Network error: Cannot connect to the server at ${this.baseURL}. Please ensure the backend API is running.`);
            }
            throw error;
        }
    }

    /**
     * Upload file
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - Form data with file
     * @returns {Promise<Object>} - Response data
     */
    async upload(endpoint, formData) {
        const headers = {};
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Don't set Content-Type for FormData, let browser set it with boundary

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers,
                body: formData,
            });

            return await this.handleResponse(response);
        } catch (error) {
            if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error(`Network error: Cannot connect to the server at ${this.baseURL}. Please ensure the backend API is running.`);
            }
            throw error;
        }
    }
}

// Create and export singleton instance
const apiClient = new ApiClient();
export default apiClient;





