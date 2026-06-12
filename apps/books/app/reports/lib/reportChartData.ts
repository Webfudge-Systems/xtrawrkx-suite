import type { AnalyticsAreaPoint, ProfitLossMonth } from '@webfudge/ui/book-components'
import type { Expense, Invoice } from '@/lib/types'

export type ReportsTimeRange = 'this_fiscal_year' | 'previous_fiscal_year' | 'last_12_months'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

function inTimeRange(dateStr: string | undefined, range: ReportsTimeRange): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  const y = d.getFullYear()
  const m = d.getMonth()

  if (range === 'last_12_months') {
    const cutoff = new Date(now)
    cutoff.setMonth(cutoff.getMonth() - 11)
    cutoff.setDate(1)
    cutoff.setHours(0, 0, 0, 0)
    return d >= cutoff
  }

  const fiscalStartYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  const targetYear = range === 'this_fiscal_year' ? fiscalStartYear : fiscalStartYear - 1
  const fiscalMonth = (m + 9) % 12
  const fiscalYear = m >= 3 ? y : y - 1
  return fiscalYear === targetYear
}

export function buildReportsAnalyticsArea(invoices: Invoice[], range: ReportsTimeRange): AnalyticsAreaPoint[] {
  const buckets = new Map<string, number>()
  for (const inv of invoices) {
    if (!inTimeRange(inv.date, range)) continue
    const d = new Date(inv.date!)
    const key = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    buckets.set(key, (buckets.get(key) ?? 0) + (inv.total ?? 0))
  }

  if (buckets.size === 0) {
    return MONTH_LABELS.slice(0, 8).map((month) => ({ month, amount: 0 }))
  }

  return Array.from(buckets.entries()).map(([month, amount]) => ({ month, amount }))
}

export function buildReportsProfitLoss(
  invoices: Invoice[],
  expenses: Expense[],
  range: ReportsTimeRange
): ProfitLossMonth[] {
  const buckets = new Map<string, { profit: number; loss: number }>()

  for (const inv of invoices) {
    if (!inTimeRange(inv.date, range)) continue
    const label = new Date(inv.date!).toLocaleDateString('en-US', { month: 'short' })
    const row = buckets.get(label) ?? { profit: 0, loss: 0 }
    row.profit += inv.total ?? 0
    buckets.set(label, row)
  }

  for (const exp of expenses) {
    if (!inTimeRange(exp.date, range)) continue
    const label = new Date(exp.date!).toLocaleDateString('en-US', { month: 'short' })
    const row = buckets.get(label) ?? { profit: 0, loss: 0 }
    row.loss += exp.amount ?? 0
    buckets.set(label, row)
  }

  if (buckets.size === 0) {
    return MONTH_LABELS.slice(0, 6).map((month) => ({ month, profit: 0, loss: 0 }))
  }

  return Array.from(buckets.entries()).map(([month, { profit, loss }]) => ({ month, profit, loss }))
}

export function buildReportsCashFlowArea(
  invoices: Invoice[],
  expenses: Expense[],
  range: ReportsTimeRange
): AnalyticsAreaPoint[] {
  const pl = buildReportsProfitLoss(invoices, expenses, range)
  return pl.map((row) => ({
    month: row.month.toUpperCase(),
    amount: (row.profit ?? 0) - (row.loss ?? 0),
  }))
}

export type ExpenseSlice = { name: string; value: number }

export function buildTopExpenseSlices(expenses: Expense[], range: ReportsTimeRange): ExpenseSlice[] {
  const grouped = expenses.reduce<Record<string, number>>((acc, item) => {
    if (!inTimeRange(item.date, range)) return acc
    const key = item.category || 'Other'
    acc[key] = (acc[key] ?? 0) + (item.amount ?? 0)
    return acc
  }, {})

  const sorted = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  if (sorted.length > 0) return sorted

  return [
    { name: 'Software', value: 35 },
    { name: 'Subcontractor', value: 30 },
    { name: 'Marketing', value: 20 },
    { name: 'Travel', value: 15 },
  ]
}

export function timeRangeLabel(range: ReportsTimeRange): string {
  if (range === 'previous_fiscal_year') return 'Previous fiscal year'
  if (range === 'last_12_months') return 'Last 12 months'
  return 'This fiscal year'
}
