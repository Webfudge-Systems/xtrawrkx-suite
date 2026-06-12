import type { AnalyticsAreaPoint, ProfitLossMonth } from '@webfudge/ui/book-components'
import { parseIndianCurrency } from '@/lib/formatCurrency'
import type { BankAccountRow } from '@/lib/mock-data/banking'
import type { SalesInvoiceRow } from '@/lib/mock-data/sales/seeds'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'

export type IncomeChartInvoice = { date?: string; total?: number }

export function toIncomeChartInvoices(
  invoices: Array<{ date?: string; amount?: number; total?: number }>
): IncomeChartInvoice[] {
  return invoices.map((inv) => ({
    date: inv.date,
    total: inv.amount ?? inv.total ?? 0,
  }))
}

export function sumBankAccountBalances(accounts: BankAccountRow[]): number {
  return accounts.reduce((sum, row) => sum + (row.balance ?? 0), 0)
}

export function sumInvoicedAmountInMonth(
  invoices: SalesInvoiceRow[],
  year: number,
  month: number
): number {
  return invoices.reduce((sum, inv) => {
    if (!inv.date) return sum
    const d = new Date(inv.date)
    if (d.getFullYear() !== year || d.getMonth() !== month) return sum
    return sum + (inv.amount ?? 0)
  }, 0)
}

export function sumExpenseAmountInMonth(
  expenses: PurchaseDocRow[],
  year: number,
  month: number
): number {
  return expenses.reduce((sum, row) => {
    if (!row.date) return sum
    const d = new Date(row.date)
    if (d.getFullYear() !== year || d.getMonth() !== month) return sum
    return sum + (parseIndianCurrency(row.amount) ?? 0)
  }, 0)
}

/** Estimate prior-month bank total from current balances and this-month cash flow. */
export function estimatePriorMonthBankTotal(
  accounts: BankAccountRow[],
  invoices: SalesInvoiceRow[],
  expenses: PurchaseDocRow[],
  referenceDate = new Date()
): number {
  const current = sumBankAccountBalances(accounts)
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()

  const incomeThisMonth = sumInvoicedAmountInMonth(invoices, year, month)
  const expenseThisMonth = sumExpenseAmountInMonth(expenses, year, month)

  return Math.max(0, current - incomeThisMonth + expenseThisMonth)
}

export function formatBalanceTrendLabel(
  current: number,
  previous: number
): { label: string; positive: boolean } {
  if (previous === 0 && current === 0) {
    return { label: 'No change from last month', positive: true }
  }
  if (previous === 0) {
    return { label: '+ 100% than last month', positive: true }
  }
  const raw = ((current - previous) / previous) * 100
  const positive = raw >= 0
  const pct = Math.min(999, Math.round(Math.abs(raw)))
  return {
    label: `${positive ? '+' : '-'} ${pct}% than last month`,
    positive,
  }
}

export function buildAnalyticsAreaMonthlyFromInvoices(
  invoices: SalesInvoiceRow[]
): AnalyticsAreaPoint[] {
  const result: AnalyticsAreaPoint[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    const amount = sumInvoicedAmountInMonth(invoices, year, month)
    result.push({ month: label, amount })
  }
  return result
}

export function buildProfitLossMonthlyFromLive(
  invoices: SalesInvoiceRow[],
  expenses: PurchaseDocRow[]
): ProfitLossMonth[] {
  const result: ProfitLossMonth[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const year = d.getFullYear()
    const month = d.getMonth()
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    result.push({
      month: label,
      profit: sumInvoicedAmountInMonth(invoices, year, month),
      loss: sumExpenseAmountInMonth(expenses, year, month),
    })
  }
  return result
}

export function sumInvoiceTotals(invoices: SalesInvoiceRow[]): number {
  return invoices.reduce((sum, inv) => sum + (inv.amount ?? 0), 0)
}

export function sumReceivables(invoices: SalesInvoiceRow[]): number {
  return invoices.reduce((sum, inv) => sum + (inv.balance ?? inv.amount ?? 0), 0)
}

export function sumAllExpenseAmounts(expenses: PurchaseDocRow[]): number {
  return expenses.reduce((sum, row) => sum + (parseIndianCurrency(row.amount) ?? 0), 0)
}
