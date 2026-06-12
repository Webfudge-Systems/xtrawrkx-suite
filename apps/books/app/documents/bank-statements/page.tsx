'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, FolderOpen, Landmark, Layers } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksDocumentsTableColumns } from '@/app/_components/booksDocumentsTableColumns'
import { useBooksBankStatementsStore } from '@/lib/mock-data/documents/stores'
import type { DocumentRow } from '@/lib/mock-data/documents/seeds'
import { countStatusTab, matchesStatusTab, statusFilterOptions } from '@/lib/books/listHelpers'

const BASE = '/documents/bank-statements'
const STATUS_GROUPS = { draft: ['draft'], processed: ['processed'] }

export default function BankStatementsPage() {
  const { bankStatements, deleteStatement, getById } = useBooksBankStatementsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: DocumentRow) => setDeleteId(row.id), [])
  const columns = useBooksDocumentsTableColumns({
    onRequestDelete: handleRequestDelete,
    deletingId,
    basePath: BASE,
    uploadedLabel: 'IMPORTED',
  })

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteStatement(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteId, deleteStatement, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All', count: bankStatements.length },
      { key: 'processed', label: 'Processed', count: countStatusTab(bankStatements, 'processed', 'status', STATUS_GROUPS) },
      { key: 'draft', label: 'Draft', count: countStatusTab(bankStatements, 'draft', 'status', STATUS_GROUPS) },
    ],
    [bankStatements]
  )

  return (
    <>
      <BooksListPageShell
        title="Bank Statements"
        subtitle="Inbox for auto-imported statements and Add to Bank workflow."
        kpis={[
          { title: 'All Statements', value: bankStatements.length, subtitle: 'Imported files', icon: Landmark },
          { title: 'Processed', value: countStatusTab(bankStatements, 'processed', 'status', STATUS_GROUPS), icon: FileText },
          { title: 'Draft', value: countStatusTab(bankStatements, 'draft', 'status', STATUS_GROUPS), icon: Layers },
          { title: 'This Month', value: bankStatements.length, subtitle: 'May 2026', icon: FolderOpen },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesStatusTab(row, tab, 'status', STATUS_GROUPS)}
        filterFields={[{ key: 'status', label: 'Status', options: statusFilterOptions(['Processed', 'Draft']) }]}
        columns={columns}
        data={bankStatements}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Landmark}
        emptyTitle="No bank statements yet"
        emptyDescription="Imported statements will appear here."
        searchPlaceholder="Search statements..."
        exportFilePrefix="books-bank-statements"
        sortEntity="bankStatement"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.name}
        entityLabel="Bank Statement"
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
