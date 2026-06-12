'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CreditCard,
  FileText,
  Package,
  Receipt,
  Repeat,
  Target,
  Truck,
  Users,
} from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { buildSalesDocFromForm, resolveCustomerLabel } from '@/lib/sales/formMappers'
import {
  useBooksCreditNotesStore,
  useBooksCustomersStore,
  useBooksDeliveryChallansStore,
  useBooksEstimatesStore,
  useBooksPaymentsReceivedStore,
  useBooksRecurringInvoicesStore,
  useBooksRetainerInvoicesStore,
  useBooksSalesOrdersStore,
} from '@/lib/mock-data/sales/stores'
import type { SalesDocRow } from '@/lib/mock-data/sales/seeds'

const MODULE_LABELS: Record<string, string> = {
  estimates: 'Estimate',
  'retainer-invoices': 'Retainer Invoice',
  'sales-orders': 'Sales Order',
  'delivery-challans': 'Delivery Challan',
  'recurring-invoices': 'Recurring Invoice',
  'credit-notes': 'Credit Note',
  'payments-received': 'Payment',
}

export default function BooksSalesAddModulePage({ moduleKey }: { moduleKey: string }) {
  const router = useRouter()
  const { customers } = useBooksCustomersStore()
  const estimatesStore = useBooksEstimatesStore()
  const retainerStore = useBooksRetainerInvoicesStore()
  const salesOrdersStore = useBooksSalesOrdersStore()
  const deliveryStore = useBooksDeliveryChallansStore()
  const recurringStore = useBooksRecurringInvoicesStore()
  const paymentsStore = useBooksPaymentsReceivedStore()
  const creditNotesStore = useBooksCreditNotesStore()

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: String(c.id),
        label: c.company || c.name,
      })),
    [customers]
  )

  const createRecord = useCallback(
    (data: Omit<SalesDocRow, 'id' | 'createdAt' | 'updatedAt'>) => {
      switch (moduleKey) {
        case 'estimates':
          return estimatesStore.createRecord(data)
        case 'retainer-invoices':
          return retainerStore.createRecord(data)
        case 'sales-orders':
          return salesOrdersStore.createRecord(data)
        case 'delivery-challans':
          return deliveryStore.createRecord(data)
        case 'recurring-invoices':
          return recurringStore.createRecord(data)
        case 'payments-received':
          return paymentsStore.createRecord(data)
        case 'credit-notes':
          return creditNotesStore.createRecord(data)
        default:
          return estimatesStore.createRecord(data)
      }
    },
    [
      moduleKey,
      estimatesStore,
      retainerStore,
      salesOrdersStore,
      deliveryStore,
      recurringStore,
      paymentsStore,
      creditNotesStore,
    ]
  )

  const handleSubmitSuccess = useCallback(
    async (values: Record<string, string>) => {
      const customerLabel = resolveCustomerLabel(values.customerId ?? '', customers)
      const created = createRecord(buildSalesDocFromForm(moduleKey, values, customerLabel))
      router.replace(`/sales/${moduleKey}/${created.id}`)
    },
    [createRecord, customers, moduleKey, router]
  )

  const configs: Record<
    string,
    {
      submitLabel: string
      sections: Parameters<typeof BooksCrmAddEntityPage>[0]['sections']
    }
  > = useMemo(
    () => ({
      estimates: {
        submitLabel: 'Create Estimate',
        sections: [
          {
            icon: FileText,
            title: 'Estimate Details',
            description: 'Proposal and approval information',
            fields: [
              { key: 'estimateNumber', type: 'input', label: 'Estimate Number *', required: true, placeholder: 'EST-1001' },
              { key: 'customerId', type: 'select', label: 'Customer *', required: true, options: customerOptions },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Sent', label: 'Sent' },
                  { value: 'Accepted', label: 'Accepted' },
                ],
              },
              { key: 'estimateDate', type: 'input', label: 'Estimate Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: Target,
            title: 'Notes',
            description: 'Optional details for this estimate',
            fields: [
              { key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Add any notes...', rows: 4 },
              { key: 'internalReference', type: 'input', label: 'Internal Reference', placeholder: 'Ref-123' },
            ],
          },
        ],
      },
      'retainer-invoices': {
        submitLabel: 'Create Retainer Invoice',
        sections: [
          {
            icon: Receipt,
            title: 'Retainer Invoice',
            description: 'Billing details for retainer invoicing',
            fields: [
              { key: 'retainerInvoiceNumber', type: 'input', label: 'Retainer Invoice # *', required: true, placeholder: 'RINV-1001' },
              { key: 'customerId', type: 'select', label: 'Customer *', required: true, options: customerOptions },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Sent', label: 'Sent' },
                  { value: 'Paid', label: 'Paid' },
                ],
              },
              { key: 'invoiceDate', type: 'input', label: 'Invoice Date', inputType: 'date' },
              { key: 'dueDate', type: 'input', label: 'Due Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Invoice Amount *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: Users,
            title: 'Retainer Summary',
            fields: [
              { key: 'remainingBalance', type: 'input', label: 'Remaining Balance', placeholder: '0', inputType: 'number' },
              { key: 'memo', type: 'textarea', label: 'Memo', placeholder: 'Optional memo...', rows: 4 },
            ],
          },
        ],
      },
      'sales-orders': {
        submitLabel: 'Create Sales Order',
        sections: [
          {
            icon: Package,
            title: 'Sales Order',
            description: 'Order details and fulfillment tracking',
            fields: [
              { key: 'orderNumber', type: 'input', label: 'Order Number *', required: true, placeholder: 'SO-1001' },
              { key: 'customerId', type: 'select', label: 'Customer *', required: true, options: customerOptions },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Confirmed', label: 'Confirmed' },
                ],
              },
              { key: 'orderDate', type: 'input', label: 'Order Date', inputType: 'date' },
              { key: 'total', type: 'input', label: 'Total *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: Target,
            title: 'Order Notes',
            fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }],
          },
        ],
      },
      'delivery-challans': {
        submitLabel: 'Create Delivery Challan',
        sections: [
          {
            icon: Truck,
            title: 'Delivery Challan',
            description: 'Shipment and delivery information',
            fields: [
              { key: 'challanNumber', type: 'input', label: 'Challan Number *', required: true, placeholder: 'DC-1001' },
              { key: 'customerId', type: 'select', label: 'Customer *', required: true, options: customerOptions },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Sent', label: 'Sent' },
                ],
              },
              { key: 'deliveryDate', type: 'input', label: 'Delivery Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Amount', placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: Calendar,
            title: 'Reference & Notes',
            fields: [
              { key: 'reference', type: 'input', label: 'Reference', placeholder: 'Optional reference' },
              { key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional delivery notes...', rows: 4 },
            ],
          },
        ],
      },
      'recurring-invoices': {
        submitLabel: 'Create Recurring Invoice',
        sections: [
          {
            icon: Repeat,
            title: 'Recurring Invoice Setup',
            description: 'Automated recurring billing details',
            fields: [
              { key: 'recurringName', type: 'input', label: 'Recurring Name *', required: true, placeholder: 'Recurring Billing' },
              { key: 'customerId', type: 'select', label: 'Customer *', required: true, options: customerOptions },
              {
                key: 'frequency',
                type: 'select',
                label: 'Frequency',
                options: [
                  { value: 'Monthly', label: 'Monthly' },
                  { value: 'Quarterly', label: 'Quarterly' },
                  { value: 'Yearly', label: 'Yearly' },
                ],
              },
              { key: 'nextBillingDate', type: 'input', label: 'Next Billing Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: FileText,
            title: 'Configuration',
            fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }],
          },
        ],
      },
      'credit-notes': {
        submitLabel: 'Create Credit Note',
        sections: [
          {
            icon: CreditCard,
            title: 'Credit Note',
            description: 'Issued credits and adjustments',
            fields: [
              { key: 'creditNoteNumber', type: 'input', label: 'Credit Note # *', required: true, placeholder: 'CN-1001' },
              { key: 'customerId', type: 'select', label: 'Customer *', required: true, options: customerOptions },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Issued', label: 'Issued' },
                ],
              },
              { key: 'creditDate', type: 'input', label: 'Credit Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: Target,
            title: 'Reason',
            fields: [{ key: 'reason', type: 'textarea', label: 'Reason', placeholder: 'Optional reason...', rows: 4 }],
          },
        ],
      },
      'payments-received': {
        submitLabel: 'Record Payment',
        sections: [
          {
            icon: CreditCard,
            title: 'Payment Received',
            description: 'Track incoming customer payments',
            fields: [
              { key: 'paymentNumber', type: 'input', label: 'Payment # *', required: true, placeholder: 'PAY-1001' },
              { key: 'customerId', type: 'select', label: 'Customer *', required: true, options: customerOptions },
              { key: 'paymentDate', type: 'input', label: 'Payment Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
              {
                key: 'method',
                type: 'select',
                label: 'Payment Method',
                options: [
                  { value: 'BankTransfer', label: 'Bank Transfer' },
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Card', label: 'Card' },
                ],
              },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Cleared', label: 'Cleared' },
                ],
              },
            ],
          },
          {
            icon: Receipt,
            title: 'Details',
            fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }],
          },
        ],
      },
    }),
    [customerOptions]
  )

  const config =
    configs[moduleKey] ?? {
      submitLabel: `Create ${moduleKey}`,
      sections: [
        {
          icon: FileText,
          title: 'Details',
          description: 'Create a new item',
          fields: [
            { key: 'name', type: 'input', label: 'Name *', required: true, placeholder: 'Enter name' },
            { key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 },
          ],
        },
      ],
    }

  const entityLabel = MODULE_LABELS[moduleKey] ?? moduleKey
  const listHref = `/sales/${moduleKey}`

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title={`New ${entityLabel}`}
        subtitle={`Create a new ${entityLabel.toLowerCase()} record.`}
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: entityLabel, href: listHref },
          { label: 'New' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        sections={config.sections}
        submitLabel={config.submitLabel}
        redirectOnCancelHref={listHref}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  )
}

