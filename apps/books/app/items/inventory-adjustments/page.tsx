'use client'

import { useCallback, useMemo, useState } from 'react'
import { Boxes, CheckCircle2, ClipboardList, FileText } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksInventoryAdjustmentsTableColumns } from '@/app/_components/booksInventoryAdjustmentsTableColumns'
import { useBooksInventoryAdjustmentsStore } from '@/lib/mock-data/useBooksInventoryAdjustmentsStore'
import type { InventoryAdjustmentRow } from '@/lib/mock-data/inventory-adjustments'

function matchesAdjustmentTab(row: InventoryAdjustmentRow, tabKey: string) {
  if (tabKey === 'all') return true
  if (tabKey === 'posted') return row.status.toLowerCase() === 'posted'
  if (tabKey === 'draft') return row.status.toLowerCase() === 'draft'
  return true
}

export default function InventoryAdjustmentsPage() {
  const { adjustments, deleteAdjustment, getById } = useBooksInventoryAdjustmentsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: InventoryAdjustmentRow) => {
    setDeleteId(row.id)
  }, [])

  const columns = useBooksInventoryAdjustmentsTableColumns({
    onRequestDelete: handleRequestDelete,
    deletingId,
  })

  const deleteTarget = deleteId != null ? getById(deleteId) : null

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteAdjustment(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteAdjustment, deleteId, deletingId])

  const kpis = useMemo(
    () => [
      {
        title: 'Total adjustments',
        value: adjustments.length,
        subtitle: 'Stock corrections',
        icon: Boxes,
      },
      {
        title: 'Posted',
        value: adjustments.filter((r) => r.status.toLowerCase() === 'posted').length,
        icon: CheckCircle2,
      },
      {
        title: 'Draft',
        value: adjustments.filter((r) => r.status.toLowerCase() === 'draft').length,
        icon: FileText,
      },
      { title: 'References', value: adjustments.filter((r) => r.reference).length, icon: ClipboardList },
    ],
    [adjustments]
  )

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Adjustments', count: adjustments.length },
      {
        key: 'posted',
        label: 'Posted',
        count: adjustments.filter((r) => r.status.toLowerCase() === 'posted').length,
      },
      {
        key: 'draft',
        label: 'Draft',
        count: adjustments.filter((r) => r.status.toLowerCase() === 'draft').length,
      },
    ],
    [adjustments]
  )

  const filterFields = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'Posted', label: 'Posted' },
          { value: 'Draft', label: 'Draft' },
        ],
      },
    ],
    []
  )

  return (
    <>
      <BooksListPageShell
        title="Inventory Adjustments"
        subtitle="Track stock changes and corrections."
        kpis={kpis}
        tabs={tabs}
        tabFilter={matchesAdjustmentTab}
        filterFields={filterFields}
        columns={columns}
        data={adjustments}
        onRowClickHref={(row) => `/items/inventory-adjustments/${row.id}`}
        emptyIcon={Boxes}
        emptyTitle="No adjustments yet"
        emptyDescription="Record stock corrections and audit trails."
        addHref="/items/inventory-adjustments/new"
        addLabel="New adjustment"
        searchPlaceholder="Search adjustments..."
        exportFilePrefix="books-inventory-adjustments"
        sortEntity="inventoryAdjustment"
      />

      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={deleteTarget?.name}
        entityLabel="Adjustment"
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
