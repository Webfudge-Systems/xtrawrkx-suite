'use client'

import { useMemo } from 'react'
import { Box, Layers, Package, Tag } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'

const ITEM_ROWS = [
  { id: 1, name: 'Website Design Sprint', sku: 'ITEM-001', type: 'Service', rate: '$2,000', status: 'Active' },
  { id: 2, name: 'Retainer Package', sku: 'ITEM-002', type: 'RetainerPackage', rate: '$5,000', status: 'Active' },
]

export default function ItemsAllPage() {
  const kpis = useMemo(
    () => [
      { title: 'Total items', value: ITEM_ROWS.length, subtitle: 'Catalog size', icon: Package },
      { title: 'Services', value: ITEM_ROWS.filter((r) => r.type === 'Service').length, icon: Layers },
      { title: 'Packages', value: ITEM_ROWS.filter((r) => r.type.includes('Package')).length, icon: Box },
      { title: 'SKUs', value: ITEM_ROWS.length, icon: Tag },
    ],
    []
  )

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Items', count: ITEM_ROWS.length },
      { key: 'service', label: 'Services', count: ITEM_ROWS.filter((r) => r.type === 'Service').length },
      { key: 'package', label: 'Packages', count: ITEM_ROWS.filter((r) => r.type.includes('Package')).length },
    ],
    []
  )

  return (
    <BooksListPageShell
      title="All Items"
      subtitle="Default item type is Service for agency workflows."
      kpis={kpis}
      tabs={tabs}
      columns={[
        { key: 'name', title: 'Name' },
        { key: 'sku', title: 'SKU' },
        { key: 'type', title: 'Type' },
        { key: 'rate', title: 'Rate' },
      ]}
      data={ITEM_ROWS}
      emptyIcon={Package}
      emptyTitle="No items yet"
      emptyDescription="Add services and packages your team bills against."
      addHref="/items/all/new"
      addLabel="New item"
      searchPlaceholder="Search items..."
      exportFilePrefix="books-items"
    />
  )
}
