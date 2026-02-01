/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import backendClient from '../backendClient.js';
import { strapiClient } from '../strapiClient.js';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
// const API_BASE_URL = 'https://xtrawrkxsuits-production.up.railway.app';

// Use Strapi for data storage, fallback to mock backend for development
const useStrapi = process.env.NEXT_PUBLIC_USE_STRAPI !== 'false';

/**
 * Store client account in localStorage with ensured onboarding status
 * Similar to how we store auth tokens - always ensure onboardingCompleted is set
 */
function storeClientAccount(account) {
    if (!account || typeof window === 'undefined') {
        return;
    }

    // Method 2 FIRST: Infer from data (most reliable)
    // Method 1 backup: Check boolean flag
    const hasRequiredData = !!(
        account.companyName &&
        account.industry &&
        account.email &&
        account.phone
    );

    let onboardingCompleted;
    if (hasRequiredData) {
        // If they have all required data, onboarding is complete
        onboardingCompleted = true;
    } else if (account.onboardingCompleted === true) {
        // Fall back to boolean if data doesn't exist
        onboardingCompleted = true;
    } else {
        onboardingCompleted = false;
    }

    // Store account with ensured onboarding status
    const accountToStore = {
        ...account,
        onboardingCompleted: onboardingCompleted
    };

    localStorage.setItem('client_account', JSON.stringify(accountToStore));

    return accountToStore;
}

/**
 * Check if email already exists
 * @param {string} email - Email to check
 * @returns {Promise<{exists: boolean}>}
 */
export async function checkEmailExists(email) {
    if (useStrapi) {
        try {
            const emailLower = email.toLowerCase().trim();

            // Use the dedicated auth endpoint for checking email
            const url = `${strapiClient.baseURL}/api/auth/client/check-email?email=${encodeURIComponent(emailLower)}`;


            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Email check failed:', response.status, response.statusText, errorText);
                // On error, return false to allow signup - the actual signup will catch duplicate emails
                return { exists: false };
            }

            const data = await response.json();
            const exists = data.exists === true;


            return { exists };
        } catch (error) {
            console.error('Error checking email existence:', error);
            // On error, return false to allow signup attempt
            // The actual signup endpoint will catch duplicate emails
            return { exists: false };
        }
    }

    // Fallback - assume email doesn't exist
    return { exists: false };
}

/**
 * Client signup - creates account and sends OTP
 * @param {object} signupData - All signup information
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function clientSignup(signupData) {
    if (useStrapi) {
        try {
            const response = await fetch(`${strapiClient.baseURL}/api/auth/client/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(signupData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error signing up via Strapi:', error);
            throw error;
        }
    }

    // Fallback to mock backend
    return backendClient.post('/auth/send-otp', {
        email: signupData.email,
        phone: signupData.phone
    });
}

/**
 * Verify OTP and activate account
 * @param {string} email 
 * @param {string} otp 
 * @returns {Promise<{account: any, token: string}>}
 */
export async function verifyOTP(email, otp) {
    if (useStrapi) {
        try {
            const response = await fetch(`${strapiClient.baseURL}/api/auth/client/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Store token in localStorage (client-side only)
            if (data.token && typeof window !== 'undefined') {
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('client_token', data.token);
                if (data.account) {
                    storeClientAccount(data.account);
                }
            }

            return data;
        } catch (error) {
            console.error('Error verifying OTP via Strapi:', error);
            throw error;
        }
    }

    // Fallback to mock backend
    const response = await backendClient.post('/auth/verify-otp', {
        email,
        phone: '',
        otp,
        name: ''
    });

    // Store token in localStorage (client-side only)
    if (response.token && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
    }

    return response;
}

/**
 * Login user (existing users only)
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{account: any, token: string}>}
 */
export async function login(email, password) {
    if (useStrapi) {
        try {
            const response = await fetch(`${strapiClient.baseURL}/api/auth/client/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Store token in localStorage (client-side only)
            const token = data.jwt || data.token;
            if (token && typeof window !== 'undefined') {
                localStorage.setItem('client_token', token);
                localStorage.setItem('auth_token', token);
                if (data.account) {
                    storeClientAccount(data.account);
                }
                if (data.contacts) {
                    localStorage.setItem('client_contacts', JSON.stringify(data.contacts));
                }
            }

            return { ...data, token: token };
        } catch (error) {
            console.error('Error logging in via Strapi:', error);
            throw error;
        }
    }

    const response = await backendClient.post('/auth/login', {
        email,
        password
    });

    // Store token in localStorage (client-side only)
    if (response.token && typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.token);
    }

    return response;
}

/**
 * Get current user session
 * @returns {Promise<any>}
 */
export async function getCurrentUser() {
    if (useStrapi) {
        try {
            // Check localStorage first for client account
            if (typeof window !== 'undefined') {
                const accountData = localStorage.getItem('client_account');
                if (accountData) {
                    try {
                        const account = JSON.parse(accountData);
                        return {
                            account: account,
                            id: account.id,
                            email: account.email,
                            name: account.companyName,
                        };
                    } catch (error) {
                        console.error('Error parsing client account:', error);
                    }
                }
            }

            // Try to fetch from Strapi
            const token = typeof window !== 'undefined' ? (localStorage.getItem('client_token') || localStorage.getItem('auth_token')) : null;

            if (!token) {
                throw new Error('No authentication token');
            }

            const response = await fetch(`${strapiClient.baseURL}/api/auth/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get current user');
            }

            const data = await response.json();

            // Handle client account response
            if (data.type === 'client' && data.account) {
                if (typeof window !== 'undefined') {
                    storeClientAccount(data.account);
                }
                return {
                    account: data.account,
                    id: data.account.id,
                    email: data.account.email,
                    name: data.account.companyName
                };
            }

            return data;
        } catch (error) {
            console.error('Error getting current user from Strapi:', error);
            // Fallback to demo user check
            if (typeof window !== 'undefined') {
                const demoUser = localStorage.getItem('demo_user');
                if (demoUser) {
                    try {
                        return JSON.parse(demoUser);
                    } catch (parseError) {
                        console.error('Error parsing demo user:', parseError);
                        localStorage.removeItem('demo_user');
                    }
                }
            }
            throw error;
        }
    }

    // Check if this is a demo user (client-side only)
    if (typeof window !== 'undefined') {
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser) {
            try {
                return JSON.parse(demoUser);
            } catch (error) {
                console.error('Error parsing demo user:', error);
                localStorage.removeItem('demo_user');
            }
        }
    }

    // Otherwise, use the regular API
    return backendClient.get('/auth/me');
}

/**
 * Logout user
 * @returns {Promise<void>}
 */
export async function logout() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('demo_user'); // Also remove demo user data
    }
    return Promise.resolve();
}

