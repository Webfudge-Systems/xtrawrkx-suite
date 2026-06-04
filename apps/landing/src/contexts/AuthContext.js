"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { strapiAuthService } from '../services/strapiAuthService';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if Strapi is available
        if (!strapiAuthService.isStrapiAvailable()) {
            setLoading(false);
            return;
        }

        // Check for existing token and verify it
        const initAuth = async () => {
            try {
                const token = strapiAuthService.getToken();
                if (token) {
                    // Verify token with backend (clear auth on failure during init)
                    const userData = await strapiAuthService.verifyToken(token, true);
                    setUser(userData);
                } else {
                    // Check for stored user
                    const storedUser = strapiAuthService.getCurrentUser();
                    setUser(storedUser);
                }
            } catch (error) {
                // Only clear user if it's an auth error (401), not network errors
                if (error.message?.includes('Session expired') || error.message?.includes('Access denied')) {
                    setUser(null);
                } else {
                    // For other errors, keep stored user (might be temporary network issue)
                    const storedUser = strapiAuthService.getCurrentUser();
                    setUser(storedUser);
                }
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        // Set up auth state listener
        const unsubscribe = strapiAuthService.onAuthStateChanged((user) => {
            setUser(user);
            if (loading) setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (identifier, password) => {
        try {
            setError(null);
            setLoading(true);
            const userData = await strapiAuthService.signIn(identifier, password);
            setUser(userData);
            return userData;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setError(null);
            await strapiAuthService.signOut();
            setUser(null);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const resetPassword = async (email) => {
        try {
            setError(null);
            // Strapi password reset would need to be implemented
            // For now, throw an error indicating it's not implemented
            throw new Error('Password reset not yet implemented with Strapi');
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const createUser = async (email, password, displayName) => {
        try {
            setError(null);
            // Strapi user creation would need to be implemented
            // For now, throw an error indicating it's not implemented
            throw new Error('User creation not yet implemented with Strapi');
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const clearError = () => {
        setError(null);
    };

    const refreshUser = async () => {
        try {
            const token = strapiAuthService.getToken();
            if (!token) {
                return null;
            }

            // Refresh user data without clearing auth on failure (only clear on 401)
            const userData = await strapiAuthService.verifyToken(token, false);
            setUser(userData);
            return userData;
        } catch (error) {
            // Don't log out user on refresh failures - might be temporary network issues
            // Only clear if it's an actual auth error
            if (error.message?.includes('Session expired') || error.message?.includes('Access denied')) {
                // Only clear on actual auth failures
                setUser(null);
            }
            // For other errors, keep current user data
            console.warn('Failed to refresh user data:', error.message);
            return null;
        }
    };

    const value = {
        user,
        loading,
        error,
        signIn,
        signOut,
        resetPassword,
        createUser,
        clearError,
        refreshUser,
        isAdmin: user?.isAdmin || false,
        isStrapiAvailable: strapiAuthService.isStrapiAvailable(),
        // Keep isFirebaseAvailable for backward compatibility, but it will always be false
        isFirebaseAvailable: false,
        getToken: () => strapiAuthService.getToken(),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}; 
