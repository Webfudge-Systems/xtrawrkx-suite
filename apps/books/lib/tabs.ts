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

/** If the route is exactly a module root (e.g. /sales), return its first child tab href. */
export function getDefaultTabHref(pathname: string): string | null {
  const exact = Object.keys(ROUTE_TABS).find((prefix) => pathname === prefix)
  if (!exact) return null
  const first = ROUTE_TABS[exact]?.[0]?.href
  if (!first) return null
  const a = pathname.replace(/\/$/, '') || '/'
  const b = first.replace(/\/$/, '') || '/'
  if (a === b) return null
  return first
}
