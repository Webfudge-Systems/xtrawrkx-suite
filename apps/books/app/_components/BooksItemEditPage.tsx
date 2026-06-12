'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { ITEM_FORM_SECTIONS } from '@/app/_components/itemFormConfig'
import { useBooksItemsStore } from '@/lib/mock-data/useBooksItemsStore'
import { formatIndianCurrencyInput } from '@/lib/formatCurrency'

export default function BooksItemEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, updateItem } = useBooksItemsStore()
  const item = getById(id)

  const initialValues = useMemo(() => {
    if (!item) return undefined
    return {
      name: item.name,
      sku: item.sku,
      type: item.type,
      rate: formatIndianCurrencyInput(item.rate),
      status: item.status,
      unit: item.unit ?? '',
      description: item.description ?? '',
    }
  }, [item])

  if (!item) {
    return (
      <div className="space-y-6">
        <BooksEntityPageHeader
          title="Item not found"
          subtitle="This item may have been deleted or the link is invalid."
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'All Items', href: '/items/all' },
            { label: 'Edit' },
          ]}
        />
        <p className="text-[var(--books-text-secondary,#9ca3af)]">Item not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title={`Edit ${item.name}`}
        subtitle="Update catalog details, pricing, and description."
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'All Items', href: '/items/all' },
          { label: item.name, href: `/items/all/${item.id}` },
          { label: 'Edit' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        sections={ITEM_FORM_SECTIONS}
        submitLabel="Update Item"
        redirectOnCancelHref={`/items/all/${item.id}`}
        initialValues={initialValues}
        onSubmitSuccess={async (values) => {
          updateItem(item.id, values)
          router.replace(`/items/all/${item.id}`)
        }}
      />
    </div>
  )
}
