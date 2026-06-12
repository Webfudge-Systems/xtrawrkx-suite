'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Package, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksSalesDocTableColumns } from '@/app/_components/booksSalesTableColumns'
import { useBooksDeliveryChallansStore } from '@/lib/mock-data/sales/stores'
import type { SalesDocRow } from '@/lib/mock-data/sales/seeds'
import { countSalesDocTab, matchesSalesDocStatuses, salesDocStatusOptions } from '@/lib/sales/listHelpers'

const BASE = '/sales/delivery-challans'
const STATUS_GROUPS = {
  delivered: ['delivered'],
  inTransit: ['in transit'],
}

export default function DeliveryChallansPage() {
  const { deliveryChallans, deleteRecord, getById } = useBooksDeliveryChallansStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: SalesDocRow) => setDeleteId(row.id), [])
  const columns = useBooksSalesDocTableColumns({
    numberLabel: 'CHALLAN#',
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
      { key: 'all', label: 'All Challans', count: deliveryChallans.length },
      { key: 'delivered', label: 'Delivered', count: countSalesDocTab(deliveryChallans, 'delivered', STATUS_GROUPS) },
      {
        key: 'inTransit',
        label: 'In Transit',
        count: countSalesDocTab(deliveryChallans, 'inTransit', STATUS_GROUPS),
      },
    ],
    [deliveryChallans]
  )

  return (
    <>
      <BooksListPageShell
        title="Delivery Challans"
        subtitle="Goods delivery and dispatch records."
        kpis={[
          { title: 'All Challans', value: deliveryChallans.length, subtitle: 'Total delivery challans', icon: Package },
          {
            title: 'Delivered',
            value: countSalesDocTab(deliveryChallans, 'delivered', STATUS_GROUPS),
            icon: TrendingUp,
          },
          {
            title: 'In Transit',
            value: countSalesDocTab(deliveryChallans, 'inTransit', STATUS_GROUPS),
            icon: FileText,
          },
          { title: 'Customers', value: new Set(deliveryChallans.map((r) => r.customer)).size, icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesSalesDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[
          { key: 'status', label: 'Status', options: salesDocStatusOptions(['Delivered', 'In transit']) },
        ]}
        columns={columns}
        data={deliveryChallans}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Package}
        emptyTitle="No delivery challans yet"
        emptyDescription="Create your first delivery challan to get started."
        addHref={`${BASE}/new`}
        addLabel="New delivery challan"
        searchPlaceholder="Search delivery challans..."
        exportFilePrefix="books-delivery-challans"
        sortEntity="deliveryChallan"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Delivery Challan"
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
