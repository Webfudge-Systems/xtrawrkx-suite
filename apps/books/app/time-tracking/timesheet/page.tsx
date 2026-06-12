'use client'

import { useCallback, useMemo, useState } from 'react'
import { Briefcase, Clock3, FileText, Timer } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksTimeEntriesTableColumns } from '@/app/_components/booksTimeTrackingTableColumns'
import { useBooksTimeEntriesStore } from '@/lib/mock-data/time-tracking/stores'
import type { TimeEntryRow } from '@/lib/mock-data/time-tracking/seeds'

const BASE = '/time-tracking/timesheet'

export default function TimesheetPage() {
  const { timeEntries, deleteTimeEntry, getById } = useBooksTimeEntriesStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const summary = useMemo(() => {
    const totalHours = timeEntries.reduce((sum, e) => sum + e.hours, 0)
    const billableHours = timeEntries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0)
    const unbilled = timeEntries.filter((e) => e.billable && !e.invoiced).length
    const projectCount = new Set(timeEntries.map((e) => e.projectId)).size
    return { totalHours, billableHours, unbilled, projectCount }
  }, [timeEntries])

  const handleRequestDelete = useCallback((row: TimeEntryRow) => setDeleteId(row.id), [])
  const columns = useBooksTimeEntriesTableColumns({ onRequestDelete: handleRequestDelete, deletingId, basePath: BASE })

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteTimeEntry(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteId, deleteTimeEntry, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Entries', count: timeEntries.length },
      {
        key: 'billable',
        label: 'Billable',
        count: timeEntries.filter((e) => e.billable).length,
      },
      {
        key: 'unbilled',
        label: 'Unbilled',
        count: timeEntries.filter((e) => e.billable && !e.invoiced).length,
      },
    ],
    [timeEntries]
  )

  return (
    <>
      <BooksListPageShell
        title="Timesheet"
        subtitle="Track logged hours across projects."
        kpis={[
          { title: 'All Entries', value: timeEntries.length, subtitle: 'Time entries', icon: Timer },
          { title: 'Total Hours', value: summary.totalHours.toFixed(1), subtitle: 'Logged', icon: Clock3 },
          { title: 'Billable Hours', value: summary.billableHours.toFixed(1), subtitle: 'Ready to bill', icon: FileText },
          { title: 'Projects', value: summary.projectCount, subtitle: 'With time logged', icon: Briefcase },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => {
          if (tab === 'all') return true
          if (tab === 'billable') return row.billable
          if (tab === 'unbilled') return row.billable && !row.invoiced
          return true
        }}
        columns={columns}
        data={timeEntries}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Clock3}
        emptyTitle="No time entries yet"
        emptyDescription="Log time against a project to see entries here."
        searchPlaceholder="Search timesheet..."
        exportFilePrefix="books-timesheet"
        sortEntity="timeEntry"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.task}
        entityLabel="Time Entry"
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
