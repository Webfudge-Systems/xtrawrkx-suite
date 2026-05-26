"use client";

import { useState, useEffect, createContext, useContext } from 'react';
import { verifyOTP as apiVerifyOTP, login as apiLogin, logout as apiLogout, getCurrentUser } from './api/authService.js';
import { resolveClientAccountCompanyName } from '@/utils/clientAccountCompany';

// Auth Context
const AuthContext = createContext(null);

// Auth Provider Component
export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            if (typeof window !== 'undefined') {
                const path = window.location.pathname || '';
                if (path.includes('/auth')) {
                    const params = new URLSearchParams(window.location.search);
                    const handoffEmail = params.get('email');
                    const shouldSwitchUser =
                        params.get('switch_user') === '1' || params.get('from') === 'invite';
                    if (
                        shouldSwitchUser ||
                        (
                            params.get('from') === 'xtrawrkx-website' &&
                            handoffEmail &&
                            handoffEmail.includes('@')
                        )
                    ) {
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('client_token');
                        localStorage.removeItem('client_account');
                        localStorage.removeItem('client_contacts');
                        localStorage.removeItem('demo_user');
                    }
                }
            }

            const token = localStorage.getItem('auth_token') || localStorage.getItem('client_token');

            if (!token) {
                setStatus('unauthenticated');
                return;
            }

            const user = await getCurrentUser();

            // Handle both account-based and user-based responses
            const account = user?.account || user;
            const accountId = account?.id || user?.id;
            const accountEmail = account?.email || user?.email;
            const accountName =
                resolveClientAccountCompanyName(account) ||
                account?.companyName ||
                account?.name ||
                accountEmail;
            const accountRole = account?.role || user?.role || 'MEMBER';
            const accountPermissions = Array.isArray(account?.permissions) ? account.permissions : [];

            // Method 2 FIRST: Infer from required data (most reliable)
            // Method 1 backup: Check boolean flags
            const hasRequiredData = !!(
                (resolveClientAccountCompanyName(account) || account?.companyName) &&
                account?.industry &&
                account?.email &&
                account?.phone
            );

            let onboardingCompleted = false;

            if (hasRequiredData) {
                // If they have all required data, onboarding is complete
                onboardingCompleted = true;
            } else if (account?.onboardingCompleted !== undefined) {
                onboardingCompleted = Boolean(account.onboardingCompleted);
            } else if (user?.onboardingCompleted !== undefined) {
                onboardingCompleted = Boolean(user.onboardingCompleted);
            } else if (user?.onboarded !== undefined) {
                onboardingCompleted = Boolean(user.onboarded);
            }


            setSession({
                user: {
                    id: accountId,
                    email: accountEmail,
                    name: accountName,
                    role: accountRole,
                    permissions: accountPermissions,
                    profile: {
                        id: accountId,
                        email: accountEmail,
                        phone: account?.phone || user?.phone || '',
                        onboarded: onboardingCompleted,
                        needsOnboarding: !onboardingCompleted,
                    }
                }
            });
            setStatus('authenticated');
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('client_token');
            localStorage.removeItem('client_account');
            localStorage.removeItem('client_contacts');
            localStorage.removeItem('demo_user');
            setSession(null);
            setStatus('unauthenticated');
        }
    };


    // sendOTP is deprecated - use clientSignup instead
    const sendOTP = async (email, phone) => {
        console.warn('sendOTP is deprecated. Use clientSignup instead.');
        setStatus('unauthenticated');
        throw new Error('sendOTP is no longer supported. Please use the signup flow.');
    };

    const verifyOTP = async (email, phone, otp, name = '') => {
        try {
            setStatus('loading');
            const response = await apiVerifyOTP(email, phone, otp, name);

            setSession({
                user: {
                    id: response.user.id,
                    email: response.user.email,
                    name: response.user.name,
                    profile: {
                        id: response.user.id,
                        email: response.user.email,
                        phone: response.user.phone || '',
                    }
                }
            });
            setStatus('authenticated');
            return response;
        } catch (error) {
            setStatus('unauthenticated');
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await apiLogout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('client_token');
            localStorage.removeItem('client_account');
            localStorage.removeItem('client_contacts');
            setSession(null);
            setStatus('unauthenticated');
            window.location.href = '/auth';
        }
    };

    const signIn = async (email, password) => {
        try {
            setStatus('loading');
            const response = await apiLogin(email, password);

            // Handle both account-based and user-based responses
            const account = response.account || response.user;
            const accountId = account?.id || account?.id;
            const accountEmail = account?.email || email;
            const accountName =
                resolveClientAccountCompanyName(account) ||
                account?.companyName ||
                account?.name ||
                accountEmail;
            const accountRole = account?.role || 'MEMBER';
            const accountPermissions = Array.isArray(account?.permissions) ? account.permissions : [];

            setSession({
                user: {
                    id: accountId,
                    email: accountEmail,
                    name: accountName,
                    role: accountRole,
                    permissions: accountPermissions,
                    profile: {
                        id: accountId,
                        email: accountEmail,
                        phone: account?.phone || '',
                        onboarded: account?.onboardingCompleted || false,
                        needsOnboarding: !account?.onboardingCompleted,
                    }
                }
            });
            setStatus('authenticated');
            return {
                ...response,
                user: {
                    id: accountId,
                    email: accountEmail,
                    name: accountName,
                    role: accountRole,
                    permissions: accountPermissions,
                    needsOnboarding: !account?.onboardingCompleted,
                }
            };
        } catch (error) {
            setStatus('unauthenticated');
            throw error;
        }
    };

    const register = async (email, phone, otp, name = '') => {
        // Registration is now the same as verifyOTP since account creation happens during OTP verification
        return verifyOTP(email, phone, otp, name);
    };

    return (
        <AuthContext.Provider value={{
            session,
            status,
            sendOTP,
            verifyOTP,
            signIn,
            signOut,
            register,
            checkAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook to use auth context
export function useSession() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useSession must be used within AuthProvider');
    }

    return {
        data: context.session,
        status: context.status
    };
}

// Hook to use auth actions
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return {
        sendOTP: context.sendOTP,
        verifyOTP: context.verifyOTP,
        signIn: context.signIn,
        signOut: context.signOut,
        register: context.register,
        checkAuth: context.checkAuth,
        updateOnboardingStatus: context.updateOnboardingStatus
    };
}

// Export signOut and signIn for compatibility
export const signOut = () => {
    const context = useContext(AuthContext);
    return context?.signOut() || (() => {
        localStorage.removeItem('auth_token');
        window.location.href = '/auth';
    });
};

export const signIn = () => {
    window.location.href = '/auth';
};
