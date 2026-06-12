'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CreditCard,
  FileText,
  Repeat,
  Receipt,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { buildPurchaseDocFromForm, resolveVendorLabel } from '@/lib/purchases/formMappers'
import {
  useBooksBillsStore,
  useBooksExpensesStore,
  useBooksPaymentsMadeStore,
  useBooksPurchaseOrdersStore,
  useBooksRecurringBillsStore,
  useBooksRecurringExpensesStore,
  useBooksVendorCreditsStore,
  useBooksVendorsStore,
} from '@/lib/mock-data/purchases/stores'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'

const MODULE_LABELS: Record<string, string> = {
  expenses: 'Expense',
  'recurring-expenses': 'Recurring Expense',
  'purchase-orders': 'Purchase Order',
  bills: 'Bill',
  'payments-made': 'Payment',
  'recurring-bills': 'Recurring Bill',
  'vendor-credits': 'Vendor Credit',
}

export default function BooksPurchasesAddModulePage({ moduleKey }: { moduleKey: string }) {
  const router = useRouter()
  const { vendors } = useBooksVendorsStore()
  const expensesStore = useBooksExpensesStore()
  const recurringExpensesStore = useBooksRecurringExpensesStore()
  const purchaseOrdersStore = useBooksPurchaseOrdersStore()
  const billsStore = useBooksBillsStore()
  const paymentsMadeStore = useBooksPaymentsMadeStore()
  const recurringBillsStore = useBooksRecurringBillsStore()
  const vendorCreditsStore = useBooksVendorCreditsStore()

  const vendorOptions = useMemo(
    () =>
      vendors.map((v) => ({
        value: String(v.id),
        label: v.company || v.name,
      })),
    [vendors]
  )

  const categoryOptions = [
    { value: 'Subcontractor', label: 'Subcontractor' },
    { value: 'SoftwareSaaS', label: 'Software / SaaS' },
    { value: 'Travel', label: 'Travel' },
    { value: 'Office', label: 'Office' },
    { value: 'Meals', label: 'Meals' },
    { value: 'Training', label: 'Training' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Other', label: 'Other' },
  ]

  const frequencyOptions = [
    { value: 'Monthly', label: 'Monthly' },
    { value: 'Quarterly', label: 'Quarterly' },
    { value: 'Yearly', label: 'Yearly' },
  ]

  const createRecord = useCallback(
    (data: Omit<PurchaseDocRow, 'id' | 'createdAt' | 'updatedAt'>) => {
      switch (moduleKey) {
        case 'expenses':
          return expensesStore.createRecord(data)
        case 'recurring-expenses':
          return recurringExpensesStore.createRecord(data)
        case 'purchase-orders':
          return purchaseOrdersStore.createRecord(data)
        case 'bills':
          return billsStore.createRecord(data)
        case 'payments-made':
          return paymentsMadeStore.createRecord(data)
        case 'recurring-bills':
          return recurringBillsStore.createRecord(data)
        case 'vendor-credits':
          return vendorCreditsStore.createRecord(data)
        default:
          return expensesStore.createRecord(data)
      }
    },
    [
      moduleKey,
      expensesStore,
      recurringExpensesStore,
      purchaseOrdersStore,
      billsStore,
      paymentsMadeStore,
      recurringBillsStore,
      vendorCreditsStore,
    ]
  )

  const handleSubmitSuccess = useCallback(
    async (values: Record<string, string>) => {
      const vendorLabel = resolveVendorLabel(values.vendorId ?? '', vendors)
      const created = createRecord(buildPurchaseDocFromForm(moduleKey, values, vendorLabel))
      router.replace(`/purchases/${moduleKey}/${created.id}`)
    },
    [createRecord, moduleKey, router, vendors]
  )

  const configs: Record<
    string,
    {
      submitLabel: string
      sections: Parameters<typeof BooksCrmAddEntityPage>[0]['sections']
    }
  > = useMemo(
    () => ({
      expenses: {
        submitLabel: 'Create Expense',
        sections: [
          {
            icon: FileText,
            title: 'Expense Details',
            description: 'Record an expense entry',
            fields: [
              { key: 'expenseDate', type: 'input', label: 'Expense Date *', required: true, inputType: 'date' },
              { key: 'vendorId', type: 'select', label: 'Vendor *', required: true, options: vendorOptions },
              { key: 'category', type: 'select', label: 'Category', options: categoryOptions },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Recorded', label: 'Recorded' },
                  { value: 'Billable', label: 'Billable' },
                ],
              },
              { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: Receipt,
            title: 'Receipt & Notes',
            fields: [
              { key: 'receiptRef', type: 'input', label: 'Receipt Reference', placeholder: 'Optional reference' },
              { key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional notes...', rows: 4 },
            ],
          },
        ],
      },
      'recurring-expenses': {
        submitLabel: 'Create Recurring Expense',
        sections: [
          {
            icon: Repeat,
            title: 'Recurring Expense Setup',
            description: 'Automate recurring expense entries',
            fields: [
              { key: 'recurringName', type: 'input', label: 'Name *', required: true, placeholder: 'Recurring Expense' },
              { key: 'vendorId', type: 'select', label: 'Vendor *', required: true, options: vendorOptions },
              { key: 'frequency', type: 'select', label: 'Frequency', options: frequencyOptions },
              { key: 'nextDate', type: 'input', label: 'Next Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: FileText,
            title: 'Notes',
            fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }],
          },
        ],
      },
      'purchase-orders': {
        submitLabel: 'Create Purchase Order',
        sections: [
          {
            icon: ShoppingCart,
            title: 'Purchase Order',
            description: 'Order details and approvals',
            fields: [
              { key: 'poNumber', type: 'input', label: 'PO # *', required: true, placeholder: 'PO-1001' },
              { key: 'vendorId', type: 'select', label: 'Vendor *', required: true, options: vendorOptions },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Issued', label: 'Issued' },
                ],
              },
              { key: 'orderDate', type: 'input', label: 'Order Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: Truck,
            title: 'Notes',
            fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }],
          },
        ],
      },
      bills: {
        submitLabel: 'Create Bill',
        sections: [
          {
            icon: Receipt,
            title: 'Bill',
            description: 'Track vendor bills and due dates',
            fields: [
              { key: 'billNumber', type: 'input', label: 'Bill # *', required: true, placeholder: 'BILL-1001' },
              { key: 'vendorId', type: 'select', label: 'Vendor *', required: true, options: vendorOptions },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Open', label: 'Open' },
                  { value: 'Overdue', label: 'Overdue' },
                  { value: 'Paid', label: 'Paid' },
                ],
              },
              { key: 'billDate', type: 'input', label: 'Bill Date', inputType: 'date' },
              { key: 'dueDate', type: 'input', label: 'Due Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: FileText,
            title: 'Notes',
            fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }],
          },
        ],
      },
      'payments-made': {
        submitLabel: 'Record Payment',
        sections: [
          {
            icon: CreditCard,
            title: 'Payment Made',
            description: 'Track outgoing payments',
            fields: [
              { key: 'paymentNumber', type: 'input', label: 'Payment # *', required: true, placeholder: 'PMT-1001' },
              { key: 'vendorId', type: 'select', label: 'Vendor *', required: true, options: vendorOptions },
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
                  { value: 'Paid', label: 'Paid' },
                  { value: 'Cleared', label: 'Cleared' },
                ],
              },
            ],
          },
          {
            icon: FileText,
            title: 'Notes',
            fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }],
          },
        ],
      },
      'recurring-bills': {
        submitLabel: 'Create Recurring Bill',
        sections: [
          {
            icon: Repeat,
            title: 'Recurring Bill Setup',
            fields: [
              { key: 'recurringName', type: 'input', label: 'Name *', required: true, placeholder: 'Recurring Bill' },
              { key: 'vendorId', type: 'select', label: 'Vendor *', required: true, options: vendorOptions },
              { key: 'frequency', type: 'select', label: 'Frequency', options: frequencyOptions },
              { key: 'nextDate', type: 'input', label: 'Next Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: Calendar,
            title: 'Notes',
            fields: [{ key: 'notes', type: 'textarea', label: 'Notes', placeholder: 'Optional...', rows: 4 }],
          },
        ],
      },
      'vendor-credits': {
        submitLabel: 'Create Vendor Credit',
        sections: [
          {
            icon: CreditCard,
            title: 'Vendor Credit',
            fields: [
              { key: 'creditNumber', type: 'input', label: 'Credit # *', required: true, placeholder: 'VC-1001' },
              { key: 'vendorId', type: 'select', label: 'Vendor *', required: true, options: vendorOptions },
              {
                key: 'status',
                type: 'select',
                label: 'Status',
                options: [
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Open', label: 'Open' },
                  { value: 'Issued', label: 'Issued' },
                ],
              },
              { key: 'creditDate', type: 'input', label: 'Credit Date', inputType: 'date' },
              { key: 'amount', type: 'input', label: 'Amount *', required: true, placeholder: '0', inputType: 'number' },
            ],
          },
          {
            icon: FileText,
            title: 'Reason',
            fields: [{ key: 'reason', type: 'textarea', label: 'Reason', placeholder: 'Optional reason...', rows: 4 }],
          },
        ],
      },
    }),
    [vendorOptions]
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
  const listHref = `/purchases/${moduleKey}`

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
