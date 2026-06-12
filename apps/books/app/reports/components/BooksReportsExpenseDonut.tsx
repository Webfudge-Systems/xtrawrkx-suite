'use client'

import { useMemo } from 'react'
import { PieChart as PieChartIcon } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Card } from '@webfudge/ui'
import {
  DashboardChartCanvas,
  DonutChartFrame,
  DONUT_TOOLTIP_WRAPPER_STYLE,
  PRIMARY_ORANGE_SHADES,
} from '@webfudge/ui'
import { formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import type { ExpenseSlice } from '../lib/reportChartData'

const CHART_INNER = 54
const CHART_OUTER = 86
const TRACK_FILL = 'var(--books-chart-track, #2a2f3a)'

type Props = {
  slices: ExpenseSlice[]
  className?: string
}

function ExpenseTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload?: ExpenseSlice & { pct?: number; color?: string } }>
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="min-w-[9rem] rounded-xl border border-[color:var(--books-border,rgba(255,255,255,0.12))] bg-[var(--books-tooltip-bg,#1e2128)] px-3 py-2.5 shadow-lg">
      <p className="text-sm font-semibold text-[var(--books-text-primary,#f0f0f0)]">{row.name}</p>
      <p className="mt-1 text-xs text-[var(--books-text-secondary,#9ca3af)]">
        <span className="font-bold tabular-nums text-[var(--books-text-primary,#f0f0f0)]">
          {formatSalesMoney(row.value)}
        </span>
        {row.pct != null ? (
          <>
            {' '}
            · <span className="font-semibold text-[var(--books-orange-text,#fb923c)]">{row.pct}%</span>
          </>
        ) : null}
      </p>
    </div>
  )
}

export default function BooksReportsExpenseDonut({ slices, className }: Props) {
  const { rows, total } = useMemo(() => {
    const sum = slices.reduce((acc, s) => acc + s.value, 0)
    const mapped = slices.map((slice, idx) => ({
      ...slice,
      key: slice.name,
      color: PRIMARY_ORANGE_SHADES[idx % PRIMARY_ORANGE_SHADES.length],
      pct: sum > 0 ? Math.round((slice.value / sum) * 1000) / 10 : 0,
    }))
    return { rows: mapped, total: sum }
  }, [slices])

  const displayTotal = total > 0 ? formatSalesMoney(total) : '—'

  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={`flex h-full min-h-0 flex-col overflow-hidden ${className ?? ''}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--books-border,rgba(255,255,255,0.08))] p-6 md:px-7">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[var(--books-text-primary,#f0f0f0)]">
            Top expenses
          </h2>
          <p className="mt-1 text-sm text-[var(--books-text-secondary,#9ca3af)]">
            Spend breakdown by category
          </p>
        </div>
        <PieChartIcon className="h-5 w-5 shrink-0 text-[var(--books-orange-text,#fb923c)]" aria-hidden />
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-6 md:p-7">
        <DashboardChartCanvas className="min-h-[14rem] flex-1">
          <DonutChartFrame total={displayTotal} centerLabel="Total">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: 1 }]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={CHART_INNER}
                  outerRadius={CHART_OUTER}
                  fill={TRACK_FILL}
                  stroke="none"
                  isAnimationActive={false}
                />
                <Pie
                  data={rows}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={CHART_INNER}
                  outerRadius={CHART_OUTER}
                  paddingAngle={rows.length > 1 ? 4 : 0}
                  cornerRadius={5}
                  stroke="var(--books-bg-card, #1e2128)"
                  strokeWidth={3}
                >
                  {rows.map((row) => (
                    <Cell key={row.key} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip content={<ExpenseTooltip />} wrapperStyle={DONUT_TOOLTIP_WRAPPER_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </DonutChartFrame>
        </DashboardChartCanvas>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.key} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
                aria-hidden
              />
              <span className="min-w-0 truncate text-[var(--books-text-secondary,#9ca3af)]">{row.name}</span>
              <span className="ml-auto shrink-0 tabular-nums text-[var(--books-text-primary,#f0f0f0)]">
                {row.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
