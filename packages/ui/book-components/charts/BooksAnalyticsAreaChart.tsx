'use client'

import { useId } from 'react'
import { Filter, Info } from 'lucide-react'
import { clsx } from 'clsx'
import {
  Area,
  AreaChart,
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

export type BooksAnalyticsAreaChartProps = {
  title?: string
  salesValue: string
  salesSubLabel?: string
  salesTrendLabel?: string
  salesTrendPositive?: boolean
  conversionValue: string
  conversionSubLabel?: string
  conversionTrendLabel?: string
  conversionTrendPositive?: boolean
  data: AnalyticsAreaPoint[]
  periodLabel?: string
  onPeriodClick?: () => void
  onFiltersClick?: () => void
  className?: string
}

function formatAxisK(v: number) {
  if (v >= 1000) return `${Math.round(v / 1000)}k`
  return String(Math.round(v))
}

export function BooksAnalyticsAreaChart({
  title = 'Analytics',
  salesValue,
  salesSubLabel = 'sales',
  salesTrendLabel = '↓ 0.4%',
  salesTrendPositive = false,
  conversionValue,
  conversionSubLabel = 'Conv. rate',
  conversionTrendLabel = '↑ 13%',
  conversionTrendPositive = true,
  data,
  periodLabel = 'This year',
  onPeriodClick,
  onFiltersClick,
  className,
}: BooksAnalyticsAreaChartProps) {
  const uid = useId().replace(/:/g, '')
  const hatchId = `books-analytics-hatch-${uid}`

  return (
    <Card
      variant="elevated"
      padding={false}
      className={clsx('min-w-0', className)}
    >
      <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
          <button
            type="button"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="About analytics"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="muted"
            size="sm"
            rounded="pill"
            className="border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700"
            onClick={onPeriodClick}
          >
            {periodLabel}
          </Button>
          <Button
            type="button"
            variant="muted"
            size="sm"
            rounded="pill"
            className="border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700"
            onClick={onFiltersClick}
          >
            <Filter className="mr-1.5 h-3.5 w-3.5 text-gray-500" aria-hidden />
            Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-6 border-b border-gray-100 p-5 sm:grid-cols-2">
        <div>
          <p className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{salesValue}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">{salesSubLabel}</span>
            {salesTrendLabel ? (
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  salesTrendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                )}
              >
                {salesTrendLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{conversionValue}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">{conversionSubLabel}</span>
            {conversionTrendLabel ? (
              <span
                className={clsx(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  conversionTrendPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                )}
              >
                {conversionTrendLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-5 pt-4">
        <div className="h-[260px] w-full min-w-0 sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 4 }}>
              <defs>
                <pattern
                  id={hatchId}
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
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatAxisK}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #fed7aa',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                name="Amount"
                stroke="#ea580c"
                strokeWidth={2}
                fill={`url(#${hatchId})`}
                fillOpacity={0.85}
                dot={{ r: 3, fill: '#ea580c', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#c2410c', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}
