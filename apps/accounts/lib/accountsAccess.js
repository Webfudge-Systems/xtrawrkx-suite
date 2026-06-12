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
