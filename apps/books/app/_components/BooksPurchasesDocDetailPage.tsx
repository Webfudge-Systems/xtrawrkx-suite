'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Edit, FileText, Hash, Tag, Trash2, Truck } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'
import {
  useBooksBillsStore,
  useBooksExpensesStore,
  useBooksPaymentsMadeStore,
  useBooksPurchaseOrdersStore,
  useBooksRecurringBillsStore,
  useBooksRecurringExpensesStore,
  useBooksVendorCreditsStore,
} from '@/lib/mock-data/purchases/stores'

export type PurchaseDocModuleKey =
  | 'expenses'
  | 'recurring-expenses'
  | 'purchase-orders'
  | 'bills'
  | 'payments-made'
  | 'recurring-bills'
  | 'vendor-credits'

const MODULE_META: Record<
  PurchaseDocModuleKey,
  { basePath: string; entityLabel: string; listLabel: string; exportPrefix: string }
> = {
  expenses: {
    basePath: '/purchases/expenses',
    entityLabel: 'Expense',
    listLabel: 'Expenses',
    exportPrefix: 'expense',
  },
  'recurring-expenses': {
    basePath: '/purchases/recurring-expenses',
    entityLabel: 'Recurring Expense',
    listLabel: 'Recurring Expenses',
    exportPrefix: 'recurring-expense',
  },
  'purchase-orders': {
    basePath: '/purchases/purchase-orders',
    entityLabel: 'Purchase Order',
    listLabel: 'Purchase Orders',
    exportPrefix: 'purchase-order',
  },
  bills: {
    basePath: '/purchases/bills',
    entityLabel: 'Bill',
    listLabel: 'Bills',
    exportPrefix: 'bill',
  },
  'payments-made': {
    basePath: '/purchases/payments-made',
    entityLabel: 'Payment',
    listLabel: 'Payments Made',
    exportPrefix: 'payment-made',
  },
  'recurring-bills': {
    basePath: '/purchases/recurring-bills',
    entityLabel: 'Recurring Bill',
    listLabel: 'Recurring Bills',
    exportPrefix: 'recurring-bill',
  },
  'vendor-credits': {
    basePath: '/purchases/vendor-credits',
    entityLabel: 'Vendor Credit',
    listLabel: 'Vendor Credits',
    exportPrefix: 'vendor-credit',
  },
}

function usePurchaseDocModuleStore(moduleKey: PurchaseDocModuleKey) {
  const expenses = useBooksExpensesStore()
  const recurringExpenses = useBooksRecurringExpensesStore()
  const purchaseOrders = useBooksPurchaseOrdersStore()
  const bills = useBooksBillsStore()
  const paymentsMade = useBooksPaymentsMadeStore()
  const recurringBills = useBooksRecurringBillsStore()
  const vendorCredits = useBooksVendorCreditsStore()

  switch (moduleKey) {
    case 'expenses':
      return { records: expenses.expenses, getById: expenses.getById, deleteRecord: expenses.deleteRecord }
    case 'recurring-expenses':
      return {
        records: recurringExpenses.recurringExpenses,
        getById: recurringExpenses.getById,
        deleteRecord: recurringExpenses.deleteRecord,
      }
    case 'purchase-orders':
      return {
        records: purchaseOrders.purchaseOrders,
        getById: purchaseOrders.getById,
        deleteRecord: purchaseOrders.deleteRecord,
      }
    case 'bills':
      return { records: bills.bills, getById: bills.getById, deleteRecord: bills.deleteRecord }
    case 'payments-made':
      return {
        records: paymentsMade.paymentsMade,
        getById: paymentsMade.getById,
        deleteRecord: paymentsMade.deleteRecord,
      }
    case 'recurring-bills':
      return {
        records: recurringBills.recurringBills,
        getById: recurringBills.getById,
        deleteRecord: recurringBills.deleteRecord,
      }
    case 'vendor-credits':
      return {
        records: vendorCredits.vendorCredits,
        getById: vendorCredits.getById,
        deleteRecord: vendorCredits.deleteRecord,
      }
    default:
      return { records: [], getById: () => null, deleteRecord: () => {} }
  }
}

export default function BooksPurchasesDocDetailPage({ moduleKey }: { moduleKey: PurchaseDocModuleKey }) {
  const meta = MODULE_META[moduleKey]
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteRecord } = usePurchaseDocModuleStore(moduleKey)
  const record = getById(id) as PurchaseDocRow | null
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!record) return undefined
    return [record.vendor, record.status].filter(Boolean).join(' • ')
  }, [record])

  const handleConfirmDelete = async () => {
    if (!record || deleting) return
    try {
      setDeleting(true)
      deleteRecord(record.id)
      setShowDeleteModal(false)
      router.push(meta.basePath)
    } finally {
      setDeleting(false)
    }
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title={`${meta.entityLabel} not found`}
          basePath={meta.basePath}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: meta.listLabel, href: meta.basePath },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">{meta.entityLabel} not found.</p>
          <Link href={meta.basePath} className="mt-4 inline-block">
            <Button variant="primary">Back to list</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksRecordEntityPageHeader
        title={record.number}
        subtitle={subtitle}
        basePath={meta.basePath}
        record={{ id: record.id, name: record.number }}
        exportPrefix={meta.exportPrefix}
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: meta.listLabel, href: meta.basePath },
          { label: record.number },
        ]}
      />

      <Card variant="elevated" surface="books" className="rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--books-orange-bg)] text-[var(--books-orange-text)]">
            <FileText className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[var(--books-text-primary,#f8fafc)]">{record.number}</h2>
            <p className="text-sm text-[var(--books-text-secondary,#9ca3af)]">{record.vendor}</p>
          </div>
          <span
            className={clsx(
              'rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase',
              'border-[color:var(--books-border)] text-[var(--books-text-secondary)]'
            )}
          >
            {record.status}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard theme="books" compact title="Amount" value={record.amount} icon={Hash} colorScheme="orange" />
        <KPICard theme="books" compact title="Vendor" value={record.vendor} icon={Truck} colorScheme="orange" />
        <KPICard theme="books" compact title="Date" value={record.date} icon={Calendar} colorScheme="orange" />
        <KPICard theme="books" compact title="Status" value={record.status} icon={Tag} colorScheme="orange" />
      </div>

      <Card variant="elevated" surface="books" className="rounded-xl">
        <BooksInfoSection title={`${meta.entityLabel} details`} icon={FileText} isFirst>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BooksInfoRow label="Number" value={record.number} icon={Hash} />
            <BooksInfoRow label="Vendor" value={record.vendor} icon={Truck} />
            <BooksInfoRow label="Amount" value={record.amount} icon={Hash} emphasize />
            <BooksInfoRow label="Date" value={record.date} icon={Calendar} />
            <BooksInfoRow label="Created" icon={Calendar}>
              <TableCellCreated dateString={record.createdAt} theme="books" />
            </BooksInfoRow>
          </div>
        </BooksInfoSection>
      </Card>

      <Card variant="elevated" surface="books" className="rounded-xl p-4">
        <BooksSidebarCardTitle title="Quick links" icon={FileText} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${meta.basePath}/${record.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setShowDeleteModal(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </Card>

      <BooksDeleteItemModal
        isOpen={showDeleteModal}
        itemName={record.number}
        entityLabel={meta.entityLabel}
        deleting={deleting}
        onClose={() => {
          if (deleting) return
          setShowDeleteModal(false)
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
