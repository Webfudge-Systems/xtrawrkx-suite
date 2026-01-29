'use strict';

/**
 * Authentication middleware
 */
module.exports = (config, { strapi }) => {
    return async (ctx, next) => {
        try {
            // Skip authentication only for specific public routes
            const publicRoutes = [
                '/api/auth/internal/login',
                '/api/auth/client/login',
                '/api/auth/request-reset',
                '/api/auth/reset-password'
            ];

            // Skip authentication for admin, user-roles, xtrawrkx-users, user-management, auth, dashboard, and CRM routes (for now)
            if (ctx.request.path.startsWith('/admin') ||
                ctx.request.path.startsWith('/api/admin') ||
                ctx.request.path.startsWith('/api/user-roles') ||
                ctx.request.path.startsWith('/api/xtrawrkx-users') ||
                ctx.request.path.startsWith('/api/user-management') ||
                ctx.request.path.startsWith('/api/auth/') ||
                ctx.request.path.startsWith('/api/dashboard/') ||
                ctx.request.path.startsWith('/api/upload') ||
                ctx.request.path.startsWith('/uploads') ||
                ctx.request.path.startsWith('/api/lead-companies') ||
                ctx.request.path.startsWith('/api/client-accounts') ||
                ctx.request.path.startsWith('/api/contacts') ||
                ctx.request.path.startsWith('/api/deals') ||
                ctx.request.path.startsWith('/api/activities') ||
                ctx.request.path.startsWith('/api/proposals') ||
                ctx.request.path.startsWith('/api/task-comments') ||
                ctx.request.path.startsWith('/api/tasks') ||
                ctx.request.path.startsWith('/api/subtasks') ||
                publicRoutes.includes(ctx.request.path)) {
                return await next();
            }

            // Chat messages require authentication but are accessible to ALL authenticated users (any level, not just admin)
            // Continue to authentication check below for chat messages
            const token = ctx.request.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return ctx.unauthorized('No token provided');
            }


            let decoded;
            try {
                // Use Strapi's JWT service which uses the correct secret
                decoded = strapi.plugins['users-permissions'].services.jwt.verify(token);
            } catch (jwtError) {

                // Fallback to manual JWT verification with the JWT_SECRET
                const jwt = require('jsonwebtoken');
                const jwtSecret = process.env.JWT_SECRET || 'myJwtSecret123456789012345678901234567890';

                try {
                    decoded = jwt.verify(token, jwtSecret);
                } catch (manualError) {
                    return ctx.unauthorized('Invalid token');
                }
            }

            // Set user context based on token type
            if (decoded.type === 'internal') {
                const user = await strapi.db.query('api::xtrawrkx-user.xtrawrkx-user').findOne({
                    where: { id: decoded.id, isActive: true },
                });

                if (!user) {
                    return ctx.unauthorized('User not found or inactive');
                }

                ctx.state.user = {
                    ...user,
                    type: 'internal'
                };
            } else if (decoded.type === 'client') {
                const account = await strapi.db.query('api::account.account').findOne({
                    where: { id: decoded.id, isActive: true },
                    populate: {
                        contacts: {
                            where: { status: 'ACTIVE' }
                        }
                    }
                });

                if (!account) {
                    return ctx.unauthorized('Account not found or inactive');
                }

                ctx.state.user = {
                    ...account,
                    type: 'client'
                };
            } else {
                return ctx.unauthorized('Invalid token type');
            }

            await next();
        } catch (error) {
            console.error('Authentication middleware error:', error);
            return ctx.unauthorized('Invalid token');
        }
    };
};

