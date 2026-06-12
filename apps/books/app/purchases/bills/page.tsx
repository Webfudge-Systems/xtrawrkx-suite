'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksPurchaseDocTableColumns } from '@/app/_components/booksPurchasesTableColumns'
import { useBooksBillsStore, useBooksVendorsStore } from '@/lib/mock-data/purchases/stores'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'
import {
  countPurchaseDocTab,
  matchesPurchaseDocStatuses,
  purchaseDocStatusOptions,
} from '@/lib/purchases/listHelpers'

const BASE = '/purchases/bills'
const STATUS_GROUPS = {
  unpaid: ['open', 'unpaid'],
  overdue: ['overdue'],
  paid: ['paid'],
}

export default function BillsPage() {
  const { bills, deleteRecord, getById } = useBooksBillsStore()
  const { vendors } = useBooksVendorsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const unpaid = countPurchaseDocTab(bills, 'unpaid', STATUS_GROUPS)
  const overdue = countPurchaseDocTab(bills, 'overdue', STATUS_GROUPS)
  const paid = countPurchaseDocTab(bills, 'paid', STATUS_GROUPS)

  const handleRequestDelete = useCallback((row: PurchaseDocRow) => setDeleteId(row.id), [])
  const columns = useBooksPurchaseDocTableColumns({
    numberLabel: 'BILL#',
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
      { key: 'all', label: 'All Bills', count: bills.length },
      { key: 'unpaid', label: 'Unpaid', count: unpaid },
      { key: 'overdue', label: 'Overdue', count: overdue },
      { key: 'paid', label: 'Paid', count: paid },
    ],
    [bills.length, overdue, paid, unpaid]
  )

  return (
    <>
      <BooksListPageShell
        title="Bills"
        subtitle="Track vendor bills and payables."
        kpis={[
          { title: 'All Bills', value: bills.length, subtitle: `${bills.length} bills`, icon: FileText },
          {
            title: 'Unpaid',
            value: unpaid,
            subtitle: unpaid === 0 ? '₹0 unpaid' : `${unpaid} unpaid`,
            icon: Receipt,
          },
          {
            title: 'Overdue',
            value: overdue,
            subtitle: overdue === 0 ? 'No overdue' : `${overdue} overdue`,
            icon: TrendingUp,
          },
          {
            title: 'Vendors',
            value: vendors.length,
            subtitle: `${vendors.length} vendors`,
            icon: Users,
          },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesPurchaseDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[
          {
            key: 'status',
            label: 'Status',
            options: purchaseDocStatusOptions(['Open', 'Overdue', 'Paid']),
          },
        ]}
        columns={columns}
        data={bills}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={FileText}
        emptyTitle="No bills yet"
        emptyDescription="Bills will appear here when recorded."
        addHref={`${BASE}/new`}
        addLabel="Add bill"
        searchPlaceholder="Search bills..."
        exportFilePrefix="books-bills"
        sortEntity="bill"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Bill"
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
