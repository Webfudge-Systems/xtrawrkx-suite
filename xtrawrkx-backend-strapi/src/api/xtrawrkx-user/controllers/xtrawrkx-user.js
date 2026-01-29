'use strict';

/**
 * xtrawrkx-user controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::xtrawrkx-user.xtrawrkx-user', ({ strapi }) => ({
    /**
     * Get all users with populated roles
     */
    async find(ctx) {
        try {
            const { query } = ctx;

            // Use entityService which properly handles filters, pagination, etc.
            const entities = await strapi.entityService.findMany('api::xtrawrkx-user.xtrawrkx-user', {
                ...query,
                populate: {
                    primaryRole: true,
                    userRoles: true,
                    department: true
                }
            });


            // entityService returns the data in Strapi v4 format already
            // If it's already in the right format, return it directly
            if (entities && typeof entities === 'object' && 'data' in entities) {
                return entities;
            }

            // Otherwise, if it's an array, transform it to Strapi v4 format
            if (Array.isArray(entities)) {
                const transformedUsers = entities.map(user => ({
                    id: user.id,
                    attributes: {
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        department: user.department ? {
                            data: {
                                id: user.department.id,
                                attributes: user.department
                            }
                        } : null,
                        isActive: user.isActive,
                        emailVerified: user.emailVerified,
                        lastLoginAt: user.lastLoginAt,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                        primaryRole: user.primaryRole ? {
                            data: {
                                id: user.primaryRole.id,
                                attributes: user.primaryRole
                            }
                        } : null,
                        userRoles: user.userRoles ? {
                            data: user.userRoles.map(role => ({
                                id: role.id,
                                attributes: role
                            }))
                        } : { data: [] }
                    }
                }));

                return {
                    data: transformedUsers,
                    meta: {
                        pagination: {
                            total: transformedUsers.length
                        }
                    }
                };
            }

            return entities;
        } catch (error) {
            console.error('Error fetching users:', error);
            console.error('Error details:', error.message);
            ctx.internalServerError('Failed to fetch users');
        }
    },

    /**
     * Get a specific user with populated roles
     */
    async findOne(ctx) {
        try {
            const { id } = ctx.params;

            const user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { id },
                populate: {
                    primaryRole: true,
                    userRoles: true,
                    department: true
                }
            });

            if (!user) {
                return ctx.notFound('User not found');
            }

            ctx.send({
                data: {
                    id: user.id,
                    attributes: {
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phone: user.phone,
                        department: user.department ? {
                            data: {
                                id: user.department.id,
                                attributes: user.department
                            }
                        } : null,
                        isActive: user.isActive,
                        emailVerified: user.emailVerified,
                        lastLoginAt: user.lastLoginAt,
                        createdAt: user.createdAt,
                        updatedAt: user.updatedAt,
                        primaryRole: user.primaryRole ? {
                            data: {
                                id: user.primaryRole.id,
                                attributes: user.primaryRole
                            }
                        } : null,
                        userRoles: user.userRoles ? {
                            data: user.userRoles.map(role => ({
                                id: role.id,
                                attributes: role
                            }))
                        } : { data: [] }
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching user:', error);
            ctx.internalServerError('Failed to fetch user');
        }
    },

    /**
     * Update user with primaryRole
     */
    async update(ctx) {
        try {
            const { id } = ctx.params;
            const { data } = ctx.request.body;


            // Prepare update data
            const updateData = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone,
                department: data.department,
                isActive: data.isActive,
                primaryRole: data.primaryRole
            };

            // Handle password update if provided (hash it)
            if (data.password && data.password.trim() !== '') {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash(data.password, 12);
                updateData.password = hashedPassword;
            }

            const updatedUser = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').update({
                where: { id },
                data: updateData,
                populate: {
                    primaryRole: true,
                    userRoles: true,
                    department: true
                }
            });

            ctx.send({
                data: {
                    id: updatedUser.id,
                    attributes: {
                        email: updatedUser.email,
                        firstName: updatedUser.firstName,
                        lastName: updatedUser.lastName,
                        phone: updatedUser.phone,
                        department: updatedUser.department ? {
                            data: {
                                id: updatedUser.department.id,
                                attributes: updatedUser.department
                            }
                        } : null,
                        isActive: updatedUser.isActive,
                        emailVerified: updatedUser.emailVerified,
                        lastLoginAt: updatedUser.lastLoginAt,
                        createdAt: updatedUser.createdAt,
                        updatedAt: updatedUser.updatedAt,
                        primaryRole: updatedUser.primaryRole ? {
                            data: {
                                id: updatedUser.primaryRole.id,
                                attributes: updatedUser.primaryRole
                            }
                        } : null,
                        userRoles: updatedUser.userRoles ? {
                            data: updatedUser.userRoles.map(role => ({
                                id: role.id,
                                attributes: role
                            }))
                        } : { data: [] }
                    }
                }
            });
        } catch (error) {
            console.error('Error updating user:', error);
            ctx.internalServerError('Failed to update user');
        }
    },

    /**
     * Delete user
     */
    async delete(ctx) {
        try {
            const { id } = ctx.params;

            // Check if user exists
            const user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                where: { id }
            });

            if (!user) {
                return ctx.notFound('User not found');
            }

            // Delete the user
            await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').delete({
                where: { id }
            });

            // Return success response
            ctx.send({
                data: {
                    id: parseInt(id)
                },
                meta: {}
            });
        } catch (error) {
            console.error('Error deleting user:', error);
            ctx.internalServerError('Failed to delete user');
        }
    }
}));
