'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Lock, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksAccountantJournalTableColumns } from '@/app/_components/booksAccountantTableColumns'
import BooksChartPlaceholderCard from '@/app/accountant/_components/BooksChartPlaceholderCard'
import { useBooksTransactionLocksStore } from '@/lib/mock-data/accountant/stores'
import type { AccountantJournalRow } from '@/lib/mock-data/accountant/seeds'
import { countStatusTab, matchesStatusTab } from '@/lib/books/listHelpers'

const BASE = '/accountant/transaction-locking'
const STATUS_GROUPS = { locked: ['locked'] }

export default function TransactionLockingPage() {
  const { transactionLocks, deleteRecord, getById } = useBooksTransactionLocksStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: AccountantJournalRow) => setDeleteId(row.id), [])
  const columns = useBooksAccountantJournalTableColumns({
    numberLabel: 'LOCK ID',
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
      { key: 'all', label: 'All', count: transactionLocks.length },
      { key: 'locked', label: 'Locked', count: countStatusTab(transactionLocks, 'locked', 'status', STATUS_GROUPS) },
    ],
    [transactionLocks]
  )

  return (
    <>
      <BooksListPageShell
        title="Transaction Locking"
        subtitle="Lock accounting periods to prevent changes."
        kpis={[
          { title: 'All Locks', value: transactionLocks.length, subtitle: `${transactionLocks.length} periods`, icon: Lock },
          { title: 'Locked', value: countStatusTab(transactionLocks, 'locked', 'status', STATUS_GROUPS), icon: FileText },
          { title: 'Open', value: 0, subtitle: 'Current period open', icon: TrendingUp },
          { title: 'Users', value: 1, subtitle: '1 admin', icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesStatusTab(row, tab, 'status', STATUS_GROUPS)}
        topBlocks={
          <>
            <BooksChartPlaceholderCard title="Lock History" />
            <BooksChartPlaceholderCard title="Periods by Status" />
          </>
        }
        columns={columns}
        data={transactionLocks}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Lock}
        emptyTitle="No transaction locks yet"
        emptyDescription="Locked periods will appear here."
        addHref={`${BASE}/new`}
        addLabel="Add lock"
        searchPlaceholder="Search locks..."
        exportFilePrefix="books-transaction-locking"
        sortEntity="transactionLock"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.journalNumber}
        entityLabel="Transaction Lock"
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
