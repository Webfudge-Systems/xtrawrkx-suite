'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksSalesDocTableColumns } from '@/app/_components/booksSalesTableColumns'
import { useBooksSalesOrdersStore } from '@/lib/mock-data/sales/stores'
import type { SalesDocRow } from '@/lib/mock-data/sales/seeds'
import { countSalesDocTab, matchesSalesDocStatuses, salesDocStatusOptions } from '@/lib/sales/listHelpers'

const BASE = '/sales/sales-orders'
const STATUS_GROUPS = {
  confirmed: ['confirmed'],
  draft: ['draft'],
}

export default function SalesOrdersPage() {
  const { salesOrders, deleteRecord, getById } = useBooksSalesOrdersStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: SalesDocRow) => setDeleteId(row.id), [])
  const columns = useBooksSalesDocTableColumns({
    numberLabel: 'SO#',
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
      { key: 'all', label: 'All Orders', count: salesOrders.length },
      { key: 'confirmed', label: 'Confirmed', count: countSalesDocTab(salesOrders, 'confirmed', STATUS_GROUPS) },
      { key: 'draft', label: 'Draft', count: countSalesDocTab(salesOrders, 'draft', STATUS_GROUPS) },
    ],
    [salesOrders]
  )

  return (
    <>
      <BooksListPageShell
        title="Sales Orders"
        subtitle="Orders before invoicing."
        kpis={[
          { title: 'All Orders', value: salesOrders.length, subtitle: 'Total sales orders', icon: Receipt },
          { title: 'Confirmed', value: countSalesDocTab(salesOrders, 'confirmed', STATUS_GROUPS), icon: TrendingUp },
          { title: 'Draft', value: countSalesDocTab(salesOrders, 'draft', STATUS_GROUPS), icon: FileText },
          { title: 'Customers', value: new Set(salesOrders.map((r) => r.customer)).size, icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesSalesDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[{ key: 'status', label: 'Status', options: salesDocStatusOptions(['Confirmed', 'Draft']) }]}
        columns={columns}
        data={salesOrders}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Receipt}
        emptyTitle="No sales orders yet"
        emptyDescription="Create your first sales order to get started."
        addHref={`${BASE}/new`}
        addLabel="New sales order"
        searchPlaceholder="Search sales orders..."
        exportFilePrefix="books-sales-orders"
        sortEntity="salesOrder"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Sales Order"
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
