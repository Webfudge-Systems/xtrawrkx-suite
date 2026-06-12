export function normStatus(value: unknown): string {
  return String(value ?? '').toLowerCase()
}

export function countWhere<T>(rows: T[], predicate: (row: T) => boolean): number {
  return rows.filter(predicate).length
}

export function countByStatuses<T extends Record<string, unknown>>(
  rows: T[],
  statusKey: keyof T,
  statuses: string[]
): number {
  const normalized = statuses.map(normStatus)
  return countWhere(rows, (row) => normalized.includes(normStatus(row[statusKey])))
}
