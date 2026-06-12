'use client'

import { useCallback, useMemo, useState } from 'react'
import { BookOpen, FileText, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksAccountantJournalTableColumns } from '@/app/_components/booksAccountantTableColumns'
import BooksChartPlaceholderCard from '@/app/accountant/_components/BooksChartPlaceholderCard'
import { useBooksManualJournalsStore } from '@/lib/mock-data/accountant/stores'
import type { AccountantJournalRow } from '@/lib/mock-data/accountant/seeds'
import { countStatusTab, matchesStatusTab, statusFilterOptions } from '@/lib/books/listHelpers'

const BASE = '/accountant/manual-journals'
const STATUS_GROUPS = { draft: ['draft'], posted: ['published', 'posted'] }

export default function ManualJournalsPage() {
  const { manualJournals, deleteRecord, getById } = useBooksManualJournalsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: AccountantJournalRow) => setDeleteId(row.id), [])
  const columns = useBooksAccountantJournalTableColumns({
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
      { key: 'all', label: 'All Journals', count: manualJournals.length },
      { key: 'draft', label: 'Draft', count: countStatusTab(manualJournals, 'draft', 'status', STATUS_GROUPS) },
      { key: 'posted', label: 'Posted', count: countStatusTab(manualJournals, 'posted', 'status', STATUS_GROUPS) },
    ],
    [manualJournals]
  )

  return (
    <>
      <BooksListPageShell
        title="Manual Journals"
        subtitle="Accounting controls, journals, and chart of accounts."
        kpis={[
          { title: 'All Journals', value: manualJournals.length, subtitle: `${manualJournals.length} entries`, icon: BookOpen },
          { title: 'Draft', value: countStatusTab(manualJournals, 'draft', 'status', STATUS_GROUPS), icon: FileText },
          { title: 'Posted', value: countStatusTab(manualJournals, 'posted', 'status', STATUS_GROUPS), icon: TrendingUp },
          { title: 'Users', value: 2, subtitle: '2 contributors', icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesStatusTab(row, tab, 'status', STATUS_GROUPS)}
        filterFields={[{ key: 'status', label: 'Status', options: statusFilterOptions(['Draft', 'Published']) }]}
        topBlocks={
          <>
            <BooksChartPlaceholderCard title="Posting Trend" />
            <BooksChartPlaceholderCard title="Entries by Type" />
          </>
        }
        columns={columns}
        data={manualJournals}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={BookOpen}
        emptyTitle="No manual journals yet"
        emptyDescription="Manual journals will appear here when created."
        addHref={`${BASE}/new`}
        addLabel="Add manual journal"
        searchPlaceholder="Search journals..."
        exportFilePrefix="books-manual-journals"
        sortEntity="manualJournal"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.journalNumber}
        entityLabel="Manual Journal"
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
