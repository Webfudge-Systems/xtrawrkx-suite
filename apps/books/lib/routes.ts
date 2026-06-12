import { ROUTE_TABS } from './tabs'

export type HeaderAction = 'filter' | 'export' | 'import' | 'add'

export type BreadcrumbItem = {
  label: string
  href: string | null
}

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
  '/purchases/vendors': 'Manage vendors, expenses, and payables.',
  '/time-tracking/projects': 'Track projects and logged hours.',
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
      // Skip module hub crumb (Dashboard → Customers, not Dashboard → Sales → Customers).
      const breadcrumbs =
        prefix === '/documents'
          ? ['Dashboard', PREFIX_CRUMB[prefix] ?? prefix, tab.label]
          : ['Dashboard', tab.label]
      out[tab.href] = {
        title: tab.label,
        subtitle: TAB_SUBTITLE_OVERRIDES[tab.href] ?? base.subtitle,
        breadcrumbs,
        actions: base.actions,
      }
    }
  }
  return out
}

const TAB_ROUTE_META = buildTabRouteMeta()

const TAB_LABEL_HREFS: Record<string, string> = {}
for (const tabs of Object.values(ROUTE_TABS)) {
  for (const tab of tabs) {
    TAB_LABEL_HREFS[tab.label] = tab.href
  }
}

const TAB_ROUTE_KEYS_SORTED = Object.keys(TAB_ROUTE_META).sort((a, b) => b.length - a.length)

const PREFIXES = Object.keys(ROUTE_META).sort((a, b) => b.length - a.length)

/** Item/price-list/adjustment detail, edit, and module create routes use in-page header only. */
export function isBooksEntityPage(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'
  if (/^\/items\/all\/\d+$/.test(normalized)) return true
  if (/^\/items\/all\/\d+\/edit$/.test(normalized)) return true
  if (/^\/items\/price-lists\/\d+$/.test(normalized)) return true
  if (/^\/items\/price-lists\/\d+\/edit$/.test(normalized)) return true
  if (/^\/items\/inventory-adjustments\/\d+$/.test(normalized)) return true
  if (/^\/items\/inventory-adjustments\/\d+\/edit$/.test(normalized)) return true
  if (/^\/items\/[^/]+\/new$/.test(normalized)) return true
  if (/^\/banking\/\d+$/.test(normalized)) return true
  if (/^\/banking\/\d+\/edit$/.test(normalized)) return true
  if (normalized === '/banking/new') return true
  if (/^\/sales\/customers\/\d+$/.test(normalized)) return true
  if (/^\/sales\/customers\/\d+\/edit$/.test(normalized)) return true
  if (/^\/sales\/invoices\/\d+$/.test(normalized)) return true
  if (/^\/sales\/invoices\/\d+\/edit$/.test(normalized)) return true
  if (/^\/sales\/(estimates|retainer-invoices|sales-orders|delivery-challans|recurring-invoices|payments-received|credit-notes)\/\d+$/.test(normalized)) return true
  if (/^\/sales\/(estimates|retainer-invoices|sales-orders|delivery-challans|recurring-invoices|payments-received|credit-notes)\/\d+\/edit$/.test(normalized)) return true
  if (/^\/sales\/[^/]+\/new$/.test(normalized)) return true
  if (/^\/purchases\/vendors\/\d+$/.test(normalized)) return true
  if (/^\/purchases\/vendors\/\d+\/edit$/.test(normalized)) return true
  if (/^\/purchases\/(expenses|recurring-expenses|purchase-orders|bills|payments-made|recurring-bills|vendor-credits)\/\d+$/.test(normalized)) return true
  if (/^\/purchases\/(expenses|recurring-expenses|purchase-orders|bills|payments-made|recurring-bills|vendor-credits)\/\d+\/edit$/.test(normalized)) return true
  if (/^\/purchases\/[^/]+\/new$/.test(normalized)) return true
  if (/^\/time-tracking\/projects\/\d+$/.test(normalized)) return true
  if (/^\/time-tracking\/projects\/\d+\/edit$/.test(normalized)) return true
  if (/^\/time-tracking\/timesheet\/\d+$/.test(normalized)) return true
  if (/^\/time-tracking\/timesheet\/\d+\/edit$/.test(normalized)) return true
  if (/^\/time-tracking\/[^/]+\/new$/.test(normalized)) return true
  if (/^\/accountant\/(manual-journals|bulk-update|currency-adjustments|chart-of-accounts|transaction-locking)\/\d+$/.test(normalized)) return true
  if (/^\/accountant\/(manual-journals|bulk-update|currency-adjustments|chart-of-accounts|transaction-locking)\/\d+\/edit$/.test(normalized)) return true
  if (/^\/accountant\/[^/]+\/new$/.test(normalized)) return true
  if (/^\/documents\/\d+$/.test(normalized)) return true
  if (/^\/documents\/bank-statements\/\d+$/.test(normalized)) return true
  return false
}

function resolveRouteMetaNoNew(normalized: string): RouteMeta {
  if (normalized === '/' || normalized === '') return ROUTE_META['/home']

  const itemEditMatch = normalized.match(/^\/items\/all\/(\d+)\/edit$/)
  if (itemEditMatch) {
    return {
      title: 'Edit Item',
      subtitle: 'Update catalog details and pricing.',
      breadcrumbs: ['Dashboard', 'All Items', 'Edit'],
      actions: [],
    }
  }

  const itemDetailMatch = normalized.match(/^\/items\/all\/(\d+)$/)
  if (itemDetailMatch) {
    return {
      title: 'Item Details',
      subtitle: 'View catalog item profile and pricing.',
      breadcrumbs: ['Dashboard', 'All Items', 'Details'],
      actions: [],
    }
  }

  const priceListEditMatch = normalized.match(/^\/items\/price-lists\/(\d+)\/edit$/)
  if (priceListEditMatch) {
    return {
      title: 'Edit Price List',
      subtitle: 'Update pricing rules and notes.',
      breadcrumbs: ['Dashboard', 'Price Lists', 'Edit'],
      actions: [],
    }
  }

  const priceListDetailMatch = normalized.match(/^\/items\/price-lists\/(\d+)$/)
  if (priceListDetailMatch) {
    return {
      title: 'Price List Details',
      subtitle: 'View custom pricing rules and status.',
      breadcrumbs: ['Dashboard', 'Price Lists', 'Details'],
      actions: [],
    }
  }

  const adjustmentEditMatch = normalized.match(/^\/items\/inventory-adjustments\/(\d+)\/edit$/)
  if (adjustmentEditMatch) {
    return {
      title: 'Edit Adjustment',
      subtitle: 'Update stock correction details and notes.',
      breadcrumbs: ['Dashboard', 'Inventory Adjustments', 'Edit'],
      actions: [],
    }
  }

  const adjustmentDetailMatch = normalized.match(/^\/items\/inventory-adjustments\/(\d+)$/)
  if (adjustmentDetailMatch) {
    return {
      title: 'Adjustment Details',
      subtitle: 'View inventory correction profile.',
      breadcrumbs: ['Dashboard', 'Inventory Adjustments', 'Details'],
      actions: [],
    }
  }

  const bankEditMatch = normalized.match(/^\/banking\/(\d+)\/edit$/)
  if (bankEditMatch) {
    return {
      title: 'Edit Account',
      subtitle: 'Update account details and feed status.',
      breadcrumbs: ['Dashboard', 'Banking', 'Edit'],
      actions: [],
    }
  }

  const bankDetailMatch = normalized.match(/^\/banking\/(\d+)$/)
  if (bankDetailMatch) {
    return {
      title: 'Account Details',
      subtitle: 'View balances, feed status, and sync history.',
      breadcrumbs: ['Dashboard', 'Banking', 'Details'],
      actions: [],
    }
  }

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

const HOME_CRUMB_HREFS: Record<string, string> = {
  Activity: '/home/activity',
  'Recent Updates': '/home/recent-updates',
}

/** Clickable breadcrumb trail for Topbar navigation. Last crumb has `href: null`. */
export function getBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const meta = getRouteMeta(pathname)

  return meta.breadcrumbs.map((label, index) => {
    const isLast = index === meta.breadcrumbs.length - 1
    if (isLast) return { label, href: null }

    if (label === 'Dashboard') return { label, href: '/home' }

    const homeHref = HOME_CRUMB_HREFS[label]
    if (homeHref) return { label, href: homeHref }

    const tabHref = TAB_LABEL_HREFS[label]
    if (tabHref) return { label, href: tabHref }

    if (label === 'Documents') return { label, href: '/documents' }

    return { label, href: null }
  })
}

export function getAddHref(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, '') || '/'

  if (normalized.endsWith('/new')) return null

  const withNew = (base: string) => `${base.replace(/\/$/, '')}/new`

  if (normalized.startsWith('/sales/')) return withNew(normalized)
  if (normalized.startsWith('/purchases/')) return withNew(normalized)
  if (normalized.startsWith('/accountant/')) return withNew(normalized)
  if (normalized.startsWith('/items/')) return withNew(normalized)
  if (normalized.startsWith('/sales/')) return withNew(normalized)
  if (normalized.startsWith('/time-tracking/projects')) return '/time-tracking/projects/new'
  if (normalized.startsWith('/documents')) return null
  if (normalized === '/sales') return '/sales/customers/new'
  if (normalized === '/purchases') return '/purchases/vendors/new'
  if (normalized === '/accountant') return '/accountant/manual-journals/new'
  if (normalized === '/items') return '/items/all/new'
  if (normalized === '/banking') return '/banking/new'
  if (normalized === '/sales') return '/sales/customers/new'
  return null
}
