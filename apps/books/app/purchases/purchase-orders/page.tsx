'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksPurchaseDocTableColumns } from '@/app/_components/booksPurchasesTableColumns'
import { useBooksPurchaseOrdersStore } from '@/lib/mock-data/purchases/stores'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'
import {
  countPurchaseDocTab,
  matchesPurchaseDocStatuses,
  purchaseDocStatusOptions,
} from '@/lib/purchases/listHelpers'

const BASE = '/purchases/purchase-orders'
const STATUS_GROUPS = {
  draft: ['draft'],
  issued: ['issued'],
}

export default function PurchaseOrdersPage() {
  const { purchaseOrders, deleteRecord, getById } = useBooksPurchaseOrdersStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const draft = countPurchaseDocTab(purchaseOrders, 'draft', STATUS_GROUPS)
  const issued = countPurchaseDocTab(purchaseOrders, 'issued', STATUS_GROUPS)
  const vendorCount = useMemo(
    () => new Set(purchaseOrders.map((o) => o.vendor)).size,
    [purchaseOrders]
  )

  const handleRequestDelete = useCallback((row: PurchaseDocRow) => setDeleteId(row.id), [])
  const columns = useBooksPurchaseDocTableColumns({
    numberLabel: 'PO#',
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
      { key: 'all', label: 'All Orders', count: purchaseOrders.length },
      { key: 'draft', label: 'Draft', count: draft },
      { key: 'issued', label: 'Issued', count: issued },
    ],
    [draft, issued, purchaseOrders.length]
  )

  return (
    <>
      <BooksListPageShell
        title="Purchase Orders"
        subtitle="Create and track purchase orders."
        kpis={[
          {
            title: 'All Orders',
            value: purchaseOrders.length,
            subtitle: `${purchaseOrders.length} orders`,
            icon: Receipt,
          },
          { title: 'Draft', value: draft, subtitle: `${draft} drafts`, icon: FileText },
          { title: 'Issued', value: issued, subtitle: `${issued} issued`, icon: TrendingUp },
          { title: 'Vendors', value: vendorCount, subtitle: `${vendorCount} vendors`, icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesPurchaseDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[
          { key: 'status', label: 'Status', options: purchaseDocStatusOptions(['Draft', 'Issued']) },
        ]}
        columns={columns}
        data={purchaseOrders}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Receipt}
        emptyTitle="No purchase orders yet"
        emptyDescription="Purchase orders will appear here when created."
        addHref={`${BASE}/new`}
        addLabel="Add purchase order"
        searchPlaceholder="Search purchase orders..."
        exportFilePrefix="books-purchase-orders"
        sortEntity="purchaseOrder"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Purchase Order"
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
