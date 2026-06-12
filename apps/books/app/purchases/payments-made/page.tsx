'use client'

import { useCallback, useMemo, useState } from 'react'
import { CreditCard, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksPurchaseDocTableColumns } from '@/app/_components/booksPurchasesTableColumns'
import { useBooksPaymentsMadeStore } from '@/lib/mock-data/purchases/stores'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'
import {
  countPurchaseDocTab,
  matchesPurchaseDocStatuses,
  purchaseDocStatusOptions,
} from '@/lib/purchases/listHelpers'

const BASE = '/purchases/payments-made'
const STATUS_GROUPS = {
  paid: ['paid'],
  cleared: ['cleared'],
}

export default function PaymentsMadePage() {
  const { paymentsMade, deleteRecord, getById } = useBooksPaymentsMadeStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const vendorCount = useMemo(
    () => new Set(paymentsMade.map((p) => p.vendor)).size,
    [paymentsMade]
  )

  const handleRequestDelete = useCallback((row: PurchaseDocRow) => setDeleteId(row.id), [])
  const columns = useBooksPurchaseDocTableColumns({
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
      { key: 'all', label: 'All Payments', count: paymentsMade.length },
      { key: 'paid', label: 'Paid', count: countPurchaseDocTab(paymentsMade, 'paid', STATUS_GROUPS) },
    ],
    [paymentsMade]
  )

  return (
    <>
      <BooksListPageShell
        title="Payments Made"
        subtitle="Track outgoing vendor payments."
        kpis={[
          {
            title: 'All Payments',
            value: paymentsMade.length,
            subtitle: `${paymentsMade.length} payments`,
            icon: CreditCard,
          },
          {
            title: 'Paid',
            value: countPurchaseDocTab(paymentsMade, 'paid', STATUS_GROUPS),
            subtitle: 'Completed payments',
            icon: Receipt,
          },
          { title: 'This Month', value: paymentsMade.length, subtitle: 'May 2026', icon: TrendingUp },
          { title: 'Vendors', value: vendorCount, subtitle: `${vendorCount} vendors`, icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesPurchaseDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[
          { key: 'status', label: 'Status', options: purchaseDocStatusOptions(['Paid', 'Cleared']) },
        ]}
        columns={columns}
        data={paymentsMade}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={CreditCard}
        emptyTitle="No payments yet"
        emptyDescription="Payments will appear here when recorded."
        addHref={`${BASE}/new`}
        addLabel="Record payment"
        searchPlaceholder="Search payments..."
        exportFilePrefix="books-payments-made"
        sortEntity="paymentMade"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Payment"
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
