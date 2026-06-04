import { ROUTE_TABS } from './tabs'

export type HeaderAction = 'filter' | 'export' | 'import' | 'add'

export type RouteMeta = {
  title: string
  subtitle: string
  breadcrumbs: string[]
  actions: HeaderAction[]
}

export const ROUTE_META: Record<string, RouteMeta> = {
  '/home': {
    title: 'Dashboard',
    subtitle: 'Track your books performance and activities.',
    breadcrumbs: ['Dashboard'],
    actions: [],
  },
  '/home/activity': {
    title: 'Activity',
    subtitle: 'Timeline of sales, purchases, banking, and accounting events.',
    breadcrumbs: ['Dashboard', 'Activity'],
    actions: [],
  },
  '/home/recent-updates': {
    title: 'Recent Updates',
    subtitle: 'Audit log of record creates, edits, emails, and payments.',
    breadcrumbs: ['Dashboard', 'Recent Updates'],
    actions: [],
  },
  '/sales': {
    title: 'Sales',
    subtitle: 'Manage customers, invoices, and receivables.',
    breadcrumbs: ['Dashboard', 'Sales'],
    actions: ['filter', 'export', 'import', 'add'],
  },
  '/purchases': {
    title: 'Purchases',
    subtitle: 'Manage vendors, expenses, and payables.',
    breadcrumbs: ['Dashboard', 'Purchases'],
    actions: ['filter', 'export', 'import', 'add'],
  },
  '/items': {
    title: 'Items',
    subtitle: 'Manage products, pricing, and inventory.',
    breadcrumbs: ['Dashboard', 'Items'],
    actions: ['filter', 'export', 'import', 'add'],
  },
  '/banking': {
    title: 'Banking',
    subtitle: 'Manage accounts, transfers, and reconciliation.',
    breadcrumbs: ['Dashboard', 'Banking'],
    actions: ['filter', 'export', 'import', 'add'],
  },
  '/time-tracking': {
    title: 'Time Tracking',
    subtitle: 'Track projects and logged hours.',
    breadcrumbs: ['Dashboard', 'Time Tracking'],
    actions: ['filter', 'export', 'import', 'add'],
  },
  '/accountant': {
    title: 'Accountant',
    subtitle: 'Accounting controls, journals, and chart of accounts.',
    breadcrumbs: ['Dashboard', 'Accountant'],
    actions: ['filter', 'export', 'import', 'add'],
  },
  '/reports': {
    title: 'Reports',
    subtitle: 'Explore financial and operational reports.',
    breadcrumbs: ['Dashboard', 'Reports'],
    actions: [],
  },
  '/documents': {
    title: 'Documents',
    subtitle: 'Organize and review business documents.',
    breadcrumbs: ['Dashboard', 'Documents'],
    actions: ['filter', 'export', 'import', 'add'],
  },
}

/** Breadcrumb label for each module prefix (matches SubPageTabs). */
const PREFIX_CRUMB: Record<string, string> = {
  '/sales': 'Sales',
  '/purchases': 'Purchases',
  '/items': 'Items',
  '/time-tracking': 'Time Tracking',
  '/accountant': 'Accountant',
  '/documents': 'Documents',
}

/** More specific Topbar subtitles for common list pages. */
const TAB_SUBTITLE_OVERRIDES: Partial<Record<string, string>> = {
  '/sales/customers': 'View and manage your customer list.',
  '/items/all': 'Default item type is Service for agency workflows.',
  '/items/price-lists': 'Custom pricing by customer and group.',
  '/items/inventory-adjustments': 'Track stock changes and corrections.',
}

function buildTabRouteMeta(): Record<string, RouteMeta> {
  const out: Record<string, RouteMeta> = {}
  for (const [prefix, tabs] of Object.entries(ROUTE_TABS)) {
    const base = ROUTE_META[prefix]
    if (!base) continue
    for (const tab of tabs) {
      out[tab.href] = {
        title: tab.label,
        subtitle: TAB_SUBTITLE_OVERRIDES[tab.href] ?? base.subtitle,
        breadcrumbs: ['Dashboard', PREFIX_CRUMB[prefix] ?? prefix, tab.label],
        actions: base.actions,
      }
    }
  }
  return out
}

const TAB_ROUTE_META = buildTabRouteMeta()

const TAB_ROUTE_KEYS_SORTED = Object.keys(TAB_ROUTE_META).sort((a, b) => b.length - a.length)

const PREFIXES = Object.keys(ROUTE_META).sort((a, b) => b.length - a.length)

function resolveRouteMetaNoNew(normalized: string): RouteMeta {
  if (normalized === '/' || normalized === '') return ROUTE_META['/home']

  const tabMatch = TAB_ROUTE_KEYS_SORTED.find((k) => normalized === k || normalized.startsWith(`${k}/`))
  if (tabMatch) return TAB_ROUTE_META[tabMatch]

  const match = PREFIXES.find((prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`))
  return (match ? ROUTE_META[match] : ROUTE_META['/home']) as RouteMeta
}

/**
 * Breadcrumb + title for Topbar. Uses tab labels for nested routes (e.g. Sales → Customers).
 */
export function getRouteMeta(pathname: string): RouteMeta {
  const normalized = pathname.replace(/\/$/, '') || '/'

  const newMatch = normalized.match(/^(.+)\/new$/)
  if (newMatch) {
    const parent = newMatch[1].replace(/\/$/, '') || '/'
    const pMeta = resolveRouteMetaNoNew(parent)
    const singular = pMeta.title.replace(/s$/, '')
    return {
      title: `New ${singular}`,
      subtitle: pMeta.subtitle,
      breadcrumbs: [...pMeta.breadcrumbs, 'New'],
      actions: pMeta.actions,
    }
  }

  return resolveRouteMetaNoNew(normalized)
}

export function getAddHref(pathname: string): string | null {
  if (pathname.startsWith('/sales/')) return `${pathname.replace(/\/$/, '')}/new`
  if (pathname.startsWith('/purchases/')) return `${pathname.replace(/\/$/, '')}/new`
  if (pathname.startsWith('/accountant/')) return `${pathname.replace(/\/$/, '')}/new`
  if (pathname.startsWith('/items/')) return '/items/new'
  if (pathname.startsWith('/time-tracking/projects')) return '/time-tracking/projects/new'
  if (pathname.startsWith('/documents')) return null
  if (pathname === '/sales') return '/sales/customers/new'
  if (pathname === '/purchases') return '/purchases/vendors/new'
  if (pathname === '/accountant') return '/accountant/manual-journals/new'
  if (pathname === '/items') return '/items/new'
  return null
}
