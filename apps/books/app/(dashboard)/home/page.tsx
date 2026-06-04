'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Briefcase,
  Building2,
  Coins,
  Cpu,
  FileText,
  Plane,
  Receipt,
  ScrollText,
  ShoppingBag,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { formatCurrency } from '@webfudge/utils'
import { KPICard } from '@webfudge/ui'
import {
  BooksChartViewSwitcher,
  BooksQuickAccessCard,
  MonthlySpendingLimitCard,
  RecentActivitiesTable,
  StackedBankCards,
  TotalBalanceCard,
} from '@webfudge/ui/book-components'
import type { BooksQuickAccessShortcut } from '@webfudge/ui/book-components'
import type { ActivityTableRow, AnalyticsAreaPoint, ProfitLossMonth } from '@webfudge/ui/book-components'
import { booksApi } from '@/lib/api'
import type { Bill, Customer, Expense, Invoice, InvoiceStatus, TimeEntry, Vendor } from '@/lib/types'

const DEFAULT_MONTHLY_SPEND_LIMIT = 0

const ACTIVITY_ICONS = [Smartphone, Plane, ShoppingBag, Sparkles, Cpu] as const

/** Equal-height rows for wireframe-aligned dashboard grid */
const HOME_ROW_INCOME = 'h-[320px] min-h-[320px]'
const HOME_ROW_MID = 'h-[280px] min-h-[280px]'
const HOME_ROW_BOTTOM = 'h-[340px] min-h-[340px]'
const HOME_QUICK_ACCESS_HEIGHT = 'xl:h-[calc(320px+1.5rem+280px)] xl:min-h-[calc(320px+1.5rem+280px)]'

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

function sumInvoicedInMonth(invoices: Invoice[], y: number, month: number) {
  return invoices.reduce((sum, inv) => {
    if (!inv.date) return sum
    const d = new Date(inv.date)
    if (d.getFullYear() !== y || d.getMonth() !== month) return sum
    return sum + (inv.total ?? 0)
  }, 0)
}

function sumExpensesInMonth(expenses: Expense[], y: number, month: number) {
  return expenses.reduce((sum, e) => {
    if (!e.date) return sum
    const d = new Date(e.date)
    if (d.getFullYear() !== y || d.getMonth() !== month) return sum
    return sum + (e.amount ?? 0)
  }, 0)
}

function countInvoicesInMonth(invoices: Invoice[], y: number, month: number) {
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

function buildAnalyticsAreaMonthly(invoices: Invoice[]): AnalyticsAreaPoint[] {
  const result: AnalyticsAreaPoint[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const y = d.getFullYear()
    const m = d.getMonth()
    const label = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    let amount = 0
    for (const inv of invoices) {
      if (!inv.date) continue
      const dt = new Date(inv.date)
      if (dt.getFullYear() === y && dt.getMonth() === m) amount += inv.total ?? 0
    }
    result.push({ month: label, amount })
  }
  return result
}

function buildProfitLossMonthly(invoices: Invoice[], expenses: Expense[]): ProfitLossMonth[] {
  const result: ProfitLossMonth[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    const y = d.getFullYear()
    const m = d.getMonth()
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    let profit = 0
    let loss = 0
    for (const inv of invoices) {
      if (!inv.date) continue
      const dt = new Date(inv.date)
      if (dt.getFullYear() === y && dt.getMonth() === m) profit += inv.total ?? 0
    }
    for (const e of expenses) {
      if (!e.date) continue
      const dt = new Date(e.date)
      if (dt.getFullYear() === y && dt.getMonth() === m) loss += e.amount ?? 0
    }
    result.push({ month: label, profit, loss })
  }
  return result
}

function mapInvoiceActivityStatus(status: InvoiceStatus): ActivityTableRow['status'] {
  if (status === 'Paid') return 'completed'
  if (status === 'Partial' || status === 'Sent' || status === 'Viewed') return 'in_progress'
  return 'pending'
}

function formatOrderId(number: string) {
  const n = String(number || '').trim()
  if (/^inv[_-]/i.test(n)) return n.replace(/-/g, '_').toUpperCase()
  return `INV_${n.replace(/\s+/g, '_')}`.toUpperCase()
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

function formatDueDateLabel(dateStr: string) {
  const d = new Date(dateStr || '')
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function HomePage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  useEffect(() => {
    booksApi.fetchInvoices().then((res) => setInvoices(res.data ?? [])).catch(() => setInvoices([]))
    booksApi.fetchExpenses().then((res) => setExpenses(res.data ?? [])).catch(() => setExpenses([]))
    booksApi.fetchTimeEntries().then((res) => setTimeEntries(res.data ?? [])).catch(() => setTimeEntries([]))
    booksApi.fetchCustomers().then((res) => setCustomers(res.data ?? [])).catch(() => setCustomers([]))
    booksApi.fetchBills().then((res) => setBills(res.data ?? [])).catch(() => setBills([]))
    booksApi.fetchVendors().then((res) => setVendors(res.data ?? [])).catch(() => setVendors([]))
  }, [])

  const customerNameById = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of customers) {
      const label = (c.company && c.company.trim()) || c.name || `Customer #${c.id}`
      m.set(c.id, label)
    }
    return m
  }, [customers])

  const metrics = useMemo(() => {
    const totalReceivables = invoices.reduce((sum, invoice) => sum + (invoice.balanceDue ?? invoice.total ?? 0), 0)
    const totalPayables = expenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0)
    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0)
    const unbilledHours = timeEntries
      .filter((item) => item.billable && !item.invoiced)
      .reduce((sum, item) => sum + item.hours, 0)
    const unbilledExpenses = expenses.filter((item) => item.billable).reduce((sum, item) => sum + item.amount, 0)
    return { totalReceivables, totalPayables, totalInvoiced, unbilledHours, unbilledExpenses }
  }, [expenses, invoices, timeEntries])

  const spentThisMonth = useMemo(() => {
    const now = new Date()
    return expenses.reduce((sum, e) => {
      if (!e.date) return sum
      const d = new Date(e.date)
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return sum
      return sum + (e.amount ?? 0)
    }, 0)
  }, [expenses])

  /** When no explicit limit is configured, derive a display cap so the gauge remains meaningful. */
  const monthlySpendLimitDisplay = useMemo(() => {
    if (DEFAULT_MONTHLY_SPEND_LIMIT > 0) return DEFAULT_MONTHLY_SPEND_LIMIT
    if (spentThisMonth <= 0) return 0
    return Math.max(Math.ceil(spentThisMonth * 1.15), 1000)
  }, [spentThisMonth])

  const chartData = useMemo(() => buildProfitLossMonthly(invoices, expenses), [expenses, invoices])
  const analyticsAreaData = useMemo(() => buildAnalyticsAreaMonthly(invoices), [invoices])

  const netPosition = useMemo(
    () => Math.max(0, metrics.totalReceivables - metrics.totalPayables),
    [metrics.totalPayables, metrics.totalReceivables]
  )

  const conversionDisplay = useMemo(() => {
    if (invoices.length === 0) return '—'
    const paid = invoices.filter((i) => i.status === 'Paid').length
    return `${((paid / invoices.length) * 100).toFixed(2)}%`
  }, [invoices])

  const wallets = useMemo(
    () => [
      {
        code: 'INR',
        balanceLabel: formatCurrency(metrics.totalReceivables, 'INR', 'en-IN'),
        limitLabel: 'Primary',
        active: true,
      },
      {
        code: 'USD',
        balanceLabel: formatCurrency(0, 'USD', 'en-US'),
        limitLabel: 'Operating',
        active: true,
      },
      {
        code: 'EUR',
        balanceLabel: formatCurrency(0, 'EUR', 'de-DE'),
        limitLabel: 'Reserve',
        active: false,
      },
    ],
    [metrics.totalReceivables]
  )

  const activityRows: ActivityTableRow[] = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => {
      const ta = new Date(a.date || a.updatedAt || 0).getTime()
      const tb = new Date(b.date || b.updatedAt || 0).getTime()
      return tb - ta
    })
    return sorted.slice(0, 12).map((inv, i) => {
      const line = inv.lineItems?.[0]
      const label = (line?.description && line.description.trim()) || 'Invoice'
      const Icon = ACTIVITY_ICONS[i % ACTIVITY_ICONS.length]
      const balanceDue = inv.balanceDue ?? inv.total ?? 0
      const balanceLabel =
        inv.status === 'Paid' ? '—' : formatCurrency(Math.max(0, balanceDue))
      return {
        id: String(inv.id),
        orderId: formatOrderId(inv.number),
        activityLabel: label,
        Icon,
        priceLabel: formatCurrency(inv.total ?? 0),
        status: mapInvoiceActivityStatus(inv.status),
        dateLabel: formatActivityRowDate(inv.date, inv.updatedAt),
        customerLabel: customerNameById.get(inv.customerId) ?? `Customer #${inv.customerId}`,
        dueDateLabel: formatDueDateLabel(inv.dueDate),
        balanceLabel,
      }
    })
  }, [customerNameById, invoices])

  const booksHomeKpis = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = now.getMonth()
    const prev = new Date(y, m - 1)
    const py = prev.getFullYear()
    const pm = prev.getMonth()

    const invThis = sumInvoicedInMonth(invoices, y, m)
    const invLast = sumInvoicedInMonth(invoices, py, pm)
    const expThis = sumExpensesInMonth(expenses, y, m)
    const expLast = sumExpensesInMonth(expenses, py, pm)
    const cntThis = countInvoicesInMonth(invoices, y, m)
    const cntLast = countInvoicesInMonth(invoices, py, pm)
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

    return [
      {
        title: 'Total Receivables',
        value: formatCurrency(metrics.totalReceivables),
        icon: Wallet,
        ...a,
      },
      {
        title: 'Total Payables',
        value: formatCurrency(metrics.totalPayables),
        icon: Briefcase,
        ...b,
      },
      {
        title: 'This Month Billing',
        value: formatCurrency(invThis),
        icon: Coins,
        ...c,
      },
      {
        title: 'Net Position',
        value: formatCurrency(netPosition),
        icon: TrendingUp,
        ...d,
      },
    ]
  }, [expenses, invoices, metrics.totalPayables, metrics.totalReceivables, netPosition])

  const quickAccessShortcuts: BooksQuickAccessShortcut[] = useMemo(
    () => [
      {
        id: 'invoices',
        title: 'Invoices',
        count: invoices.length,
        icon: FileText,
        onClick: () => router.push('/sales/invoices'),
      },
      {
        id: 'customers',
        title: 'Customers',
        count: customers.length,
        icon: Users,
        onClick: () => router.push('/sales/customers'),
      },
      {
        id: 'expenses',
        title: 'Expenses',
        count: expenses.length,
        icon: Receipt,
        onClick: () => router.push('/purchases/expenses'),
      },
      {
        id: 'reports',
        title: 'Reports',
        count: 0,
        icon: TrendingUp,
        onClick: () => router.push('/reports'),
      },
      {
        id: 'bills',
        title: 'Bills',
        count: bills.length,
        icon: ScrollText,
        onClick: () => router.push('/purchases/bills'),
      },
      {
        id: 'vendors',
        title: 'Vendors',
        count: vendors.length,
        icon: Building2,
        onClick: () => router.push('/purchases/vendors'),
      },
    ],
    [bills.length, customers.length, expenses.length, invoices.length, router, vendors.length]
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
            incomeInvoices={invoices}
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
            balanceLabel={formatCurrency(netPosition)}
            trendLabel="+ 5% than last month"
            trendPositive
            wallets={wallets}
            showWallets={false}
            onTransfer={() => router.push('/banking')}
            onRequest={() => router.push('/sales/invoices')}
          />
        </div>

        <div className={clsx('min-h-0 xl:col-span-4 xl:row-start-2', HOME_ROW_MID)}>
          <MonthlySpendingLimitCard
            className="h-full w-full"
            spent={spentThisMonth}
            limit={monthlySpendLimitDisplay}
            spentLabel={formatCurrency(spentThisMonth)}
            limitLabel={
              monthlySpendLimitDisplay > 0
                ? formatCurrency(monthlySpendLimitDisplay)
                : formatCurrency(0)
            }
          />
        </div>

        <div
          className={clsx(
            'grid min-h-0 grid-cols-1 gap-6 xl:col-span-12',
            HOME_ROW_BOTTOM,
            'xl:grid-cols-[minmax(0,34fr)_minmax(0,66fr)]'
          )}
        >
          <StackedBankCards
            className="h-full min-h-0 w-full"
            title="My Wallet"
            showCardIcon
            onAddNew={() => router.push('/banking')}
            addNewLabel="Add new"
          />

          <RecentActivitiesTable
            variant="feed"
            className="h-full min-h-0 w-full"
            rows={activityRows}
            searchPlaceholder="Search anything..."
            subtitle="Latest updates and actions"
          />
        </div>
      </div>
    </div>
  )
}
