"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

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
        if (!authService.isFirebaseAvailable()) {
            setLoading(false);
            return;
        }

        const unsubscribe = authService.onAuthStateChanged((userData) => {
            setUser(userData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email, password) => {
        try {
            setError(null);
            setLoading(true);
            const userData = await authService.signIn(email, password);
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
            await authService.signOut();
            setUser(null);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const resetPassword = async (email) => {
        try {
            setError(null);
            await authService.resetPassword(email);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const createUser = async (email, password, displayName) => {
        try {
            setError(null);
            return await authService.createUser(email, password, displayName);
        } catch (error) {
            setError(error.message);
            throw error;
        }
    };

    const refreshUser = async () => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser?.email || !authService.isAdmin({ email: currentUser.email })) {
            return null;
        }

        const userData = {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            isAdmin: true,
        };
        setUser(userData);
        return userData;
    };

    const clearError = () => {
        setError(null);
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
        isFirebaseAvailable: authService.isFirebaseAvailable(),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
