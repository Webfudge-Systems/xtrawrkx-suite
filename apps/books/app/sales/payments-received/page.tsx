'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksSalesDocTableColumns } from '@/app/_components/booksSalesTableColumns'
import { useBooksPaymentsReceivedStore } from '@/lib/mock-data/sales/stores'
import type { SalesDocRow } from '@/lib/mock-data/sales/seeds'
import { countSalesDocTab, matchesSalesDocStatuses, salesDocStatusOptions } from '@/lib/sales/listHelpers'

const BASE = '/sales/payments-received'
const STATUS_GROUPS = {
  completed: ['completed'],
}

export default function PaymentsReceivedPage() {
  const { paymentsReceived, deleteRecord, getById } = useBooksPaymentsReceivedStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: SalesDocRow) => setDeleteId(row.id), [])
  const columns = useBooksSalesDocTableColumns({
    numberLabel: 'PAYMENT#',
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
      { key: 'all', label: 'All Payments', count: paymentsReceived.length },
      {
        key: 'completed',
        label: 'Completed',
        count: countSalesDocTab(paymentsReceived, 'completed', STATUS_GROUPS),
      },
    ],
    [paymentsReceived]
  )

  return (
    <>
      <BooksListPageShell
        title="Payments Received"
        subtitle="Customer payments and allocations."
        kpis={[
          { title: 'All Payments', value: paymentsReceived.length, subtitle: 'Total payments', icon: Receipt },
          {
            title: 'Completed',
            value: countSalesDocTab(paymentsReceived, 'completed', STATUS_GROUPS),
            icon: TrendingUp,
          },
          {
            title: 'Customers',
            value: new Set(paymentsReceived.map((r) => r.customer)).size,
            icon: Users,
          },
          { title: 'This Month', value: paymentsReceived.length, subtitle: 'Recent payments', icon: FileText },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesSalesDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[{ key: 'status', label: 'Status', options: salesDocStatusOptions(['Completed']) }]}
        columns={columns}
        data={paymentsReceived}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Receipt}
        emptyTitle="No payments yet"
        emptyDescription="Record your first payment to get started."
        addHref={`${BASE}/new`}
        addLabel="New payment"
        searchPlaceholder="Search payments..."
        exportFilePrefix="books-payments-received"
        sortEntity="paymentReceived"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Payment Received"
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
