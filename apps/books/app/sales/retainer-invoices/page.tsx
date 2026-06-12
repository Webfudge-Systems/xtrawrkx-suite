'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksSalesDocTableColumns } from '@/app/_components/booksSalesTableColumns'
import { useBooksRetainerInvoicesStore } from '@/lib/mock-data/sales/stores'
import type { SalesDocRow } from '@/lib/mock-data/sales/seeds'
import { countSalesDocTab, matchesSalesDocStatuses, salesDocStatusOptions } from '@/lib/sales/listHelpers'

const BASE = '/sales/retainer-invoices'
const STATUS_GROUPS = {
  sent: ['sent'],
  paid: ['paid'],
}

export default function RetainerInvoicesPage() {
  const { retainerInvoices, deleteRecord, getById } = useBooksRetainerInvoicesStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: SalesDocRow) => setDeleteId(row.id), [])
  const columns = useBooksSalesDocTableColumns({
    numberLabel: 'RETAINER#',
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
      { key: 'all', label: 'All Retainers', count: retainerInvoices.length },
      { key: 'sent', label: 'Sent', count: countSalesDocTab(retainerInvoices, 'sent', STATUS_GROUPS) },
      { key: 'paid', label: 'Paid', count: countSalesDocTab(retainerInvoices, 'paid', STATUS_GROUPS) },
    ],
    [retainerInvoices]
  )

  return (
    <>
      <BooksListPageShell
        title="Retainer Invoices"
        subtitle="Retainer billing and draw-downs."
        kpis={[
          { title: 'All Retainers', value: retainerInvoices.length, subtitle: 'Total retainer invoices', icon: Receipt },
          { title: 'Sent', value: countSalesDocTab(retainerInvoices, 'sent', STATUS_GROUPS), icon: FileText },
          { title: 'Paid', value: countSalesDocTab(retainerInvoices, 'paid', STATUS_GROUPS), icon: TrendingUp },
          { title: 'Customers', value: new Set(retainerInvoices.map((r) => r.customer)).size, icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesSalesDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[{ key: 'status', label: 'Status', options: salesDocStatusOptions(['Sent', 'Paid']) }]}
        columns={columns}
        data={retainerInvoices}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Receipt}
        emptyTitle="No retainer invoices yet"
        emptyDescription="Create your first retainer invoice to get started."
        addHref={`${BASE}/new`}
        addLabel="New retainer invoice"
        searchPlaceholder="Search retainer invoices..."
        exportFilePrefix="books-retainer-invoices"
        sortEntity="salesRetainerInvoice"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Retainer Invoice"
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
