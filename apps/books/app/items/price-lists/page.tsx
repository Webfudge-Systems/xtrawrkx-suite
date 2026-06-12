'use client'

import { useCallback, useMemo, useState } from 'react'
import { CheckCircle2, FileText, ListOrdered, Tag } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksPriceListsTableColumns } from '@/app/_components/booksPriceListsTableColumns'
import { useBooksPriceListsStore } from '@/lib/mock-data/useBooksPriceListsStore'
import type { PriceListRow } from '@/lib/mock-data/price-lists'

function matchesPriceListTab(row: PriceListRow, tabKey: string) {
  if (tabKey === 'all') return true
  if (tabKey === 'active') return row.status.toLowerCase() === 'active'
  if (tabKey === 'draft') return row.status.toLowerCase() === 'draft'
  return true
}

export default function PriceListsPage() {
  const { priceLists, deletePriceList, getById } = useBooksPriceListsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: PriceListRow) => {
    setDeleteId(row.id)
  }, [])

  const columns = useBooksPriceListsTableColumns({
    onRequestDelete: handleRequestDelete,
    deletingId,
  })

  const deleteTarget = deleteId != null ? getById(deleteId) : null

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deletePriceList(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteId, deletePriceList, deletingId])

  const kpis = useMemo(
    () => [
      {
        title: 'Total price lists',
        value: priceLists.length,
        subtitle: 'Pricing rules',
        icon: ListOrdered,
      },
      {
        title: 'Active',
        value: priceLists.filter((r) => r.status.toLowerCase() === 'active').length,
        icon: CheckCircle2,
      },
      {
        title: 'Draft',
        value: priceLists.filter((r) => r.status.toLowerCase() === 'draft').length,
        icon: FileText,
      },
      { title: 'With codes', value: priceLists.filter((r) => r.code).length, icon: Tag },
    ],
    [priceLists]
  )

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Lists', count: priceLists.length },
      {
        key: 'active',
        label: 'Active',
        count: priceLists.filter((r) => r.status.toLowerCase() === 'active').length,
      },
      {
        key: 'draft',
        label: 'Draft',
        count: priceLists.filter((r) => r.status.toLowerCase() === 'draft').length,
      },
    ],
    [priceLists]
  )

  const filterFields = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'Active', label: 'Active' },
          { value: 'Draft', label: 'Draft' },
        ],
      },
    ],
    []
  )

  return (
    <>
      <BooksListPageShell
        title="Price Lists"
        subtitle="Custom pricing by customer and group."
        kpis={kpis}
        tabs={tabs}
        tabFilter={matchesPriceListTab}
        filterFields={filterFields}
        columns={columns}
        data={priceLists}
        onRowClickHref={(row) => `/items/price-lists/${row.id}`}
        emptyIcon={ListOrdered}
        emptyTitle="No price lists yet"
        emptyDescription="Create custom pricing rules for customers and groups."
        addHref="/items/price-lists/new"
        addLabel="New price list"
        searchPlaceholder="Search price lists..."
        exportFilePrefix="books-price-lists"
        sortEntity="priceList"
      />

      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={deleteTarget?.name}
        entityLabel="Price List"
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
