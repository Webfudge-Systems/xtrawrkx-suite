'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Rectangle,
} from 'recharts'
import { STACK_SERIES, STACK_ORDER } from './stackedBarChartTheme'

function shortenBarLabel(name) {
  const s = String(name || '').trim()
  if (!s) return '—'
  if (s.includes('@')) {
    const local = s.split('@')[0]
    return local.length > 14 ? `${local.slice(0, 12)}…` : local
  }
  return s.length > 16 ? `${s.slice(0, 14)}…` : s
}

function StackedTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const rows = payload.filter((p) => Number(p.value) > 0)
  const total = rows.reduce((sum, p) => sum + (Number(p.value) || 0), 0)

  return (
    <div className="min-w-[11rem] rounded-xl border border-gray-200/90 bg-white/95 px-3.5 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      <ul className="space-y-2">
        {rows.map((entry) => {
          const key = entry.dataKey
          const theme = STACK_SERIES[key] || STACK_SERIES.pending
          const value = Number(entry.value) || 0
          const pct = total > 0 ? Math.round((value / total) * 1000) / 10 : 0
          return (
            <li key={key} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-2 text-gray-600">
                <span
                  className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                  style={{ backgroundColor: theme.color }}
                />
                {theme.label}
              </span>
              <span className="font-bold tabular-nums text-gray-900">
                {value}
                <span className="ml-1 font-semibold text-gray-400">({pct}%)</span>
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-2.5 border-t border-gray-100 pt-2 text-xs font-medium text-gray-500">
        Total: <span className="font-bold text-gray-800">{total}</span> task{total === 1 ? '' : 's'}
      </p>
    </div>
  )
}

function SummaryChips({ totals, grandTotal }) {
  return (
    <div className="relative mb-4 flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800 ring-1 ring-gray-200/90">
        <span className="tabular-nums">{grandTotal}</span> total task{grandTotal === 1 ? '' : 's'}
      </span>
      {STACK_ORDER.map((key) => {
        const theme = STACK_SERIES[key]
        const value = totals[key] ?? 0
        if (value === 0) return null
        const pct = grandTotal > 0 ? Math.round((value / grandTotal) * 1000) / 10 : 0
        return (
          <div
            key={key}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${theme.pill}`}
          >
            <span
              className="h-2 w-2 rounded-full ring-1 ring-white/80"
              style={{ backgroundColor: theme.color }}
            />
            {theme.label}
            <span className="tabular-nums">{value}</span>
            <span className="text-[10px] font-bold opacity-70">({pct}%)</span>
          </div>
        )
      })}
    </div>
  )
}

function InlineLegend({ totals, grandTotal }) {
  if (grandTotal === 0) return null
  return (
    <div className="relative mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-orange-100/80 pt-4">
      {STACK_ORDER.map((key) => {
        const theme = STACK_SERIES[key]
        const value = totals[key] ?? 0
        const pct = grandTotal > 0 ? Math.round((value / grandTotal) * 1000) / 10 : 0
        return (
          <div key={key} className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <span
              className="h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: theme.color }}
            />
            <span>{theme.label}</span>
            <span className="font-bold tabular-nums text-gray-800">{value}</span>
            <span className="text-[10px] font-semibold text-gray-400">({pct}%)</span>
          </div>
        )
      })}
    </div>
  )
}

const ACTIVE_OPACITY = 0.88
const BAR_RADIUS = 8

function topRadiusForSegment(row, dataKey) {
  const overdue = row?.overdue ?? 0
  const pending = row?.pending ?? 0
  const completed = row?.completed ?? 0
  if (dataKey === 'completed' && completed > 0) return [BAR_RADIUS, BAR_RADIUS, 0, 0]
  if (dataKey === 'pending' && pending > 0 && completed === 0) return [BAR_RADIUS, BAR_RADIUS, 0, 0]
  if (dataKey === 'overdue' && overdue > 0 && pending === 0 && completed === 0) {
    return [BAR_RADIUS, BAR_RADIUS, 0, 0]
  }
  return [0, 0, 0, 0]
}

function makeStackBarShape(dataKey) {
  return function StackBarShape(props) {
    const { fill, x, y, width, height, payload, fillOpacity } = props
    if (!height || height <= 0) return null
    return (
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        radius={topRadiusForSegment(payload, dataKey)}
        fillOpacity={fillOpacity}
        stroke="#ffffff"
        strokeWidth={2}
      />
    )
  }
}

/**
 * Stacked vertical bar chart with polished dashboard styling.
 * Each data item should have: { name, overdue, pending, completed }
 */
export default function GradientStackedBarChart({
  data = [],
  height = 300,
  showSummary = true,
  emptyMessage = 'No data to display.',
  className = '',
}) {
  const [activeIndex, setActiveIndex] = useState(-1)

  const { totals, grandTotal, chartData, yMax } = useMemo(() => {
    const out = { overdue: 0, pending: 0, completed: 0 }
    let max = 0
    let sum = 0

    const rows = data.map((row) => {
      const overdue = row.overdue ?? 0
      const pending = row.pending ?? 0
      const completed = row.completed ?? 0
      const total = overdue + pending + completed
      out.overdue += overdue
      out.pending += pending
      out.completed += completed
      sum += total
      if (total > max) max = total
      return {
        ...row,
        overdue,
        pending,
        completed,
        _total: total,
        _label: shortenBarLabel(row.name),
        _fullName: row.name,
      }
    })

    const padded = Math.ceil(max * 1.12) || 4
    return {
      totals: out,
      grandTotal: sum,
      chartData: rows,
      yMax: padded < 4 ? 4 : padded,
    }
  }, [data])

  if (!data.length) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gradient-to-b from-orange-50/30 to-white ${className}`}
        style={{ minHeight: height }}
      >
        <p className="px-4 text-center text-sm text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-orange-100/70 bg-gradient-to-b from-orange-50/45 via-white to-white px-4 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_50%_at_50%_0%,rgba(255,122,32,0.1),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-8 left-1/2 h-24 w-3/4 max-w-md -translate-x-1/2 rounded-full bg-orange-200/15 blur-2xl"
      />

      {showSummary ? <SummaryChips totals={totals} grandTotal={grandTotal} /> : null}

      <div className="relative w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
            barCategoryGap="22%"
            barGap={2}
            onMouseLeave={() => setActiveIndex(-1)}
          >
            <CartesianGrid
              strokeDasharray="3 6"
              stroke="#e5e7eb"
              strokeOpacity={0.65}
              vertical={false}
            />
            <XAxis
              dataKey="_label"
              tick={{ fontSize: 11, fill: '#4b5563', fontWeight: 600 }}
              axisLine={{ stroke: '#f3f4f6' }}
              tickLine={false}
              dy={10}
              interval={0}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, yMax]}
              tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              width={28}
              tickCount={5}
            />
            <Tooltip
              content={<StackedTooltip />}
              cursor={{ fill: 'rgba(255, 122, 32, 0.07)', radius: 8 }}
              labelFormatter={(label, payload) =>
                payload?.[0]?.payload?._fullName ?? label
              }
            />
            <Bar
              dataKey="overdue"
              stackId="stack"
              fill={STACK_SERIES.overdue.color}
              maxBarSize={52}
              shape={makeStackBarShape('overdue')}
              background={{ fill: '#ffedd5', radius: BAR_RADIUS }}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`overdue-${index}`}
                  fill={STACK_SERIES.overdue.color}
                  fillOpacity={activeIndex === -1 || activeIndex === index ? 1 : ACTIVE_OPACITY}
                />
              ))}
            </Bar>
            <Bar
              dataKey="pending"
              stackId="stack"
              fill={STACK_SERIES.pending.color}
              maxBarSize={52}
              shape={makeStackBarShape('pending')}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`pending-${index}`}
                  fill={STACK_SERIES.pending.color}
                  fillOpacity={activeIndex === -1 || activeIndex === index ? 1 : ACTIVE_OPACITY}
                />
              ))}
            </Bar>
            <Bar
              dataKey="completed"
              stackId="stack"
              fill={STACK_SERIES.completed.color}
              maxBarSize={52}
              shape={makeStackBarShape('completed')}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`completed-${index}`}
                  fill={STACK_SERIES.completed.color}
                  fillOpacity={activeIndex === -1 || activeIndex === index ? 1 : ACTIVE_OPACITY}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <InlineLegend totals={totals} grandTotal={grandTotal} />
    </div>
  )
}
