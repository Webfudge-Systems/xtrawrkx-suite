import { authService } from '@webfudge/auth'

export const CRM_ROUTE_MODULES = [
  { prefix: '/sales/lead-companies', module: 'leads' },
  { prefix: '/sales/contacts', module: 'contacts' },
  { prefix: '/sales/deals', module: 'deals' },
  { prefix: '/clients/accounts', module: 'client_accounts' },
  { prefix: '/clients/invoices', module: 'client_invoices' },
  { prefix: '/clients/projects', module: 'client_projects' },
  { prefix: '/clients/proposals', module: 'proposals' },
  { prefix: '/meetings', module: 'meetings' },
  { prefix: '/calendar', module: 'calendar' },
  { prefix: '/analytics', module: 'analytics' },
  { prefix: '/settings', module: 'settings' },
]

export function canReadCRM(moduleKey) {
  return authService.canRead('crm', moduleKey)
}

export function canWriteCRM(moduleKey) {
  return authService.canWrite('crm', moduleKey)
}

export function canManageCRM(moduleKey) {
  return authService.canManage('crm', moduleKey)
}

/** Whether the current org role is manager or admin (team oversight views). */
export function isCrmManagerOrAdmin() {
  const role = authService.getCurrentOrgRole()
  const code = String(role?.code || role?.name || '').toLowerCase().trim()
  if (code === 'admin' || code.endsWith('-admin') || code === 'administrator') return true
  if (code === 'manager' || code.includes('manager')) return true
  return false
}

export function currentUserIds() {
  const user = authService.getStoredUser()
  return [
    user?.id,
    user?.documentId,
    user?.userId,
    user?.strapiUserId,
  ]
    .filter((value) => value != null)
    .map(String)
}

/** Strapi users-permissions id for relation filters (assignedTo). */
export function currentStrapiUserId() {
  const user = authService.getStoredUser()
  const raw = user?.id ?? user?.strapiUserId ?? user?.userId
  if (raw == null) return null
  const n = parseInt(String(raw), 10)
  return Number.isNaN(n) ? null : n
}

function normalizeIdentity(value) {
  return value == null ? '' : String(value).trim().toLowerCase()
}

function userIdentityValues(user) {
  if (!user || typeof user !== 'object') return []
  const email = normalizeIdentity(user.email)
  const username = normalizeIdentity(user.username)
  const emailLocal = email ? email.split('@')[0] : ''
  return [username, email, emailLocal].filter(Boolean)
}

export function currentUserIdentityValues() {
  return userIdentityValues(authService.getStoredUser())
}

export function isAssignedToCurrentUser(record) {
  const assignedTo = record?.assignedTo
  if (assignedTo == null) return false
  const assignedId =
    typeof assignedTo === 'object'
      ? assignedTo.id ?? assignedTo.documentId
      : assignedTo
  if (assignedId != null && currentUserIds().includes(String(assignedId))) return true
  if (typeof assignedTo !== 'object') return false
  const assignedIdentityValues = userIdentityValues(assignedTo)
  if (assignedIdentityValues.length === 0) return false
  const currentIdentities = new Set(currentUserIdentityValues())
  return assignedIdentityValues.some((value) => currentIdentities.has(value))
}

export function canEditCRMRecord(moduleKey, record) {
  if (canManageCRM(moduleKey)) return true
  return canWriteCRM(moduleKey) && isAssignedToCurrentUser(record)
}

export function crmModuleForPath(pathname = '/') {
  if (pathname === '/') return 'dashboard'
  return CRM_ROUTE_MODULES.find((item) => pathname.startsWith(item.prefix))?.module || 'dashboard'
}

export function canReadCurrentCRMPath(pathname = '/') {
  return canReadCRM(crmModuleForPath(pathname))
}
