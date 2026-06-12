'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { INVENTORY_ADJUSTMENT_FORM_SECTIONS } from '@/app/_components/inventoryAdjustmentFormConfig'
import { useBooksInventoryAdjustmentsStore } from '@/lib/mock-data/useBooksInventoryAdjustmentsStore'

const BASE = '/items/inventory-adjustments'

export default function BooksInventoryAdjustmentEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, updateAdjustment } = useBooksInventoryAdjustmentsStore()
  const record = getById(id)

  const initialValues = useMemo(() => {
    if (!record) return undefined
    return {
      name: record.name,
      reference: record.reference,
      status: record.status,
      notes: record.notes ?? '',
    }
  }, [record])

  if (!record) {
    return (
      <div className="space-y-6">
        <BooksEntityPageHeader
          title="Adjustment not found"
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Inventory Adjustments', href: BASE },
            { label: 'Edit' },
          ]}
        />
        <p className="text-[var(--books-text-secondary,#9ca3af)]">Adjustment not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title={`Edit ${record.name}`}
        subtitle="Update stock correction details and notes."
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Inventory Adjustments', href: BASE },
          { label: record.name, href: `${BASE}/${record.id}` },
          { label: 'Edit' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        sections={INVENTORY_ADJUSTMENT_FORM_SECTIONS}
        submitLabel="Update Adjustment"
        redirectOnCancelHref={`${BASE}/${record.id}`}
        initialValues={initialValues}
        onSubmitSuccess={async (values) => {
          updateAdjustment(record.id, {
            name: values.name,
            reference: values.reference || record.reference,
            status: values.status || record.status,
            notes: values.notes,
          })
          router.replace(`${BASE}/${record.id}`)
        }}
      />
    </div>
  )
}
