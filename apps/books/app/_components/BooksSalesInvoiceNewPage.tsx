'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Receipt } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { buildInvoiceFromForm, resolveCustomerLabel } from '@/lib/sales/formMappers'
import { useBooksCustomersStore, useBooksSalesInvoicesStore } from '@/lib/mock-data/sales/stores'

const BASE = '/sales/invoices'

export default function BooksSalesInvoiceNewPage() {
  const router = useRouter()
  const { customers } = useBooksCustomersStore()
  const { createInvoice } = useBooksSalesInvoicesStore()

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: String(c.id),
        label: c.company || c.name,
      })),
    [customers]
  )

  const handleSubmitSuccess = useCallback(
    async (values: Record<string, string>) => {
      const customerLabel = resolveCustomerLabel(values.customerId ?? '', customers)
      const created = createInvoice(buildInvoiceFromForm(values, customerLabel))
      router.replace(`${BASE}/${created.id}`)
    },
    [createInvoice, customers, router]
  )

  const sections = useMemo(
    () => [
      {
        icon: Receipt,
        title: 'Invoice Details',
        description: 'Basic invoice information',
        fields: [
          {
            key: 'invoiceNumber',
            type: 'input' as const,
            label: 'Invoice Number *',
            placeholder: 'INV-1001',
            required: true,
          },
          {
            key: 'customerId',
            type: 'select' as const,
            label: 'Customer *',
            required: true,
            options: customerOptions,
          },
          {
            key: 'status',
            type: 'select' as const,
            label: 'Status',
            options: [
              { value: 'Draft', label: 'Draft' },
              { value: 'Sent', label: 'Sent' },
              { value: 'Viewed', label: 'Viewed' },
              { value: 'Partial', label: 'Partial' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Overdue', label: 'Overdue' },
              { value: 'Void', label: 'Void' },
            ],
          },
          { key: 'invoiceDate', type: 'input' as const, label: 'Invoice Date', inputType: 'date' as const },
          { key: 'dueDate', type: 'input' as const, label: 'Due Date', inputType: 'date' as const },
        ],
      },
      {
        icon: FileText,
        title: 'Amounts',
        description: 'Subtotal, tax, and total',
        fields: [
          { key: 'subtotal', type: 'input' as const, label: 'Subtotal', placeholder: '0', inputType: 'number' as const },
          { key: 'tax', type: 'input' as const, label: 'Tax', placeholder: '0', inputType: 'number' as const },
          {
            key: 'total',
            type: 'input' as const,
            label: 'Total *',
            placeholder: '0',
            inputType: 'number' as const,
            required: true,
          },
          {
            key: 'notes',
            type: 'textarea' as const,
            label: 'Notes',
            placeholder: 'Optional invoice notes...',
            rows: 4,
          },
        ],
      },
    ],
    [customerOptions]
  )

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title="New Invoice"
        subtitle="Create a sales invoice for a customer."
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Invoices', href: BASE },
          { label: 'New' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        sections={sections}
        submitLabel="Create Invoice"
        redirectOnCancelHref={BASE}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  )
}
