import { normStatus } from '@/lib/mock-data/helpers'
import type { SalesDocRow } from '@/lib/mock-data/sales/seeds'

export function matchesSalesDocStatuses(row: SalesDocRow, tabKey: string, groups: Record<string, string[]>) {
  if (tabKey === 'all') return true
  const allowed = groups[tabKey]
  if (!allowed) return true
  return allowed.includes(normStatus(row.status))
}

export function countSalesDocTab(rows: SalesDocRow[], tabKey: string, groups: Record<string, string[]>) {
  return rows.filter((row) => matchesSalesDocStatuses(row, tabKey, groups)).length
}

export function salesDocStatusOptions(statuses: string[]) {
  return statuses.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
}
