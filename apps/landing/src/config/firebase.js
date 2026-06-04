// Firebase configuration - with fallback values for development
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyCRyooUo6KheeDUEuEV9Add_XozmN_p--0",
    authDomain: "xtrawrkx.firebaseapp.com",
    projectId: "xtrawrkx",
    storageBucket: "xtrawrkx.firebasestorage.app",
    messagingSenderId: "647527626177",
    appId: "1:647527626177:web:7a791b0e6a5d8c14f9ab40"
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
    return firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.projectId &&
        firebaseConfig.storageBucket &&
        firebaseConfig.messagingSenderId &&
        firebaseConfig.appId;
};

// Initialize Firebase
let app = null;
let auth = null;
let db = null;
let analytics = null;

try {
    if (isFirebaseConfigured()) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // Initialize Analytics only if measurement ID is provided and in browser
        if (firebaseConfig.measurementId && typeof window !== 'undefined') {
            try {
                analytics = getAnalytics(app);
            } catch (analyticsError) {
                // Analytics initialization failed silently
            }
        }


    } else {
        throw new Error('Firebase configuration is incomplete');
    }
} catch (error) {
    throw new Error(`Failed to initialize Firebase: ${error.message}`);
}

// Validate that db is properly initialized
if (!db) {
    throw new Error('Firestore database is not initialized. Check your Firebase configuration.');
}

// Check if Firebase is available
export const isFirebaseAvailable = () => {
    return !!db && !!auth;
};

// Export services with validation (removed storage)
export { auth, db, analytics }; 