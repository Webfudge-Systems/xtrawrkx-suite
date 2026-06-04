// CMS Configuration
// This file controls whether to use Firebase CMS data or static data

export const CMS_CONFIG = {
    // Set to true to use Firebase CMS data, false to use static data
    USE_CMS_DATA: process.env.NEXT_PUBLIC_USE_CMS_DATA === 'true',

    // Admin configuration
    ADMIN_EMAILS: process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || ['admin@xtrawrkx.com'],

    // Strapi backend configuration
    STRAPI_API_URL: 'https://xtrawrkxsuits-production.up.railway.app/api',

    // Firebase project configuration
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyCRyooUo6KheeDUEuEV9Add_XozmN_p--0",
        authDomain: "xtrawrkx.firebaseapp.com",
        projectId: "xtrawrkx",
        messagingSenderId: "647527626177",
        appId: "1:647527626177:web:7a791b0e6a5d8c14f9ab40",
        measurementId: "G-NS76C2JWEQ"
    }
};

// Helper function to check if CMS is enabled
export const isCMSEnabled = () => CMS_CONFIG.USE_CMS_DATA;

// Helper function to check if user is admin
export const isUserAdmin = (email) => {
    return CMS_CONFIG.ADMIN_EMAILS.includes(email);
};

// Data source labels for UI
export const DATA_SOURCE_LABELS = {
    static: 'Static Data',
    cms: 'Firebase CMS',
    current: CMS_CONFIG.USE_CMS_DATA ? 'Firebase CMS' : 'Static Data'
}; 