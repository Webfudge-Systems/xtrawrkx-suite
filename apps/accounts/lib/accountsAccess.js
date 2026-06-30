import { authService } from '@webfudge/auth'

function normalizeRoleCode(role) {
  return String(role?.code || role?.name || '').trim().toLowerCase()
}

function isAdminRoleShape(role) {
  const code = normalizeRoleCode(role)
  const name = String(role?.name || '').trim().toLowerCase()
  return (
    code === 'admin' ||
    code.endsWith('-admin') ||
    name === 'admin' ||
    name === 'organization admin' ||
    name === 'platform admin'
  )
}

/** Organization Admin role in the active workspace. */
export function isOrganizationAdmin() {
  if (typeof window === 'undefined') return false
  const org = authService.getCurrentOrg()
  if (org && isAdminRoleShape({ code: org.roleCode, name: org.role })) return true
  return isAdminRoleShape(authService.getCurrentOrgRole())
}

function getDelegationAccess(appKey, moduleKey) {
  const app = String(appKey || '').toLowerCase()
  const mod = String(moduleKey || '').trim()
  return authService.getCurrentOrgPermissions()?.delegation?.[app]?.modules?.[mod]?.access || 'none'
}

function hasAnyDelegationManage() {
  const perms = authService.getCurrentOrgPermissions()
  const apps = ['crm', 'pm']
  for (const appKey of apps) {
    const modules = perms?.delegation?.[appKey]?.modules || {}
    for (const moduleKey of Object.keys(modules)) {
      if (getDelegationAccess(appKey, moduleKey) === 'manage') return true
    }
  }
  return false
}

/** May access Roles & Permissions management (view or edit). */
export function canManageRolePermissions(roleManagementMeta = null) {
  if (roleManagementMeta?.canManageRoles != null) return Boolean(roleManagementMeta.canManageRoles)
  if (isOrganizationAdmin()) return true
  if (authService.canManage('crm', 'settings')) return true
  if (authService.canManage('pm', 'settings')) return true
  return hasAnyDelegationManage()
}

/** May create or delete custom roles. */
export function canCreateCustomRoles(roleManagementMeta = null) {
  if (roleManagementMeta?.canCreateCustomRoles != null) {
    return Boolean(roleManagementMeta.canCreateCustomRoles)
  }
  return isOrganizationAdmin() || authService.canManage('crm', 'settings') || authService.canManage('pm', 'settings')
}

/** May edit delegation grants on Manager/Member/custom roles. */
export function canEditRoleDelegation(roleManagementMeta = null) {
  if (roleManagementMeta?.canEditDelegation != null) return Boolean(roleManagementMeta.canEditDelegation)
  return isOrganizationAdmin()
}

/** May edit a target role's permission matrix. */
export function canEditTargetRole(role, roleManagementMeta = null) {
  if (role?.canEdit != null) return Boolean(role.canEdit)
  if (!canManageRolePermissions(roleManagementMeta)) return false
  if (isOrganizationAdmin()) return true
  const code = normalizeRoleCode(role)
  if (code === 'admin' || code === 'manager') return false
  return code === 'member' || !role?.isSystem
}

/** May change one CRM/PM module row when editing another role. */
export function canEditModuleInRoleMatrix(appKey, moduleKey, roleManagementMeta = null) {
  if (isOrganizationAdmin()) return true
  const editable = roleManagementMeta?.editableModules?.[appKey]
  if (Array.isArray(editable)) return editable.includes(moduleKey)
  if (authService.canManage(appKey, 'settings')) return true
  return getDelegationAccess(appKey, moduleKey) === 'manage'
}

export function canDelegateModule(appKey, moduleKey) {
  if (isOrganizationAdmin()) return true
  return getDelegationAccess(appKey, moduleKey) === 'manage'
}
