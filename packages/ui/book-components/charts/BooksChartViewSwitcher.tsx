'use client'

import { useId, useMemo, useState } from 'react'
import { BarChart3, ChevronDown, Filter, Info } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Button, Card } from '@webfudge/ui'

export type AnalyticsAreaPoint = {
  month: string
  amount: number
}

export type ProfitLossMonth = {
  month: string
  profit: number
  loss: number
}

export type BooksChartViewSwitcherProps = {
  salesValue: string
  salesSubLabel?: string
  salesTrendLabel?: string
  salesTrendPositive?: boolean
  conversionValue: string
  conversionSubLabel?: string
  conversionTrendLabel?: string
  conversionTrendPositive?: boolean
  analyticsData: AnalyticsAreaPoint[]
  profitLossData: ProfitLossMonth[]
  plSubtitle?: string
  sectionTitle?: string
  profitLabel?: string
  lossLabel?: string
  periodLabel?: string
  onPeriodClick?: () => void
  onFiltersClick?: () => void
  className?: string
  defaultView?: ChartViewMode
  lockView?: boolean
  plHeaderTitle?: string
  /** Invoice rows used to build Today / Last week / Last month income chart. */
  incomeInvoices?: Array<{ date?: string; total?: number }>
}

export type IncomeTimePeriod = 'today' | 'last_week' | 'last_month'

const INCOME_PERIOD_OPTIONS: { value: IncomeTimePeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'last_week', label: 'Last week' },
  { value: 'last_month', label: 'Last month' },
]

const INCOME_PERIOD_SELECT_CLASS = clsx(
  'appearance-none cursor-pointer rounded-full border border-orange-200/90 py-1.5 pl-3 pr-8 text-xs font-semibold shadow-sm',
  'bg-[var(--books-input-bg,#ffffff)] text-[var(--books-input-text,#111827)]',
  'transition-all duration-200 hover:border-orange-300 hover:bg-[var(--books-bg-elevated,#fff7ed)]',
  'focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25',
  'dark:border-orange-500/35 dark:hover:bg-[var(--books-bg-elevated,#252830)]'
)

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function buildIncomeSeriesForPeriod(
  invoices: Array<{ date?: string; total?: number }>,
  period: IncomeTimePeriod
): AnalyticsAreaPoint[] {
  const now = new Date()

  if (period === 'today') {
    const slots = [
      { label: '6AM', from: 6, to: 9 },
      { label: '9AM', from: 9, to: 12 },
      { label: '12PM', from: 12, to: 15 },
      { label: '3PM', from: 15, to: 18 },
      { label: '6PM', from: 18, to: 21 },
      { label: '9PM', from: 21, to: 24 },
    ]
    const todayStart = startOfDay(now).getTime()
    return slots.map(({ label, from, to }) => {
      let amount = 0
      for (const inv of invoices) {
        if (!inv.date) continue
        const dt = new Date(inv.date)
        if (startOfDay(dt).getTime() !== todayStart) continue
        const h = dt.getHours()
        if (h >= from && h < to) amount += inv.total ?? 0
      }
      return { month: label, amount }
    })
  }

  if (period === 'last_week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      const label = d.toLocaleDateString('en-US', { weekday: 'short' })
      const dayStart = startOfDay(d).getTime()
      let amount = 0
      for (const inv of invoices) {
        if (!inv.date) continue
        const dt = new Date(inv.date)
        if (startOfDay(dt).getTime() === dayStart) amount += inv.total ?? 0
      }
      return { month: label, amount }
    })
  }

  return Array.from({ length: 4 }, (_, i) => {
    const weekEnd = new Date(now)
    weekEnd.setHours(23, 59, 59, 999)
    weekEnd.setDate(weekEnd.getDate() - (3 - i) * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    let amount = 0
    for (const inv of invoices) {
      if (!inv.date) continue
      const dt = new Date(inv.date)
      const t = dt.getTime()
      if (t >= weekStart.getTime() && t <= weekEnd.getTime()) amount += inv.total ?? 0
    }
    return { month: label, amount }
  })
}

function formatAxisK(v: number) {
  if (v === 0) return '0'
  if (v >= 100_000) return `${Math.round(v / 100_000)}L`
  if (v >= 1000) return `${Math.round(v / 1000)}k`
  return String(Math.round(v))
}

function formatAxisInr(v: number) {
  if (v === 0) return '₹0'
  if (v >= 100_000) return `₹${Math.round(v / 100_000)}L`
  if (v >= 1000) return `₹${Math.round(v / 1000)}k`
  return `₹${Math.round(v)}`
}

function incomeYAxisMax(values: number[]) {
  const max = Math.max(0, ...values)
  if (max <= 0) return 10_000
  const padded = max * 1.15
  const step = max >= 50_000 ? 10_000 : max >= 10_000 ? 5000 : 1000
  return Math.max(step, Math.ceil(padded / step) * step)
}

function formatIncomeTooltip(value: unknown) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

function tooltipPLNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function plYAxisMax(rows: ProfitLossMonth[]) {
  let max = 0
  for (const r of rows) {
    max = Math.max(max, r.profit, r.loss, r.profit + r.loss)
  }
  if (max <= 0) return 50_000
  const padded = max * 1.12
  const step = 5000
  return Math.max(step, Math.ceil(padded / step) * step)
}

export type ChartViewMode = 'analytics' | 'pl'

export function BooksChartViewSwitcher({
  salesValue,
  salesSubLabel = 'sales',
  salesTrendLabel = '↓ 0.4%',
  salesTrendPositive = false,
  conversionValue,
  conversionSubLabel = 'Conv. rate',
  conversionTrendLabel = '↑ 13%',
  conversionTrendPositive = true,
  analyticsData,
  profitLossData,
  plSubtitle = 'Stacked income vs spend by month',
  sectionTitle = 'Bars overview',
  profitLabel = 'Profit',
  lossLabel = 'Loss',
  periodLabel = 'This year',
  onPeriodClick,
  onFiltersClick,
  className,
  defaultView = 'analytics',
  lockView = false,
  plHeaderTitle = 'Total Income',
  incomeInvoices = [],
}: BooksChartViewSwitcherProps) {
  const [view, setView] = useState<ChartViewMode>(defaultView)
  const [incomePeriod, setIncomePeriod] = useState<IncomeTimePeriod>('last_month')
  const uid = useId().replace(/:/g, '')
  const incomePeriodSelectId = `books-income-period-${uid}`
  const hatchAnalyticsId = `books-switch-analytics-hatch-${uid}`
  const hatchBarId = `books-switch-bar-hatch-${uid}`
  const incomeGradientId = `books-income-area-grad-${uid}`

  const incomeSeries = useMemo(() => {
    if (lockView) {
      return buildIncomeSeriesForPeriod(incomeInvoices, incomePeriod).map((d) => ({
        month: d.month,
        value: d.amount ?? 0,
      }))
    }
    const fromInvoices = analyticsData.map((d) => ({ month: d.month, value: d.amount ?? 0 }))
    if (fromInvoices.some((d) => d.value > 0)) return fromInvoices
    return profitLossData.map((d) => ({
      month: d.month,
      value: Math.max(0, (d.profit ?? 0) - (d.loss ?? 0)),
    }))
  }, [analyticsData, profitLossData, incomeInvoices, incomePeriod, lockView])

  const incomeHasData = useMemo(() => incomeSeries.some((d) => d.value > 0), [incomeSeries])
  const incomeYMax = useMemo(
    () => incomeYAxisMax(incomeSeries.map((d) => d.value)),
    [incomeSeries]
  )

  const plHasData = useMemo(
    () => profitLossData.some((r) => (r.profit ?? 0) > 0 || (r.loss ?? 0) > 0),
    [profitLossData]
  )
  const plYMax = useMemo(() => plYAxisMax(profitLossData), [profitLossData])

  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={twMerge(
        'flex h-full min-h-0 min-w-0 flex-col overflow-hidden',
        className
      )}
    >
      <div className="flex shrink-0 flex-col gap-3 p-6 pb-0 pt-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between md:px-7 md:pt-7">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--books-text-primary,#111827)]">
              {view === 'analytics' ? 'Analytics' : plHeaderTitle}
            </h2>
            {view === 'pl' && lockView ? (
              <div className="relative shrink-0">
                <label htmlFor={incomePeriodSelectId} className="sr-only">
                  Income time period
                </label>
                <select
                  id={incomePeriodSelectId}
                  value={incomePeriod}
                  onChange={(e) => setIncomePeriod(e.target.value as IncomeTimePeriod)}
                  className={INCOME_PERIOD_SELECT_CLASS}
                >
                  {INCOME_PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--books-text-tertiary,#9ca3af)]"
                  aria-hidden
                />
              </div>
            ) : null}
            {view === 'analytics' ? (
              <button
                type="button"
                className="rounded-lg p-1 text-[var(--books-text-tertiary,#9ca3af)] transition-colors hover:bg-[var(--books-bg-elevated,#f3f4f6)] hover:text-[var(--books-text-secondary,#4b5563)]"
                aria-label="About analytics"
              >
                <Info className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          {view === 'pl' && !lockView ? (
            <p className="mt-1 text-sm text-[var(--books-text-secondary,#6b7280)]">{plSubtitle}</p>
          ) : null}
          {view === 'pl' && lockView && plSubtitle ? (
            <p className="mt-1 text-sm text-[var(--books-text-secondary,#6b7280)]">{plSubtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {view === 'analytics' ? (
            <>
              <Button
                type="button"
                variant="muted"
                size="sm"
                rounded="pill"
                className="border border-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-elevated,#f9fafb)] px-3 text-xs font-semibold text-[var(--books-text-secondary,#374151)]"
                onClick={onPeriodClick}
              >
                {periodLabel}
              </Button>
              <Button
                type="button"
                variant="muted"
                size="sm"
                rounded="pill"
                className="border border-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-elevated,#f9fafb)] px-3 text-xs font-semibold text-[var(--books-text-secondary,#374151)]"
                onClick={onFiltersClick}
              >
                <Filter className="mr-1.5 h-3.5 w-3.5 text-[var(--books-text-secondary,#6b7280)]" aria-hidden />
                Filters
              </Button>
            </>
          ) : null}
          {!lockView ? (
            <select
              id={`books-chart-view-${uid}`}
              aria-label="Chart view"
              value={view}
              onChange={(e) => setView(e.target.value as ChartViewMode)}
              className={clsx(
                'min-w-[10.5rem] cursor-pointer rounded-full border border-orange-200/90 py-2 pl-3 pr-9 text-sm font-semibold shadow-sm',
                'bg-[var(--books-input-bg,#ffffff)] text-[var(--books-input-text,#1f2937)]',
                'transition-all duration-200 hover:border-orange-300 hover:bg-[var(--books-bg-elevated,#fff7ed)] focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25'
              )}
            >
              <option value="analytics">Analytics</option>
              <option value="pl">Profit &amp; Loss</option>
            </select>
          ) : null}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 px-6 pb-6 md:px-7 md:pb-7">
        <div
          className={clsx(
            'absolute inset-0 flex min-h-0 flex-col gap-6 overflow-hidden transition-opacity duration-300 ease-out',
            view === 'analytics' ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'
          )}
          aria-hidden={view !== 'analytics'}
        >
          <div className="grid shrink-0 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-2xl font-bold tracking-tight text-[var(--books-text-primary,#111827)] sm:text-3xl">
                {salesValue}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-[var(--books-text-secondary,#6b7280)]">{salesSubLabel}</span>
                {salesTrendLabel ? (
                  <span
                    className={clsx(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      salesTrendPositive
                        ? 'bg-[var(--books-green-bg,rgba(16,185,129,0.1))] text-[var(--books-green,#059669)]'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                    )}
                  >
                    {salesTrendLabel}
                  </span>
                ) : null}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-[var(--books-text-primary,#111827)] sm:text-3xl">
                {conversionValue}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-[var(--books-text-secondary,#6b7280)]">{conversionSubLabel}</span>
                {conversionTrendLabel ? (
                  <span
                    className={clsx(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      conversionTrendPositive
                        ? 'bg-[var(--books-green-bg,rgba(16,185,129,0.1))] text-[var(--books-green,#059669)]'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                    )}
                  >
                    {conversionTrendLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <div className="h-full min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData} margin={{ top: 12, right: 8, left: 4, bottom: 4 }}>
                  <defs>
                    <pattern
                      id={hatchAnalyticsId}
                      patternUnits="userSpaceOnUse"
                      width="10"
                      height="10"
                      patternTransform="rotate(-45)"
                    >
                      <rect width="10" height="10" fill="#ffedd5" />
                      <path
                        d="M0 10 L10 0"
                        stroke="#fb923c"
                        strokeOpacity={0.45}
                        strokeWidth={1.2}
                      />
                    </pattern>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--books-chart-grid, #e5e7eb)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: 'var(--books-chart-tick, #6b7280)', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatAxisK}
                    tick={{ fontSize: 11, fill: 'var(--books-chart-tick-muted, #9ca3af)' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--books-tooltip-border, #fed7aa)',
                      backgroundColor: 'var(--books-tooltip-bg, #ffffff)',
                      color: 'var(--books-tooltip-text, #111827)',
                      boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                    }}
                    labelStyle={{ color: 'var(--books-tooltip-text, #111827)', fontWeight: 600 }}
                    itemStyle={{ color: 'var(--books-tooltip-text, #111827)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Amount"
                    stroke="#ea580c"
                    strokeWidth={2}
                    fill={`url(#${hatchAnalyticsId})`}
                    fillOpacity={0.85}
                    dot={{ r: 3, fill: '#ea580c', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#c2410c', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div
          className={clsx(
            'absolute inset-0 flex min-h-0 flex-col overflow-hidden transition-opacity duration-300 ease-out',
            view === 'pl' ? 'z-10 opacity-100' : 'z-0 pointer-events-none opacity-0'
          )}
          aria-hidden={view !== 'pl'}
        >
          {lockView ? (
            <>
              <div className="relative min-h-0 flex-1 px-2 pb-4 pt-2 md:px-4 md:pb-5">
                <div className="h-full min-h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={incomeSeries}
                      margin={{ top: 16, right: 12, left: 4, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient id={incomeGradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ea580c" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#ea580c" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 6"
                        vertical={false}
                        stroke="var(--books-chart-grid, #e5e7eb)"
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 11, fill: 'var(--books-chart-tick, #6b7280)', fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        dy={6}
                      />
                      <YAxis
                        domain={[0, incomeYMax]}
                        tickFormatter={formatAxisInr}
                        tick={{ fontSize: 11, fill: 'var(--books-chart-tick-muted, #9ca3af)' }}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                      />
                      <Tooltip
                        cursor={{
                          stroke: 'var(--books-brand, #ea580c)',
                          strokeDasharray: '4 4',
                          strokeOpacity: 0.5,
                        }}
                        formatter={(value) => [formatIncomeTooltip(value), 'Income']}
                        labelFormatter={(label) => String(label ?? '')}
                        contentStyle={{
                          borderRadius: 10,
                          border: '1px solid var(--books-tooltip-border, #fed7aa)',
                          backgroundColor: 'var(--books-tooltip-bg, #ffffff)',
                          color: 'var(--books-tooltip-text, #111827)',
                          boxShadow: '0 10px 28px rgba(15,23,42,0.12)',
                          fontSize: 13,
                          fontWeight: 600,
                          padding: '10px 14px',
                        }}
                      />
                      <Area
                        type="natural"
                        dataKey="value"
                        name="Income"
                        stroke="var(--books-brand, #ea580c)"
                        strokeWidth={2.5}
                        fill={`url(#${incomeGradientId})`}
                        fillOpacity={1}
                        dot={false}
                        activeDot={{
                          r: 5,
                          fill: '#ea580c',
                          stroke: 'var(--books-bg-card,#ffffff)',
                          strokeWidth: 2,
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {!incomeHasData ? (
                  <div className="pointer-events-none absolute inset-x-6 top-1/2 flex -translate-y-1/2 flex-col items-center text-center md:inset-x-10">
                    <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--books-bg-elevated,#f3f4f6)] text-[var(--books-text-tertiary,#9ca3af)]">
                      <BarChart3 className="h-4 w-4" aria-hidden />
                    </span>
                    <p className="text-sm font-medium text-[var(--books-text-primary,#111827)]">No income data yet</p>
                    <p className="mt-0.5 max-w-xs text-xs text-[var(--books-text-secondary,#6b7280)]">
                      Record invoices to see your revenue trend here.
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-6 md:px-7">
                <h3 className="text-sm font-semibold text-[var(--books-text-primary,#111827)]">{sectionTitle}</h3>
                <div className="flex items-center gap-4 rounded-full border border-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-elevated,#f9fafb)] px-3 py-1.5 text-[12px] font-medium text-[var(--books-text-secondary,#374151)]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--books-brand,#ea580c)]" aria-hidden />
                    {profitLabel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-[var(--books-chart-loss,#1c1c1c)]"
                      aria-hidden
                    />
                    {lossLabel}
                  </span>
                </div>
              </div>
              <div className="relative min-h-0 flex-1 px-6 pb-6 md:px-7 md:pb-7">
                <div className="relative flex h-full min-h-[200px] w-full flex-col">
                  {!plHasData ? (
                    <div className="flex flex-1 items-center justify-center">
                      <p className="text-sm text-[var(--books-text-secondary,#6b7280)]">
                        No profit &amp; loss data for this period.
                      </p>
                    </div>
                  ) : (
                    <div className="h-full min-h-[200px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={profitLossData}
                          barCategoryGap={8}
                          barGap={4}
                          margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <pattern
                              id={hatchBarId}
                              patternUnits="userSpaceOnUse"
                              width="6"
                              height="6"
                              patternTransform="rotate(45)"
                            >
                              <rect width="6" height="6" fill="transparent" />
                              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--books-brand, #ea580c)" strokeWidth="2.4" />
                            </pattern>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="4 4"
                            stroke="var(--books-chart-grid, #e5e7eb)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="month"
                            tick={{ fontSize: 11, fill: 'var(--books-chart-tick, #6b7280)' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, Math.max(50_000, plYMax)]}
                            tickFormatter={formatAxisK}
                            tick={{ fontSize: 11, fill: 'var(--books-chart-tick-muted, #9ca3af)' }}
                            axisLine={false}
                            tickLine={false}
                            width={44}
                          />
                          <Tooltip
                            formatter={(value, name) => [
                              tooltipPLNumber(value).toLocaleString('en-IN'),
                              String(name ?? ''),
                            ]}
                            labelFormatter={(label) => `Month: ${String(label ?? '')}`}
                            contentStyle={{
                              borderRadius: 8,
                              border: '1px solid var(--books-tooltip-border, #e5e7eb)',
                              backgroundColor: 'var(--books-tooltip-bg, #ffffff)',
                              color: 'var(--books-tooltip-text, #111827)',
                              fontSize: 12,
                              padding: '8px 12px',
                            }}
                          />
                          <Bar
                            dataKey="profit"
                            name={profitLabel}
                            fill={`url(#${hatchBarId})`}
                            stroke="var(--books-brand, #ea580c)"
                            strokeWidth={1}
                            radius={[3, 3, 0, 0]}
                            barSize={20}
                          />
                          <Bar
                            dataKey="loss"
                            name={lossLabel}
                            fill="var(--books-chart-loss, #1c1c1c)"
                            radius={[3, 3, 0, 0]}
                            barSize={20}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </Card>
  )
}
