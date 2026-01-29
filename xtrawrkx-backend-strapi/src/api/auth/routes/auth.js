module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/auth/internal/login',
            handler: 'auth.internalLogin',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/client/login',
            handler: 'auth.clientLogin',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/auth/client/check-email',
            handler: 'auth.checkEmailExists',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/client/signup',
            handler: 'auth.clientSignup',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/client/verify-otp',
            handler: 'auth.verifyOTP',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/create-internal-user',
            handler: 'auth.createInternalUser',
            config: {
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/auth/me',
            handler: 'auth.getCurrentUser',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/request-reset',
            handler: 'auth.requestPasswordReset',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/reset-password',
            handler: 'auth.resetPassword',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/auth/debug-token',
            handler: 'auth.debugToken',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'PUT',
            path: '/auth/update-profile',
            handler: 'auth.updateProfile',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/upload-avatar',
            handler: 'auth.uploadAvatar',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/change-password',
            handler: 'auth.changePassword',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/auth/activities',
            handler: 'auth.getUserActivities',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/auth/all-activities',
            handler: 'auth.getAllActivities',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/auth/activity-stats',
            handler: 'auth.getActivityStats',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'POST',
            path: '/auth/clear-activities',
            handler: 'auth.clearAllActivities',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};

