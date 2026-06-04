'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Sector } from 'recharts'
import { PieChart as PieChartIcon, ChevronRight } from 'lucide-react'
import { Card, LoadingSpinner, EmptyState } from '@webfudge/ui'
import leadCompanyService from '../../lib/api/leadCompanyService'
import { SOURCE_OPTIONS } from '../../lib/dealFormOptions'
import {
  DashboardChartCanvas,
  PRIMARY_ORANGE_SHADES,
  DonutChartFrame,
  DONUT_TOOLTIP_WRAPPER_STYLE,
} from '@webfudge/ui'

const TRACK_FILL = '#ffedd5'
const CHART_INNER = 54
const CHART_OUTER = 86

function sourceLabel(key) {
  if (!key || key === 'UNKNOWN') return 'Not set'
  const u = String(key).toUpperCase()
  const opt = SOURCE_OPTIONS.find((o) => o.value === u)
  if (opt) return opt.label
  return String(key)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function aggregateBySource(companies) {
  const map = new Map()
  for (const c of companies) {
    const raw = c?.source
    const k =
      raw != null && String(raw).trim() !== '' ? String(raw).trim().toUpperCase() : 'UNKNOWN'
    map.set(k, (map.get(k) || 0) + 1)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
}

function shortenSourceLabel(name) {
  const s = String(name || '').trim()
  if (!s) return '—'
  return s.length > 18 ? `${s.slice(0, 16)}…` : s
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

function SourceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="min-w-[9rem] rounded-xl border border-gray-200/90 bg-white/95 px-3 py-2.5 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
      <p className="text-sm font-semibold text-gray-900">{row.name}</p>
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

function SourceDonutChart({ rows, pieData, total }) {
  const [activeIndex, setActiveIndex] = useState(-1)
  const trackData = [{ value: 1 }]

  return (
    <DashboardChartCanvas className="min-h-[15rem] flex-1">
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
                <Cell key={row.key} fill={row.color} />
              ))}
            </Pie>
            <Tooltip
              content={<SourceTooltip />}
              wrapperStyle={DONUT_TOOLTIP_WRAPPER_STYLE}
            />
          </PieChart>
        </ResponsiveContainer>
      </DonutChartFrame>

      {rows.length > 0 && rows.length <= 6 ? (
        <div className="relative mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-orange-100/80 pt-4">
          {rows.map((row) => (
            <div key={row.key} className="flex max-w-[8.5rem] items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white"
                style={{ backgroundColor: row.color }}
              />
              <span className="truncate text-[11px] font-medium text-gray-600" title={row.label}>
                {shortenSourceLabel(row.label)}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-orange-700">{row.pct}%</span>
            </div>
          ))}
        </div>
      ) : null}
    </DashboardChartCanvas>
  )
}

export default function LeadSourcesWidget({ className = '', dashboardRow = false }) {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const list = await leadCompanyService.fetchAll()
        if (!cancelled) setCompanies(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error('LeadSourcesWidget:', e)
        if (!cancelled) setCompanies([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const { rows, total, sourceCount, pieData } = useMemo(() => {
    const entries = aggregateBySource(companies)
    const sum = entries.reduce((s, [, n]) => s + n, 0)

    const rows = entries.slice(0, 8).map(([key, count], i) => {
      const pct = sum > 0 ? Math.round((count / sum) * 1000) / 10 : 0
      return {
        key: String(key),
        label: sourceLabel(key),
        value: count,
        pct,
        color: PRIMARY_ORANGE_SHADES[i % PRIMARY_ORANGE_SHADES.length],
      }
    })

    const pieData = rows.map((r) => ({ name: r.label, value: r.value, pct: r.pct, key: r.key }))

    return {
      rows,
      total: sum,
      sourceCount: entries.length,
      pieData,
    }
  }, [companies])

  const shellClass = dashboardRow
    ? `flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/60 p-5 shadow-md ${className}`
    : `flex flex-col p-6 shadow-lg ${className}`

  return (
    <Card className={shellClass}>
      <div className={`flex shrink-0 items-start justify-between gap-4 ${dashboardRow ? 'mb-4' : 'mb-5'}`}>
        <div className="min-w-0 flex-1">
          <h2 className={`font-semibold text-gray-900 ${dashboardRow ? 'text-lg' : 'text-xl'}`}>
            Lead sources
          </h2>
          <p className="mt-0.5 text-sm text-gray-600">Where your lead companies originate</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div
            className={`flex items-center justify-center border border-orange-200 bg-orange-50 shadow-sm ${
              dashboardRow ? 'h-10 w-10 rounded-lg' : 'h-11 w-11 rounded-xl'
            }`}
          >
            <PieChartIcon
              className={dashboardRow ? 'h-5 w-5 text-orange-600' : 'h-[22px] w-[22px] text-orange-600'}
              aria-hidden
            />
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
        <div className={`space-y-4 animate-pulse ${dashboardRow ? 'min-h-[15rem] flex-1' : ''}`}>
          <div className="flex gap-2">
            <div className="h-8 w-24 rounded-full bg-gray-100" />
            <div className="h-8 w-20 rounded-full bg-gray-100" />
          </div>
          <div className="mx-auto h-40 w-40 rounded-full bg-gray-100" />
        </div>
      ) : total === 0 ? (
        <EmptyState
          icon={PieChartIcon}
          title="No lead sources yet"
          description="Add lead companies to see where they come from."
          className={dashboardRow ? 'min-h-[15rem] flex-1 py-10' : 'py-10'}
          action={
            <Link
              href="/sales/lead-companies/new"
              className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              Add a lead
              <ChevronRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <div className={`flex min-h-0 flex-col gap-4 ${dashboardRow ? 'flex-1' : ''}`}>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-200/80">
              <span className="tabular-nums">{total}</span> total lead{total === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200/90">
              <span className="tabular-nums">{sourceCount}</span> source{sourceCount === 1 ? '' : 's'}
            </span>
          </div>

          <SourceDonutChart rows={rows} pieData={pieData} total={total} />
        </div>
      )}
    </Card>
  )
}
