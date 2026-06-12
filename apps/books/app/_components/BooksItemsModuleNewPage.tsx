'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Package } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { ITEM_FORM_SECTIONS } from '@/app/_components/itemFormConfig'
import { PRICE_LIST_FORM_SECTIONS } from '@/app/_components/priceListFormConfig'
import { INVENTORY_ADJUSTMENT_FORM_SECTIONS } from '@/app/_components/inventoryAdjustmentFormConfig'
import { useBooksItemsStore } from '@/lib/mock-data/useBooksItemsStore'
import { useBooksPriceListsStore } from '@/lib/mock-data/useBooksPriceListsStore'
import { useBooksInventoryAdjustmentsStore } from '@/lib/mock-data/useBooksInventoryAdjustmentsStore'
import type { ItemRow } from '@/lib/mock-data'

type ModuleNewConfig = {
  submitLabel: string
  cancelHref: string
  headerTitle: string
  headerSubtitle: string
  breadcrumbParent?: { label: string; href: string }
  sections: Parameters<typeof BooksCrmAddEntityPage>[0]['sections']
}

const MODULE_CONFIGS: Record<string, ModuleNewConfig> = {
  all: {
    submitLabel: 'Create Item',
    cancelHref: '/items/all',
    headerTitle: 'New Item',
    headerSubtitle: 'Add a service, package, or product to your catalog.',
    breadcrumbParent: { label: 'All Items', href: '/items/all' },
    sections: ITEM_FORM_SECTIONS,
  },
  'price-lists': {
    submitLabel: 'Create Price List',
    cancelHref: '/items/price-lists',
    headerTitle: 'New Price List',
    headerSubtitle: 'Custom pricing rules by customer or group.',
    breadcrumbParent: { label: 'Price Lists', href: '/items/price-lists' },
    sections: PRICE_LIST_FORM_SECTIONS,
  },
  'inventory-adjustments': {
    submitLabel: 'Create Adjustment',
    cancelHref: '/items/inventory-adjustments',
    headerTitle: 'New Inventory Adjustment',
    headerSubtitle: 'Record stock corrections and audit trails.',
    breadcrumbParent: { label: 'Inventory Adjustments', href: '/items/inventory-adjustments' },
    sections: INVENTORY_ADJUSTMENT_FORM_SECTIONS,
  },
}

function resolveModuleConfig(moduleKey: string): ModuleNewConfig {
  return (
    MODULE_CONFIGS[moduleKey] ??
    ({
      submitLabel: `Create ${moduleKey.replace(/-/g, ' ')}`,
      cancelHref: `/items/${moduleKey}`,
      headerTitle: `New ${moduleKey.replace(/-/g, ' ')}`,
      headerSubtitle: 'Create a new record.',
      breadcrumbParent: {
        label: moduleKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        href: `/items/${moduleKey}`,
      },
      sections: [
        {
          icon: Package,
          title: 'Details',
          description: 'Create a new record',
          fields: [
            { key: 'name', type: 'input', label: 'Name *', required: true, placeholder: 'Enter name' },
            { key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional…', rows: 4 },
          ],
        },
      ],
    } as ModuleNewConfig)
  )
}

export default function BooksItemsModuleNewPage({ moduleKey }: { moduleKey: string }) {
  const router = useRouter()
  const { createItem } = useBooksItemsStore()
  const { createPriceList } = useBooksPriceListsStore()
  const { createAdjustment } = useBooksInventoryAdjustmentsStore()
  const config = useMemo(() => resolveModuleConfig(moduleKey), [moduleKey])
  const parent = config.breadcrumbParent ?? { label: 'All Items', href: '/items/all' }

  const handleSubmitSuccess = useCallback(
    async (values: Record<string, string>) => {
      if (moduleKey === 'all') {
        const created = createItem({
          name: values.name,
          sku: values.sku || `SKU-${Date.now()}`,
          type: values.type,
          rate: values.rate,
          status: values.status || 'Draft',
          unit: values.unit,
          description: values.description,
        } satisfies Omit<ItemRow, 'id' | 'createdAt' | 'updatedAt'>)
        router.replace(`/items/all/${created.id}`)
        return
      }

      if (moduleKey === 'price-lists') {
        const created = createPriceList({
          name: values.name,
          code: values.code || `PL-${Date.now()}`,
          status: values.status || 'Draft',
          description: values.description,
        })
        router.replace(`/items/price-lists/${created.id}`)
        return
      }

      if (moduleKey === 'inventory-adjustments') {
        const created = createAdjustment({
          name: values.name,
          reference: values.reference || `ADJ-${Date.now()}`,
          status: values.status || 'Draft',
          notes: values.notes,
        })
        router.replace(`/items/inventory-adjustments/${created.id}`)
        return
      }

      router.replace(config.cancelHref)
    },
    [config.cancelHref, createAdjustment, createItem, createPriceList, moduleKey, router]
  )

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title={config.headerTitle}
        subtitle={config.headerSubtitle}
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: parent.label, href: parent.href },
          { label: 'New' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        submitLabel={config.submitLabel}
        redirectOnCancelHref={config.cancelHref}
        onSubmitSuccess={handleSubmitSuccess}
        sections={config.sections as Parameters<typeof BooksCrmAddEntityPage>[0]['sections']}
      />
    </div>
  )
}
