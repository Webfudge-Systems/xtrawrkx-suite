'use strict';

/**
 * organization controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const rbac = require('../../../constants/rbac-app-matrix');
const {
  canAccess,
  canManageAppSettings,
  canManageOrganizationProfile,
  canManageOrganizationSecurity,
  relationId,
} = require('../../../utils/rbac');
const {
  transferUserAssignments,
  removeUserFromOrgStructure,
} = require('../../../utils/user-assignment-transfer');
const {
  resolveOrganizationRoleIdForOrg,
  validateOrganizationRoleId,
  ORG_ROLE_UID,
} = require('../../../utils/organization-role');
const { logAccountsActivity, actorDisplayName } = require('../../../utils/crm-activity-log');
const { usernameExists } = require('../../../utils/user-username');
const {
  applyMembershipDepartments,
  departmentsPayload,
  normalizeIdList,
} = require('../../../utils/department-membership');

function getRolesAdminError(ctx, orgIdFromParams) {
  if (!ctx.state.user) return 'Missing or invalid credentials';
  if (String(ctx.state.orgId || '') !== String(orgIdFromParams)) {
    return 'Select this organization in your workspace before changing roles';
  }
  if (!ctx.state.effectivePermissions && !ctx.state.orgPermissions) {
    return 'Permissions are not available for this organization';
  }
  if (canManageAppSettings(ctx)) {
    return null;
  }
  return 'Only users with manage access to CRM or PM settings can manage roles';
}

function buildRoleCode(name, organizationId) {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 42) || 'custom-role';

  return `${base}-org-${organizationId}`;
}

const ORGANIZATION_SETTINGS_FIELDS = [
  'name',
  'companyEmail',
  'companyPhone',
  'website',
  'address',
  'industry',
  'size',
  'activeModules',
  'onboardingCompleted',
];

const OPTIONAL_STRING_FIELDS = new Set([
  'companyEmail',
  'companyPhone',
  'website',
  'industry',
  'size',
]);

function pickOrganizationSettings(body) {
  const data = {};
  ORGANIZATION_SETTINGS_FIELDS.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(body || {}, key)) return;
    let value = body[key];
    if (typeof value === 'string') {
      value = value.trim();
      if (key === 'name') {
        if (!value) return;
        data[key] = value;
        return;
      }
      if (OPTIONAL_STRING_FIELDS.has(key) && value === '') {
        data[key] = null;
        return;
      }
    }
    data[key] = value;
  });
  return data;
}

async function resolveCanEditOrganizationSettings(strapi, ctx, orgId) {
  if (canManageOrganizationProfile(ctx)) return true;
  const userId = ctx.state.user?.id;
  if (!userId || !orgId) return false;
  const org = await strapi.entityService.findOne('api::organization.organization', orgId, {
    fields: ['id'],
    populate: { owner: { fields: ['id'] } },
  });
  const ownerId = relationId(org?.owner);
  return ownerId != null && String(ownerId) === String(userId);
}

module.exports = createCoreController('api::organization.organization', ({ strapi }) => ({
  // Custom create with onboarding
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const {
      name,
      companyEmail,
      companyPhone,
      website,
      address,
      industry,
      size,
      appId,
      moduleIds,
      userCount,
      invitedEmails
    } = ctx.request.body;

    try {
      // Call onboarding service
      const result = await strapi.service('api::organization.organization').createWithOnboarding({
        userId: user.id,
        organizationData: { name, companyEmail, companyPhone, website, address, industry, size },
        appId,
        moduleIds,
        userCount: userCount || 1,
        invitedEmails: invitedEmails || []
      });

      return ctx.send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Organization creation error:', error);
      const msg = error.message || '';
      // Map Strapi unique constraint (slug from name) to the form field
      if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('already exists')) {
        return ctx.badRequest(
          'Company name already exists. Please choose a different organization name.',
          { field: 'name' }
        );
      }
      return ctx.badRequest(msg || 'Failed to create organization');
    }
  },

  async current(ctx) {
    const user = ctx.state.user;
    const orgId = ctx.state.orgId;
    if (!user) return ctx.unauthorized('Missing or invalid credentials');
    if (!orgId) return ctx.forbidden('No active organization');

    try {
      const organization = await strapi.entityService.findOne('api::organization.organization', orgId, {
        populate: {
          owner: true,
          subscriptions: {
            populate: {
              app: true,
              selectedModules: true,
            },
          },
          organizationUsers: {
            populate: {
              user: true,
              role: true,
            },
          },
        },
      });

      if (!organization) return ctx.notFound('Organization not found');
      const canEditOrganizationSettings = await resolveCanEditOrganizationSettings(strapi, ctx, orgId);
      const canManageSecuritySettings = canManageOrganizationSecurity(ctx);
      return ctx.send({
        success: true,
        data: {
          ...organization,
          currentRole: ctx.state.orgRole || 'Member',
          currentRoleCode: ctx.state.orgRoleCode || 'member',
          permissions: ctx.state.effectivePermissions || ctx.state.orgPermissions || rbac.normalizePermissions({}),
          canEditOrganizationSettings,
          canManageSecuritySettings,
        },
      });
    } catch (error) {
      console.error('Error fetching current organization:', error);
      return ctx.badRequest(error.message || 'Failed to load organization');
    }
  },

  async updateSettings(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Missing or invalid credentials');
    if (String(ctx.state.orgId || '') !== String(id)) {
      return ctx.forbidden('Select this organization before updating settings');
    }
    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      const canEdit = await resolveCanEditOrganizationSettings(strapi, ctx, id);
      if (!canEdit) {
        return ctx.forbidden(
          'You need organization Admin access, workspace ownership, or manage access to CRM or PM settings'
        );
      }

      const data = pickOrganizationSettings(ctx.request.body || {});
      if (Object.keys(data).length === 0) {
        return ctx.badRequest('No supported settings were provided');
      }
      if (!data.name && Object.prototype.hasOwnProperty.call(ctx.request.body || {}, 'name')) {
        return ctx.badRequest('Organization name is required');
      }

      const updated = await strapi.entityService.update('api::organization.organization', id, { data });
      return ctx.send({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating organization settings:', error);
      return ctx.badRequest(error.message || 'Failed to update organization settings');
    }
  },

  async getAppAccess(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Missing or invalid credentials');
    if (String(ctx.state.orgId || '') !== String(id)) {
      return ctx.forbidden('Select this organization before viewing app access');
    }
    if (!canAccess(ctx, 'crm', 'settings', 'read') && !canAccess(ctx, 'pm', 'settings', 'read')) {
      return ctx.forbidden('You need settings access to view app access');
    }

    try {
      const organization = await strapi.entityService.findOne('api::organization.organization', id, {
        populate: {
          subscriptions: {
            populate: {
              app: true,
              selectedModules: true,
            },
          },
        },
      });
      if (!organization) return ctx.notFound('Organization not found');

      const roles = await strapi.entityService.findMany(ORG_ROLE_UID, {
        filters: {
          $or: [{ organization: id }, { organization: { $null: true } }],
        },
        fields: ['name', 'code', 'accessLevel', 'description', 'isSystem', 'permissions'],
        sort: { name: 'asc' },
        limit: 250,
      });

      const roleAccess = roles.map((role) => {
        const isSystem = Boolean(role.isSystem);
        const permissions =
          isSystem
            ? rbac.defaultPermissionsForSystemCode(role.code)
            : role.permissions && typeof role.permissions === 'object' && Object.keys(role.permissions).length > 0
              ? rbac.normalizePermissions(role.permissions)
              : rbac.normalizePermissions({});
        return {
          id: role.id,
          name: role.name,
          code: role.code,
          isSystem,
          accessLevel: role.accessLevel,
          permissions,
        };
      });

      return ctx.send({
        success: true,
        data: {
          organization,
          subscriptions: organization.subscriptions || [],
          apps: {
            crm: {
              label: 'CRM',
              enabled: true,
              modules: rbac.CRM_MODULES,
            },
            pm: {
              label: 'Project Management',
              enabled: true,
              modules: rbac.PM_MODULES,
            },
          },
          roleAccess,
        },
      });
    } catch (error) {
      console.error('Error fetching app access:', error);
      return ctx.badRequest(error.message || 'Failed to load app access');
    }
  },

  // Get organization with related data
  async findOne(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    try {
      // Check user access
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      const organization = await strapi.entityService.findOne('api::organization.organization', id, {
        populate: {
          owner: true,
          subscriptions: {
            populate: {
              app: true,
              selectedModules: true
            }
          },
          organizationUsers: {
            populate: {
              user: true,
              role: true,
            }
          }
        }
      });

      return ctx.send({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error('Error fetching organization:', error);
      return ctx.badRequest(error.message);
    }
  },

  // Get users in organization
  async getUsers(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Missing or invalid credentials');
    }

    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      const orgUsers = await strapi.entityService.findMany('api::organization-user.organization-user', {
        filters: { organization: id, isActive: true },
        populate: {
          user: true,
          role: true,
          departments: { fields: ['id', 'name', 'isActive'] },
          primaryDepartment: { fields: ['id', 'name'] },
        }
      });

      const mappedUsers = orgUsers.map((membership) => {
        const member = membership;
        // Cast expanded entityService row because generated Strapi TS types lag custom populate fields.
        /** @type {any} */
        const memberAny = member;
        const userData = memberAny?.user || {};
        const roleData = memberAny?.role || {};
        const deptInfo = departmentsPayload(memberAny);

        return {
          id: userData?.id || memberAny?.id,
          email: userData?.email || '',
          username: userData?.username || '',
          firstName: userData?.firstName || userData?.firstname || '',
          lastName: userData?.lastName || userData?.lastname || '',
          blocked: Boolean(userData?.blocked),
          confirmed: userData?.confirmed !== false,
          createdAt: userData?.createdAt || null,
          updatedAt: userData?.updatedAt || null,
          roleId: roleData?.id || null,
          role: roleData?.name || 'Member',
          roleCode: roleData?.code || 'member',
          membershipId: memberAny?.id,
          joinedAt: memberAny?.joinedAt,
          lastAccessAt: memberAny?.lastAccessAt,
          departments: deptInfo.departments,
          departmentIds: deptInfo.departments.map((d) => d.id),
          primaryDepartmentId: deptInfo.primaryDepartmentId,
        };
      });

      return ctx.send({
        success: true,
        data: mappedUsers
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return ctx.badRequest(error.message);
    }
  },

  // Invite users to organization
  async inviteUsers(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const {
      emails,
      role,
      permissions,
      directAdd = false,
      directPassword,
      sendWelcomeEmail = true,
      departmentIds,
      primaryDepartmentId,
    } = ctx.request.body;

    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      if (directAdd) {
        const targetEmail = Array.isArray(emails) ? emails[0] : null;
        const result = await strapi.service('api::invitation.invitation').addUserDirectly({
          organizationId: id,
          email: targetEmail,
          addedById: user.id,
          role: role || 'Member',
          customPermissions: permissions || {},
          password: directPassword,
          sendWelcomeEmail: sendWelcomeEmail !== false,
          departmentIds: normalizeIdList(departmentIds),
          primaryDepartmentId,
        });
        return ctx.send({
          success: true,
          mode: 'direct',
          data: result,
        });
      }

      const invitations = await strapi.service('api::invitation.invitation').createInvitations(
        id,
        emails,
        user.id,
        role,
        permissions
      );

      return ctx.send({
        success: true,
        mode: 'invite',
        data: invitations
      });
    } catch (error) {
      console.error('Error inviting users:', error);
      return ctx.badRequest(error.message);
    }
  },

  // Update organization membership (role / active status / blocked status)
  async updateUserMembership(ctx) {
    const { id, membershipId } = ctx.params;
    const user = ctx.state.user;
    const {
      roleId,
      roleCode,
      roleName,
      isActive,
      status,
      email,
      username,
      password,
      transferToUserId,
      departmentIds,
      primaryDepartmentId,
    } = ctx.request.body || {};

    if (!user) {
      return ctx.unauthorized('Missing or invalid credentials');
    }

    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      const memberships = await strapi.entityService.findMany('api::organization-user.organization-user', {
        filters: { id: membershipId, organization: id },
        populate: {
          user: true,
          role: true,
          departments: { fields: ['id', 'name'] },
          primaryDepartment: { fields: ['id', 'name'] },
        },
        limit: 1,
      });

      if (!memberships.length) {
        return ctx.notFound('Membership not found');
      }

      /** @type {any} */
      const membership = memberships[0];
      const membershipUpdate = {};

      if (typeof isActive === 'boolean') {
        membershipUpdate.isActive = isActive;
      }

      if (roleId != null && `${roleId}`.trim() !== '') {
        membershipUpdate.role = await validateOrganizationRoleId(strapi, roleId, id);
      } else if (roleCode || roleName) {
        membershipUpdate.role = await resolveOrganizationRoleIdForOrg(strapi, roleCode || roleName, id);
      }

      if (Object.keys(membershipUpdate).length > 0) {
        await strapi.entityService.update('api::organization-user.organization-user', membership.id, {
          data: membershipUpdate,
        });
      }

      if (departmentIds !== undefined) {
        await applyMembershipDepartments(strapi, membership.id, id, {
          departmentIds: normalizeIdList(departmentIds),
          primaryDepartmentId,
        });
      }

      const targetUserId = membership?.user?.id;
      const userUpdate = {};
      let passwordChanged = false;
      let transferCounts = null;
      const wasSuspended = Boolean(membership?.user?.blocked);
      const isSuspending = status === 'suspended' && !wasSuspended;

      if (isSuspending && targetUserId) {
        if (transferToUserId == null || String(transferToUserId).trim() === '') {
          return ctx.badRequest('Select a user to receive open assignments before suspending');
        }
        if (Number(transferToUserId) === Number(targetUserId)) {
          return ctx.badRequest('Cannot transfer assignments to the same user');
        }
        transferCounts = await transferUserAssignments(strapi, {
          organizationId: id,
          fromUserId: targetUserId,
          toUserId: transferToUserId,
        });
      }

      if (status === 'suspended' || status === 'active') {
        if (targetUserId) {
          userUpdate.blocked = status === 'suspended';
        }
      }

      if (targetUserId) {
        const normalizedEmail =
          typeof email === 'string' && email.trim() !== ''
            ? email.trim().toLowerCase()
            : null;
        const normalizedUsername =
          typeof username === 'string' && username.trim() !== '' ? username.trim() : null;

        if (normalizedEmail) {
          const emailTaken = await strapi.query('plugin::users-permissions.user').findOne({
            where: { email: normalizedEmail },
          });
          if (emailTaken && String(emailTaken.id) !== String(targetUserId)) {
            return ctx.badRequest('Email is already in use');
          }
          userUpdate.email = normalizedEmail;
        }

        if (normalizedUsername) {
          if (normalizedUsername.length < 3) {
            return ctx.badRequest('Name must be at least 3 characters');
          }
          const taken = await usernameExists(strapi, normalizedUsername, targetUserId);
          if (taken) {
            return ctx.badRequest('Name is already in use');
          }
          userUpdate.username = normalizedUsername;
        }

        if (Object.keys(userUpdate).length > 0) {
          await strapi.entityService.update('plugin::users-permissions.user', targetUserId, {
            data: userUpdate,
          });
        }

        if (password != null && String(password).trim() !== '') {
          if (!canManageOrganizationSecurity(ctx)) {
            return ctx.forbidden('Only organization admins can change user passwords');
          }

          const minLen = 8;
          const normalizedPassword = String(password).trim();
          if (normalizedPassword.length < minLen) {
            return ctx.badRequest(`Password must be at least ${minLen} characters`);
          }

          await strapi.plugins['users-permissions'].services.user.edit(targetUserId, {
            password: normalizedPassword,
          });
          passwordChanged = true;
        }
      }

      try {
        const targetEmail =
          membership?.user?.email || membership?.user?.username || `member #${membershipId}`;
        const actorName = await actorDisplayName(strapi, user.id);
        const changes = [];
        if (typeof isActive === 'boolean') {
          changes.push({
            key: 'isActive',
            label: 'Active',
            before: membership.isActive ? 'Yes' : 'No',
            after: isActive ? 'Yes' : 'No',
          });
        }
        if (status === 'suspended' || status === 'active') {
          changes.push({
            key: 'status',
            label: 'Status',
            before: membership?.user?.blocked ? 'Suspended' : 'Active',
            after: status === 'suspended' ? 'Suspended' : 'Active',
          });
        }
        if (userUpdate.email) {
          changes.push({
            key: 'email',
            label: 'Email',
            before: membership?.user?.email || '—',
            after: userUpdate.email,
          });
        }
        if (userUpdate.username) {
          changes.push({
            key: 'username',
            label: 'Name',
            before: membership?.user?.username || '—',
            after: userUpdate.username,
          });
        }
        if (passwordChanged) {
          changes.push({
            key: 'password',
            label: 'Password',
            before: '—',
            after: 'Updated',
          });
        }
        if (transferCounts) {
          changes.push({
            key: 'assignmentsTransferred',
            label: 'Assignments transferred',
            before: '—',
            after: 'Yes',
          });
        }
        if (membershipUpdate.role != null) {
          const prevRoleName = membership?.role?.name || membership?.role?.code || '—';
          const newRole = await strapi.entityService.findOne(ORG_ROLE_UID, membershipUpdate.role, {
            fields: ['name', 'code'],
          });
          const newRoleName = newRole?.name || newRole?.code || String(membershipUpdate.role);
          changes.push({
            key: 'role',
            label: 'Role',
            before: prevRoleName,
            after: newRoleName,
          });
        }
        if (
          changes.length > 0 ||
          Object.keys(membershipUpdate).length > 0 ||
          Object.keys(userUpdate).length > 0 ||
          passwordChanged
        ) {
          const parts = changes.map((c) => c.label).join(', ');
          const summary =
            changes.length > 0
              ? `${actorName} updated ${targetEmail} (${parts})`
              : `${actorName} updated ${targetEmail}`;
          await logAccountsActivity(strapi, {
            organizationId: id,
            actorUserId: user.id,
            action: 'update',
            subjectType: 'organization_user',
            subjectId: membership.id,
            summary,
            meta: {
              email: targetEmail,
              module: 'accounts',
              ...(transferCounts ? { transferCounts } : {}),
              ...(changes.length > 0 ? { changes } : {}),
            },
          });
        }
      } catch (_) {
        /* logging is best-effort */
      }

      return ctx.send({ success: true, ...(transferCounts ? { transferCounts } : {}) });
    } catch (error) {
      console.error('Error updating organization membership:', error);
      return ctx.badRequest(error.message || 'Failed to update membership');
    }
  },

  async deleteUserMembership(ctx) {
    const { id, membershipId } = ctx.params;
    const user = ctx.state.user;
    const transferToUserId = ctx.query?.transferToUserId ?? ctx.request.body?.transferToUserId;

    if (!user) {
      return ctx.unauthorized('Missing or invalid credentials');
    }
    if (!canManageOrganizationSecurity(ctx)) {
      return ctx.forbidden('Only organization admins can remove users');
    }

    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      const memberships = await strapi.entityService.findMany('api::organization-user.organization-user', {
        filters: { id: membershipId, organization: id, isActive: true },
        populate: { user: true },
        limit: 1,
      });

      if (!memberships.length) {
        return ctx.notFound('Membership not found');
      }

      /** @type {any} */
      const membership = memberships[0];
      const targetUserId = membership?.user?.id;
      if (!targetUserId) {
        return ctx.badRequest('User account not found for this membership');
      }
      if (Number(targetUserId) === Number(user.id)) {
        return ctx.badRequest('You cannot remove your own account');
      }
      if (transferToUserId == null || String(transferToUserId).trim() === '') {
        return ctx.badRequest('Select a user to receive open assignments before removing this user');
      }
      if (Number(transferToUserId) === Number(targetUserId)) {
        return ctx.badRequest('Cannot transfer assignments to the same user');
      }

      const transferCounts = await transferUserAssignments(strapi, {
        organizationId: id,
        fromUserId: targetUserId,
        toUserId: transferToUserId,
      });
      await removeUserFromOrgStructure(strapi, {
        organizationId: id,
        userId: targetUserId,
      });

      await strapi.entityService.update('api::organization-user.organization-user', membership.id, {
        data: { isActive: false },
      });

      try {
        const targetEmail =
          membership?.user?.email || membership?.user?.username || `member #${membershipId}`;
        const actorName = await actorDisplayName(strapi, user.id);
        await logAccountsActivity(strapi, {
          organizationId: id,
          actorUserId: user.id,
          action: 'delete',
          subjectType: 'organization_user',
          subjectId: membership.id,
          summary: `${actorName} removed ${targetEmail} from the organization`,
          meta: {
            email: targetEmail,
            module: 'accounts',
            transferCounts,
          },
        });
      } catch (_) {
        /* logging is best-effort */
      }

      return ctx.send({ success: true, transferCounts });
    } catch (error) {
      console.error('Error removing organization membership:', error);
      return ctx.badRequest(error.message || 'Failed to remove user');
    }
  },

  // Add app to existing organization
  async addApp(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in');
    }

    const { appId, moduleIds, userCount, invitedEmails } = ctx.request.body;

    try {
      // Check user access
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      // Add app subscription to organization
      const result = await strapi.service('api::organization.organization').addAppToOrganization({
        organizationId: id,
        userId: user.id,
        appId,
        moduleIds,
        userCount: userCount || 1,
        invitedEmails: invitedEmails || []
      });

      return ctx.send({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error adding app to organization:', error);
      const msg = error.message || '';
      if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('already exists')) {
        return ctx.badRequest(
          'This app is already added to the selected organization.',
          { field: 'organization' }
        );
      }
      return ctx.badRequest(msg || 'Failed to add app');
    }
  },

  /** CRM + PM roles visible to the org (system templates + custom org roles). */
  async getOrganizationRoles(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Missing or invalid credentials');
    }

    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      const systemRoles = await strapi.entityService.findMany(ORG_ROLE_UID, {
        // Strapi filtering by null relation; TS types omit $null shorthand.
        /** @type {any} */
        filters: { organization: { $null: true } },
        fields: ['name', 'code', 'accessLevel', 'description', 'isSystem', 'permissions'],
        sort: { name: 'asc' },
        limit: 100,
      });

      const customRoles = await strapi.entityService.findMany(ORG_ROLE_UID, {
        filters: { organization: id, isSystem: false },
        fields: ['name', 'code', 'accessLevel', 'description', 'isSystem', 'permissions'],
        sort: { name: 'asc' },
        limit: 200,
      });

      const mapRow = (row, isSystem) => {
        const rawPerms = row.permissions;
        const hasStored = rawPerms && typeof rawPerms === 'object' && Object.keys(rawPerms).length > 0;
        const permissions = isSystem
          ? rbac.defaultPermissionsForSystemCode(row.code)
          : hasStored
            ? rbac.normalizePermissions(rawPerms)
            : rbac.normalizePermissions({});

        return {
          id: row.id,
          name: row.name,
          code: row.code,
          accessLevel: row.accessLevel,
          description: row.description,
          isSystem,
          organizationId: isSystem ? null : parseInt(String(id), 10),
          permissions,
        };
      };

      const data = [
        ...systemRoles.map((r) => mapRow(r, true)),
        ...customRoles.map((r) => mapRow(r, false)),
      ];

      return ctx.send({ success: true, data });
    } catch (error) {
      console.error('Error fetching organization roles:', error);
      return ctx.badRequest(error.message || 'Failed to load roles');
    }
  },

  async createOrganizationRole(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const err = getRolesAdminError(ctx, id);
    if (err) {
      return ctx.forbidden(err);
    }

    const { name, description, permissions } = ctx.request.body || {};
    const normalizedName = String(name || '').trim();
    if (!normalizedName) {
      return ctx.badRequest('Role name is required');
    }

    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      const dup = await strapi.entityService.findMany(ORG_ROLE_UID, {
        filters: { organization: id, name: normalizedName },
        limit: 1,
      });
      if (dup.length > 0) {
        return ctx.badRequest('A role with this name already exists in this organization');
      }

      const perms = rbac.normalizePermissions(permissions);
      /** @type {any} */
      const roleCreatePayload = {
        name: normalizedName,
        code: buildRoleCode(normalizedName, id),
        description: description ? String(description) : '',
        isSystem: false,
        organization: id,
        permissions: perms,
        accessLevel: rbac.deriveAccessLevel(perms),
      }
      const created = await strapi.entityService.create(ORG_ROLE_UID, {
        data: roleCreatePayload,
      });

      return ctx.send({ success: true, data: created });
    } catch (error) {
      console.error('Error creating organization role:', error);
      return ctx.badRequest(error.message || 'Failed to create role');
    }
  },

  async updateOrganizationRole(ctx) {
    const { id, roleId } = ctx.params;
    const user = ctx.state.user;
    const err = getRolesAdminError(ctx, id);
    if (err) {
      return ctx.forbidden(err);
    }

    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      const existing = await strapi.entityService.findOne(ORG_ROLE_UID, roleId, {
        populate: ['organization'],
      });
      if (!existing) {
        return ctx.notFound('Role not found');
      }

      /** @type {any} */
      const row = existing;
      if (row.isSystem) {
        return ctx.badRequest('System roles cannot be modified');
      }

      const orgPk = typeof row.organization === 'object' ? row.organization?.id : row.organization;
      if (String(orgPk) !== String(id)) {
        return ctx.forbidden('This role does not belong to the selected organization');
      }

      const { name, description, permissions } = ctx.request.body || {};
      const data = {};

      if (typeof name === 'string' && name.trim()) {
        const nextName = name.trim();
        const dup = await strapi.entityService.findMany(ORG_ROLE_UID, {
          filters: { organization: id, name: nextName },
          limit: 5,
        });
        const taken = dup.some((r) => String(r.id) !== String(roleId));
        if (taken) {
          return ctx.badRequest('A role with this name already exists in this organization');
        }
        data.name = nextName;
        data.code = buildRoleCode(nextName, id);
      }

      if (typeof description === 'string') {
        data.description = description;
      }

      if (permissions && typeof permissions === 'object') {
        const perms = rbac.normalizePermissions(permissions);
        data.permissions = perms;
        data.accessLevel = rbac.deriveAccessLevel(perms);
      }

      if (Object.keys(data).length === 0) {
        return ctx.send({ success: true, data: row });
      }

      const updated = await strapi.entityService.update(ORG_ROLE_UID, roleId, { data });
      return ctx.send({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating organization role:', error);
      return ctx.badRequest(error.message || 'Failed to update role');
    }
  },

  async deleteOrganizationRole(ctx) {
    const { id, roleId } = ctx.params;
    const user = ctx.state.user;
    const err = getRolesAdminError(ctx, id);
    if (err) {
      return ctx.forbidden(err);
    }

    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) {
        return ctx.forbidden('You do not have access to this organization');
      }

      const existing = await strapi.entityService.findOne(ORG_ROLE_UID, roleId, {
        populate: ['organization'],
      });
      if (!existing) {
        return ctx.notFound('Role not found');
      }

      /** @type {any} */
      const row = existing;
      if (row.isSystem) {
        return ctx.badRequest('System roles cannot be deleted');
      }

      const orgPk = typeof row.organization === 'object' ? row.organization?.id : row.organization;
      if (String(orgPk) !== String(id)) {
        return ctx.forbidden('This role does not belong to the selected organization');
      }

      const inUse = await strapi.entityService.findMany('api::organization-user.organization-user', {
        filters: { organization: id, role: roleId },
        limit: 1,
      });
      if (inUse.length > 0) {
        return ctx.badRequest('This role is assigned to one or more users. Reassign them before deleting.');
      }

      await strapi.entityService.delete(ORG_ROLE_UID, roleId);
      return ctx.send({ success: true });
    } catch (error) {
      console.error('Error deleting organization role:', error);
      return ctx.badRequest(error.message || 'Failed to delete role');
    }
  },

  async getSecuritySettings(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Missing or invalid credentials');
    if (String(ctx.state.orgId || '') !== String(id)) {
      return ctx.forbidden('Select this organization before viewing security settings');
    }
    if (!canManageOrganizationSecurity(ctx)) {
      return ctx.forbidden('Only organization admins can view security settings');
    }

    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) return ctx.forbidden('You do not have access to this organization');

      const org = await strapi.entityService.findOne('api::organization.organization', id, {
        fields: ['securitySettings'],
      });
      const defaults = {
        requireMfa: false,
        sessionTimeoutMinutes: 480,
        passwordMinLength: 8,
        allowPasswordLogin: true,
        allowedEmailDomains: [],
      };
      return ctx.send({
        success: true,
        data: { ...defaults, ...(org?.securitySettings || {}) },
      });
    } catch (error) {
      console.error('Error loading security settings:', error);
      return ctx.badRequest(error.message || 'Failed to load security settings');
    }
  },

  async updateSecuritySettings(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Missing or invalid credentials');
    if (String(ctx.state.orgId || '') !== String(id)) {
      return ctx.forbidden('Select this organization before updating security settings');
    }
    if (!canManageOrganizationSecurity(ctx)) {
      return ctx.forbidden('Only organization admins can update security settings');
    }

    try {
      const hasAccess = await strapi.service('api::organization.organization').checkUserAccess(id, user.id);
      if (!hasAccess) return ctx.forbidden('You do not have access to this organization');

      const body = ctx.request.body || {};
      const incoming = body.securitySettings || body;
      const allowedKeys = [
        'requireMfa',
        'sessionTimeoutMinutes',
        'passwordMinLength',
        'allowPasswordLogin',
        'allowedEmailDomains',
      ];
      const patch = {};
      allowedKeys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(incoming, key)) {
          patch[key] = incoming[key];
        }
      });
      if (Object.keys(patch).length === 0) {
        return ctx.badRequest('No supported security settings were provided');
      }

      if (Object.prototype.hasOwnProperty.call(patch, 'passwordMinLength')) {
        const minLen = Number(patch.passwordMinLength);
        patch.passwordMinLength = Math.min(128, Math.max(6, Number.isFinite(minLen) ? minLen : 8));
      }
      if (Object.prototype.hasOwnProperty.call(patch, 'sessionTimeoutMinutes')) {
        const timeout = Number(patch.sessionTimeoutMinutes);
        patch.sessionTimeoutMinutes = Number.isFinite(timeout) && timeout > 0 ? timeout : 480;
      }
      if (Object.prototype.hasOwnProperty.call(patch, 'allowedEmailDomains')) {
        const raw = patch.allowedEmailDomains;
        patch.allowedEmailDomains = Array.isArray(raw)
          ? raw.map((d) => String(d).trim().toLowerCase()).filter(Boolean)
          : String(raw || '')
              .split(',')
              .map((d) => d.trim().toLowerCase())
              .filter(Boolean);
      }

      const org = await strapi.entityService.findOne('api::organization.organization', id, {
        fields: ['securitySettings'],
      });
      const merged = { ...(org?.securitySettings || {}), ...patch };

      const updated = await strapi.entityService.update('api::organization.organization', id, {
        data: { securitySettings: merged },
      });
      return ctx.send({ success: true, data: updated.securitySettings });
    } catch (error) {
      console.error('Error updating security settings:', error);
      return ctx.badRequest(error.message || 'Failed to update security settings');
    }
  },
}));
