'use strict';

/**
 * user-role controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::user-role.user-role', ({ strapi }) => ({
    /**
     * Get all user roles with user counts
     */
    async find(ctx) {
        try {
            const { query } = ctx;

            // Get roles with populated users
            const roles = await strapi.db.query('api::user-role.user-role').findMany({
                ...query,
                populate: {
                    users: {
                        select: ['id']
                    }
                },
                orderBy: { rank: 'asc' }
            });

            // Transform data to include user counts
            const transformedRoles = roles.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description,
                isSystemRole: role.isSystemRole,
                rank: role.rank,
                color: role.color,
                icon: role.icon,
                permissions: role.permissions || {},
                visibility: role.visibility,
                userCount: role.users ? role.users.length : 0,
                createdAt: role.createdAt,
                updatedAt: role.updatedAt
            }));

            ctx.send({
                data: transformedRoles,
                meta: {
                    pagination: {
                        total: transformedRoles.length
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching user roles:', error);
            ctx.internalServerError('Failed to fetch user roles');
        }
    },

    /**
     * Get a specific user role with users
     */
    async findOne(ctx) {
        try {
            const { id } = ctx.params;

            const role = await strapi.db.query('api::user-role.user-role').findOne({
                where: { id },
                populate: {
                    users: {
                        select: ['id', 'firstName', 'lastName', 'email', 'department']
                    }
                }
            });

            if (!role) {
                return ctx.notFound('User role not found');
            }

            ctx.send({
                data: {
                    id: role.id,
                    name: role.name,
                    description: role.description,
                    isSystemRole: role.isSystemRole,
                    rank: role.rank,
                    color: role.color,
                    icon: role.icon,
                    permissions: role.permissions || {},
                    visibility: role.visibility,
                    users: role.users || [],
                    userCount: role.users ? role.users.length : 0,
                    createdAt: role.createdAt,
                    updatedAt: role.updatedAt
                }
            });
        } catch (error) {
            console.error('Error fetching user role:', error);
            ctx.internalServerError('Failed to fetch user role');
        }
    },

    /**
     * Create a new user role
     */
    async create(ctx) {
        try {
            const { data } = ctx.request.body;

            // Validate required fields
            if (!data.name) {
                return ctx.badRequest('Role name is required');
            }

            // Validate rank is provided
            if (data.rank === undefined || data.rank === null) {
                return ctx.badRequest('Role rank is required');
            }

            // Check if role name already exists
            const existingRole = await strapi.db.query('api::user-role.user-role').findOne({
                where: { name: data.name }
            });

            if (existingRole) {
                return ctx.badRequest('Role name already exists');
            }

            // Check if rank already exists (must be unique)
            const existingRank = await strapi.db.query('api::user-role.user-role').findOne({
                where: { rank: data.rank }
            });

            if (existingRank) {
                return ctx.badRequest(`Rank ${data.rank} is already assigned to role "${existingRank.name}". Each role must have a unique rank.`);
            }

            // Set default permissions if not provided
            const defaultPermissions = {
                leads: { create: false, read: false, update: false, delete: false, convert: false },
                accounts: { create: false, read: false, update: false, delete: false },
                contacts: { create: false, read: false, update: false, delete: false },
                deals: { create: false, read: false, update: false, delete: false },
                projects: { create: false, read: false, update: false, delete: false },
                tasks: { create: false, read: false, update: false, delete: false },
                imports: { create: false, read: false, update: false, delete: false, import: false },
                exports: { create: false, read: false, update: false, delete: false, export: false },
                reports: { create: false, read: false, update: false, delete: false }
            };

            const roleData = {
                name: data.name,
                description: data.description || '',
                isSystemRole: data.isSystemRole || false,
                rank: data.rank,
                color: data.color || 'from-gray-500 to-gray-600',
                icon: data.icon || 'Shield',
                permissions: data.permissions || defaultPermissions,
                visibility: data.visibility || 'private'
            };

            const newRole = await strapi.db.query('api::user-role.user-role').create({
                data: roleData
            });

            ctx.send({
                data: {
                    ...newRole,
                    userCount: 0
                }
            });
        } catch (error) {
            console.error('Error creating user role:', error);
            ctx.internalServerError('Failed to create user role');
        }
    },

    /**
     * Update a user role
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { data } = ctx.request.body;

            // Check if role exists
            const existingRole = await strapi.db.query('api::user-role.user-role').findOne({
                where: { id }
            });

            if (!existingRole) {
                return ctx.notFound('User role not found');
            }

            // Prevent updating system roles (except by admin)
            if (existingRole.isSystemRole && !ctx.state.user?.role === 'ADMIN') {
                return ctx.forbidden('Cannot modify system roles');
            }

            // Check if new name conflicts with existing role
            if (data.name && data.name !== existingRole.name) {
                const nameConflict = await strapi.db.query('api::user-role.user-role').findOne({
                    where: { name: data.name }
                });

                if (nameConflict) {
                    return ctx.badRequest('Role name already exists');
                }
            }

            // Check if new rank conflicts with existing role (must be unique)
            if (data.rank !== undefined && data.rank !== existingRole.rank) {
                const rankConflict = await strapi.db.query('api::user-role.user-role').findOne({
                    where: { rank: data.rank }
                });

                if (rankConflict) {
                    return ctx.badRequest(`Rank ${data.rank} is already assigned to role "${rankConflict.name}". Each role must have a unique rank.`);
                }
            }

            const updatedRole = await strapi.db.query('api::user-role.user-role').update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    rank: data.rank,
                    color: data.color,
                    icon: data.icon,
                    permissions: data.permissions,
                    visibility: data.visibility
                },
                populate: {
                    users: {
                        select: ['id']
                    }
                }
            });

            ctx.send({
                data: {
                    ...updatedRole,
                    userCount: updatedRole.users ? updatedRole.users.length : 0
                }
            });
        } catch (error) {
            console.error('Error updating user role:', error);
            ctx.internalServerError('Failed to update user role');
        }
    },

    /**
     * Delete a user role
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;

            // Check if role exists
            const existingRole = await strapi.db.query('api::user-role.user-role').findOne({
                where: { id },
                populate: {
                    users: {
                        select: ['id']
                    }
                }
            });

            if (!existingRole) {
                return ctx.notFound('User role not found');
            }

            // Prevent deleting system roles
            if (existingRole.isSystemRole) {
                return ctx.forbidden('Cannot delete system roles');
            }

            // Check if role has assigned users
            if (existingRole.users && existingRole.users.length > 0) {
                return ctx.badRequest('Cannot delete role with assigned users. Please reassign users first.');
            }

            await strapi.db.query('api::user-role.user-role').delete({
                where: { id }
            });

            ctx.send({
                data: { id },
                message: 'User role deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting user role:', error);
            ctx.internalServerError('Failed to delete user role');
        }
    },

    /**
     * Assign users to a role
     */
    async assignUsers(ctx) {
        try {
            const { id } = ctx.params;
            const { userIds } = ctx.request.body;

            if (!userIds || !Array.isArray(userIds)) {
                return ctx.badRequest('User IDs array is required');
            }

            // Check if role exists
            const role = await strapi.db.query('api::user-role.user-role').findOne({
                where: { id }
            });

            if (!role) {
                return ctx.notFound('User role not found');
            }

            // Validate all user IDs exist
            const users = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findMany({
                where: { id: { $in: userIds } },
                select: ['id']
            });

            if (users.length !== userIds.length) {
                return ctx.badRequest('One or more user IDs are invalid');
            }

            // Update the role with new users (this will replace existing assignments)
            const updatedRole = await strapi.db.query('api::user-role.user-role').update({
                where: { id },
                data: {
                    users: userIds
                },
                populate: {
                    users: {
                        select: ['id', 'firstName', 'lastName', 'email', 'department']
                    }
                }
            });

            ctx.send({
                data: {
                    ...updatedRole,
                    userCount: updatedRole.users ? updatedRole.users.length : 0
                }
            });
        } catch (error) {
            console.error('Error assigning users to role:', error);
            ctx.internalServerError('Failed to assign users to role');
        }
    },

    /**
     * Get user permissions by user ID
     */
    async getUserPermissions(ctx) {
        try {
            const { userId } = ctx.params;

            // Get user permissions using the service
            const permissions = await strapi.service('api::user-role.user-role').getUserPermissions(userId);

            if (!permissions) {
                return ctx.notFound('User not found or no permissions available');
            }

            ctx.send({
                data: {
                    userId: parseInt(userId),
                    permissions
                }
            });
        } catch (error) {
            console.error('Error getting user permissions:', error);
            ctx.internalServerError('Failed to get user permissions');
        }
    },

    /**
     * Initialize or update default system roles
     * This endpoint creates missing roles and updates ranks of existing roles
     */
    async initializeDefaultRoles(ctx) {
        try {
            const result = await strapi.service('api::user-role.user-role').createDefaultRoles();
            
            ctx.send({
                success: true,
                message: 'Default roles initialized/updated successfully'
            });
        } catch (error) {
            console.error('Error initializing default roles:', error);
            ctx.internalServerError('Failed to initialize default roles');
        }
    },

    /**
     * Fix duplicate ranks in existing roles
     * Updates all roles to have unique ranks based on the hierarchy
     */
    async fixDuplicateRanks(ctx) {
        try {
            const result = await strapi.service('api::user-role.user-role').updateRolesToUniqueRanks();
            
            if (result.success) {
                ctx.send({
                    success: true,
                    message: result.message
                });
            } else {
                ctx.badRequest(result.error);
            }
        } catch (error) {
            console.error('Error fixing duplicate ranks:', error);
            ctx.internalServerError('Failed to fix duplicate ranks');
        }
    },

    /**
     * Validate that all roles have unique ranks
     * Returns any duplicate ranks found
     */
    async validateUniqueRanks(ctx) {
        try {
            const allRoles = await strapi.db.query('api::user-role.user-role').findMany({
                orderBy: { rank: 'asc' }
            });

            const rankMap = new Map();
            const duplicates = [];

            for (const role of allRoles) {
                if (rankMap.has(role.rank)) {
                    const existing = rankMap.get(role.rank);
                    if (!duplicates.find(d => d.rank === role.rank)) {
                        duplicates.push({
                            rank: role.rank,
                            roles: [existing.name, role.name]
                        });
                    } else {
                        const dup = duplicates.find(d => d.rank === role.rank);
                        dup.roles.push(role.name);
                    }
                } else {
                    rankMap.set(role.rank, role);
                }
            }

            ctx.send({
                valid: duplicates.length === 0,
                duplicates: duplicates,
                message: duplicates.length === 0 
                    ? 'All roles have unique ranks' 
                    : `Found ${duplicates.length} duplicate rank(s)`
            });
        } catch (error) {
            console.error('Error validating unique ranks:', error);
            ctx.internalServerError('Failed to validate unique ranks');
        }
    }
}));
