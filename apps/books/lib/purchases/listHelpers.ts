import { normStatus } from '@/lib/mock-data/helpers'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'

export function matchesPurchaseDocStatuses(
  row: PurchaseDocRow,
  tabKey: string,
  groups: Record<string, string[]>
) {
  if (tabKey === 'all') return true
  const allowed = groups[tabKey]
  if (!allowed) return true
  return allowed.includes(normStatus(row.status))
}

export function countPurchaseDocTab(
  rows: PurchaseDocRow[],
  tabKey: string,
  groups: Record<string, string[]>
) {
  return rows.filter((row) => matchesPurchaseDocStatuses(row, tabKey, groups)).length
}

export function purchaseDocStatusOptions(statuses: string[]) {
  return statuses.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
}
