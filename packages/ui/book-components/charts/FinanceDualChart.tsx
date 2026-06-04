'use client'

import { useId } from 'react'
import { twMerge } from 'tailwind-merge'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@webfudge/ui'

export type ProfitLossMonth = {
  month: string
  /** Collected / inflow (orange segment) */
  profit: number
  /** Spend / outflow (dark segment) */
  loss: number
}

export type FinanceDualChartProps = {
  title?: string
  subtitle?: string
  sectionTitle?: string
  profitLabel?: string
  lossLabel?: string
  data: ProfitLossMonth[]
  className?: string
}

function formatK(v: number) {
  if (v >= 1000) return `${Math.round(v / 1000)}k`
  return String(Math.round(v))
}

export function FinanceDualChart({
  title = 'Profit & Loss',
  subtitle = 'Stacked income vs spend by month',
  sectionTitle = 'Bars overview',
  profitLabel = 'Profit',
  lossLabel = 'Loss',
  data,
  className,
}: FinanceDualChartProps) {
  const uid = useId().replace(/:/g, '')
  const hatchId = `books-profit-hatch-${uid}`

  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={twMerge(
        className
      )}
    >
      <div className="flex flex-col gap-6 p-6 md:p-7">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--books-text-primary,#111827)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--books-text-secondary,#6b7280)]">{subtitle}</p>
        </div>
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--books-text-primary,#1f2937)]">{sectionTitle}</h3>
          <div className="flex items-center gap-4 text-xs font-medium text-[var(--books-text-secondary,#4b5563)]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--books-brand,#ea580c)]" aria-hidden />
              {profitLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full bg-[var(--books-chart-loss,#171717)]"
                aria-hidden
              />
              {lossLabel}
            </span>
          </div>
          </div>
          <div className="h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              barCategoryGap="4%"
              barGap={2}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <defs>
                <pattern
                  id={hatchId}
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                  patternTransform="rotate(45)"
                >
                  <rect width="6" height="6" fill="#fb923c" fillOpacity={0.35} />
                  <path d="M0 6 L6 0" stroke="#ea580c" strokeWidth={1} strokeOpacity={0.5} />
                </pattern>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--books-chart-grid, #e5e7eb)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--books-chart-tick, #6b7280)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatK}
                tick={{ fontSize: 11, fill: 'var(--books-chart-tick-muted, #9ca3af)' }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                cursor={{ fill: 'rgba(251, 146, 60, 0.08)' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid var(--books-tooltip-border, #fed7aa)',
                  backgroundColor: 'var(--books-tooltip-bg, #ffffff)',
                  color: 'var(--books-tooltip-text, #111827)',
                  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
                }}
              />
              <Legend wrapperStyle={{ display: 'none' }} />
              <Bar
                dataKey="loss"
                stackId="pl"
                name={lossLabel}
                fill="var(--books-chart-loss, #171717)"
                radius={[0, 0, 8, 8]}
                maxBarSize={96}
              />
              <Bar
                dataKey="profit"
                stackId="pl"
                name={profitLabel}
                fill={`url(#${hatchId})`}
                radius={[8, 8, 0, 0]}
                maxBarSize={96}
              />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Card>
  )
}
