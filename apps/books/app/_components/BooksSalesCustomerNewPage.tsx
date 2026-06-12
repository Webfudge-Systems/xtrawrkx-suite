'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Users } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { buildCustomerFromForm } from '@/lib/sales/formMappers'
import { useBooksCustomersStore } from '@/lib/mock-data/sales/stores'

const BASE = '/sales/customers'

export default function BooksSalesCustomerNewPage() {
  const router = useRouter()
  const { createCustomer } = useBooksCustomersStore()

  const handleSubmitSuccess = useCallback(
    async (values: Record<string, string>) => {
      const created = createCustomer(buildCustomerFromForm(values))
      router.replace(`${BASE}/${created.id}`)
    },
    [createCustomer, router]
  )

  const sections = useMemo(
    () => [
      {
        icon: Building2,
        title: 'Customer Information',
        description: 'Basic information about the customer',
        fields: [
          {
            key: 'companyName',
            type: 'input' as const,
            label: 'Company Name *',
            placeholder: 'Enter company name',
            required: true,
            colSpan: 'span2' as const,
          },
          {
            key: 'clientType',
            type: 'select' as const,
            label: 'Client Type',
            required: true,
            options: [
              { value: 'AgencyClient', label: 'Agency Client' },
              { value: 'DirectClient', label: 'Direct Client' },
              { value: 'Partner', label: 'Partner' },
            ],
          },
          { key: 'industry', type: 'input' as const, label: 'Industry', placeholder: 'Industry' },
          {
            key: 'website',
            type: 'input' as const,
            label: 'Website',
            placeholder: 'https://company.com',
            inputType: 'url' as const,
          },
          {
            key: 'phone',
            type: 'input' as const,
            label: 'Phone',
            placeholder: '+91 98765 43210',
            inputType: 'tel' as const,
          },
          {
            key: 'email',
            type: 'input' as const,
            label: 'Email *',
            placeholder: 'contact@company.com',
            inputType: 'email' as const,
            required: true,
          },
        ],
      },
      {
        icon: Users,
        title: 'Additional Details',
        description: 'Optional fields for better customer onboarding',
        fields: [
          {
            key: 'billingNotes',
            type: 'textarea' as const,
            label: 'Billing Notes',
            placeholder: 'Notes for billing...',
          },
          {
            key: 'portalLink',
            type: 'input' as const,
            label: 'Portal Link',
            placeholder: 'https://portal.company.com',
            inputType: 'url' as const,
          },
          {
            key: 'description',
            type: 'textarea' as const,
            label: 'Description',
            placeholder: 'Short description...',
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
        title="New Customer"
        subtitle="Add a customer to your sales workspace."
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Customers', href: BASE },
          { label: 'New' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        sections={sections}
        submitLabel="Create Customer"
        redirectOnCancelHref={BASE}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  )
}
