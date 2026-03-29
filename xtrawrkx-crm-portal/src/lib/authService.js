// Use environment variable or fallback to production URL
// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
// const API_BASE_URL = 'https://xtrawrkxsuits-production.up.railway.app';

class AuthService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - User data and token
     */
    async login(email, password) {
        try {
            let response;
            try {
                response = await fetch(`${this.baseURL}/api/auth/internal/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                });
            } catch (fetchError) {
                // DNS failure, offline, TLS, etc. — browser often reports TypeError / Failed to fetch (not CORS).
                console.error('Fetch error:', fetchError);
                if (fetchError.message?.includes('Failed to fetch') || fetchError.name === 'TypeError') {
                    throw new Error(
                        'Cannot reach the API at ' + this.baseURL + '. This is usually a device or network issue (e.g. ERR_NAME_NOT_RESOLVED or Failed to fetch in DevTools), not CORS. Try another Wi-Fi, mobile data, turn off VPN or private DNS, or use public DNS. The server can still be online for other users.'
                    );
                }
                throw fetchError;
            }

            // Parse response
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                // If response is not JSON, use status text
                const statusText = response.statusText || 'Unknown error';
                throw new Error(`Server error (${response.status}): ${statusText}`);
            }

            if (!response.ok) {
                // Extract error message from various possible structures
                let errorMessage = 'Login failed. Please try again.';


                // Strapi v4 error structure is typically: { error: { status: 400, message: "..." } }
                // But can also be: { error: "..." } or { message: "..." }
                if (data) {
                    // Try data.error.message first (most common Strapi format)
                    if (data.error?.message) {
                        errorMessage = data.error.message;
                    }
                    // Try data.error if it's a string
                    else if (typeof data.error === 'string') {
                        errorMessage = data.error;
                    }
                    // Try data.message
                    else if (data.message) {
                        errorMessage = data.message;
                    }
                    // Try data.error.name
                    else if (data.error?.name) {
                        errorMessage = data.error.name;
                    }
                    // Try nested data.error.data.message
                    else if (data.error?.data?.message) {
                        errorMessage = data.error.data.message;
                    }
                    // Try data.data.error.message
                    else if (data.data?.error?.message) {
                        errorMessage = data.data.error.message;
                    }
                    // Try data.data.message
                    else if (data.data?.message) {
                        errorMessage = data.data.message;
                    }
                }

                // If still default, try to get any string from the response
                if (errorMessage === 'Login failed. Please try again.' && data) {
                    const dataString = JSON.stringify(data);
                    if (dataString && dataString.length < 200) {
                        errorMessage = `Login failed: ${dataString}`;
                    }
                }

                throw new Error(errorMessage);
            }

            // Store token in localStorage and cookies
            if (data.token) {
                localStorage.setItem('xtrawrkx-authToken', data.token);
                localStorage.setItem('xtrawrkx-user', JSON.stringify(data.user));
                localStorage.setItem('xtrawrkx-user-role', data.user.role || data.user.primaryRole?.name || 'User');
                localStorage.setItem('auth_user', JSON.stringify(data.user));

                // Also store in cookies for middleware access
                document.cookie = `xtrawrkx-authToken=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            }

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Get current user data
     * @returns {Promise<Object|null>} - Current user data
     */
    async getCurrentUser() {
        try {
            const token = this.getToken();
            if (!token) return null;

            // Try to get user from API with populated relationships
            try {
                const response = await fetch(`${this.baseURL}/api/users/me?populate=primaryRole,userRoles`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    const userData = data.user || data;

                    // Handle Strapi v4 structure (with attributes)
                    if (userData.attributes) {
                        const normalizedUser = {
                            id: userData.id || userData.documentId,
                            ...userData.attributes,
                            primaryRole: userData.attributes.primaryRole || userData.primaryRole,
                            userRoles: userData.attributes.userRoles || userData.userRoles,
                        };
                        // Update stored user with fresh data
                        localStorage.setItem('xtrawrkx-user', JSON.stringify(normalizedUser));
                        return normalizedUser;
                    }

                    // Update stored user with fresh data
                    localStorage.setItem('xtrawrkx-user', JSON.stringify(userData));
                    return userData;
                } else if (response.status === 401) {
                    // Token expired or invalid, use stored data
                    console.warn('Token expired, using stored user data');
                } else {
                    // API call failed, use stored data
                    console.warn('API call failed, using stored user data');
                }
            } catch (apiError) {
                // API call failed, use stored data
                console.warn('API call error, using stored user data:', apiError);
            }

            // Fallback to stored user data
            const storedUser = this.getStoredUser();
            if (storedUser) {
                return storedUser;
            }

            return null;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('xtrawrkx-authToken');
        localStorage.removeItem('xtrawrkx-user');
        localStorage.removeItem('xtrawrkx-user-role');
        localStorage.removeItem('fluxx-authToken');
        localStorage.removeItem('fluxx-user');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');

        // Also clear the cookie
        if (typeof document !== 'undefined') {
            document.cookie = 'xtrawrkx-authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
    }

    /**
     * Get stored token
     * @returns {string|null} - Stored token
     */
    getToken() {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('xtrawrkx-authToken') || localStorage.getItem('fluxx-authToken') || localStorage.getItem('auth_token');
    }

    /**
     * Get stored user data
     * @returns {Object|null} - Stored user data
     */
    getStoredUser() {
        if (typeof window === 'undefined') return null;
        const userData = localStorage.getItem('xtrawrkx-user') || localStorage.getItem('fluxx-user') || localStorage.getItem('auth_user') || localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Get stored user role
     * @returns {string|null} - Stored user role
     */
    getStoredUserRole() {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('xtrawrkx-user-role') || localStorage.getItem('fluxx-role') || 'User';
    }

    /**
     * Check if user is authenticated
     * @returns {boolean} - Authentication status
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Check if token is valid by testing it
     * @returns {Promise<boolean>} - Token validity
     */
    async isTokenValid() {
        try {
            const token = this.getToken();
            if (!token) return false;

            const response = await fetch(`${this.baseURL}/api/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            return response.ok;
        } catch (error) {
            console.error('Token validation error:', error);
            return false;
        }
    }

    /**
     * Check if user has specific permission
     * @param {string} module - Module name (e.g., 'leads', 'accounts')
     * @param {string} action - Action name (e.g., 'create', 'read', 'update', 'delete')
     * @returns {boolean} - Permission status
     */
    hasPermission(module, action) {
        const user = this.getStoredUser();
        if (!user || !user.permissions) return false;

        return user.permissions[module] && user.permissions[module][action] === true;
    }

    /**
     * Check if user has specific role
     * @param {string} roleName - Role name to check
     * @returns {boolean} - Role status
     */
    hasRole(roleName) {
        const user = this.getStoredUser();
        if (!user) return false;

        return user.primaryRole?.name === roleName ||
            user.userRoles?.some(role => role.name === roleName);
    }

    /**
     * Check if user is admin level or higher
     * @returns {boolean} - Admin status
     */
    isAdmin() {
        const user = this.getStoredUser();
        if (!user) return false;

        const adminRoles = ['Super Admin', 'Admin', 'Manager'];
        return adminRoles.includes(user.primaryRole?.name) ||
            user.userRoles?.some(role => adminRoles.includes(role.name));
    }

    /**
     * Request password reset
     * @param {string} email - User email
     * @returns {Promise<Object>} - Response data
     */
    async requestPasswordReset(email) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/request-reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password reset request failed');
            }

            return data;
        } catch (error) {
            console.error('Password reset request error:', error);
            throw error;
        }
    }

    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} password - New password
     * @returns {Promise<Object>} - Response data
     */
    async resetPassword(token, password) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Password reset failed');
            }

            return data;
        } catch (error) {
            console.error('Password reset error:', error);
            throw error;
        }
    }
}

export default new AuthService();

