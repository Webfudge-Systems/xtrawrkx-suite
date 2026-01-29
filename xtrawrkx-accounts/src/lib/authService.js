/**
 * Centralized Authentication Service
 * Handles token management, localStorage, and authentication state
 */
class AuthService {
    static TOKEN_KEY = 'currentUser';
    // Use environment variable for API URL, fallback to localhost for development
    static API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337') + '/api';

    /**
     * Get JWT token from localStorage
     * Supports both 'currentUser' (with token inside) and 'authToken' (direct token) formats
     */
    static getToken() {
        // First, try to get from currentUser (preferred format)
        const userData = localStorage.getItem(this.TOKEN_KEY);
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                if (parsed.token) {
                    return parsed.token;
                }
            } catch (error) {
                console.error('Error parsing user data from localStorage:', error);
            }
        }

        // Fallback: check for authToken (legacy format)
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            // Migrate to new format if we have the token but not the user data
            return authToken;
        }

        return null;
    }

    /**
     * Get complete user data from localStorage
     */
    static getUserData() {
        const userData = localStorage.getItem(this.TOKEN_KEY);
        if (!userData) return null;

        try {
            return JSON.parse(userData);
        } catch (error) {
            console.error('Error parsing user data from localStorage:', error);
            return null;
        }
    }

    /**
     * Store user data and token in localStorage
     */
    static setUserData(userData) {
        try {
            localStorage.setItem(this.TOKEN_KEY, JSON.stringify(userData));
        } catch (error) {
            console.error('Error storing user data in localStorage:', error);
        }
    }

    /**
     * Clear authentication data
     * Only call this when you're absolutely sure the token is invalid
     */
    static clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem('authToken'); // Also clear legacy format
    }

    /**
     * Check if user is authenticated with valid token
     */
    static isAuthenticated() {
        const token = this.getToken();
        return token && !this.isTokenExpired(token);
    }

    /**
     * Check if JWT token is expired
     */
    static isTokenExpired(token) {
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true;
        }
    }

    /**
     * Get token or refresh if needed
     * Always requires manual login - no auto-login in any environment
     */
    static async refreshTokenIfNeeded() {
        const currentToken = this.getToken();

        if (currentToken && !this.isTokenExpired(currentToken)) {
            return currentToken;
        }

        // Token is expired or missing - user must login manually
        return null;
    }

    /**
     * Auto-login with stored credentials
     * NOTE: This method should only be used in development
     * In production, users should always login manually
     */
    static async autoLogin() {
        // Disable auto-login in production
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Auto-login is disabled in production');
        }

        // Check for demo credentials in environment variables
        const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
        const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

        if (!demoEmail || !demoPassword) {
            throw new Error('Demo credentials not configured');
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/internal/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: demoEmail,
                    password: demoPassword,
                }),
            });


            if (response.ok) {
                const authData = await response.json();

                // Store the new token and user data
                this.setUserData({
                    ...authData.user,
                    token: authData.token,
                    name: authData.user.name || `${authData.user.firstName} ${authData.user.lastName}`,
                });

                return authData.token;
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || 'Auto-login failed');
            }
        } catch (error) {
            console.error('Auto-login error:', error);
            this.clearAuth();
            throw error;
        }
    }

    /**
     * Manual login with email and password
     */
    static async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/internal/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const authData = await response.json();

                // Store the token and user data
                this.setUserData({
                    ...authData.user,
                    token: authData.token,
                    name: authData.user.name || `${authData.user.firstName} ${authData.user.lastName}`,
                });

                return authData;
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Logout user
     */
    static logout() {
        this.clearAuth();
        // Optionally redirect to login page
        // window.location.href = '/auth/login';
    }

    /**
     * Make authenticated API request
     */
    static async apiRequest(endpoint, options = {}) {
        try {
            const token = await this.refreshTokenIfNeeded();

            if (!token) {
                throw new Error('Authentication required');
            }

            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...options.headers,
                },
                ...options,
            };

            // Only set Content-Type for non-FormData requests
            if (!(options.body instanceof FormData)) {
                config.headers['Content-Type'] = 'application/json';
            }

            const response = await fetch(`${this.API_BASE_URL}${endpoint}`, config);

            if (!response.ok) {
                if (response.status === 401) {
                    // Check if token is actually expired before clearing
                    const currentToken = this.getToken();
                    if (currentToken && this.isTokenExpired(currentToken)) {
                        // Token is expired, clear auth
                        this.clearAuth();
                        throw new Error('Authentication failed: Token expired');
                    } else if (!currentToken) {
                        // No token, don't clear (already cleared)
                        throw new Error('Authentication required');
                    } else {
                        // Token exists and not expired, but got 401 - might be invalid token
                        // Only clear if we're sure it's invalid (e.g., after retry)
                        console.warn('Got 401 but token appears valid, might be server issue');
                        // Don't clear immediately - let the user retry
                        throw new Error('Authentication failed: Please try logging in again');
                    }
                }

                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            // Handle empty responses (common for DELETE requests)
            const contentType = response.headers.get('content-type');
            const contentLength = response.headers.get('content-length');

            // Check if response has content
            if (contentLength === '0') {
                return { success: true, message: 'Operation completed successfully' };
            }

            // Try to get response as text first to check if it's empty
            const text = await response.text();

            // If empty, return success
            if (!text || text.trim() === '') {
                return { success: true, message: 'Operation completed successfully' };
            }

            // Try to parse as JSON
            try {
                return JSON.parse(text);
            } catch (parseError) {
                // If not JSON, return the text as data
                return { success: true, data: text };
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    /**
     * Get current user info
     */
    static getCurrentUser() {
        return this.getUserData();
    }

    /**
     * Check if current user has specific role
     */
    static hasRole(role) {
        const userData = this.getUserData();
        return userData?.role === role;
    }

    /**
     * Check if current user is admin
     */
    static isAdmin() {
        return this.hasRole('ADMIN');
    }

    /**
     * Fetch all active departments
     */
    static async getDepartments() {
        try {
            const response = await this.apiRequest('/departments');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching departments:', error);
            throw error;
        }
    }

    /**
     * Fetch department statistics
     */
    static async getDepartmentStats() {
        try {
            const response = await this.apiRequest('/departments/stats');
            return response.data || [];
        } catch (error) {
            console.error('Error fetching department stats:', error);
            throw error;
        }
    }
}

export default AuthService;
