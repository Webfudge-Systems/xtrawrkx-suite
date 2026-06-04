import { authService } from '@webfudge/auth'
import { canReadCRM } from './rbac'

export const DASHBOARD_VIEW_STORAGE_KEY = 'crm.dashboard.view'

export const DASHBOARD_VIEW_IDS = {
  PERSONAL: 'personal',
  SALES: 'sales',
  MANAGER: 'manager',
}

/** @typedef {'personal' | 'sales' | 'manager'} DashboardViewId */

export const DASHBOARD_VIEW_META = {
  [DASHBOARD_VIEW_IDS.PERSONAL]: {
    id: DASHBOARD_VIEW_IDS.PERSONAL,
    label: 'Personal',
    description: 'Your tasks, meetings, and day-to-day work.',
  },
  [DASHBOARD_VIEW_IDS.SALES]: {
    id: DASHBOARD_VIEW_IDS.SALES,
    label: 'Sales',
    description: 'How is the business performing?',
  },
  [DASHBOARD_VIEW_IDS.MANAGER]: {
    id: DASHBOARD_VIEW_IDS.MANAGER,
    label: 'Manager',
    description: 'How is my team progressing?',
  },
}

/**
 * Normalize active organization role to admin | manager | member.
 */
export function getOrgRoleTier() {
  const role = authService.getCurrentOrgRole()
  const code = String(role.code || role.name || '').toLowerCase().trim()
  if (code === 'admin' || code.endsWith('-admin') || code === 'administrator') {
    return 'admin'
  }
  if (code === 'manager' || code.includes('manager')) {
    return 'manager'
  }
  return 'member'
}

/**
 * Whether the user may open a dashboard view tab.
 * @param {DashboardViewId} viewId
 */
export function canAccessDashboardView(viewId) {
  if (!canReadCRM('dashboard')) return false

  const tier = getOrgRoleTier()

  switch (viewId) {
    case DASHBOARD_VIEW_IDS.PERSONAL:
      return true
    case DASHBOARD_VIEW_IDS.SALES:
      return tier === 'admin'
    case DASHBOARD_VIEW_IDS.MANAGER:
      return tier === 'admin' || tier === 'manager'
    default:
      return false
  }
}

/** @returns {Array<typeof DASHBOARD_VIEW_META.personal>} */
export function getAvailableDashboardViews() {
  return Object.values(DASHBOARD_VIEW_META).filter((view) => canAccessDashboardView(view.id))
}

/**
 * @param {DashboardViewId | string | null | undefined} viewId
 * @param {DashboardViewId[]} [availableIds]
 */
export function resolveDashboardView(viewId, availableIds) {
  const allowed =
    availableIds ??
    getAvailableDashboardViews().map((v) => v.id)
  if (allowed.length === 0) return DASHBOARD_VIEW_IDS.PERSONAL
  if (viewId && allowed.includes(viewId)) return viewId
  return allowed[0]
}

export function readStoredDashboardView() {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(DASHBOARD_VIEW_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeDashboardView(viewId) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DASHBOARD_VIEW_STORAGE_KEY, viewId)
  } catch {
    /* ignore */
  }
}
