'use strict';

const {
  ACCESS,
  CRM_MODULES,
  PM_MODULES,
  defaultPermissionsForSystemCode,
  normalizePermissions,
} = require('../constants/rbac-app-matrix');

const ACCESS_RANK = {
  [ACCESS.NONE]: 0,
  [ACCESS.READ]: 1,
  [ACCESS.WRITE]: 2,
  [ACCESS.MANAGE]: 3,
};

const APP_MODULES = {
  crm: CRM_MODULES,
  pm: PM_MODULES,
};

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeRoleCode(role) {
  return String(role?.code || role?.name || '').trim().toLowerCase();
}

function isAdminRole(role) {
  const code = normalizeRoleCode(role);
  return code === 'admin' || code.endsWith('-admin') || String(role?.name || '').toLowerCase() === 'admin';
}

/** Org role name/code from JWT middleware (organization-user.role). */
function orgRoleFromCtx(ctx) {
  return ctx?.state?.orgRoleDetails || { name: ctx?.state?.orgRole, code: ctx?.state?.orgRoleCode };
}

/**
 * Organization Admin — full PM scope (row-level rules bypass).
 */
function isPmOrgAdminRole(ctx) {
  return isAdminRole(orgRoleFromCtx(ctx));
}

/**
 * System "Manager" org role (not Admin): may view all projects; edits only projects they manage.
 */
function isPmOrgManagerRole(ctx) {
  if (isPmOrgAdminRole(ctx)) return false;
  const r = orgRoleFromCtx(ctx);
  const code = normalizeRoleCode(r);
  const name = String(r?.name || ctx?.state?.orgRole || '').trim().toLowerCase();
  return code === 'manager' || name === 'manager';
}

/**
 * Everyone else at org level (custom roles, Member template, etc.) — PM member row-level rules.
 */
function isPmOrgMemberRole(ctx) {
  return !isPmOrgAdminRole(ctx) && !isPmOrgManagerRole(ctx);
}

/**
 * User may access a project row as team member or assigned project manager.
 */
function userCanAccessProjectRow(project, userId) {
  if (!project || userId == null) return false;
  const pmId = relationId(project.projectManager);
  if (pmId != null && Number(pmId) === Number(userId)) return true;
  const raw = project.teamMembers;
  const list = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  for (const u of list) {
    const id = relationId(u);
    if (id != null && Number(id) === Number(userId)) return true;
  }
  return false;
}

function projectIsPrivate(project) {
  return project?.isPrivate === true;
}

/**
 * Project list filters for non-admin users.
 * - Manager: all public projects + private projects where user is on the team.
 * - Member: only projects where user is PM or team member.
 */
function buildProjectListFiltersForUser(ctx, orgId, userId) {
  const filters = { organization: orgId };
  if (isPmOrgAdminRole(ctx)) return filters;
  if (userId == null) {
    filters.id = { $in: [] };
    return filters;
  }
  if (isPmOrgManagerRole(ctx)) {
    filters.$or = [
      { isPrivate: false },
      { isPrivate: { $null: true } },
      { projectManager: userId },
      { teamMembers: userId },
    ];
    return filters;
  }
  filters.$or = [{ projectManager: userId }, { teamMembers: userId }];
  return filters;
}

/**
 * May view a single project row.
 * - Admin: all projects.
 * - Manager: all public projects; private only when on the team.
 * - Member: only when on the team.
 */
function userCanViewProjectRow(ctx, project, userId) {
  if (!project || userId == null) return false;
  if (isPmOrgAdminRole(ctx)) return true;
  if (userCanAccessProjectRow(project, userId)) return true;
  if (isPmOrgManagerRole(ctx) && !projectIsPrivate(project)) return true;
  return false;
}

function roleBasePermissions(role) {
  if (role?.isSystem) return defaultPermissionsForSystemCode(role?.code || role?.name || 'member');
  const raw = role?.permissions;
  const hasStored = isObject(raw) && Object.keys(raw).length > 0;
  if (hasStored) return normalizePermissions(raw);
  return defaultPermissionsForSystemCode(role?.code || role?.name || 'member');
}

function applyPermissionOverrides(base, overrides) {
  const next = clone(base);
  if (!isObject(overrides)) return next;

  for (const appKey of Object.keys(APP_MODULES)) {
    const modules = overrides?.[appKey]?.modules;
    if (!isObject(modules)) continue;

    for (const moduleKey of Object.keys(APP_MODULES[appKey])) {
      if (!Object.prototype.hasOwnProperty.call(modules, moduleKey)) continue;
      const rawAccess = modules[moduleKey]?.access ?? modules[moduleKey]?.level;
      const access = String(rawAccess || '').toLowerCase();
      if (!Object.prototype.hasOwnProperty.call(ACCESS_RANK, access)) continue;
      next[appKey].modules[moduleKey] = { access };
    }
  }

  return next;
}

function resolveEffectivePermissions(membership) {
  const role = membership?.role || {};
  const base = roleBasePermissions(role);
  return applyPermissionOverrides(base, membership?.customPermissions);
}

function getAccess(permissions, appKey, moduleKey) {
  const app = String(appKey || '').toLowerCase();
  const mod = String(moduleKey || '').trim();
  const access = permissions?.[app]?.modules?.[mod]?.access || ACCESS.NONE;
  return Object.prototype.hasOwnProperty.call(ACCESS_RANK, access) ? access : ACCESS.NONE;
}

function canAccessPermissions(permissions, appKey, moduleKey, minimumAccess = ACCESS.READ, role = null) {
  if (isAdminRole(role)) return true;
  const have = ACCESS_RANK[getAccess(permissions, appKey, moduleKey)] ?? 0;
  const need = ACCESS_RANK[String(minimumAccess || ACCESS.READ).toLowerCase()] ?? ACCESS_RANK[ACCESS.READ];
  return have >= need;
}

function canAccess(ctx, appKey, moduleKey, minimumAccess = ACCESS.READ) {
  return canAccessPermissions(
    ctx?.state?.effectivePermissions || ctx?.state?.orgPermissions || {},
    appKey,
    moduleKey,
    minimumAccess,
    ctx?.state?.orgRoleDetails || { name: ctx?.state?.orgRole, code: ctx?.state?.orgRoleCode }
  );
}

function requireModuleAccess(ctx, appKey, moduleKey, minimumAccess = ACCESS.READ) {
  if (canAccess(ctx, appKey, moduleKey, minimumAccess)) return null;
  const label = `${String(appKey || '').toUpperCase()}.${moduleKey}`;
  return ctx.forbidden(`You need ${minimumAccess} access to ${label}`);
}

function relationId(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value.id ?? value.documentId ?? null;
  return value;
}

function isAssignedToCurrentUser(entry, user) {
  const assignedId = relationId(entry?.assignedTo);
  if (assignedId == null || !user) return false;
  const userIds = [user.id, user.documentId].filter((v) => v != null).map(String);
  return userIds.includes(String(assignedId));
}

function requireOwnerOrModuleManage(ctx, appKey, moduleKey, entry, message = null) {
  if (canAccess(ctx, appKey, moduleKey, ACCESS.MANAGE)) return null;
  if (isAssignedToCurrentUser(entry, ctx?.state?.user)) return null;
  return ctx.forbidden(message || `You can only edit ${moduleKey} assigned to you`);
}

function canManageAppSettings(ctx) {
  return (
    canAccess(ctx, 'crm', 'settings', ACCESS.MANAGE) ||
    canAccess(ctx, 'pm', 'settings', ACCESS.MANAGE)
  );
}

/** Org Admin role or CRM/PM settings manage — used for Accounts organization profile (sync checks only). */
function canManageOrganizationProfile(ctx) {
  return canManageAppSettings(ctx) || isAdminRole(orgRoleFromCtx(ctx));
}

/** Organization security policies — org Admin (or platform admin context) only. */
function canManageOrganizationSecurity(ctx) {
  if (ctx?.state?.platformAdminContext) return true;
  return isAdminRole(orgRoleFromCtx(ctx));
}

function requireAppSettingsManage(ctx) {
  if (canManageAppSettings(ctx)) return null;
  return ctx.forbidden('You need manage access to CRM or PM settings');
}

function membershipSummary(membership) {
  const role = membership?.role || {};
  return {
    role: role?.name || 'Member',
    roleCode: role?.code || 'member',
    roleId: role?.id || null,
    accessLevel: role?.accessLevel || null,
    permissions: resolveEffectivePermissions(membership),
    customPermissions: membership?.customPermissions || {},
    joinedAt: membership?.joinedAt || null,
  };
}

module.exports = {
  ACCESS,
  ACCESS_RANK,
  APP_MODULES,
  applyPermissionOverrides,
  canAccess,
  canAccessPermissions,
  canManageAppSettings,
  canManageOrganizationProfile,
  canManageOrganizationSecurity,
  getAccess,
  isAdminRole,
  isAssignedToCurrentUser,
  isPmOrgAdminRole,
  isPmOrgManagerRole,
  isPmOrgMemberRole,
  membershipSummary,
  projectIsPrivate,
  relationId,
  requireAppSettingsManage,
  requireModuleAccess,
  requireOwnerOrModuleManage,
  resolveEffectivePermissions,
  buildProjectListFiltersForUser,
  userCanAccessProjectRow,
  userCanViewProjectRow,
};
