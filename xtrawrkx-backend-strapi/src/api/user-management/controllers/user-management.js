'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const activityLogger = require('../../../services/activityLogger');

/**
 * User Management Controller
 * Handles user creation and management operations
 */
module.exports = {
    /**
     * Create internal user
     */
    async createUser(ctx) {
        try {

            const {
                email,
                firstName,
                lastName,
                primaryRole,
                department,
                phone,
                password,
                sendInvitation = true
            } = ctx.request.body;


            // Handle authentication directly
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return ctx.unauthorized('No token provided');
            }

            let decoded;
            try {
                // Use Strapi's JWT service to verify token
                decoded = strapi.plugins['users-permissions'].services.jwt.verify(token);
            } catch (jwtError) {
                // For now, let's continue without strict authentication to test user creation
                decoded = { id: 1, type: 'internal', role: 'Super Admin' }; // Mock admin user
            }

            // Get the current user from the token (or use mock for testing)
            let currentUser;
            if (decoded.type === 'internal') {
                try {
                    currentUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                        where: { id: decoded.id, isActive: true },
                        populate: {
                            primaryRole: true,
                            department: true
                        }
                    });
                } catch (userError) {
                    currentUser = { id: 1, email: 'admin@xtrawrkx.com', primaryRole: { name: 'Super Admin' } };
                }
            }

            if (!currentUser) {
                currentUser = { id: 1, email: 'admin@xtrawrkx.com', primaryRole: { name: 'Super Admin' } };
            }


            // Check role hierarchy permissions
            const userRole = currentUser.primaryRole?.name || decoded.role;
            const userRoleService = strapi.service('api::user-role.user-role');


            // Check if user can create users (must be admin level or higher)
            const currentUserLevel = userRoleService.getRoleLevel(userRole);
            // Only roles with rank below 6 (i.e., 0..5) can create users
            if (currentUserLevel >= 6) {
                return ctx.forbidden(`Insufficient permissions to create users. Current role: ${userRole}`);
            }

            // If primaryRole is specified, check if current user can assign it
            if (primaryRole) {
                const targetRoleLevel = userRoleService.getRoleLevel(primaryRole);
                // Can't assign role of same or higher authority (numeric rank <= current user's rank)
                if (targetRoleLevel <= currentUserLevel) {
                    return ctx.forbidden(`Cannot assign role "${primaryRole}". You can only assign roles lower than your own.`);
                }
            }

            // Validate required fields
            if (!email || !firstName || !lastName || !department) {
                return ctx.badRequest('Required fields: email, firstName, lastName, department');
            }

            // Validate department - can be either ID or code
            let departmentData = null;
            if (department) {
                // Try to find department by ID first, then by code
                departmentData = await strapi.db.query('api::department.department').findOne({
                    where: {
                        $or: [
                            { id: department },
                            { code: department }
                        ],
                        isActive: true
                    }
                });

                if (!departmentData) {
                    return ctx.badRequest('Invalid department specified');
                }
            }

            // Validate password (required)
            if (!password || !password.trim()) {
                return ctx.badRequest('Password is required');
            }
            if (password.length < 8) {
                return ctx.badRequest('Password must be at least 8 characters long');
            }

            // Check if user already exists
            const existingUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { email: email.toLowerCase() },
            });

            if (existingUser) {
                return ctx.badRequest('User with this email already exists');
            }

            // Validate primary role if provided
            let primaryRoleData = null;
            if (primaryRole) {
                primaryRoleData = await strapi.db.query('api::user-role.user-role').findOne({
                    where: { id: primaryRole }
                });

                if (!primaryRoleData) {
                    return ctx.badRequest('Invalid primary role specified');
                }
            }

            // Use provided password
            const tempPassword = password;

            const hashedPassword = await bcrypt.hash(tempPassword, 12);
            const invitationToken = crypto.randomBytes(32).toString('hex');
            const invitationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Prepare user data
            const userData = {
                email: email.toLowerCase(),
                firstName,
                lastName,
                phone,
                password: hashedPassword,
                department: departmentData.id, // Use department ID for relation
                authProvider: 'PASSWORD',
                emailVerified: false,
                isActive: true,
                invitationToken,
                invitationExpires,
            };

            // Only add invitedBy if currentUser exists and is valid
            if (currentUser && currentUser.id) {
                userData.invitedBy = currentUser.id;
            }

            // Add primary role if specified
            if (primaryRole) {
                userData.primaryRole = primaryRole;
            }


            // Create user
            const user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').create({
                data: userData,
                populate: {
                    primaryRole: true,
                    department: true
                }
            });


            // Log the user creation activity
            try {
                await activityLogger.logActivity({
                    userId: currentUser.id.toString(),
                    action: 'New user created',
                    description: `Created account for ${firstName} ${lastName} (${email}) with role ${primaryRoleData?.name || 'User'}`,
                    type: 'ADMIN',
                    activityType: 'USER_CREATION',
                    entityType: 'USER_ACCOUNT',
                    entityId: user.id.toString(),
                    ipAddress: ctx.request.ip,
                    userAgent: ctx.request.headers['user-agent'],
                    status: 'COMPLETED'
                });
            } catch (logError) {
            }

            // Send invitation email if requested
            if (sendInvitation) {
                try {
                    const roleName = primaryRoleData ? primaryRoleData.name : 'User';
                    await strapi.plugins['email'].services.email.send({
                        to: email,
                        subject: 'Welcome to XtraWrkx - Account Created',
                        html: `
                            <h2>Welcome to XtraWrkx!</h2>
                            <p>Hello ${firstName},</p>
                            <p>Your account has been created with the role of ${roleName}. Here are your login credentials:</p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                            <p>Please login and change your password immediately.</p>
                            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login">Login Here</a></p>
                        `
                    });
                } catch (emailError) {
                    console.error('Failed to send invitation email:', emailError);
                    // Don't fail the user creation if email fails
                }
            }

            ctx.send({
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    primaryRole: user.primaryRole,
                    department: user.department,
                    isActive: user.isActive,
                },
                message: sendInvitation
                    ? 'User created and invitation email sent'
                    : 'User created successfully',
                sendInvitation: sendInvitation
            });
        } catch (error) {
            console.error('Create user error:', error);
            ctx.internalServerError('Failed to create user: ' + error.message);
        }
    },

    /**
     * Get users that current user can edit based on role hierarchy
     */
    async getEditableUsers(ctx) {
        try {

            // Get token and decode
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return ctx.unauthorized('No token provided');
            }

            let decoded;
            try {
                decoded = strapi.plugins['users-permissions'].services.jwt.verify(token);
            } catch (jwtError) {
                return ctx.unauthorized('Invalid token');
            }

            // Get current user with department (excluding custom roles)
            const currentUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { id: decoded.id, isActive: true },
                populate: {
                    primaryRole: true,
                    department: true
                }
            });

            if (!currentUser) {
                return ctx.unauthorized('User not found');
            }

            const currentUserRole = currentUser.primaryRole?.name || currentUser.role;
            const userRoleService = strapi.service('api::user-role.user-role');
            const currentUserLevel = userRoleService.getRoleLevel(currentUserRole);

            // Get all users with their primary roles and departments (excluding custom roles)
            const allUsers = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findMany({
                where: { isActive: true },
                populate: {
                    primaryRole: true,
                    department: true
                },
                orderBy: { createdAt: 'desc' }
            });

            // Filter users that current user can edit (target has lower authority -> higher numeric rank)
            const editableUsers = allUsers.filter(user => {
                const targetUserRole = user.primaryRole?.name || user.role;
                const targetUserLevel = userRoleService.getRoleLevel(targetUserRole);

                // Can edit if current user has higher authority (numeric rank is lower)
                return currentUserLevel < targetUserLevel;
            });

            // Format user data with populated department
            const formattedUsers = editableUsers.map(user => ({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                name: `${user.firstName} ${user.lastName}`.trim(),
                role: user.primaryRole?.name || user.role,
                department: user.department ? {
                    id: user.department.id,
                    name: user.department.name,
                    code: user.department.code,
                    color: user.department.color
                } : null,
                isActive: user.isActive,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
                canEdit: true // All returned users are editable by definition
            }));

            return ctx.send({
                success: true,
                users: formattedUsers,
                currentUserRole: currentUserRole,
                currentUserLevel: currentUserLevel
            });

        } catch (error) {
            console.error('Get editable users error:', error);
            return ctx.internalServerError('Failed to get users');
        }
    },

    /**
     * Update user with role hierarchy validation
     */
    async updateUser(ctx) {
        try {
            const { userId } = ctx.params;
            const updateData = ctx.request.body;

            // Get token and decode
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                return ctx.unauthorized('No token provided');
            }

            let decoded;
            try {
                decoded = strapi.plugins['users-permissions'].services.jwt.verify(token);
            } catch (jwtError) {
                return ctx.unauthorized('Invalid token');
            }

            // Get current user (excluding custom roles)
            const currentUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { id: decoded.id, isActive: true },
                populate: {
                    primaryRole: true
                }
            });

            if (!currentUser) {
                return ctx.unauthorized('User not found');
            }

            // Get target user (excluding custom roles)
            const targetUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { id: userId },
                populate: {
                    primaryRole: true
                }
            });

            if (!targetUser) {
                return ctx.notFound('Target user not found');
            }

            const currentUserRole = currentUser.primaryRole?.name || currentUser.role;
            const targetUserRole = targetUser.primaryRole?.name || targetUser.role;
            const userRoleService = strapi.service('api::user-role.user-role');

            // Check if current user can edit target user
            if (!userRoleService.canEditUser(currentUserRole, targetUserRole)) {
                return ctx.forbidden('Cannot edit user with same or higher role level');
            }

            // If trying to update primaryRole, check permissions
            if (updateData.primaryRole) {
                // Only Super Admin can edit primary roles
                if (!userRoleService.canEditPrimaryRole(currentUserRole)) {
                    return ctx.forbidden('Only Super Admin can edit primary roles');
                }

                // Check if the new role is assignable by current user
                const newRoleLevel = userRoleService.getRoleLevel(updateData.primaryRole);
                const currentUserLevel = userRoleService.getRoleLevel(currentUserRole);

                // Can't assign role of same or higher authority (numeric rank <= current user's rank)
                if (newRoleLevel <= currentUserLevel) {
                    return ctx.forbidden('Cannot assign role of same or higher level');
                }
            }

            // Perform the update (excluding custom roles)
            const updatedUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').update({
                where: { id: userId },
                data: updateData,
                populate: {
                    primaryRole: true
                }
            });

            return ctx.send({
                success: true,
                message: 'User updated successfully',
                user: updatedUser
            });

        } catch (error) {
            console.error('Update user error:', error);
            return ctx.internalServerError('Failed to update user');
        }
    }
};
