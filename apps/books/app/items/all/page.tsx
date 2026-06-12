'use client'

import { useCallback, useMemo, useState } from 'react'
import { Box, Layers, Package, Tag } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksItemsTableColumns } from '@/app/_components/booksItemsTableColumns'
import { useBooksItemsStore } from '@/lib/mock-data/useBooksItemsStore'
import type { ItemRow } from '@/lib/mock-data'

function matchesItemTab(row: ItemRow, tabKey: string) {
  if (tabKey === 'all') return true
  if (tabKey === 'service') return row.type === 'Service'
  if (tabKey === 'package') return row.type.includes('Package')
  return true
}

export default function ItemsAllPage() {
  const { items, deleteItem, getById } = useBooksItemsStore()
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: ItemRow) => {
    setDeleteItemId(row.id)
  }, [])

  const columns = useBooksItemsTableColumns({
    onRequestDelete: handleRequestDelete,
    deletingId,
  })

  const deleteTarget = deleteItemId != null ? getById(deleteItemId) : null

  const confirmDelete = useCallback(async () => {
    if (deleteItemId == null || deletingId) return
    try {
      setDeletingId(deleteItemId)
      deleteItem(deleteItemId)
      setDeleteItemId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteItem, deleteItemId, deletingId])

  const kpis = useMemo(
    () => [
      { title: 'Total items', value: items.length, subtitle: 'Catalog size', icon: Package },
      { title: 'Services', value: items.filter((r) => r.type === 'Service').length, icon: Layers },
      { title: 'Packages', value: items.filter((r) => r.type.includes('Package')).length, icon: Box },
      { title: 'SKUs', value: items.length, icon: Tag },
    ],
    [items]
  )

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Items', count: items.length },
      { key: 'service', label: 'Services', count: items.filter((r) => r.type === 'Service').length },
      { key: 'package', label: 'Packages', count: items.filter((r) => r.type.includes('Package')).length },
    ],
    [items]
  )

  const filterFields = useMemo(
    () => [
      {
        key: 'type',
        label: 'Item Type',
        options: [
          { value: 'Service', label: 'Service' },
          { value: 'RetainerPackage', label: 'Retainer Package' },
          { value: 'Digital', label: 'Digital' },
        ],
      },
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
        title="All Items"
        subtitle="Default item type is Service for agency workflows."
        kpis={kpis}
        tabs={tabs}
        tabFilter={matchesItemTab}
        filterFields={filterFields}
        columns={columns}
        data={items}
        onRowClickHref={(row) => `/items/all/${row.id}`}
        emptyIcon={Package}
        emptyTitle="No items yet"
        emptyDescription="Add services and packages your team bills against."
        addHref="/items/all/new"
        addLabel="New item"
        searchPlaceholder="Search items..."
        exportFilePrefix="books-items"
        sortEntity="item"
      />

      <BooksDeleteItemModal
        isOpen={deleteItemId != null}
        itemName={deleteTarget?.name}
        deleting={deletingId != null}
        onClose={() => {
          if (deletingId) return
          setDeleteItemId(null)
        }}
        onConfirm={confirmDelete}
      />
    </>
  )
}
