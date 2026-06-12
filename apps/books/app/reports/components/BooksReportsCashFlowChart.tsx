'use client'

import { useId } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@webfudge/ui'
import { formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import type { AnalyticsAreaPoint } from '@webfudge/ui/book-components'

const chartTooltipStyle = {
  borderRadius: '0.75rem',
  border: '1px solid var(--books-border, rgba(255,255,255,0.12))',
  backgroundColor: 'var(--books-tooltip-bg, #1e2128)',
  color: 'var(--books-tooltip-text, #f0f0f0)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
}

function formatAxisTick(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${Math.round(n / 1000)}k`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
  return String(n)
}

type Props = {
  data: AnalyticsAreaPoint[]
  netCash: number
  totalIncome: number
  totalExpense: number
  periodLabel: string
  incomeTrendLabel: string
  expenseTrendLabel: string
  className?: string
}

export default function BooksReportsCashFlowChart({
  data,
  netCash,
  totalIncome,
  totalExpense,
  periodLabel,
  incomeTrendLabel,
  expenseTrendLabel,
  className,
}: Props) {
  const gradientId = useId().replace(/:/g, '')

  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={`flex h-full min-h-0 flex-col overflow-hidden ${className ?? ''}`}
    >
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-[color:var(--books-border,rgba(255,255,255,0.08))] p-6 md:px-7">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--books-text-primary,#f0f0f0)]">
            Cash flow
          </h2>
          <p className="mt-1 text-sm text-[var(--books-text-secondary,#9ca3af)]">
            Net movement by month · {periodLabel}
          </p>
        </div>
        <TrendingUp className="h-5 w-5 shrink-0 text-[var(--books-orange-text,#fb923c)]" aria-hidden />
      </div>

      <div className="grid shrink-0 gap-4 border-b border-[color:var(--books-border,rgba(255,255,255,0.08))] p-6 sm:grid-cols-2 md:px-7">
        <div>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-[var(--books-text-primary,#f0f0f0)] sm:text-3xl">
            {formatSalesMoney(netCash)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--books-text-secondary,#9ca3af)]">net movement</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                netCash >= 0
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              }`}
            >
              {incomeTrendLabel}
            </span>
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums tracking-tight text-[var(--books-text-primary,#f0f0f0)] sm:text-3xl">
            {formatSalesMoney(totalIncome)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-[var(--books-text-secondary,#9ca3af)]">inflow</span>
            <span className="rounded-full bg-[var(--books-bg-elevated,#252830)] px-2 py-0.5 text-xs font-semibold text-[var(--books-text-tertiary,#6b7280)]">
              out {formatSalesMoney(totalExpense)} · {expenseTrendLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-6 pt-4 md:px-7">
        <div className="h-full min-h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--books-chart-grid, #2a2f3a)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--books-chart-tick, #9ca3af)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatAxisTick}
                tick={{ fontSize: 11, fill: 'var(--books-chart-tick, #9ca3af)' }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                formatter={(value) => formatSalesMoney(Number(value) || 0)}
                contentStyle={chartTooltipStyle}
              />
              <Area
                type="monotone"
                dataKey="amount"
                name="Net cash"
                stroke="#f97316"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}
