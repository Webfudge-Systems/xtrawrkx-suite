'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, FolderOpen, Layers, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksDocumentsTableColumns } from '@/app/_components/booksDocumentsTableColumns'
import { useBooksDocumentsStore } from '@/lib/mock-data/documents/stores'
import type { DocumentRow } from '@/lib/mock-data/documents/seeds'
import { countStatusTab, matchesStatusTab, statusFilterOptions } from '@/lib/books/listHelpers'

const BASE = '/documents'
const STATUS_GROUPS = {
  active: ['active'],
  draft: ['draft'],
  archived: ['processed'],
}

export default function DocumentsPage() {
  const { documents, deleteDocument, getById } = useBooksDocumentsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: DocumentRow) => setDeleteId(row.id), [])
  const columns = useBooksDocumentsTableColumns({
    onRequestDelete: handleRequestDelete,
    deletingId,
    basePath: BASE,
  })

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteDocument(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteDocument, deleteId, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All', count: documents.length },
      { key: 'active', label: 'Active', count: countStatusTab(documents, 'active', 'status', STATUS_GROUPS) },
      { key: 'draft', label: 'Draft', count: countStatusTab(documents, 'draft', 'status', STATUS_GROUPS) },
      { key: 'archived', label: 'Archived', count: countStatusTab(documents, 'archived', 'status', STATUS_GROUPS) },
    ],
    [documents]
  )

  return (
    <>
      <BooksListPageShell
        title="All Documents"
        subtitle="Files view with upload status and Add to record actions."
        kpis={[
          { title: 'Total Records', value: documents.length, subtitle: 'Uploaded files', icon: FolderOpen },
          { title: 'Active', value: countStatusTab(documents, 'active', 'status', STATUS_GROUPS), icon: FileText },
          { title: 'Draft', value: countStatusTab(documents, 'draft', 'status', STATUS_GROUPS), icon: FileText },
          { title: 'Archived', value: countStatusTab(documents, 'archived', 'status', STATUS_GROUPS), icon: FolderOpen },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesStatusTab(row, tab, 'status', STATUS_GROUPS)}
        filterFields={[
          { key: 'status', label: 'Status', options: statusFilterOptions(['Processed', 'Active', 'Draft']) },
        ]}
        columns={columns}
        data={documents}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={FolderOpen}
        emptyTitle="No documents yet"
        emptyDescription="Uploaded files will appear here."
        searchPlaceholder="Search records..."
        exportFilePrefix="books-documents"
        sortEntity="document"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.name}
        entityLabel="Document"
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
