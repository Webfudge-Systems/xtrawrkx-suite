'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { PRICE_LIST_FORM_SECTIONS } from '@/app/_components/priceListFormConfig'
import { useBooksPriceListsStore } from '@/lib/mock-data/useBooksPriceListsStore'

const BASE = '/items/price-lists'

export default function BooksPriceListEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, updatePriceList } = useBooksPriceListsStore()
  const record = getById(id)

  const initialValues = useMemo(() => {
    if (!record) return undefined
    return {
      name: record.name,
      code: record.code,
      status: record.status,
      description: record.description ?? '',
    }
  }, [record])

  if (!record) {
    return (
      <div className="space-y-6">
        <BooksEntityPageHeader
          title="Price list not found"
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Price Lists', href: BASE },
            { label: 'Edit' },
          ]}
        />
        <p className="text-[var(--books-text-secondary,#9ca3af)]">Price list not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title={`Edit ${record.name}`}
        subtitle="Update pricing rules and notes."
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Price Lists', href: BASE },
          { label: record.name, href: `${BASE}/${record.id}` },
          { label: 'Edit' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        sections={PRICE_LIST_FORM_SECTIONS}
        submitLabel="Update Price List"
        redirectOnCancelHref={`${BASE}/${record.id}`}
        initialValues={initialValues}
        onSubmitSuccess={async (values) => {
          updatePriceList(record.id, {
            name: values.name,
            code: values.code || record.code,
            status: values.status || record.status,
            description: values.description,
          })
          router.replace(`${BASE}/${record.id}`)
        }}
      />
    </div>
  )
}
