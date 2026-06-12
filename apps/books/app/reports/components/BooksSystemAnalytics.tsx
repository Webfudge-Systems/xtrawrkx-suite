'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Banknote, Clock3, Landmark, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { Card, Select } from '@webfudge/ui'
import {
  BooksChartViewSwitcher,
  FinanceDualChart,
  FintechMetricsQuad,
  StackedBankCards,
  type BankCardDisplay,
} from '@webfudge/ui/book-components'
import BooksReportsCashFlowChart from './BooksReportsCashFlowChart'
import type { BankAccount, Expense, Invoice, Project, TimeEntry } from '@/lib/types'
import {
  MOCK_BANK_ACCOUNTS_LEGACY,
  MOCK_EXPENSES,
  MOCK_INVOICES,
  MOCK_PROJECTS,
  MOCK_TIME_ENTRIES,
} from '@/lib/mock-data'
import { formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import BooksReportsExpenseDonut from './BooksReportsExpenseDonut'
import {
  buildReportsAnalyticsArea,
  buildReportsCashFlowArea,
  buildReportsProfitLoss,
  buildTopExpenseSlices,
  timeRangeLabel,
  type ReportsTimeRange,
} from '../lib/reportChartData'

const REPORT_ROW_MAIN = 'h-[360px] min-h-[360px]'
const REPORT_ROW_SECONDARY = 'h-[320px] min-h-[320px]'

const BANK_GRADIENTS = [
  'bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400',
  'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950',
  'bg-gradient-to-br from-indigo-400 via-blue-400 to-sky-300',
  'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-400',
] as const

function monthTrend(current: number, previous: number): { label: string; direction: 'up' | 'down' } {
  if (previous === 0 && current === 0) return { label: '— vs prior', direction: 'up' }
  if (previous === 0) return { label: '↑ 100% vs prior', direction: 'up' }
  const raw = ((current - previous) / previous) * 100
  const pct = Math.min(999, Math.round(Math.abs(raw)))
  const up = raw >= 0
  return { label: `${up ? '↑' : '↓'} ${pct}% vs prior`, direction: up ? 'up' : 'down' }
}

export default function BooksSystemAnalytics() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState<ReportsTimeRange>('this_fiscal_year')

  const [invoices] = useState<Invoice[]>(MOCK_INVOICES)
  const [expenses] = useState<Expense[]>(MOCK_EXPENSES)
  const [timeEntries] = useState<TimeEntry[]>(MOCK_TIME_ENTRIES)
  const [projects] = useState<Project[]>(MOCK_PROJECTS)
  const [bankAccounts] = useState<BankAccount[]>(MOCK_BANK_ACCOUNTS_LEGACY)

  const analyticsAreaData = useMemo(
    () => buildReportsAnalyticsArea(invoices, timeRange),
    [invoices, timeRange]
  )
  const profitLossData = useMemo(
    () => buildReportsProfitLoss(invoices, expenses, timeRange),
    [expenses, invoices, timeRange]
  )
  const cashFlowAreaData = useMemo(
    () => buildReportsCashFlowArea(invoices, expenses, timeRange),
    [expenses, invoices, timeRange]
  )
  const topExpenseSlices = useMemo(
    () => buildTopExpenseSlices(expenses, timeRange),
    [expenses, timeRange]
  )

  const metrics = useMemo(() => {
    const totalReceivables = invoices.reduce(
      (sum, invoice) => sum + (invoice.balanceDue ?? invoice.total ?? 0),
      0
    )
    const totalPayables = expenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0)
    const totalIncome = profitLossData.reduce((sum, row) => sum + (row.profit ?? 0), 0)
    const totalExpense = profitLossData.reduce((sum, row) => sum + (row.loss ?? 0), 0)
    const netCash = totalIncome - totalExpense
    const unbilledHours = timeEntries
      .filter((t) => t.billable && !t.invoiced)
      .reduce((sum, t) => sum + t.hours, 0)
    const unbilledExpenses = expenses.filter((e) => e.billable).reduce((sum, e) => sum + e.amount, 0)

    const incomeTrend = monthTrend(
      profitLossData.slice(-1)[0]?.profit ?? 0,
      profitLossData.slice(-2)[0]?.profit ?? 0
    )
    const expenseTrend = monthTrend(
      profitLossData.slice(-1)[0]?.loss ?? 0,
      profitLossData.slice(-2)[0]?.loss ?? 0
    )

    return {
      totalReceivables,
      totalPayables,
      totalIncome,
      totalExpense,
      netCash,
      unbilledHours,
      unbilledExpenses,
      incomeTrend,
      expenseTrend,
    }
  }, [expenses, invoices, profitLossData, timeEntries])

  const fintechItems = useMemo(
    () => [
      {
        title: 'Receivables',
        value: formatSalesMoney(metrics.totalReceivables),
        trendLabel: 'Current + overdue',
        trendDirection: 'up' as const,
        icon: Receipt,
        highlight: true,
      },
      {
        title: 'Payables',
        value: formatSalesMoney(metrics.totalPayables),
        trendLabel: 'Vendor & bill spend',
        trendDirection: 'down' as const,
        icon: Wallet,
      },
      {
        title: 'Net cash',
        value: formatSalesMoney(metrics.netCash),
        trendLabel: metrics.netCash >= 0 ? 'Positive movement' : 'Negative movement',
        trendDirection: (metrics.netCash >= 0 ? 'up' : 'down') as 'up' | 'down',
        icon: TrendingUp,
      },
      {
        title: 'Unbilled',
        value: `${metrics.unbilledHours.toFixed(1)}h`,
        trendLabel: formatSalesMoney(metrics.unbilledExpenses),
        trendDirection: 'up' as const,
        icon: Clock3,
      },
    ],
    [metrics]
  )

  const topProjects = useMemo(
    () =>
      projects.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
      })),
    [projects]
  )

  const bankCards = useMemo<BankCardDisplay[]>(
    () =>
      [...bankAccounts]
        .sort((a, b) => (b.balance ?? 0) - (a.balance ?? 0))
        .slice(0, 4)
        .map((acc, idx) => ({
          id: String(acc.id),
          bankName: acc.name,
          maskedNumber: `₹ ${formatSalesMoney(acc.balance ?? 0).replace('₹', '').trim()}`,
          expiry: acc.type ?? 'Account',
          gradientClassName: BANK_GRADIENTS[idx % BANK_GRADIENTS.length],
        })),
    [bankAccounts]
  )

  const timeRangeOptions = useMemo(
    () => [
      { value: 'this_fiscal_year', label: 'This Fiscal Year' },
      { value: 'previous_fiscal_year', label: 'Previous Fiscal Year' },
      { value: 'last_12_months', label: 'Last 12 Months' },
    ],
    []
  )

  const marginPct =
    metrics.totalIncome > 0
      ? Math.round(((metrics.totalIncome - metrics.totalExpense) / metrics.totalIncome) * 100)
      : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/reports"
            className="rounded-full border border-[color:var(--books-border,rgba(255,255,255,0.12))] bg-[var(--books-bg-elevated,#252830)] px-3 py-1.5 font-semibold text-[var(--books-orange-text,#fb923c)] transition-colors hover:bg-[var(--books-bg-card,#1e2128)]"
          >
            Profit &amp; loss
          </Link>
          <Link
            href="/documents"
            className="rounded-full border border-[color:var(--books-border,rgba(255,255,255,0.12))] bg-[var(--books-bg-elevated,#252830)] px-3 py-1.5 font-semibold text-[var(--books-text-secondary,#9ca3af)] transition-colors hover:text-[var(--books-text-primary,#f0f0f0)]"
          >
            Document vault
          </Link>
          <span className="rounded-full border border-dashed border-[color:var(--books-border,rgba(255,255,255,0.12))] px-3 py-1.5 text-[var(--books-text-tertiary,#6b7280)]">
            Balance sheet · soon
          </span>
        </div>
        <div className="w-56">
          <Select
            value={timeRange}
            options={timeRangeOptions}
            onChange={(v: string) => setTimeRange(v as ReportsTimeRange)}
            className="!border-[color:var(--books-border,rgba(255,255,255,0.12))] !bg-[var(--books-bg-card,#1e2128)] !text-[var(--books-text-primary,#f0f0f0)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={`min-h-0 xl:col-span-8 ${REPORT_ROW_MAIN}`}>
          <BooksChartViewSwitcher
            className="h-full w-full"
            salesValue={formatSalesMoney(metrics.totalIncome)}
            salesSubLabel="revenue"
            salesTrendLabel={metrics.incomeTrend.label}
            salesTrendPositive={metrics.incomeTrend.direction === 'up'}
            conversionValue={`${marginPct}%`}
            conversionSubLabel="margin"
            conversionTrendLabel={metrics.expenseTrend.label}
            conversionTrendPositive={metrics.expenseTrend.direction === 'down'}
            analyticsData={analyticsAreaData}
            profitLossData={profitLossData}
            defaultView="pl"
            plHeaderTitle="Revenue & spend"
            plSubtitle="Income vs expenses for the selected period"
            sectionTitle="Profit and loss"
            profitLabel="Income"
            lossLabel="Expense"
            periodLabel={timeRangeLabel(timeRange)}
          />
        </div>

        <div className={`min-h-0 xl:col-span-4 ${REPORT_ROW_MAIN}`}>
          <FintechMetricsQuad items={fintechItems} className="h-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={`min-h-0 xl:col-span-7 ${REPORT_ROW_SECONDARY}`}>
          <BooksReportsCashFlowChart
            className="h-full"
            data={cashFlowAreaData}
            netCash={metrics.netCash}
            totalIncome={metrics.totalIncome}
            totalExpense={metrics.totalExpense}
            periodLabel={timeRangeLabel(timeRange)}
            incomeTrendLabel={metrics.incomeTrend.label}
            expenseTrendLabel={metrics.expenseTrend.label}
          />
        </div>

        <div className={`min-h-0 xl:col-span-5 ${REPORT_ROW_SECONDARY}`}>
          <BooksReportsExpenseDonut slices={topExpenseSlices} className="h-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <FinanceDualChart
          className="h-full min-h-[300px]"
          title="Income vs expense"
          subtitle="Monthly stacked comparison for the selected period"
          sectionTitle="Monthly bars"
          profitLabel="Income"
          lossLabel="Expense"
          data={profitLossData}
        />

        <Card
          variant="elevated"
          padding={false}
          surface="books"
          className="flex min-h-[300px] flex-col overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[color:var(--books-border,rgba(255,255,255,0.08))] p-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--books-text-primary,#f0f0f0)]">Projects</h2>
              <p className="mt-1 text-sm text-[var(--books-text-secondary,#9ca3af)]">
                Billable work not yet invoiced
              </p>
            </div>
            <Landmark className="h-5 w-5 text-[var(--books-orange-text,#fb923c)]" aria-hidden />
          </div>

          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[color:var(--books-border,rgba(255,255,255,0.08))] bg-[var(--books-bg-elevated,#252830)] p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--books-text-secondary,#9ca3af)]">
                  <Clock3 className="h-4 w-4" />
                  Unbilled hours
                </div>
                <p className="mt-2 text-xl font-semibold tabular-nums text-[var(--books-text-primary,#f0f0f0)]">
                  {metrics.unbilledHours.toFixed(1)}h
                </p>
              </div>
              <div className="rounded-xl border border-[color:var(--books-border,rgba(255,255,255,0.08))] bg-[var(--books-bg-elevated,#252830)] p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--books-text-secondary,#9ca3af)]">
                  <Banknote className="h-4 w-4" />
                  Unbilled expenses
                </div>
                <p className="mt-2 text-xl font-semibold tabular-nums text-[var(--books-text-primary,#f0f0f0)]">
                  {formatSalesMoney(metrics.unbilledExpenses)}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--books-text-tertiary,#6b7280)]">
                Active projects
              </h3>
              {topProjects.length === 0 ? (
                <p className="py-4 text-center text-sm text-[var(--books-text-tertiary,#6b7280)]">
                  No projects yet
                </p>
              ) : (
                <div className="space-y-2">
                  {topProjects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-[var(--books-bg-elevated,#252830)]"
                    >
                      <span className="min-w-0 truncate text-[var(--books-text-secondary,#9ca3af)]">
                        {p.name}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--books-text-tertiary,#6b7280)]">
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className={`${REPORT_ROW_SECONDARY}`}>
        <StackedBankCards
          className="h-full"
          title="Bank & credit accounts"
          cards={bankCards}
          addNewLabel="Add account"
          onAddNew={() => router.push('/banking')}
        />
      </div>
    </div>
  )
}
