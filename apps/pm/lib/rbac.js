import { authService } from '@webfudge/auth'

export const PM_ROUTE_MODULES = [
  { prefix: '/projects', module: 'projects' },
  { prefix: '/tasks', module: 'tasks' },
  { prefix: '/my-tasks', module: 'my_tasks' },
  { prefix: '/inbox', module: 'inbox' },
  { prefix: '/message', module: 'inbox' },
  { prefix: '/clients', module: 'client_accounts' },
  { prefix: '/calendar', module: 'calendar' },
  { prefix: '/analytics', module: 'analytics' },
  { prefix: '/settings', module: 'settings' },
]

/** Client accounts API is scoped under CRM permissions (shared org data). */
export function canReadClientAccounts() {
  return authService.canRead('crm', 'client_accounts')
}

export function canWriteClientAccounts() {
  return authService.canWrite('crm', 'client_accounts')
}

export function canManageClientAccounts() {
  return authService.canManage('crm', 'client_accounts')
}

/** Other CRM modules used on client account detail (deals, invoices, projects). */
export function canWriteCrmModule(moduleKey) {
  return authService.canWrite('crm', moduleKey)
}

export function canReadPM(moduleKey) {
  return authService.canRead('pm', moduleKey)
}

export function canWritePM(moduleKey) {
  return authService.canWrite('pm', moduleKey)
}

export function canManagePM(moduleKey) {
  return authService.canManage('pm', moduleKey)
}

export function pmModuleForPath(pathname = '/') {
  if (pathname === '/') return 'dashboard'
  return PM_ROUTE_MODULES.find((item) => pathname.startsWith(item.prefix))?.module || 'dashboard'
}

export function canReadCurrentPMPath(pathname = '/') {
  if (pathname.startsWith('/clients')) {
    return canReadClientAccounts()
  }
  return canReadPM(pmModuleForPath(pathname))
}
