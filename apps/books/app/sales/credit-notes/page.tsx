'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksSalesDocTableColumns } from '@/app/_components/booksSalesTableColumns'
import { useBooksCreditNotesStore } from '@/lib/mock-data/sales/stores'
import type { SalesDocRow } from '@/lib/mock-data/sales/seeds'
import { countSalesDocTab, matchesSalesDocStatuses, salesDocStatusOptions } from '@/lib/sales/listHelpers'

const BASE = '/sales/credit-notes'
const STATUS_GROUPS = {
  draft: ['draft'],
  issued: ['issued'],
}

export default function CreditNotesPage() {
  const { creditNotes, deleteRecord, getById } = useBooksCreditNotesStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: SalesDocRow) => setDeleteId(row.id), [])
  const columns = useBooksSalesDocTableColumns({
    numberLabel: 'CREDIT NOTE#',
    basePath: BASE,
    onRequestDelete: handleRequestDelete,
    deletingId,
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
      { key: 'all', label: 'All Credit Notes', count: creditNotes.length },
      { key: 'draft', label: 'Draft', count: countSalesDocTab(creditNotes, 'draft', STATUS_GROUPS) },
      { key: 'issued', label: 'Issued', count: countSalesDocTab(creditNotes, 'issued', STATUS_GROUPS) },
    ],
    [creditNotes]
  )

  return (
    <>
      <BooksListPageShell
        title="Credit Notes"
        subtitle="Track issued credits and adjustments."
        kpis={[
          { title: 'All Credits', value: creditNotes.length, subtitle: 'Total credit notes', icon: Receipt },
          { title: 'Draft', value: countSalesDocTab(creditNotes, 'draft', STATUS_GROUPS), icon: FileText },
          { title: 'Issued', value: countSalesDocTab(creditNotes, 'issued', STATUS_GROUPS), icon: TrendingUp },
          { title: 'Customers', value: new Set(creditNotes.map((r) => r.customer)).size, icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesSalesDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[{ key: 'status', label: 'Status', options: salesDocStatusOptions(['Draft', 'Issued']) }]}
        columns={columns}
        data={creditNotes}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Receipt}
        emptyTitle="No credit notes yet"
        emptyDescription="Create your first credit note to get started."
        addHref={`${BASE}/new`}
        addLabel="New credit note"
        searchPlaceholder="Search credit notes..."
        exportFilePrefix="books-credit-notes"
        sortEntity="creditNote"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Credit Note"
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
