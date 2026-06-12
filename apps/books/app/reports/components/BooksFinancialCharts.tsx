'use client'

import { useId, useMemo, useState } from 'react'
import { Card } from '@webfudge/ui'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Banknote, Receipt, Wallet } from 'lucide-react'
import type { Expense, Invoice } from '@/lib/types'
import { MOCK_EXPENSES, MOCK_INVOICES } from '@/lib/mock-data'
import { formatCurrency } from '@webfudge/utils'

const PIE_COLORS = ['#f97316', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa']
const monthKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

const chartTooltipStyle = {
  borderRadius: '0.75rem',
  border: '1px solid var(--books-border, #e5e7eb)',
  backgroundColor: 'var(--books-tooltip-bg, #ffffff)',
  color: 'var(--books-tooltip-text, #111827)',
  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
}

function formatAxisTick(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return String(n)
}

function tooltipNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function BooksFinancialCharts({ timeRange = 'this_fiscal_year' }: { timeRange?: string }) {
  // Backend analytics not connected yet: keep charts/legend in "0-data" placeholder mode.
  // (Dropdown remains for UI consistency + future wiring.)
  const zeroMode = false

  const cashFlowGradientId = useId().replace(/:/g, '')
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES)
  const [expenses] = useState<Expense[]>(MOCK_EXPENSES)

  const incomeVsExpense = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number }>()
    monthKeys.forEach((month) => map.set(month, { month, income: 0, expense: 0 }))

    invoices.forEach((invoice) => {
      const key = new Date(invoice.date).toLocaleString('en-US', { month: 'short' })
      if (map.has(key)) map.get(key)!.income += invoice.total ?? 0
    })
    expenses.forEach((expense) => {
      const key = new Date(expense.date).toLocaleString('en-US', { month: 'short' })
      if (map.has(key)) map.get(key)!.expense += expense.amount ?? 0
    })

    if (zeroMode) {
      return monthKeys.map((month) => ({ month, income: 0, expense: 0 }))
    }

    const values = Array.from(map.values())
    const hasData = values.some((v) => v.income > 0 || v.expense > 0)
    return hasData
      ? values
      : [
          { month: 'Jan', income: 12000, expense: 5000 },
          { month: 'Feb', income: 15000, expense: 7000 },
          { month: 'Mar', income: 18000, expense: 9000 },
          { month: 'Apr', income: 16000, expense: 8500 },
          { month: 'May', income: 19000, expense: 9500 },
        ]
  }, [expenses, invoices, zeroMode])

  const fiscalYear = useMemo(() => {
    const dates = [
      ...invoices.map((i) => new Date(i.date).getTime()),
      ...expenses.map((e) => new Date(e.date).getTime()),
    ].filter((t) => Number.isFinite(t))

    if (dates.length === 0) return new Date().getFullYear()
    return new Date(Math.min(...dates)).getFullYear()
  }, [expenses, invoices])

  const cashSummary = useMemo(() => {
    const totalIncome = incomeVsExpense.reduce((sum, row) => sum + (row.income ?? 0), 0)
    const totalOutgoing = incomeVsExpense.reduce((sum, row) => sum + (row.expense ?? 0), 0)

    if (zeroMode) {
      return {
        totalIncome: 0,
        totalOutgoing: 0,
        cashOnHandStart: 0,
        cashOnHandEnd: 0,
        startLabel: `01/01/${fiscalYear}`,
        endLabel: `12/31/${fiscalYear}`,
      }
    }

    // Without a backend-provided opening balance, we show the computed net cash movement.
    const cashOnHandStart = 0
    const cashOnHandEnd = cashOnHandStart + (totalIncome - totalOutgoing)

    return {
      totalIncome,
      totalOutgoing,
      cashOnHandStart,
      cashOnHandEnd,
      startLabel: `01/01/${fiscalYear}`,
      endLabel: `12/31/${fiscalYear}`,
    }
  }, [fiscalYear, incomeVsExpense, zeroMode])

  const cashFlow = useMemo(
    () =>
      incomeVsExpense.map((row) => ({
        month: row.month,
        amount: row.income - row.expense,
      })),
    [incomeVsExpense]
  )

  const { topExpenses, pieValuesArePercent } = useMemo(() => {
    if (zeroMode) {
      return {
        topExpenses: [
          { name: 'Software', value: 0 },
          { name: 'Subcontractor', value: 0 },
          { name: 'Marketing', value: 0 },
          { name: 'Travel', value: 0 },
          { name: 'Other', value: 0 },
        ],
        pieValuesArePercent: false,
      }
    }

    const grouped = expenses.reduce<Record<string, number>>((acc, item) => {
      const key = item.category || 'Other'
      acc[key] = (acc[key] ?? 0) + (item.amount ?? 0)
      return acc
    }, {})

    const sorted = Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)

    if (sorted.length === 0) {
      return {
        topExpenses: [
          { name: 'Software', value: 35 },
          { name: 'Subcontractor', value: 30 },
          { name: 'Marketing', value: 20 },
          { name: 'Travel', value: 15 },
        ],
        pieValuesArePercent: true,
      }
    }

    return { topExpenses: sorted, pieValuesArePercent: false }
  }, [expenses, zeroMode])

  const pieTooltipFormatter = (value: number) => (pieValuesArePercent ? `${value}%` : formatCurrency(value))

  // If everything is 0 we still want a visible pie (for layout consistency),
  // but the legend/tooltips should display 0 values.
  const pieChartData = useMemo(() => {
    if (!zeroMode) return topExpenses
    return topExpenses.map((it) => ({ ...it, value: 1 }))
  }, [topExpenses, zeroMode])

  const topExpensesLegend = useMemo(() => {
    const sum = topExpenses.reduce((acc, it) => acc + (it.value ?? 0), 0)
    return topExpenses.map((it, idx) => {
      const percent = sum > 0 ? (it.value / sum) * 100 : 0
      return { ...it, percent, color: PIE_COLORS[idx % PIE_COLORS.length] }
    })
  }, [topExpenses])

  return (
    <div className="space-y-4">
      <Card
        variant="elevated"
        padding={false}
        className="p-4 sm:p-5 !bg-[var(--books-bg-card,#ffffff)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.38)]"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[var(--books-text-primary,#111827)]">Cash Flow</h3>
          <span className="text-xs font-medium text-[var(--books-text-tertiary,#9ca3af)]">This Fiscal Year</span>
        </div>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
          <div className="h-64 w-full xl:flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={cashFlowGradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--books-chart-grid,#e2e8f0)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--books-chart-tick,#64748b)' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--books-chart-tick,#64748b)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatAxisTick}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(tooltipNumber(value))}
                  contentStyle={chartTooltipStyle}
                />
                <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2} fill={`url(#${cashFlowGradientId})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full rounded-2xl border border-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-elevated,#f9fafb)] p-4 xl:w-64">
            <div className="text-xs font-medium text-[var(--books-text-secondary,#6b7280)]">Summary</div>
            <div className="mt-3 space-y-3 text-xs text-[var(--books-text-secondary,#6b7280)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--books-text-tertiary,#9ca3af)]">Cash on hand on {cashSummary.startLabel}</span>
                <span className="font-medium text-[var(--books-text-primary,#111827)]">{formatCurrency(cashSummary.cashOnHandStart)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--books-text-tertiary,#9ca3af)]">Income</span>
                <span className="font-medium text-[var(--books-text-primary,#111827)]">{formatCurrency(cashSummary.totalIncome)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--books-text-tertiary,#9ca3af)]">Outgo</span>
                <span className="font-medium text-[var(--books-text-primary,#111827)]">{formatCurrency(cashSummary.totalOutgoing)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--books-text-tertiary,#9ca3af)]">Cash on hand on {cashSummary.endLabel}</span>
                <span className="font-medium text-[var(--books-text-primary,#111827)]">{formatCurrency(cashSummary.cashOnHandEnd)}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          variant="elevated"
          padding={false}
          className="p-4 sm:p-5 xl:col-span-2 !bg-[var(--books-bg-card,#ffffff)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.38)]"
        >
          <h3 className="mb-4 text-base font-semibold text-[var(--books-text-primary,#111827)]">Income and Expense</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpense} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--books-chart-grid,#e2e8f0)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--books-chart-tick,#64748b)' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--books-chart-tick,#64748b)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatAxisTick}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(tooltipNumber(value))}
                  contentStyle={chartTooltipStyle}
                />
                <Bar dataKey="income" name="Income" fill="#60a5fa" radius={[0, 0, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#f97316" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card
          variant="elevated"
          padding={false}
          className="p-4 sm:p-5 !bg-[var(--books-bg-card,#ffffff)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.38)]"
        >
          <h3 className="mb-4 text-base font-semibold text-[var(--books-text-primary,#111827)]">Top Expenses</h3>
          <div className="flex items-center gap-6 h-60">
            <div className="w-56 h-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={88}
                    paddingAngle={1}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#fff" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      zeroMode ? formatCurrency(0) : pieTooltipFormatter(tooltipNumber(value))}
                    contentStyle={chartTooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1">
              <div className="space-y-3">
                {topExpensesLegend.map((it) => (
                  <div key={it.name} className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: it.color }} />
                    <div className="text-sm leading-snug break-words text-[var(--books-text-primary,#111827)]">
                      {it.name}{' '}
                      <span className="text-[var(--books-text-secondary,#6b7280)]">({it.percent.toFixed(2)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

