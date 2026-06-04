'use strict'

/**
 * Default CRM / PM permission matrix persisted on organization-role.permissions.
 * access: none | read | write | manage
 * manage = full CRUD + configuration where applicable (mirrors CRM/PM admins)
 */

const ACCESS = {
  NONE: 'none',
  READ: 'read',
  WRITE: 'write',
  MANAGE: 'manage',
}

const CRM_MODULES = {
  dashboard: 'Dashboard',
  leads: 'Leads',
  companies: 'Lead companies',
  contacts: 'Contacts',
  deals: 'Deals & pipeline',
  client_accounts: 'Client accounts',
  client_projects: 'Client projects',
  client_invoices: 'Invoices',
  proposals: 'Proposals',
  meetings: 'Meetings',
  calendar: 'Calendar',
  analytics: 'Analytics',
  settings: 'Settings',
}

const PM_MODULES = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  tasks: 'Tasks',
  my_tasks: 'My tasks',
  inbox: 'Inbox & messages',
  calendar: 'Calendar',
  analytics: 'Analytics',
  settings: 'Settings',
}

function moduleEntry(access) {
  return { access }
}

function matrixFromCrmPm(crmMap, pmMap) {
  const crm = { modules: {} }
  Object.keys(CRM_MODULES).forEach((key) => {
    crm.modules[key] = moduleEntry(crmMap[key] || ACCESS.NONE)
  })
  const pm = { modules: {} }
  Object.keys(PM_MODULES).forEach((key) => {
    pm.modules[key] = moduleEntry(pmMap[key] || ACCESS.NONE)
  })
  return { crm, pm }
}

const ALL_MANAGE_CRM = Object.fromEntries(Object.keys(CRM_MODULES).map((k) => [k, ACCESS.MANAGE]))
const ALL_MANAGE_PM = Object.fromEntries(Object.keys(PM_MODULES).map((k) => [k, ACCESS.MANAGE]))

/** Admin: full CRM + PM */
const ADMIN = matrixFromCrmPm(ALL_MANAGE_CRM, ALL_MANAGE_PM)

/** Manager: operate CRM / PM except org-level CRM & PM settings (read-only) */
const MANAGER_CRM = {
  ...ALL_MANAGE_CRM,
  settings: ACCESS.READ,
}
const MANAGER_PM = {
  ...ALL_MANAGE_PM,
  settings: ACCESS.READ,
}
const MANAGER = matrixFromCrmPm(MANAGER_CRM, MANAGER_PM)

/** Member: contribute to pipeline; limited financials; operational PM */
const MEMBER_CRM = {
  dashboard: ACCESS.READ,
  leads: ACCESS.WRITE,
  companies: ACCESS.WRITE,
  contacts: ACCESS.WRITE,
  deals: ACCESS.READ,
  client_accounts: ACCESS.READ,
  client_projects: ACCESS.READ,
  client_invoices: ACCESS.NONE,
  proposals: ACCESS.NONE,
  meetings: ACCESS.WRITE,
  calendar: ACCESS.WRITE,
  analytics: ACCESS.READ,
  settings: ACCESS.NONE,
}
const MEMBER_PM = {
  dashboard: ACCESS.READ,
  projects: ACCESS.WRITE,
  tasks: ACCESS.WRITE,
  my_tasks: ACCESS.WRITE,
  inbox: ACCESS.READ,
  calendar: ACCESS.WRITE,
  analytics: ACCESS.READ,
  settings: ACCESS.NONE,
}
const MEMBER = matrixFromCrmPm(MEMBER_CRM, MEMBER_PM)

function emptyMatrix() {
  const crm = { modules: {} }
  Object.keys(CRM_MODULES).forEach((k) => {
    crm.modules[k] = moduleEntry(ACCESS.READ)
  })
  const pm = { modules: {} }
  Object.keys(PM_MODULES).forEach((k) => {
    pm.modules[k] = moduleEntry(ACCESS.READ)
  })
  return { crm, pm }
}

function coerceAccess(raw) {
  const v = String(raw || '').toLowerCase()
  if (v === ACCESS.MANAGE || v === ACCESS.WRITE || v === ACCESS.READ || v === ACCESS.NONE) return v
  return ACCESS.READ
}

/**
 * Merge stored JSON with schema defaults (fills missing modules).
 */
function normalizePermissions(raw) {
  const base = emptyMatrix()
  if (!raw || typeof raw !== 'object') return base
  Object.keys(CRM_MODULES).forEach((k) => {
    const mod = raw.crm?.modules?.[k]
    base.crm.modules[k] = moduleEntry(coerceAccess(mod?.access ?? mod?.level))
  })
  Object.keys(PM_MODULES).forEach((k) => {
    const mod = raw.pm?.modules?.[k]
    base.pm.modules[k] = moduleEntry(coerceAccess(mod?.access ?? mod?.level))
  })
  return base
}

function defaultPermissionsForSystemCode(code) {
  const c = String(code || '').toLowerCase()
  if (c === 'admin') return JSON.parse(JSON.stringify(ADMIN))
  if (c === 'manager') return JSON.parse(JSON.stringify(MANAGER))
  return JSON.parse(JSON.stringify(MEMBER))
}

/**
 * Highest access determines organization-role.accessLevel (legacy field).
 */
function deriveAccessLevel(permissions) {
  const normalized = normalizePermissions(permissions)
  let best = 0

  const rank = (a) =>
    ({
      none: 0,
      read: 1,
      write: 2,
      manage: 3,
    }[coerceAccess(a)] ?? 0)

  const scan = (modules) => {
    Object.values(modules || {}).forEach((m) => {
      const r = rank(m?.access)
      if (r > best) best = r
    })
  }

  scan(normalized.crm?.modules)
  scan(normalized.pm?.modules)

  if (best >= 3) return 'high'
  if (best >= 2) return 'high'
  if (best >= 1) return 'medium'
  return 'basic'
}

module.exports = {
  ACCESS,
  CRM_MODULES,
  PM_MODULES,
  emptyMatrix,
  normalizePermissions,
  defaultPermissionsForSystemCode,
  deriveAccessLevel,
}
