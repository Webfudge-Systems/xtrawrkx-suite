'use client'

import { useMemo, useState } from 'react'
import { KPICard } from '@webfudge/ui'
import { Banknote, Clock3, Receipt, Wallet } from 'lucide-react'
import type { Expense, Invoice, TimeEntry } from '@/lib/types'
import { MOCK_EXPENSES, MOCK_INVOICES, MOCK_TIME_ENTRIES } from '@/lib/mock-data'
import { formatCurrency } from '@webfudge/utils'
import BooksSalesAnalyticsWidget from './BooksSalesAnalyticsWidget'
import BooksSalesPipelineWidget from './BooksSalesPipelineWidget'

const kpiColorSchemes = ['orange', 'orange', 'orange', 'orange'] as const

function KpiCards({
  metrics,
}: {
  metrics: { totalReceivables: number; totalPayables: number; unbilledHours: number; unbilledExpenses: number }
}) {
  const items = [
    {
      title: 'Total Receivables',
      value: formatCurrency(metrics.totalReceivables),
      subtitle: 'Current + overdue',
      icon: Receipt,
    },
    {
      title: 'Total Payables',
      value: formatCurrency(metrics.totalPayables),
      subtitle: 'Current + overdue',
      icon: Wallet,
    },
    {
      title: 'Unbilled Hours',
      value: `${metrics.unbilledHours.toFixed(1)}h`,
      subtitle: 'No unbilled time entries',
      icon: Clock3,
    },
    {
      title: 'Unbilled Expenses',
      value: formatCurrency(metrics.unbilledExpenses),
      subtitle: 'No pending billable expenses',
      icon: Banknote,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => (
        <KPICard
          key={item.title}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          icon={item.icon}
          colorScheme={kpiColorSchemes[index] ?? 'orange'}
          iconColorScheme="orange"
        />
      ))}
    </div>
  )
}

export default function DashboardTab({ hideKpis = false }: { hideKpis?: boolean }) {
  const [invoices] = useState<Invoice[]>(hideKpis ? [] : MOCK_INVOICES)
  const [expenses] = useState<Expense[]>(hideKpis ? [] : MOCK_EXPENSES)
  const [timeEntries] = useState<TimeEntry[]>(hideKpis ? [] : MOCK_TIME_ENTRIES)

  const metrics = useMemo(() => {
    const totalReceivables = invoices.reduce((sum, invoice) => sum + (invoice.balanceDue ?? invoice.total ?? 0), 0)
    const totalPayables = expenses.reduce((sum, expense) => sum + (expense.amount ?? 0), 0)
    const unbilledHours = timeEntries.filter((item) => item.billable && !item.invoiced).reduce((sum, item) => sum + item.hours, 0)
    const unbilledExpenses = expenses.filter((item) => item.billable).reduce((sum, item) => sum + item.amount, 0)
    return { totalReceivables, totalPayables, unbilledHours, unbilledExpenses }
  }, [expenses, invoices, timeEntries])

  return (
    <div className="space-y-6">
      {!hideKpis && <KpiCards metrics={metrics} />}
      <BooksSalesAnalyticsWidget />
      <BooksSalesPipelineWidget />
    </div>
  )
}

export { KpiCards }

