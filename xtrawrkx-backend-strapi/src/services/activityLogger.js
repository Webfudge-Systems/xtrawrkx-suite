'use strict';

/**
 * Activity Logger Service
 * Logs user activities and actions for tracking and audit purposes
 */

const activityLogger = {
    /**
     * Log a user activity
     * @param {Object} params - Activity parameters
     * @param {string} params.userId - User ID
     * @param {string} params.action - Action performed
     * @param {string} params.description - Detailed description
     * @param {string} params.type - Activity type (PROFILE, SECURITY, AUTH, etc.)
     * @param {string} params.activityType - Specific activity type (UPDATE, LOGIN, etc.)
     * @param {string} params.entityType - Entity affected
     * @param {string} params.entityId - Entity ID (optional)
     * @param {string} params.ipAddress - User IP address
     * @param {string} params.userAgent - User agent string
     * @param {string} params.status - Activity status (COMPLETED, FAILED, etc.)
     */
    async logActivity({
        userId,
        action,
        description,
        type,
        activityType,
        entityType,
        entityId = null,
        ipAddress = null,
        userAgent = null,
        status = 'COMPLETED',
        customTimestamp = null
    }) {
        try {

            // For now, we'll store activities in memory/mock storage
            // Later this can be connected to the actual Activity or AuditLog models
            const timestamp = customTimestamp ? new Date(customTimestamp).toISOString() : new Date().toISOString();
            const activity = {
                id: Date.now() + Math.random(), // Simple ID generation with randomness
                userId,
                action,
                description,
                type,
                activityType,
                entityType,
                entityId,
                ipAddress,
                userAgent,
                status,
                timestamp: timestamp,
                createdAt: timestamp
            };

            // Try to get user information to enrich the activity
            try {
                const user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                    where: { id: userId },
                    select: ['firstName', 'lastName', 'email']
                });

                if (user) {
                    activity.user = {
                        id: userId,
                        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName
                    };
                }
            } catch (error) {
                // Continue without user details
                activity.user = {
                    id: userId,
                    name: `User ${userId}`,
                    email: 'unknown@example.com'
                };
            }

            // Store in global activities array (temporary solution)
            if (!global.userActivities) {
                global.userActivities = [];
            }

            global.userActivities.unshift(activity); // Add to beginning of array

            // Keep only last 100 activities to prevent memory issues
            if (global.userActivities.length > 100) {
                global.userActivities = global.userActivities.slice(0, 100);
            }

            return activity;

        } catch (error) {
            console.error('❌ Error logging activity:', error);
            throw error;
        }
    },

    /**
     * Get activities for a specific user
     * @param {string} userId - User ID
     * @param {number} limit - Maximum number of activities to return
     * @returns {Array} User activities
     */
    async getUserActivities(userId, limit = 20) {
        try {
            if (!global.userActivities) {
                return [];
            }

            // Filter activities for the specific user and limit results
            const userActivities = global.userActivities
                .filter(activity => activity.userId === userId)
                .slice(0, limit);

            return userActivities;

        } catch (error) {
            console.error('❌ Error retrieving user activities:', error);
            return [];
        }
    },

    /**
     * Get all activities from all users (for admin/audit purposes)
     * @param {number} limit - Maximum number of activities to return
     * @param {string} type - Filter by activity type (optional)
     * @param {string} timeRange - Filter by time range (optional)
     * @returns {Array} All activities
     */
    async getAllActivities(limit = 50, type = null, timeRange = null) {
        try {
            if (!global.userActivities) {
                return [];
            }

            let activities = [...global.userActivities];

            // Filter by type if specified
            if (type && type !== 'all') {
                activities = activities.filter(activity =>
                    activity.type.toLowerCase() === type.toLowerCase()
                );
            }

            // Filter by time range if specified
            if (timeRange) {
                const now = new Date();
                let cutoffDate;

                switch (timeRange) {
                    case '1d':
                        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                        break;
                    case '7d':
                        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        break;
                    case '30d':
                        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                    case '90d':
                        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        cutoffDate = null;
                }

                if (cutoffDate) {
                    activities = activities.filter(activity =>
                        new Date(activity.timestamp) >= cutoffDate
                    );
                }
            }

            // Limit results
            activities = activities.slice(0, limit);

            return activities;

        } catch (error) {
            console.error('❌ Error retrieving all activities:', error);
            return [];
        }
    },

    /**
     * Get activity statistics
     * @returns {Object} Activity statistics
     */
    async getActivityStats() {
        try {
            if (!global.userActivities) {
                return {
                    total: 0,
                    byType: {},
                    recent: 0
                };
            }

            const activities = global.userActivities;
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Count by type
            const byType = {};
            let recentCount = 0;

            activities.forEach(activity => {
                // Count by type
                const type = activity.type.toLowerCase();
                byType[type] = (byType[type] || 0) + 1;

                // Count recent activities
                if (new Date(activity.timestamp) >= weekAgo) {
                    recentCount++;
                }
            });

            return {
                total: activities.length,
                byType,
                recent: recentCount,
                auth: byType.auth || 0,
                profile: byType.profile || 0,
                security: byType.security || 0,
                admin: byType.admin || 0
            };

        } catch (error) {
            console.error('❌ Error retrieving activity stats:', error);
            return {
                total: 0,
                byType: {},
                recent: 0
            };
        }
    },

    /**
     * Log profile update activity
     */
    async logProfileUpdate(userId, updatedFields, ipAddress, userAgent) {
        const fieldsText = Object.keys(updatedFields).join(', ');
        return this.logActivity({
            userId,
            action: 'Profile updated',
            description: `Updated profile information: ${fieldsText}`,
            type: 'PROFILE',
            activityType: 'UPDATE',
            entityType: 'USER_PROFILE',
            entityId: userId,
            ipAddress,
            userAgent,
            status: 'COMPLETED'
        });
    },

    /**
     * Log login activity
     */
    async logLogin(userId, ipAddress, userAgent, isNewDevice = false) {
        return this.logActivity({
            userId,
            action: isNewDevice ? 'Logged in from new device' : 'Logged in',
            description: `Successful login ${isNewDevice ? 'from new device' : ''}`,
            type: 'AUTH',
            activityType: 'LOGIN',
            entityType: 'USER_SESSION',
            entityId: userId,
            ipAddress,
            userAgent,
            status: 'COMPLETED'
        });
    },

    /**
     * Log password change activity
     */
    async logPasswordChange(userId, ipAddress, userAgent) {
        return this.logActivity({
            userId,
            action: 'Password changed',
            description: 'Successfully changed account password',
            type: 'SECURITY',
            activityType: 'PASSWORD_CHANGE',
            entityType: 'USER_SECURITY',
            entityId: userId,
            ipAddress,
            userAgent,
            status: 'COMPLETED'
        });
    },

    /**
     * Log avatar upload activity
     */
    async logAvatarUpload(userId, ipAddress, userAgent) {
        return this.logActivity({
            userId,
            action: 'Avatar uploaded',
            description: 'Profile picture updated successfully',
            type: 'PROFILE',
            activityType: 'AVATAR_UPLOAD',
            entityType: 'USER_PROFILE',
            entityId: userId,
            ipAddress,
            userAgent,
            status: 'COMPLETED'
        });
    },

    /**
     * Log account creation activity
     */
    async logAccountCreation(userId, ipAddress, userAgent) {
        return this.logActivity({
            userId,
            action: 'Account created',
            description: 'User account successfully created and activated',
            type: 'AUTH',
            activityType: 'ACCOUNT_CREATION',
            entityType: 'USER_ACCOUNT',
            entityId: userId,
            ipAddress,
            userAgent,
            status: 'COMPLETED'
        });
    }
};

module.exports = activityLogger;
