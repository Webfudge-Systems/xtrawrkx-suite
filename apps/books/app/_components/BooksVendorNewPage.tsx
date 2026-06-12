'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { buildVendorFromForm } from '@/lib/purchases/formMappers'
import { useBooksVendorsStore } from '@/lib/mock-data/purchases/stores'

const BASE = '/purchases/vendors'

export default function BooksVendorNewPage() {
  const router = useRouter()
  const { createVendor } = useBooksVendorsStore()

  const handleSubmitSuccess = useCallback(
    async (values: Record<string, string>) => {
      const created = createVendor(buildVendorFromForm(values))
      router.replace(`${BASE}/${created.id}`)
    },
    [createVendor, router]
  )

  const sections = useMemo(
    () => [
      {
        icon: Building2,
        title: 'Vendor Information',
        description: 'Basic information about the vendor',
        fields: [
          {
            key: 'companyName',
            type: 'input' as const,
            label: 'Company Name *',
            placeholder: 'Enter company name',
            required: true,
            colSpan: 'span2' as const,
          },
          { key: 'name', type: 'input' as const, label: 'Display Name', placeholder: 'Vendor display name' },
          {
            key: 'email',
            type: 'input' as const,
            label: 'Email *',
            placeholder: 'billing@vendor.com',
            inputType: 'email' as const,
            required: true,
          },
          {
            key: 'phone',
            type: 'input' as const,
            label: 'Phone',
            placeholder: '+91 88001 22001',
            inputType: 'tel' as const,
          },
        ],
      },
      {
        icon: Users,
        title: 'Additional Details',
        fields: [
          {
            key: 'notes',
            type: 'textarea' as const,
            label: 'Notes',
            placeholder: 'Optional vendor notes...',
            rows: 4,
          },
        ],
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title="New Vendor"
        subtitle="Add a vendor to your purchases workspace."
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Vendors', href: BASE },
          { label: 'New' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        sections={sections}
        submitLabel="Create Vendor"
        redirectOnCancelHref={BASE}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  )
}
