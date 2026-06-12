'use client'

import { useCallback, useMemo, useState } from 'react'
import { Briefcase, Clock3, FileText, Wallet } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksProjectsTableColumns } from '@/app/_components/booksTimeTrackingTableColumns'
import { formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import { useBooksProjectsStore } from '@/lib/mock-data/time-tracking/stores'
import type { ProjectRow } from '@/lib/mock-data/time-tracking/seeds'
import { countStatusTab, matchesStatusTab, statusFilterOptions } from '@/lib/books/listHelpers'

const BASE = '/time-tracking/projects'
const STATUS_GROUPS = {
  active: ['active'],
  completed: ['completed'],
  archived: ['archived'],
}

function matchesProjectTab(row: ProjectRow, tabKey: string) {
  return matchesStatusTab(row, tabKey, 'status', STATUS_GROUPS)
}

export default function ProjectsPage() {
  const { projects, deleteProject, getById } = useBooksProjectsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const summary = useMemo(() => {
    const totalLoggedHours = projects.reduce((sum, p) => sum + (p.totalLoggedHours ?? 0), 0)
    const totalBillableHours = projects.reduce((sum, p) => sum + (p.billableHours ?? 0), 0)
    const totalUnbilledAmount = projects.reduce((sum, p) => sum + (p.unbilledAmount ?? 0), 0)
    return { totalLoggedHours, totalBillableHours, totalUnbilledAmount }
  }, [projects])

  const handleRequestDelete = useCallback((row: ProjectRow) => setDeleteId(row.id), [])
  const columns = useBooksProjectsTableColumns({ onRequestDelete: handleRequestDelete, deletingId, basePath: BASE })

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteProject(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteId, deleteProject, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Projects', count: projects.length },
      { key: 'active', label: 'Active', count: countStatusTab(projects, 'active', 'status', STATUS_GROUPS) },
      { key: 'completed', label: 'Completed', count: countStatusTab(projects, 'completed', 'status', STATUS_GROUPS) },
      { key: 'archived', label: 'Archived', count: countStatusTab(projects, 'archived', 'status', STATUS_GROUPS) },
    ],
    [projects]
  )

  return (
    <>
      <BooksListPageShell
        title="Projects"
        subtitle="Track projects and logged hours."
        kpis={[
          {
            title: 'All Projects',
            value: projects.length,
            subtitle: `${projects.length} project${projects.length === 1 ? '' : 's'}`,
            icon: Briefcase,
          },
          {
            title: 'Logged Hours',
            value: summary.totalLoggedHours.toFixed(1),
            subtitle: 'Total tracked',
            icon: Clock3,
          },
          {
            title: 'Billable Hours',
            value: summary.totalBillableHours.toFixed(1),
            subtitle: 'Ready to bill',
            icon: FileText,
          },
          {
            title: 'Unbilled Amount',
            value: formatSalesMoney(summary.totalUnbilledAmount),
            subtitle: 'Pending billing',
            icon: Wallet,
          },
        ]}
        tabs={tabs}
        tabFilter={matchesProjectTab}
        filterFields={[
          {
            key: 'status',
            label: 'Status',
            options: statusFilterOptions(['active', 'completed', 'archived']),
          },
          {
            key: 'billingMethod',
            label: 'Billing Method',
            options: statusFilterOptions(['FixedCost', 'DailyRatePerUser', 'BasedOnTasks']),
          },
        ]}
        columns={columns}
        data={projects}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Briefcase}
        emptyTitle="No projects yet"
        emptyDescription="Create your first project to start tracking time and billing."
        addHref={`${BASE}/new`}
        addLabel="Add project"
        searchPlaceholder="Search projects..."
        exportFilePrefix="books-projects"
        sortEntity="project"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.name}
        entityLabel="Project"
        deleting={deletingId != null}
        onClose={() => {
          if (deletingId) return
          setDeleteId(null)
        }}
        onConfirm={confirmDelete}
      />
    </>
  )
}
