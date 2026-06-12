'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Briefcase,
  Building2,
  Coins,
  FileText,
  Receipt,
  ScrollText,
  ShoppingBag,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { formatCurrency } from '@webfudge/utils'
import { formatKpiIndianCurrency, formatKpiIndianCurrencyFull } from '@/lib/formatCurrency'
import {
  BOOKS_BALANCE_CURRENCIES,
  formatBooksBalanceDisplay,
  formatBooksBalanceFull,
} from '@/lib/currency/exchangeRates'
import { KPICard } from '@webfudge/ui'
import {
  BooksChartViewSwitcher,
  BooksQuickAccessCard,
  RecentActivitiesTable,
  TotalBalanceCard,
} from '@webfudge/ui/book-components'
import type { BooksQuickAccessShortcut } from '@webfudge/ui/book-components'
import type { ActivityTableRow } from '@webfudge/ui/book-components'
import type { TimeEntry } from '@/lib/types'
import { MOCK_TIME_ENTRIES } from '@/lib/mock-data'
import {
  buildAnalyticsAreaMonthlyFromInvoices,
  buildProfitLossMonthlyFromLive,
  estimatePriorMonthBankTotal,
  formatBalanceTrendLabel,
  sumAllExpenseAmounts,
  sumBankAccountBalances,
  sumExpenseAmountInMonth,
  sumInvoiceTotals,
  sumInvoicedAmountInMonth,
  sumReceivables,
  toIncomeChartInvoices,
} from '@/lib/home/dashboardMetrics'
import {
  useBooksActivityLog,
  type BooksActivityAction,
  type BooksActivityEntry,
} from '@/lib/mock-data/booksActivityLog'
import { useBooksItemsStore } from '@/lib/mock-data/useBooksItemsStore'
import BooksSpendingOverviewPanel from '@/app/_components/BooksSpendingOverviewPanel'
import BooksWalletPanel from '@/app/_components/BooksWalletPanel'
import { useBooksBankAccountsStore } from '@/lib/mock-data/useBooksBankAccountsStore'
import { useBooksExpensesStore } from '@/lib/mock-data/purchases/stores'
import { useBooksSalesInvoicesStore } from '@/lib/mock-data/sales/stores'
import type { SalesInvoiceRow } from '@/lib/mock-data/sales/seeds'
import type { LucideIcon } from 'lucide-react'

const ACTIVITY_ACTION_LABEL: Record<BooksActivityAction, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
}

const ACTIVITY_ACTION_STATUS: Record<BooksActivityAction, ActivityTableRow['status']> = {
  created: 'completed',
  updated: 'in_progress',
  deleted: 'pending',
}

function activityModuleIcon(module: string): LucideIcon {
  const m = module.toLowerCase()
  if (m.includes('invoice') || m.includes('estimate') || m.includes('challan')) return FileText
  if (m.includes('customer')) return Users
  if (m.includes('vendor')) return Building2
  if (m.includes('expense') || m.includes('bill') || m.includes('payment')) return Receipt
  if (m.includes('item') || m.includes('price') || m.includes('inventory')) return ShoppingBag
  if (m.includes('bank')) return Wallet
  if (m.includes('project') || m.includes('time')) return Briefcase
  return ScrollText
}

function mapActivityEntryToRow(entry: BooksActivityEntry): ActivityTableRow {
  return {
    id: entry.id,
    orderId: entry.module.toUpperCase().replace(/\s+/g, '_'),
    activityLabel: `${ACTIVITY_ACTION_LABEL[entry.action]} ${entry.entityLabel}`,
    Icon: activityModuleIcon(entry.module),
    priceLabel: entry.amount != null ? formatCurrency(entry.amount) : '—',
    status: ACTIVITY_ACTION_STATUS[entry.action],
    dateLabel: formatActivityRowDate(entry.at),
    customerLabel: entry.module,
    dueDateLabel: '—',
    balanceLabel: entry.action === 'deleted' ? 'Removed' : '—',
  }
}

/** Equal-height rows for wireframe-aligned dashboard grid */
const HOME_ROW_INCOME = 'h-[320px] min-h-[320px]'
const HOME_ROW_MID = 'h-[300px] min-h-[300px]'
const HOME_ROW_BOTTOM = 'h-[340px] min-h-[340px]'
const HOME_QUICK_ACCESS_HEIGHT = 'xl:h-[calc(320px+1.5rem+300px)] xl:min-h-[calc(320px+1.5rem+300px)]'

/** Map MoM trend to `KPICard` `change` / `changeType` (CRM-style footer). */
function trendToKpiProps(
  trend: { text: string; up: boolean },
  /** Payables: higher spend → red (treat like "decrease" sentiment in UI). */
  invertSentiment?: boolean
): {
  change?: string
  changeType: 'increase' | 'decrease'
  subtitle?: string
} {
  const t = trend.text.trim()
  if (!t.includes('%')) {
    return { subtitle: t || '—', changeType: 'increase' }
  }
  const m = t.match(/↑\s*(\d+)|↓\s*(\d+)/)
  const pct = m ? (m[1] ?? m[2] ?? '0') : '0'
  const arrowUp = t.includes('↑')
  const changeStr = arrowUp ? `+${pct}%` : `-${pct}%`
  let changeType: 'increase' | 'decrease' = arrowUp ? 'increase' : 'decrease'
  if (invertSentiment) changeType = arrowUp ? 'decrease' : 'increase'
  return { change: changeStr, changeType }
}

function countInvoicesInMonth(invoices: SalesInvoiceRow[], y: number, month: number) {
  return invoices.filter((inv) => {
    if (!inv.date) return false
    const d = new Date(inv.date)
    return d.getFullYear() === y && d.getMonth() === month
  }).length
}

function monthTrendLabel(current: number, previous: number): { text: string; up: boolean } {
  if (previous === 0 && current === 0) return { text: '— This month', up: true }
  if (previous === 0) return { text: '↑ 100% This month', up: true }
  const raw = ((current - previous) / previous) * 100
  const pct = Math.min(999, Math.round(Math.abs(raw)))
  const up = raw >= 0
  return { text: `${up ? '↑' : '↓'} ${pct}% This month`, up }
}

function formatActivityRowDate(dateStr: string, fallback?: string) {
  const d = new Date(dateStr || fallback || '')
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function HomePage() {
  const router = useRouter()
  const [timeEntries] = useState<TimeEntry[]>(MOCK_TIME_ENTRIES)

  const { invoices: liveInvoices } = useBooksSalesInvoicesStore()
  const { expenses: liveExpenses } = useBooksExpensesStore()
  const { items: liveItems } = useBooksItemsStore()
  const { accounts: liveBankAccounts } = useBooksBankAccountsStore()
  const activityLog = useBooksActivityLog(16)

  const activityHrefById = useMemo(
    () => new Map(activityLog.map((entry) => [entry.id, entry.href])),
    [activityLog]
  )

  const metrics = useMemo(() => {
    const totalReceivables = sumReceivables(liveInvoices)
    const totalPayables = sumAllExpenseAmounts(liveExpenses)
    const totalInvoiced = sumInvoiceTotals(liveInvoices)
    const unbilledHours = timeEntries
      .filter((item) => item.billable && !item.invoiced)
      .reduce((sum, item) => sum + item.hours, 0)
    return { totalReceivables, totalPayables, totalInvoiced, unbilledHours }
  }, [liveExpenses, liveInvoices, timeEntries])

  const totalBankBalance = useMemo(
    () => sumBankAccountBalances(liveBankAccounts),
    [liveBankAccounts]
  )

  const balanceTrend = useMemo(() => {
    const prior = estimatePriorMonthBankTotal(liveBankAccounts, liveInvoices, liveExpenses)
    return formatBalanceTrendLabel(totalBankBalance, prior)
  }, [liveBankAccounts, liveExpenses, liveInvoices, totalBankBalance])

  const incomeChartInvoices = useMemo(
    () => toIncomeChartInvoices(liveInvoices),
    [liveInvoices]
  )

  const chartData = useMemo(
    () => buildProfitLossMonthlyFromLive(liveInvoices, liveExpenses),
    [liveExpenses, liveInvoices]
  )
  const analyticsAreaData = useMemo(
    () => buildAnalyticsAreaMonthlyFromInvoices(liveInvoices),
    [liveInvoices]
  )

  const netPosition = useMemo(
    () => Math.max(0, metrics.totalReceivables - metrics.totalPayables),
    [metrics.totalPayables, metrics.totalReceivables]
  )

  const conversionDisplay = useMemo(() => {
    if (liveInvoices.length === 0) return '—'
    const paid = liveInvoices.filter((i) => i.status === 'Paid').length
    return `${((paid / liveInvoices.length) * 100).toFixed(2)}%`
  }, [liveInvoices])

  const wallets = useMemo(
    () =>
      BOOKS_BALANCE_CURRENCIES.map((code) => ({
        code,
        balanceLabel: formatBooksBalanceDisplay(totalBankBalance, code),
        balanceTitle: formatBooksBalanceFull(totalBankBalance, code),
        limitLabel:
          code === 'INR' ? 'Bank accounts' : code === 'USD' ? 'Converted (USD)' : 'Converted (EUR)',
        active: code === 'INR' ? liveBankAccounts.length > 0 : totalBankBalance > 0,
      })),
    [liveBankAccounts.length, totalBankBalance]
  )

  const activityRows: ActivityTableRow[] = useMemo(
    () => activityLog.map(mapActivityEntryToRow),
    [activityLog]
  )

  const booksHomeKpis = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const prev = new Date(y, m - 1)
    const py = prev.getFullYear()
    const pm = prev.getMonth()

    const invThis = sumInvoicedAmountInMonth(liveInvoices, y, m)
    const invLast = sumInvoicedAmountInMonth(liveInvoices, py, pm)
    const expThis = sumExpenseAmountInMonth(liveExpenses, y, m)
    const expLast = sumExpenseAmountInMonth(liveExpenses, py, pm)
    const cntThis = countInvoicesInMonth(liveInvoices, y, m)
    const cntLast = countInvoicesInMonth(liveInvoices, py, pm)
    const netThis = invThis - expThis
    const netLast = invLast - expLast

    const invTrend = monthTrendLabel(invThis, invLast)
    const expTrend = monthTrendLabel(expThis, expLast)
    const cntTrend = monthTrendLabel(cntThis, cntLast)
    const netTrend = monthTrendLabel(netThis, netLast)

    const a = trendToKpiProps(invTrend, false)
    const b = trendToKpiProps(expTrend, true)
    const c = trendToKpiProps(cntTrend, false)
    const d = trendToKpiProps(netTrend, false)

    const kpiAmount = (amount: number) => ({
      value: formatKpiIndianCurrency(amount),
      valueTitle: formatKpiIndianCurrencyFull(amount),
    })

    return [
      {
        title: 'Total Receivables',
        ...kpiAmount(metrics.totalReceivables),
        icon: Wallet,
        ...a,
      },
      {
        title: 'Total Payables',
        ...kpiAmount(metrics.totalPayables),
        icon: Briefcase,
        ...b,
      },
      {
        title: 'This Month Billing',
        ...kpiAmount(invThis),
        icon: Coins,
        ...c,
      },
      {
        title: 'Net Position',
        ...kpiAmount(netPosition),
        icon: TrendingUp,
        ...d,
      },
    ]
  }, [liveExpenses, liveInvoices, metrics.totalPayables, metrics.totalReceivables, netPosition])

  const quickAccessShortcuts: BooksQuickAccessShortcut[] = useMemo(
    () => [
      {
        id: 'new-invoice',
        title: 'New Invoice',
        icon: FileText,
        caption: 'Create instantly',
        onClick: () => router.push('/sales/invoices/new'),
      },
      {
        id: 'invoices',
        title: 'Invoices',
        count: liveInvoices.length,
        caption: 'View all',
        icon: ScrollText,
        onClick: () => router.push('/sales/invoices'),
      },
      {
        id: 'new-customer',
        title: 'New Customer',
        icon: Users,
        caption: 'Add contact',
        onClick: () => router.push('/sales/customers/new'),
      },
      {
        id: 'items',
        title: 'Items',
        count: liveItems.length,
        caption: 'Product catalog',
        icon: ShoppingBag,
        onClick: () => router.push('/items/all'),
      },
      {
        id: 'new-expense',
        title: 'New Expense',
        icon: Receipt,
        caption: 'Log spend',
        onClick: () => router.push('/purchases/expenses/new'),
      },
      {
        id: 'banking',
        title: 'Banking',
        count: liveBankAccounts.length,
        caption: 'Accounts',
        icon: Wallet,
        onClick: () => router.push('/banking'),
      },
    ],
    [
      liveBankAccounts.length,
      liveInvoices.length,
      liveItems.length,
      router,
    ]
  )

  return (
    <div className="-mx-4 min-h-full px-4 pb-8 md:-mx-6 md:px-6">
      {/* KPI row — extra top spacing below header tabs */}
      <div className="mb-6 grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2 sm:pt-5 lg:grid-cols-4 lg:pt-6">
        {booksHomeKpis.map((kpi) => (
          <KPICard
            key={kpi.title}
            theme="books"
            title={kpi.title}
            value={kpi.value}
            valueTitle={kpi.valueTitle}
            change={kpi.change}
            changeType={kpi.changeType}
            subtitle={kpi.subtitle}
            icon={kpi.icon}
            className="h-full"
          />
        ))}
      </div>

      {/* Wireframe: income + quick access | balance + limit | wallet + recent */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={clsx('min-h-0 xl:col-span-8 xl:row-start-1', HOME_ROW_INCOME)}>
          <BooksChartViewSwitcher
            className="h-full w-full"
            salesValue={formatCurrency(metrics.totalInvoiced)}
            conversionValue={conversionDisplay}
            analyticsData={analyticsAreaData}
            profitLossData={chartData}
            defaultView="pl"
            lockView
            plHeaderTitle="Total Income"
            plSubtitle="View your income in a certain period of time"
            incomeInvoices={incomeChartInvoices}
            sectionTitle="Profit and Loss"
          />
        </div>

        <div
          className={clsx(
            'min-h-0 xl:col-span-4 xl:row-span-2 xl:row-start-1',
            HOME_ROW_INCOME,
            HOME_QUICK_ACCESS_HEIGHT
          )}
        >
          <BooksQuickAccessCard className="h-full min-h-[280px] xl:min-h-0" shortcuts={quickAccessShortcuts} />
        </div>

        <div className={clsx('min-h-0 xl:col-span-4 xl:row-start-2', HOME_ROW_MID)}>
          <TotalBalanceCard
            className="h-full w-full"
            currencyLabel="INR"
            balanceLabel={formatBooksBalanceDisplay(totalBankBalance, 'INR')}
            balanceTitle={formatBooksBalanceFull(totalBankBalance, 'INR')}
            trendLabel={balanceTrend.label}
            trendPositive={balanceTrend.positive}
            wallets={wallets}
            showWallets={false}
            onTransfer={() => router.push('/banking')}
            onRequest={() => router.push('/sales/invoices/new')}
          />
        </div>

        <div className={clsx('min-h-0 xl:col-span-4 xl:row-start-2', HOME_ROW_MID)}>
          <BooksSpendingOverviewPanel className="h-full w-full" />
        </div>

        <div
          className={clsx(
            'grid min-h-0 grid-cols-1 gap-6 xl:col-span-12',
            HOME_ROW_BOTTOM,
            'xl:grid-cols-[minmax(0,34fr)_minmax(0,66fr)]'
          )}
        >
          <BooksWalletPanel className="h-full min-h-0 w-full" title="My Wallet" />

          <RecentActivitiesTable
            variant="feed"
            className="h-full min-h-0 w-full"
            rows={activityRows}
            searchPlaceholder="Search anything..."
            subtitle="Latest updates and actions"
            onViewActivity={(row) => {
              const href = activityHrefById.get(row.id)
              if (href) router.push(href)
            }}
          />
        </div>
      </div>
    </div>
  )
}
