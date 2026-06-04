'use client'

import { FileText, Receipt, Users } from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'

export default function NewInvoicePage() {
  return (
    <BooksCrmAddEntityPage
      submitLabel="Create Invoice"
      redirectOnCancelHref="/sales/invoices"
      sections={[
        {
          icon: Receipt,
          title: 'Invoice Details',
          description: 'Basic invoice information',
          fields: [
            { key: 'invoiceNumber', type: 'input', label: 'Invoice Number *', placeholder: 'INV-1001', required: true },
            {
              key: 'customerId',
              type: 'select',
              label: 'Customer *',
              required: true,
              options: [
                { value: 'acme', label: 'Acme Studio' },
                { value: 'northline', label: 'Northline' },
                { value: 'orbit', label: 'Orbit Labs' },
              ],
            },
            {
              key: 'status',
              type: 'select',
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
            { key: 'invoiceDate', type: 'input', label: 'Invoice Date', inputType: 'date' },
            { key: 'dueDate', type: 'input', label: 'Due Date', inputType: 'date' },
          ],
        },
        {
          icon: FileText,
          title: 'Amounts',
          description: 'Subtotal, tax, and total',
          fields: [
            { key: 'subtotal', type: 'input', label: 'Subtotal', placeholder: '0', inputType: 'number' },
            { key: 'tax', type: 'input', label: 'Tax', placeholder: '0', inputType: 'number' },
            { key: 'total', type: 'input', label: 'Total *', placeholder: '0', inputType: 'number', required: true },
            { key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional invoice notes...', rows: 4 },
          ],
        },
      ]}
    />
  )
}
