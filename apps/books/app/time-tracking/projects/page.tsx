'use client'

import { useEffect, useMemo, useState } from 'react'
import { booksApi } from '@/lib/api'
import type { Project } from '@/lib/types'
import { Briefcase, Clock3, FileText, Wallet } from 'lucide-react'
import { formatCurrency } from '@webfudge/utils'
import BooksSalesListShell from '../../sales/_components/BooksSalesListShell'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'archived'>('all')

  useEffect(() => {
    booksApi.fetchProjects().then((res) => setProjects(res.data ?? [])).catch(() => setProjects([]))
  }, [])

  const summary = useMemo(() => {
    const totalLoggedHours = projects.reduce((sum, p) => sum + (p.totalLoggedHours ?? 0), 0)
    const totalBillableHours = projects.reduce((sum, p) => sum + (p.billableHours ?? 0), 0)
    const totalUnbilledAmount = projects.reduce((sum, p) => sum + (p.unbilledAmount ?? 0), 0)
    return { totalLoggedHours, totalBillableHours, totalUnbilledAmount }
  }, [projects])

  const tabStats = useMemo(() => {
    const active = projects.filter((p) => String((p as any).booksStatus ?? p.status ?? '').toLowerCase() === 'active').length
    const completed = projects.filter((p) => String((p as any).booksStatus ?? p.status ?? '').toLowerCase() === 'completed').length
    const archived = projects.filter((p) => String((p as any).booksStatus ?? p.status ?? '').toLowerCase() === 'archived').length
    return { all: projects.length, active, completed, archived }
  }, [projects])

  const filteredProjects = useMemo(() => {
    if (activeTab === 'all') return projects
    return projects.filter(
      (p) => String((p as any).booksStatus ?? p.status ?? '').toLowerCase() === activeTab
    )
  }, [activeTab, projects])

  return (
    <BooksSalesListShell
      title="Projects"
      subtitle="Track projects and logged hours."
      kpis={[
        {
          title: 'All Projects',
          value: tabStats.all,
          subtitle: tabStats.all === 0 ? 'No projects' : `${tabStats.all} project${tabStats.all === 1 ? '' : 's'}`,
          icon: Briefcase,
          colorScheme: 'orange',
        },
        {
          title: 'Logged Hours',
          value: Number(summary.totalLoggedHours ?? 0).toFixed(1),
          subtitle: 'Total tracked',
          icon: Clock3,
          colorScheme: 'orange',
        },
        {
          title: 'Billable Hours',
          value: Number(summary.totalBillableHours ?? 0).toFixed(1),
          subtitle: 'Ready to bill',
          icon: FileText,
          colorScheme: 'orange',
        },
        {
          title: 'Unbilled Amount',
          value: formatCurrency(summary.totalUnbilledAmount),
          subtitle: 'Pending billing',
          icon: Wallet,
          colorScheme: 'orange',
        },
      ]}
      tabs={[
        { key: 'all', label: 'All Projects', count: tabStats.all },
        { key: 'active', label: 'Active', count: tabStats.active },
        { key: 'completed', label: 'Completed', count: tabStats.completed },
        { key: 'archived', label: 'Archived', count: tabStats.archived },
      ]}
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t as typeof activeTab)}
      columns={[
        { key: 'name', label: 'PROJECT NAME' },
        { key: 'customerId', label: 'CUSTOMER' },
        { key: 'billingMethod', label: 'BILLING METHOD' },
        { key: 'totalLoggedHours', label: 'TOTAL LOGGED HOURS' },
        { key: 'billableHours', label: 'BILLABLE HOURS' },
        { key: 'unbilledAmount', label: 'UNBILLED AMOUNT', render: (v: number) => formatCurrency(v ?? 0) },
        { key: 'budget', label: 'BUDGET', render: (v: number) => formatCurrency(v ?? 0) },
      ]}
      data={filteredProjects as any[]}
      emptyIcon={Briefcase}
      emptyTitle="No projects found"
      emptyDescription="Create your first project to start tracking time and billing."
      addHref="/time-tracking/projects/new"
      addLabel="Add Project"
    />
  )
}
