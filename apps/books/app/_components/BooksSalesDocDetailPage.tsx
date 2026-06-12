'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Edit, FileText, Hash, Tag, Trash2, User } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import type { SalesDocRow } from '@/lib/mock-data/sales/seeds'
import {
  useBooksCreditNotesStore,
  useBooksDeliveryChallansStore,
  useBooksEstimatesStore,
  useBooksPaymentsReceivedStore,
  useBooksRecurringInvoicesStore,
  useBooksRetainerInvoicesStore,
  useBooksSalesOrdersStore,
} from '@/lib/mock-data/sales/stores'

export type SalesDocModuleKey =
  | 'estimates'
  | 'retainer-invoices'
  | 'sales-orders'
  | 'delivery-challans'
  | 'recurring-invoices'
  | 'payments-received'
  | 'credit-notes'

const MODULE_META: Record<
  SalesDocModuleKey,
  { basePath: string; entityLabel: string; listLabel: string; exportPrefix: string }
> = {
  estimates: {
    basePath: '/sales/estimates',
    entityLabel: 'Estimate',
    listLabel: 'Estimates',
    exportPrefix: 'estimate',
  },
  'retainer-invoices': {
    basePath: '/sales/retainer-invoices',
    entityLabel: 'Retainer Invoice',
    listLabel: 'Retainer Invoices',
    exportPrefix: 'retainer-invoice',
  },
  'sales-orders': {
    basePath: '/sales/sales-orders',
    entityLabel: 'Sales Order',
    listLabel: 'Sales Orders',
    exportPrefix: 'sales-order',
  },
  'delivery-challans': {
    basePath: '/sales/delivery-challans',
    entityLabel: 'Delivery Challan',
    listLabel: 'Delivery Challans',
    exportPrefix: 'delivery-challan',
  },
  'recurring-invoices': {
    basePath: '/sales/recurring-invoices',
    entityLabel: 'Recurring Invoice',
    listLabel: 'Recurring Invoices',
    exportPrefix: 'recurring-invoice',
  },
  'payments-received': {
    basePath: '/sales/payments-received',
    entityLabel: 'Payment',
    listLabel: 'Payments Received',
    exportPrefix: 'payment-received',
  },
  'credit-notes': {
    basePath: '/sales/credit-notes',
    entityLabel: 'Credit Note',
    listLabel: 'Credit Notes',
    exportPrefix: 'credit-note',
  },
}

function useSalesDocModuleStore(moduleKey: SalesDocModuleKey) {
  const estimates = useBooksEstimatesStore()
  const retainerInvoices = useBooksRetainerInvoicesStore()
  const salesOrders = useBooksSalesOrdersStore()
  const deliveryChallans = useBooksDeliveryChallansStore()
  const recurringInvoices = useBooksRecurringInvoicesStore()
  const paymentsReceived = useBooksPaymentsReceivedStore()
  const creditNotes = useBooksCreditNotesStore()

  switch (moduleKey) {
    case 'estimates':
      return { records: estimates.estimates, getById: estimates.getById, deleteRecord: estimates.deleteRecord }
    case 'retainer-invoices':
      return {
        records: retainerInvoices.retainerInvoices,
        getById: retainerInvoices.getById,
        deleteRecord: retainerInvoices.deleteRecord,
      }
    case 'sales-orders':
      return { records: salesOrders.salesOrders, getById: salesOrders.getById, deleteRecord: salesOrders.deleteRecord }
    case 'delivery-challans':
      return {
        records: deliveryChallans.deliveryChallans,
        getById: deliveryChallans.getById,
        deleteRecord: deliveryChallans.deleteRecord,
      }
    case 'recurring-invoices':
      return {
        records: recurringInvoices.recurringInvoices,
        getById: recurringInvoices.getById,
        deleteRecord: recurringInvoices.deleteRecord,
      }
    case 'payments-received':
      return {
        records: paymentsReceived.paymentsReceived,
        getById: paymentsReceived.getById,
        deleteRecord: paymentsReceived.deleteRecord,
      }
    case 'credit-notes':
      return { records: creditNotes.creditNotes, getById: creditNotes.getById, deleteRecord: creditNotes.deleteRecord }
    default:
      return { records: [], getById: () => null, deleteRecord: () => {} }
  }
}

export default function BooksSalesDocDetailPage({ moduleKey }: { moduleKey: SalesDocModuleKey }) {
  const meta = MODULE_META[moduleKey]
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteRecord } = useSalesDocModuleStore(moduleKey)
  const record = getById(id) as SalesDocRow | null
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!record) return undefined
    return [record.customer, record.status].filter(Boolean).join(' • ')
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
            <p className="text-sm text-[var(--books-text-secondary,#9ca3af)]">{record.customer}</p>
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
        <KPICard theme="books" compact title="Customer" value={record.customer} icon={User} colorScheme="orange" />
        <KPICard theme="books" compact title="Date" value={record.date} icon={Calendar} colorScheme="orange" />
        <KPICard theme="books" compact title="Status" value={record.status} icon={Tag} colorScheme="orange" />
      </div>

      <Card variant="elevated" surface="books" className="rounded-xl">
        <BooksInfoSection title={`${meta.entityLabel} details`} icon={FileText} isFirst>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BooksInfoRow label="Number" value={record.number} icon={Hash} />
            <BooksInfoRow label="Customer" value={record.customer} icon={User} />
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
