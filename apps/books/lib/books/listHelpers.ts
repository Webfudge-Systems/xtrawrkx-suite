import { normStatus } from '@/lib/mock-data/helpers'

export function matchesStatusTab<T extends Record<string, unknown>>(
  row: T,
  tabKey: string,
  statusKey: keyof T,
  groups: Record<string, string[]>
) {
  if (tabKey === 'all') return true
  const allowed = groups[tabKey]
  if (!allowed) return true
  return allowed.includes(normStatus(row[statusKey]))
}

export function countStatusTab<T extends Record<string, unknown>>(
  rows: T[],
  tabKey: string,
  statusKey: keyof T,
  groups: Record<string, string[]>
) {
  return rows.filter((row) => matchesStatusTab(row, tabKey, statusKey, groups)).length
}

export function statusFilterOptions(statuses: string[]) {
  return statuses.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))
}
