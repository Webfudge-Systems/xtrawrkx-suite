import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth';
import { auth, isFirebaseAvailable } from '../config/firebase';

// Check if user email is in admin list
const isAdminUser = (email) => {
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [
        'admin@xtrawrkx.com',
        // Add your test email here temporarily
        'test@xtrawrkx.com'
    ];
    return adminEmails.includes(email);
};

// Authentication service
export const authService = {
    // Sign in with email and password
    signIn: async (email, password) => {
        if (!isFirebaseAvailable()) {
            throw new Error('Firebase is not available. Please check your configuration.');
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user is admin
            if (!isAdminUser(user.email)) {
                await signOut(auth);
                throw new Error('Access denied. Admin privileges required.');
            }

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                isAdmin: true
            };
        } catch (error) {
            throw new Error(error.message || 'Authentication failed');
        }
    },

    // Sign out
    signOut: async () => {
        if (!isFirebaseAvailable()) {
            return; // Gracefully handle when Firebase is not available
        }

        try {
            await signOut(auth);
        } catch (error) {
            throw new Error('Sign out failed');
        }
    },

    // Get current user
    getCurrentUser: () => {
        if (!isFirebaseAvailable()) {
            return null;
        }
        return auth.currentUser;
    },

    // Listen to auth state changes
    onAuthStateChanged: (callback) => {
        if (!isFirebaseAvailable()) {
            callback(null);
            return () => { }; // Return empty unsubscribe function
        }

        return onAuthStateChanged(auth, (user) => {
            if (user && isAdminUser(user.email)) {
                callback({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    isAdmin: true
                });
            } else {
                callback(null);
            }
        });
    },

    // Create user (admin only)
    createUser: async (email, password, displayName) => {
        if (!isFirebaseAvailable()) {
            throw new Error('Firebase is not available. Please check your configuration.');
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (displayName) {
                await updateProfile(user, { displayName });
            }

            return {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || displayName
            };
        } catch (error) {
            throw new Error(error.message || 'User creation failed');
        }
    },

    // Send password reset email
    resetPassword: async (email) => {
        if (!isFirebaseAvailable()) {
            throw new Error('Firebase is not available. Please check your configuration.');
        }

        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            throw new Error(error.message || 'Password reset failed');
        }
    },

    // Check if user is admin
    isAdmin: (user) => {
        return user && isAdminUser(user.email);
    },

    // Get Firebase availability status
    isFirebaseAvailable: () => {
        return isFirebaseAvailable();
    }
}; 
