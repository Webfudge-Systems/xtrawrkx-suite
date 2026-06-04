'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import { Card } from '@webfudge/ui'
import { formatCurrency } from '@webfudge/utils'
import dealService from '../../lib/api/dealService'
import { DEAL_STAGE_OPTIONS } from '../../lib/dealFormOptions'
import { TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react'

const ACCENT = '#ea580c'
const MONTHS_BACK = 6

/** Tiled SVG noise (feTurbulence) for mesh / film-grain overlay on KPI cards */
const GRAIN_BG = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.78" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#noise)"/></svg>'
)}")`

function GrainyKpiCard({ children }) {
  return (
    <div className="relative isolate overflow-hidden rounded-lg border border-orange-400/35 shadow-md">
      {/* White / airy wash on the right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-white"
      />
      {/* Soft ambient tint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-100/50 via-orange-50/25 to-transparent"
      />
      {/* Strong primary glow — bottom-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_130%_120%_at_0%_100%,#ea580c_0%,rgba(234,88,12,0.55)_38%,transparent_62%)]"
      />
      {/* Secondary glow — top-left */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_12%_10%,rgba(251,146,60,0.5)_0%,transparent_55%)]"
      />
      {/* Fine grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.2] mix-blend-overlay"
        style={{
          backgroundImage: GRAIN_BG,
          backgroundRepeat: 'repeat',
          backgroundSize: '180px 180px',
        }}
      />
      {/* Inner edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/30"
      />
      <div className="relative z-10 p-5">{children}</div>
    </div>
  )
}

function normStage(stage) {
  const s = (stage == null ? 'discovery' : String(stage)).trim().toLowerCase()
  if (s === 'closed_won') return 'won'
  if (s === 'closed_lost') return 'lost'
  return s
}

function isWon(stage) {
  const s = normStage(stage)
  return s === 'won'
}

function isLost(stage) {
  const s = normStage(stage)
  return s === 'lost'
}

function dealMoney(d) {
  const n = Number(d?.value)
  return Number.isFinite(n) ? n : 0
}

function pctChangeRounded(prev, curr) {
  if (prev <= 0) return curr <= 0 ? 0 : 100
  return Math.round(((curr - prev) / prev) * 100)
}

function monthLabel(d) {
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

/** Won revenue attributed to calendar month of `updatedAt` (best available without a won-at field). */
function wonRevenueInMonth(deals, year, monthIndex) {
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
  return deals.reduce((sum, d) => {
    if (!isWon(d.stage)) return sum
    const t = new Date(d.updatedAt).getTime()
    if (Number.isNaN(t) || t < start.getTime() || t > end.getTime()) return sum
    return sum + dealMoney(d)
  }, 0)
}

function WonRevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const v = payload[0]?.value ?? 0
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-gray-600">{formatCurrency(v)}</p>
    </div>
  )
}

function StageTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-gray-900">{row?.name}</p>
      <p className="text-gray-600">{row?.count} deals</p>
    </div>
  )
}

export default function SalesAnalyticsWidget({ className = '' }) {
  const [loading, setLoading] = useState(true)
  const [deals, setDeals] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const list = await dealService.fetchAll()
        if (!cancelled) setDeals(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error('SalesAnalyticsWidget:', e)
        if (!cancelled) setDeals([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const computed = useMemo(() => {
    const totalDeals = deals.length
    const wonDealsCount = deals.filter((d) => isWon(d.stage)).length
    const lostDealsCount = deals.filter((d) => isLost(d.stage)).length
    const wonRevenue = deals.filter((d) => isWon(d.stage)).reduce((s, d) => s + dealMoney(d), 0)

    const conversionRate = totalDeals > 0 ? (wonDealsCount / totalDeals) * 100 : 0
    const closed = wonDealsCount + lostDealsCount
    const winRate = closed > 0 ? (wonDealsCount / closed) * 100 : 0

    const now = new Date()
    const rollingStart = new Date(now)
    rollingStart.setDate(rollingStart.getDate() - 30)
    rollingStart.setHours(0, 0, 0, 0)
    const wonLast30Days = deals
      .filter((d) => isWon(d.stage))
      .reduce((sum, d) => {
        const t = new Date(d.updatedAt).getTime()
        if (Number.isNaN(t) || t < rollingStart.getTime()) return sum
        return sum + dealMoney(d)
      }, 0)
    const salesVelocity = wonLast30Days / 30

    const prevAnchor = new Date(now.getFullYear(), now.getMonth() - 1, 15)
    const revenueThisMonth = wonRevenueInMonth(deals, now.getFullYear(), now.getMonth())
    const revenuePrevMonth = wonRevenueInMonth(deals, prevAnchor.getFullYear(), prevAnchor.getMonth())
    const revenueMoMPercent = pctChangeRounded(revenuePrevMonth, revenueThisMonth)

    const knownStages = new Set(DEAL_STAGE_OPTIONS.map((o) => o.value))
    const stageBars = DEAL_STAGE_OPTIONS.map(({ value, label }) => ({
      key: value,
      name: label,
      count: deals.filter((d) => {
        let k = normStage(d.stage)
        if (!knownStages.has(k)) k = 'discovery'
        return k === value
      }).length,
    }))

    const revenueTrend = []
    for (let i = MONTHS_BACK - 1; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const y = ref.getFullYear()
      const m = ref.getMonth()
      const label = monthLabel(ref)
      const revenue = wonRevenueInMonth(deals, y, m)
      revenueTrend.push({ label, revenue })
    }

    return {
      totalDeals,
      conversionRate,
      winRate,
      wonRevenue,
      trends: {
        revenue: { value: wonRevenue, change: revenueMoMPercent },
      },
      salesVelocity,
      revenueMoMPercent,
      stageBars,
      revenueTrend,
    }
  }, [deals])

  if (loading) {
    return (
      <Card className={`p-6 shadow-lg ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-lg bg-gradient-to-br from-orange-100 via-orange-50 to-white opacity-90"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="h-56 bg-gray-100 rounded-lg" />
            <div className="h-56 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </Card>
    )
  }

  const hasRevenueTrend = computed.revenueTrend.some((r) => r.revenue > 0)
  const hasStageData = computed.totalDeals > 0

  return (
    <Card className={`p-6 shadow-lg ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Sales Analytics</h2>
          <p className="text-sm text-gray-600">Performance insights and trends</p>
        </div>
        <BarChart3 className="w-6 h-6 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GrainyKpiCard>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="mb-1 text-sm font-medium text-white/90 drop-shadow-sm">Revenue</p>
              <p className="truncate text-3xl font-black text-white drop-shadow-sm">
                {formatCurrency(computed.wonRevenue, { notation: 'compact' })}
              </p>
              <div className="mt-2 flex items-center text-xs text-white/85 drop-shadow-sm">
                <span
                  className={`mr-2 h-2 w-2 shrink-0 rounded-full ${computed.revenueMoMPercent >= 0 ? 'bg-emerald-300' : 'bg-rose-200'}`}
                />
                <span>
                  {computed.revenueMoMPercent === 0
                    ? '0% '
                    : `${computed.revenueMoMPercent > 0 ? '+' : ''}${computed.revenueMoMPercent}% `}
                  this month vs last month
                </span>
              </div>
            </div>
            <DollarSign className="h-9 w-9 shrink-0 text-brand-primary drop-shadow-sm" aria-hidden />
          </div>
        </GrainyKpiCard>

        <GrainyKpiCard>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="mb-1 text-sm font-medium text-white/90 drop-shadow-sm">Conversion</p>
              <p className="text-3xl font-black text-white drop-shadow-sm">
                {computed.conversionRate.toFixed(1)}%
              </p>
              <div className="mt-2 flex items-center text-xs text-white/85 drop-shadow-sm">
                <span className="mr-2 h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                <span>{computed.winRate.toFixed(1)}% win rate</span>
              </div>
            </div>
            <Target className="h-9 w-9 shrink-0 text-brand-primary drop-shadow-sm" aria-hidden />
          </div>
        </GrainyKpiCard>

        <GrainyKpiCard>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="mb-1 text-sm font-medium text-white/90 drop-shadow-sm">Velocity</p>
              <p className="truncate text-3xl font-black text-white drop-shadow-sm">
                {formatCurrency(computed.salesVelocity, { notation: 'compact' })}
              </p>
              <div className="mt-2 flex items-center text-xs text-white/85 drop-shadow-sm">
                <span className="mr-2 h-2 w-2 shrink-0 rounded-full bg-white/90 shadow-sm ring-1 ring-white/40" />
                <span>Per day (last 30 days, won)</span>
              </div>
            </div>
            <TrendingUp className="h-9 w-9 shrink-0 text-brand-primary drop-shadow-sm" aria-hidden />
          </div>
        </GrainyKpiCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/60 shadow-md p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <p className="text-sm text-gray-600 mt-0.5">Won deal value by calendar month (by last update)</p>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-lg border border-orange-200 bg-orange-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" aria-hidden />
            </div>
          </div>
          <div className="h-60 w-full min-w-0 rounded-xl border border-gray-100 bg-white p-3">
            {hasRevenueTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={computed.revenueTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesRevFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={{ stroke: '#e5e7eb' }}
                    tickFormatter={(v) =>
                      formatCurrency(Number(v), { notation: 'compact', maximumFractionDigits: v >= 100000 ? 0 : 1 })
                    }
                    width={56}
                  />
                  <Tooltip content={<WonRevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={ACCENT}
                    strokeWidth={2}
                    fill="url(#salesRevFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/80 text-sm text-gray-500 px-4 text-center">
                No won revenue in the last six months. Chart updates when deals are marked won.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/60 shadow-md p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Deals by Stage</h3>
              <p className="text-sm text-gray-600 mt-0.5">Current pipeline distribution</p>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-lg border border-orange-200 bg-orange-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-600" aria-hidden />
            </div>
          </div>
          <div className="h-60 w-full min-w-0 rounded-xl border border-gray-100 bg-white py-2.5 pr-2 pb-2.5 pl-1">
            {hasStageData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={computed.stageBars} margin={{ left: 0, right: 8, top: 2, bottom: 2 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={82}
                    tick={{ fontSize: 11, fill: '#374151' }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={4}
                  />
                  <Tooltip content={<StageTooltip />} cursor={{ fill: 'rgba(249, 115, 22, 0.06)' }} />
                  <Bar dataKey="count" name="Deals" fill={ACCENT} radius={[0, 6, 6, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/80 text-sm text-gray-500 px-4 text-center">
                No deals yet. Create deals to see stage distribution.
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}



