'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Layers, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksAccountantJournalTableColumns } from '@/app/_components/booksAccountantTableColumns'
import BooksChartPlaceholderCard from '@/app/accountant/_components/BooksChartPlaceholderCard'
import { useBooksBulkUpdatesStore } from '@/lib/mock-data/accountant/stores'
import type { AccountantJournalRow } from '@/lib/mock-data/accountant/seeds'
import { countStatusTab, matchesStatusTab, statusFilterOptions } from '@/lib/books/listHelpers'

const BASE = '/accountant/bulk-update'
const STATUS_GROUPS = { draft: ['draft'], completed: ['completed'] }

export default function BulkUpdatePage() {
  const { bulkUpdates, deleteRecord, getById } = useBooksBulkUpdatesStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: AccountantJournalRow) => setDeleteId(row.id), [])
  const columns = useBooksAccountantJournalTableColumns({
    numberLabel: 'JOB#',
    onRequestDelete: handleRequestDelete,
    deletingId,
    basePath: BASE,
  })

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteRecord(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteId, deleteRecord, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All', count: bulkUpdates.length },
      { key: 'draft', label: 'Draft', count: countStatusTab(bulkUpdates, 'draft', 'status', STATUS_GROUPS) },
      { key: 'completed', label: 'Completed', count: countStatusTab(bulkUpdates, 'completed', 'status', STATUS_GROUPS) },
    ],
    [bulkUpdates]
  )

  return (
    <>
      <BooksListPageShell
        title="Bulk Update"
        subtitle="Run bulk updates across accounts and tax codes."
        kpis={[
          { title: 'All Jobs', value: bulkUpdates.length, subtitle: `${bulkUpdates.length} bulk jobs`, icon: Layers },
          { title: 'Draft', value: countStatusTab(bulkUpdates, 'draft', 'status', STATUS_GROUPS), icon: FileText },
          { title: 'Completed', value: countStatusTab(bulkUpdates, 'completed', 'status', STATUS_GROUPS), icon: TrendingUp },
          { title: 'Users', value: 1, subtitle: '1 contributor', icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesStatusTab(row, tab, 'status', STATUS_GROUPS)}
        topBlocks={
          <>
            <BooksChartPlaceholderCard title="Bulk Update History" />
            <BooksChartPlaceholderCard title="Records Updated" />
          </>
        }
        columns={columns}
        data={bulkUpdates}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Layers}
        emptyTitle="No bulk updates yet"
        emptyDescription="Bulk update jobs will appear here when run."
        addHref={`${BASE}/new`}
        addLabel="New bulk update"
        searchPlaceholder="Search bulk updates..."
        exportFilePrefix="books-bulk-update"
        sortEntity="bulkUpdate"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.journalNumber}
        entityLabel="Bulk Update"
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
