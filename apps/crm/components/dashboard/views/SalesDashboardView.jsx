'use client'

import { useState, useEffect } from 'react'
import { Users, DollarSign, TrendingUp, Target } from 'lucide-react'
import { formatCurrency } from '@webfudge/utils'
import { DashboardKpiRow } from '@webfudge/ui'
import { fetchSalesKpis } from '../../../lib/api/dashboardDataService'
import SalesAnalyticsWidget from '../SalesAnalyticsWidget'
import LeadSourcesWidget from '../LeadSourcesWidget'
import SalesExtendedAnalytics from '../sales/SalesExtendedAnalytics'
import SalesProposalsWidget from '../sales/SalesProposalsWidget'
import SalesInvoicesWidget from '../sales/SalesInvoicesWidget'

function formatChange(c) {
  if (c === 0) return '0'
  return c > 0 ? `+${c}%` : `${c}%`
}

export default function SalesDashboardView({ canViewAnalytics, canViewLeads }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const kpis = await fetchSalesKpis()
      if (!cancelled) {
        setData(kpis)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const changes = data?.changes || {}
  const stats = [
    {
      title: 'Total Leads',
      value: loading ? '—' : String(data?.totalLeads ?? 0),
      change: formatChange(changes.leadsChange ?? 0),
      changeType: (changes.leadsChange ?? 0) >= 0 ? 'increase' : 'decrease',
      icon: Users,
    },
    {
      title: 'Pipeline Value',
      value: loading ? '—' : formatCurrency(data?.pipelineValue ?? 0, { notation: 'compact' }),
      change: formatChange(changes.pipelineValueChange ?? 0),
      changeType: (changes.pipelineValueChange ?? 0) >= 0 ? 'increase' : 'decrease',
      icon: DollarSign,
    },
    {
      title: 'Conversion Rate',
      value: loading ? '—' : `${data?.conversionRate ?? 0}%`,
      change: formatChange(changes.conversionRateChange ?? 0),
      changeType: (changes.conversionRateChange ?? 0) >= 0 ? 'increase' : 'decrease',
      icon: TrendingUp,
    },
    {
      title: 'Active Deals',
      value: loading ? '—' : String(data?.activeDeals ?? 0),
      change: formatChange(changes.dealsChange ?? 0),
      changeType: (changes.dealsChange ?? 0) >= 0 ? 'increase' : 'decrease',
      icon: Target,
    },
  ]

  return (
    <div className="space-y-6">
      <DashboardKpiRow stats={stats} />

      {canViewAnalytics ? (
        <div className="space-y-6">
          <SalesAnalyticsWidget />

          <div
            className={`grid grid-cols-1 items-stretch gap-6 ${
              canViewLeads ? 'xl:grid-cols-3' : 'xl:grid-cols-2'
            }`}
          >
            <SalesExtendedAnalytics className="h-full min-h-0" />
            {canViewLeads ? <LeadSourcesWidget dashboardRow className="h-full min-h-0" /> : null}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SalesProposalsWidget />
            <SalesInvoicesWidget />
          </div>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center text-sm text-gray-500">
          Analytics modules are not enabled for your role.
        </p>
      )}
    </div>
  )
}
