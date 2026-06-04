'use strict';

const jwt = require('jsonwebtoken');
const { membershipSummary } = require('../utils/rbac');
const rbac = require('../constants/rbac-app-matrix');
const { resolveDepartmentContext } = require('../utils/department-context');

const JWT_SECRET = process.env.JWT_SECRET || 'myJwtSecret123456789012345678901234567890';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    try {
      const authHeader = ctx.request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return await next();
      }

      const token = authHeader.replace('Bearer ', '');

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return await next();
      }

      if (typeof decoded === 'string' || !decoded || !('id' in decoded)) {
        return await next();
      }

      const user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: decoded.id },
      });

      if (user && !user.blocked) {
        ctx.state.user = user;

        const orgIdHeader = ctx.request.headers['x-organization-id'];
        if (orgIdHeader) {
          const orgId = parseInt(orgIdHeader, 10);
          if (!isNaN(orgId) && orgId > 0) {
            // Platform super-admin can operate on any org
            if (user.isPlatformAdmin) {
              const org = await strapi.entityService.findOne('api::organization.organization', orgId, {
                fields: ['id', 'name'],
              });
              if (org) {
                const adminPerms = rbac.defaultPermissionsForSystemCode('admin');
                ctx.state.orgId = orgId;
                ctx.state.orgRole = 'Admin';
                ctx.state.orgRoleCode = 'admin';
                ctx.state.orgPermissions = adminPerms;
                ctx.state.effectivePermissions = adminPerms;
                ctx.state.platformAdminContext = true;
              }
            } else {
              const membership = await strapi.entityService.findMany(
                'api::organization-user.organization-user',
                {
                  filters: { user: user.id, organization: orgId, isActive: true },
                  limit: 1,
                  populate: {
                    role: true,
                    departments: { fields: ['id', 'name', 'isActive'] },
                    primaryDepartment: { fields: ['id', 'name', 'isActive'] },
                  },
                }
              );
              if (membership.length > 0) {
                const summary = membershipSummary(membership[0]);
                ctx.state.orgId = orgId;
                ctx.state.orgRole = summary.role;
                ctx.state.orgRoleCode = summary.roleCode;
                ctx.state.orgRoleDetails = membership[0]?.role || null;
                ctx.state.orgMembership = membership[0];
                ctx.state.orgPermissions = summary.permissions;
                ctx.state.effectivePermissions = summary.permissions;
              }
            }
          }
        }

        // Fallback: auto-pick first active org
        if (!ctx.state.orgId) {
          const firstMembership = await strapi.entityService.findMany(
            'api::organization-user.organization-user',
            {
              filters: { user: user.id, isActive: true },
              sort: { joinedAt: 'ASC' },
              limit: 1,
              populate: {
                organization: true,
                role: true,
                departments: { fields: ['id', 'name', 'isActive'] },
                primaryDepartment: { fields: ['id', 'name', 'isActive'] },
              },
            }
          );
          if (firstMembership.length > 0 && firstMembership[0].organization) {
            const summary = membershipSummary(firstMembership[0]);
            ctx.state.orgId = firstMembership[0].organization.id;
            ctx.state.orgRole = summary.role;
            ctx.state.orgRoleCode = summary.roleCode;
            ctx.state.orgRoleDetails = firstMembership[0]?.role || null;
            ctx.state.orgMembership = firstMembership[0];
            ctx.state.orgPermissions = summary.permissions;
            ctx.state.effectivePermissions = summary.permissions;
          }
        }

        await resolveDepartmentContext(strapi, ctx);
      }

      return await next();
    } catch (error) {
      console.error('JWT Auth Middleware Error:', error);
      return await next();
    }
  };
};
