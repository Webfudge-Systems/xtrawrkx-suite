// Strapi Authentication Service
// Handles authentication with Strapi backend

import { CMS_CONFIG } from '../config/cms';

const STRAPI_API_URL = CMS_CONFIG.STRAPI_API_URL || process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';

// Get stored token from localStorage
const getStoredToken = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('strapi_token');
};

// Get stored user from localStorage
const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('strapi_user');
    return userStr ? JSON.parse(userStr) : null;
};

// Store token and user in localStorage
const storeAuth = (token, user) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('strapi_token', token);
    localStorage.setItem('strapi_user', JSON.stringify(user));
};

// Clear stored auth data
const clearAuth = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('strapi_token');
    localStorage.removeItem('strapi_user');
};

// Check if user email is in admin list
const isAdminUser = (email) => {
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [
        'admin@xtrawrkx.com',
    ];
    return adminEmails.includes(email);
};

// Strapi Authentication Service
export const strapiAuthService = {
    // Sign in with email and password
    signIn: async (identifier, password) => {
        try {
            // Use Next.js API route as proxy to avoid CORS issues
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier, // Can be email or username
                    password,
                }),
            });

            // Handle network errors
            if (!response) {
                throw new Error('Network error: Unable to reach the server. Please check your internet connection.');
            }

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                // If response is not JSON, it might be an HTML error page or network issue
                throw new Error('Server error: Received invalid response. Please try again later.');
            }

            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 400) {
                    throw new Error(
                        data.error ||
                        'Invalid credentials. Please check your email and password.'
                    );
                } else if (response.status === 401) {
                    throw new Error(data.error || 'Unauthorized. Please check your credentials.');
                } else if (response.status === 404) {
                    throw new Error('Authentication endpoint not found. Please contact support.');
                } else if (response.status === 405) {
                    throw new Error(
                        data.error ||
                        data.details ||
                        'Method not allowed. The authentication endpoint may not be configured correctly. Please verify the Strapi backend settings.'
                    );
                } else if (response.status >= 500) {
                    throw new Error(data.error || data.details || 'Server error. Please try again later or contact support.');
                } else {
                    throw new Error(
                        data.error ||
                        data.details ||
                        'Authentication failed. Please check your credentials.'
                    );
                }
            }

            // Check if user is admin
            // Support both 'jwt' and 'token' from response
            const token = data.jwt || data.token;
            const user = data.user;
            const userEmail = user?.email || identifier;

            if (!isAdminUser(userEmail)) {
                throw new Error('Access denied. Admin privileges required.');
            }

            // Normalize user data to include role information
            const normalizedUser = {
                id: user.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName || user.username || user.email,
                primaryRole: user.primaryRole,
                userRoles: user.userRoles,
                role: user.role || user.primaryRole?.name,
                isAdmin: true,
            };

            // Store token and user (CRM portal uses 'token', we support both)
            storeAuth(token, normalizedUser);

            return {
                ...normalizedUser,
                jwt: token,
            };
        } catch (error) {
            // Handle network/fetch errors specifically
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Failed to connect to server. Please check your internet connection and try again.');
            }
            // Re-throw with original message if it's already a formatted error
            throw error;
        }
    },

    // Sign out
    signOut: async () => {
        try {
            clearAuth();
        } catch (error) {
            throw new Error('Sign out failed');
        }
    },

    // Get current user
    getCurrentUser: () => {
        const user = getStoredUser();
        const token = getStoredToken();

        if (!user || !token) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName || user.username || user.email,
            primaryRole: user.primaryRole,
            userRoles: user.userRoles,
            role: user.role || user.primaryRole?.name,
            isAdmin: isAdminUser(user.email),
            jwt: token,
        };
    },

    // Get current token
    getToken: () => {
        return getStoredToken();
    },

    // Verify token with backend and fetch full user data
    verifyToken: async (token, clearOnFailure = true) => {
        try {
            // Use Next.js API route as proxy to avoid CORS issues
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            // Handle network errors - don't clear auth on network issues
            if (!response) {
                if (clearOnFailure) clearAuth();
                throw new Error('Network error: Unable to verify token with server.');
            }

            if (!response.ok) {
                // Only clear auth on 401 (unauthorized) - token is actually invalid
                if (response.status === 401) {
                    if (clearOnFailure) clearAuth();
                    throw new Error('Session expired. Please log in again.');
                }
                // For other errors, don't clear auth - might be temporary server issues
                if (response.status >= 500) {
                    // Don't clear on server errors - might be temporary
                    throw new Error('Server error during token verification');
                }
                // For 4xx errors other than 401, don't clear auth immediately
                // Only clear if explicitly requested (during initial auth check)
                if (clearOnFailure) {
                    // Only clear on non-401 errors if it's during initial auth
                    throw new Error('Token verification failed');
                }
                throw new Error('Token verification failed');
            }

            let userData;
            try {
                userData = await response.json();
            } catch (jsonError) {
                // Don't clear auth on parse errors - might be temporary
                if (clearOnFailure) clearAuth();
                throw new Error('Invalid response from server');
            }

            // Handle Strapi v4 structure (with attributes) or direct structure
            const user = userData.attributes || userData;
            const userEmail = user?.email;

            if (!isAdminUser(userEmail)) {
                if (clearOnFailure) clearAuth();
                throw new Error('Access denied. Admin privileges required.');
            }

            // Normalize user data structure
            const normalizedUser = {
                id: user.id || userData.id,
                email: user.email,
                username: user.username,
                displayName: user.displayName || user.username || user.email,
                primaryRole: user.primaryRole || userData.primaryRole,
                userRoles: user.userRoles || userData.userRoles,
                role: user.role || user.primaryRole?.name || userData.role,
                isAdmin: true,
            };

            // Update stored user
            storeAuth(token, normalizedUser);

            return {
                ...normalizedUser,
                jwt: token,
            };
        } catch (error) {
            // Only clear auth if explicitly requested and it's an auth error
            if (clearOnFailure && error.message.includes('Session expired')) {
                clearAuth();
            }
            // Handle network/fetch errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Failed to connect to server. Please check your internet connection.');
            }
            throw error;
        }
    },

    // Listen to auth state changes (for compatibility with existing code)
    onAuthStateChanged: (callback) => {
        // Check initial state
        const user = strapiAuthService.getCurrentUser();
        callback(user);

        // Set up interval to check for token changes
        // In a real app, you might want to use events or a more sophisticated approach
        const interval = setInterval(() => {
            const currentUser = strapiAuthService.getCurrentUser();
            if (currentUser?.jwt !== user?.jwt) {
                callback(currentUser);
            }
        }, 1000);

        // Return unsubscribe function
        return () => clearInterval(interval);
    },

    // Check if user is admin
    isAdmin: (user) => {
        return user && isAdminUser(user.email);
    },

    // Check if Strapi is available
    isStrapiAvailable: () => {
        return !!STRAPI_API_URL;
    },
};

