/**
 * Onboarding API Service
 * Handles all onboarding-related API calls
 */

import backendClient from '../backendClient.js';
import { strapiClient } from '../strapiClient.js';

// Use Strapi for data storage, fallback to mock backend for development
const useStrapi = process.env.NEXT_PUBLIC_USE_STRAPI !== 'false';

/**
 * Get account data for onboarding
 * @returns {Promise<{email: string, phone: string, name: string}>}
 */
export async function getOnboardingAccount() {
    if (useStrapi) {
        try {
            // Get account from localStorage first
            if (typeof window !== 'undefined') {
                const accountData = localStorage.getItem('client_account');
                if (accountData) {
                    try {
                        const account = JSON.parse(accountData);
                        // Get contact data if available
                        const contactsData = localStorage.getItem('client_contacts');
                        let name = '';
                        if (contactsData) {
                            try {
                                const contacts = JSON.parse(contactsData);
                                const primaryContact = contacts.find(c => c.role === 'PRIMARY_CONTACT') || contacts[0];
                                if (primaryContact) {
                                    name = `${primaryContact.firstName || ''} ${primaryContact.lastName || ''}`.trim();
                                }
                            } catch (e) {
                                console.error('Error parsing contacts:', e);
                            }
                        }

                        return {
                            email: account.email || '',
                            phone: account.phone || '',
                            name: name,
                            companyName: account.companyName || '',
                            industry: account.industry || ''
                        };
                    } catch (error) {
                        console.error('Error parsing account data:', error);
                    }
                }
            }

            // Try to fetch from API
            const token = typeof window !== 'undefined' ? (localStorage.getItem('client_token') || localStorage.getItem('auth_token')) : null;

            if (token) {
                const response = await fetch(`${strapiClient.baseURL}/api/onboarding/account?email=${encodeURIComponent(session?.user?.email || '')}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.account) {
                        return {
                            email: data.account.email || '',
                            phone: data.account.phone || '',
                            name: '',
                            companyName: data.account.companyName || '',
                            industry: data.account.industry || ''
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching account from Strapi:', error);
        }
    }

    // Fallback to mock backend
    // Check if this is a demo user (client-side only)
    if (typeof window !== 'undefined') {
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser) {
            try {
                const user = JSON.parse(demoUser);
                return {
                    email: user.email,
                    phone: user.phone,
                    name: user.name,
                    companyName: '',
                    industry: ''
                };
            } catch (error) {
                console.error('Error parsing demo user for onboarding:', error);
                localStorage.removeItem('demo_user');
            }
        }
    }

    // Otherwise, use the regular API
    return backendClient.get('/onboarding/account');
}

/**
 * Save basics data
 * @param {Object} data - Basics form data
 * @returns {Promise<any>}
 */
export async function saveOnboardingBasics(data) {
    if (useStrapi) {
        try {
            return await strapiClient.saveOnboardingBasics(data);
        } catch (error) {
            console.error('Error saving basics to Strapi:', error);
            throw error;
        }
    }

    return backendClient.post('/onboarding/basics', data);
}

/**
 * Save communities data
 * @param {Object} data - Communities selection data
 * @returns {Promise<any>}
 */
export async function saveOnboardingCommunities(data) {
    if (useStrapi) {
        try {
            return await strapiClient.saveCommunitiesSelection(data.selectedCommunities);
        } catch (error) {
            console.error('Error saving communities to Strapi:', error);
            throw error;
        }
    }

    return backendClient.post('/onboarding/communities', data);
}

/**
 * Save community submission data
 * @param {Object} data - Community submission data
 * @returns {Promise<any>}
 */
export async function saveOnboardingSubmission(data) {
    if (useStrapi) {
        try {
            return await strapiClient.submitCommunityApplication(data.community, data.data);
        } catch (error) {
            console.error('Error saving submission to Strapi:', error);
            throw error;
        }
    }

    return backendClient.post('/onboarding/submission', data);
}

/**
 * Complete onboarding and create initial project
 * @param {Object} data - Onboarding completion data
 * @returns {Promise<any>}
 */
export async function completeOnboarding(data) {
    if (useStrapi) {
        try {
            const response = await strapiClient.completeOnboarding(data);

            // Store token in localStorage (client-side only)
            if (response.token && typeof window !== 'undefined') {
                localStorage.setItem('client_token', response.token);
                localStorage.setItem('auth_token', response.token); // For compatibility
            }

            return response;
        } catch (error) {
            console.error('Error completing onboarding in Strapi:', error);
            throw error;
        }
    }

    return backendClient.post('/onboarding/complete', data);
}

