'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Filter, Clock } from 'lucide-react'
import { fetchSalesDashboardData } from '../../../lib/api/dashboardDataService'
import {
  DashboardChartPanel,
  DashboardChartEmpty,
  DASHBOARD_CHART_ACCENT,
  DashboardBarTooltip,
  DASHBOARD_BAR_TOOLTIP_CURSOR,
} from '@webfudge/ui'

function funnelUnit(_value, row) {
  const n = String(row?.name ?? '').toLowerCase()
  if (n === 'won') return 'won deal' + (_value === 1 ? '' : 's')
  if (n === 'meetings') return 'scheduled meeting' + (_value === 1 ? '' : 's')
  if (n === 'proposals') return 'active proposal' + (_value === 1 ? '' : 's')
  if (n === 'qualified') return 'qualified lead' + (_value === 1 ? '' : 's')
  return 'lead' + (_value === 1 ? '' : 's')
}

function normStage(stage) {
  const s = String(stage ?? 'discovery').trim().toLowerCase()
  if (s === 'closed_won') return 'won'
  if (s === 'closed_lost') return 'lost'
  return s
}

function isWon(stage) {
  const s = normStage(stage)
  return s === 'won'
}

export default function SalesExtendedAnalytics({ className = '' }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    deals: [],
    leads: [],
    meetings: [],
    proposals: [],
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const d = await fetchSalesDashboardData()
      if (!cancelled) {
        setData(d)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const charts = useMemo(() => {
    const { deals, leads, meetings, proposals } = data
    const now = new Date()

    const funnel = [
      { name: 'Leads', value: leads.length },
      {
        name: 'Qualified',
        value: leads.filter((l) => String(l.status || '').toUpperCase() === 'QUALIFIED').length,
      },
      {
        name: 'Meetings',
        value: meetings.filter((m) => String(m.status || '').toLowerCase() === 'scheduled').length,
      },
      {
        name: 'Proposals',
        value: proposals.filter((p) => ['SENT', 'ACCEPTED'].includes(String(p.status || '').toUpperCase()))
          .length,
      },
      { name: 'Won', value: deals.filter((d) => isWon(d.stage)).length },
    ]

    const agingBuckets = [
      { name: '0–7d', count: 0 },
      { name: '8–30d', count: 0 },
      { name: '31–60d', count: 0 },
      { name: '60d+', count: 0 },
    ]
    for (const d of deals) {
      if (isWon(d.stage) || normStage(d.stage) === 'lost') continue
      const age = Math.floor((now - new Date(d.updatedAt || d.createdAt)) / 86400000)
      if (age <= 7) agingBuckets[0].count += 1
      else if (age <= 30) agingBuckets[1].count += 1
      else if (age <= 60) agingBuckets[2].count += 1
      else agingBuckets[3].count += 1
    }

    return { funnel, agingBuckets }
  }, [data])

  return (
    <>
      <DashboardChartPanel
        title="Sales funnel"
        subtitle="Leads → Qualified → Meetings → Proposals → Won"
        icon={Filter}
        loading={loading}
        fullHeight
        brandChart
        className={className}
      >
        {!loading && charts.funnel.every((f) => f.value === 0) ? (
          <DashboardChartEmpty message="No funnel data yet." />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={192}>
            <BarChart data={charts.funnel} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
              <Tooltip
                content={<DashboardBarTooltip unit={funnelUnit} />}
                cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
              />
              <Bar dataKey="value" fill={DASHBOARD_CHART_ACCENT} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </DashboardChartPanel>

      <DashboardChartPanel
        title="Pipeline aging"
        subtitle="Open deals by days since last update"
        icon={Clock}
        loading={loading}
        fullHeight
        brandChart
        className={className}
      >
        {!loading && charts.agingBuckets.every((b) => b.count === 0) ? (
          <DashboardChartEmpty message="No open deals in pipeline." />
        ) : (
          <ResponsiveContainer width="100%" height="100%" minHeight={192}>
            <BarChart data={charts.agingBuckets} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
              <Tooltip
                content={
                  <DashboardBarTooltip
                    unit={(v) => `open deal${v === 1 ? '' : 's'}`}
                  />
                }
                cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
              />
              <Bar dataKey="count" fill="#c2410c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </DashboardChartPanel>
    </>
  )
}
