'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Sector } from 'recharts'
import { PieChart as PieChartIcon, Info, ChevronRight } from 'lucide-react'
import { Card, LoadingSpinner, EmptyState } from '@webfudge/ui'
import { fetchManagerDashboardData } from '../../../lib/api/dashboardDataService'
import { scrollbarClass } from '../leadsMeetingsShared'
import { DonutChartFrame, DONUT_TOOLTIP_WRAPPER_STYLE, PRIMARY_ORANGE_SHADES } from '@webfudge/ui'

const UNASSIGNED_COLOR = '#94a3b8'
const LIGHT_ORANGE_FILLS = new Set(['#fdba74', '#fcd34d'])

function initialsOnFill(bgColor) {
  return LIGHT_ORANGE_FILLS.has(bgColor) ? 'text-orange-950' : 'text-white'
}

function assigneeId(record) {
  const a = record?.assignedTo
  if (a == null) return null
  if (typeof a === 'object') return a.id ?? a.documentId
  return a
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  if (parts.length === 1 && parts[0].length) return parts[0].slice(0, 2).toUpperCase()
  return '?'
}

const TRACK_FILL = '#ffedd5'
const CHART_INNER = 54
const CHART_OUTER = 86

function shortenAssigneeLabel(name) {
  const s = String(name || '').trim()
  if (!s) return 'Unknown'
  if (s.includes('@')) {
    const local = s.split('@')[0]
    return local.length > 18 ? `${local.slice(0, 16)}…` : local
  }
  return s.length > 22 ? `${s.slice(0, 20)}…` : s
}

function ActiveSlice(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 5}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      cornerRadius={5}
    />
  )
}

function AssignmentDonutChart({ rows, pieData, total }) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const trackData = [{ value: 1 }]

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-orange-100/70 bg-gradient-to-b from-orange-50/50 via-white to-white px-4 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_35%,rgba(255,122,32,0.14),transparent_68%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/20 blur-2xl"
      />

      <DonutChartFrame total={total}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={trackData}
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
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={CHART_INNER}
              outerRadius={CHART_OUTER}
              paddingAngle={rows.length > 1 ? 4 : 0}
              cornerRadius={5}
              stroke="#ffffff"
              strokeWidth={3}
              activeIndex={activeIndex}
              activeShape={ActiveSlice}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {rows.map((row) => (
                <Cell key={row.id} fill={row.color} />
              ))}
            </Pie>
            <Tooltip
              content={<AssignmentTooltip />}
              wrapperStyle={DONUT_TOOLTIP_WRAPPER_STYLE}
            />
          </PieChart>
        </ResponsiveContainer>
      </DonutChartFrame>

      {rows.length > 0 && rows.length <= 5 ? (
        <div className="relative mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-orange-100/80 pt-4">
          {rows.map((row) => (
            <div key={row.id} className="flex max-w-[8.5rem] items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white"
                style={{ backgroundColor: row.color }}
              />
              <span className="truncate text-[11px] font-medium text-gray-600" title={row.name}>
                {shortenAssigneeLabel(row.name)}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-orange-700">{row.pct}%</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function AssignmentTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="min-w-[9rem] rounded-xl border border-gray-200/90 bg-white/95 px-3 py-2.5 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
      <p className="text-sm font-semibold text-gray-900">{shortenAssigneeLabel(row.name)}</p>
      <p className="mt-1 text-xs text-gray-600">
        <span className="font-bold tabular-nums text-gray-900">{row.value}</span> lead
        {row.value === 1 ? '' : 's'}
        {row.pct != null ? (
          <>
            {' '}
            · <span className="font-semibold text-orange-600">{row.pct}%</span>
          </>
        ) : null}
      </p>
    </div>
  )
}

export default function LeadAssignmentDonutWidget({ className = '' }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ leads: [], nameById: new Map() })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const d = await fetchManagerDashboardData()
      if (!cancelled) {
        setData(d)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const { rows, total, assigneeCount, unassignedCount } = useMemo(() => {
    const nameById = data.nameById || new Map()
    const leadCounts = new Map()
    let unassigned = 0
    for (const lead of data.leads) {
      const id = assigneeId(lead)
      if (id == null) {
        unassigned += 1
        continue
      }
      const key = String(id)
      leadCounts.set(key, (leadCounts.get(key) || 0) + 1)
    }

    const entries = [
      ...[...leadCounts.entries()].map(([id, value]) => ({
        id,
        name: nameById.get(String(id)) || `Member ${id}`,
        value,
        isUnassigned: false,
      })),
      ...(unassigned
        ? [{ id: 'unassigned', name: 'Unassigned', value: unassigned, isUnassigned: true }]
        : []),
    ].sort((a, b) => b.value - a.value)

    const sum = entries.reduce((s, x) => s + x.value, 0)
    const max = entries.reduce((m, x) => Math.max(m, x.value), 0) || 1

    const rows = entries.slice(0, 8).map((entry, i) => {
      const pct = sum > 0 ? Math.round((entry.value / sum) * 1000) / 10 : 0
      const color = entry.isUnassigned
        ? UNASSIGNED_COLOR
        : PRIMARY_ORANGE_SHADES[i % PRIMARY_ORANGE_SHADES.length]
      return {
        ...entry,
        pct,
        color,
        displayName: shortenAssigneeLabel(entry.name),
        initials: initialsFromName(entry.name),
        barPct: Math.round((entry.value / max) * 100),
      }
    })

    return {
      rows,
      total: sum,
      assigneeCount: leadCounts.size,
      unassignedCount: unassigned,
    }
  }, [data])

  const pieData = useMemo(
    () => rows.map((r) => ({ name: r.name, value: r.value, pct: r.pct })),
    [rows]
  )

  return (
    <Card className={`flex flex-col p-6 shadow-lg ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Lead assignment</h2>
            <span title="Share of leads per team member">
              <Info className="h-4 w-4 text-gray-400" aria-hidden />
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-600">Distribution across assignees</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 shadow-sm">
            <PieChartIcon className="h-[22px] w-[22px] text-orange-600" aria-hidden />
          </div>
          <Link
            href="/sales/lead-companies"
            className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            View all
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="flex gap-2">
            <div className="h-8 flex-1 rounded-full bg-gray-100" />
            <div className="h-8 flex-1 rounded-full bg-gray-100" />
          </div>
          <div className="mx-auto h-40 w-40 rounded-full bg-gray-100" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={PieChartIcon}
          title="No assignments yet"
          description="Assign lead companies to team members to see distribution."
          className="py-10"
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-200/80">
              <span className="tabular-nums">{total}</span> total lead{total === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200/90">
              <span className="tabular-nums">{assigneeCount}</span> assignee{assigneeCount === 1 ? '' : 's'}
            </span>
            {unassignedCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/90">
                <span className="tabular-nums">{unassignedCount}</span> unassigned
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-5">
            <AssignmentDonutChart rows={rows} pieData={pieData} total={total} />

            <ul className={`space-y-2 ${scrollbarClass} max-h-[min(16rem,40vh)]`}>
              {rows.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-gray-200 hover:bg-gray-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${initialsOnFill(row.color)}`}
                      style={{ backgroundColor: row.color }}
                    >
                      {row.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900" title={row.name}>
                          {row.displayName}
                        </p>
                        <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-gray-700">
                          {row.pct}%
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs tabular-nums text-gray-500">
                        {row.value} lead{row.value === 1 ? '' : 's'}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-[width] duration-300"
                          style={{ width: `${row.barPct}%`, backgroundColor: row.color }}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Card>
  )
}
