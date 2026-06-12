export type TabItem = { label: string; href: string }

export const ROUTE_TABS: Record<string, TabItem[]> = {
  '/sales': [
    { label: 'Customers', href: '/sales/customers' },
    { label: 'Estimates', href: '/sales/estimates' },
    { label: 'Retainer Invoices', href: '/sales/retainer-invoices' },
    { label: 'Sales Orders', href: '/sales/sales-orders' },
    { label: 'Delivery Challans', href: '/sales/delivery-challans' },
    { label: 'Invoices', href: '/sales/invoices' },
    { label: 'Payments Received', href: '/sales/payments-received' },
    { label: 'Recurring Invoices', href: '/sales/recurring-invoices' },
    { label: 'Credit Notes', href: '/sales/credit-notes' },
  ],
  '/purchases': [
    { label: 'Vendors', href: '/purchases/vendors' },
    { label: 'Expenses', href: '/purchases/expenses' },
    { label: 'Recurring Expenses', href: '/purchases/recurring-expenses' },
    { label: 'Purchase Orders', href: '/purchases/purchase-orders' },
    { label: 'Bills', href: '/purchases/bills' },
    { label: 'Payments Made', href: '/purchases/payments-made' },
    { label: 'Recurring Bills', href: '/purchases/recurring-bills' },
    { label: 'Vendor Credits', href: '/purchases/vendor-credits' },
  ],
  '/items': [
    { label: 'All Items', href: '/items/all' },
    { label: 'Price Lists', href: '/items/price-lists' },
    { label: 'Inventory Adjustments', href: '/items/inventory-adjustments' },
  ],
  '/time-tracking': [
    { label: 'Projects', href: '/time-tracking/projects' },
    { label: 'Timesheet', href: '/time-tracking/timesheet' },
  ],
  '/accountant': [
    { label: 'Manual Journals', href: '/accountant/manual-journals' },
    { label: 'Bulk Update', href: '/accountant/bulk-update' },
    { label: 'Currency Adjustments', href: '/accountant/currency-adjustments' },
    { label: 'Chart of Accounts', href: '/accountant/chart-of-accounts' },
    { label: 'Transaction Locking', href: '/accountant/transaction-locking' },
  ],
  '/documents': [
    { label: 'All Documents', href: '/documents' },
    { label: 'Bank Statements', href: '/documents/bank-statements' },
  ],
}

const NO_TABS_PREFIXES = ['/home', '/', '/banking', '/reports', '/login', '/unauthorized']

export function getTabsForRoute(pathname: string): TabItem[] {
  if (NO_TABS_PREFIXES.includes(pathname)) return []
  const prefixes = Object.keys(ROUTE_TABS).sort((a, b) => b.length - a.length)
  const match = prefixes.find((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  return match ? ROUTE_TABS[match] ?? [] : []
}

/** True when `pathname` is the tab route or a child of it (e.g. /items/all/5 → All Items tab). */
export function isBooksTabActive(
  pathname: string,
  href: string,
  searchParams?: { get: (key: string) => string | null } | null
): boolean {
  const normalizedPath = pathname.replace(/\/$/, '') || '/'
  const [pathOnly, queryPart] = href.split('?')
  const normalizedHref = pathOnly.replace(/\/$/, '') || '/'

  if (queryPart) {
    if (normalizedPath !== normalizedHref) return false
    const q = new URLSearchParams(queryPart)
    return Array.from(q.entries()).every(([k, v]) => searchParams?.get(k) === v)
  }

  if (normalizedHref === '/home') {
    return normalizedPath === '/home' || normalizedPath === '/'
  }

  if (normalizedPath === normalizedHref) return true
  return normalizedPath.startsWith(`${normalizedHref}/`)
}

/** Module roots that only exist to redirect into their first tab (no standalone hub UI). */
export const MODULE_TAB_ROOTS = ['/sales', '/purchases', '/items', '/time-tracking', '/accountant'] as const

export function getDefaultTabForModule(prefix: string): string | null {
  const tabs = ROUTE_TABS[prefix]
  if (!tabs?.length) return null
  const first = tabs[0].href.replace(/\/$/, '') || '/'
  const normalizedPrefix = prefix.replace(/\/$/, '') || '/'
  if (first === normalizedPrefix) return null
  return tabs[0].href
}

/** If the route is exactly a module root (e.g. /sales), return its first child tab href. */
export function getDefaultTabHref(pathname: string): string | null {
  const normalized = pathname.replace(/\/$/, '') || '/'
  return getDefaultTabForModule(normalized)
}
