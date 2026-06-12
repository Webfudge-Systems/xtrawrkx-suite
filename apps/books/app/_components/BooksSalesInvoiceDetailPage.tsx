'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Edit, FileText, Hash, Tag, Trash2, User, Wallet } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import { formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import { useBooksSalesInvoicesStore } from '@/lib/mock-data/sales/stores'

const BASE = '/sales/invoices'

export default function BooksSalesInvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteInvoice } = useBooksSalesInvoicesStore()
  const invoice = getById(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!invoice) return undefined
    return [invoice.customer, invoice.status].filter(Boolean).join(' • ')
  }, [invoice])

  const handleConfirmDelete = async () => {
    if (!invoice || deleting) return
    try {
      setDeleting(true)
      deleteInvoice(invoice.id)
      setShowDeleteModal(false)
      router.push(BASE)
    } finally {
      setDeleting(false)
    }
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title="Invoice not found"
          basePath={BASE}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Invoices', href: BASE },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Invoice not found.</p>
          <Link href={BASE} className="mt-4 inline-block">
            <Button variant="primary">Back to invoices</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksRecordEntityPageHeader
        title={invoice.number}
        subtitle={subtitle}
        basePath={BASE}
        record={{ id: invoice.id, name: invoice.number }}
        exportPrefix="sales-invoice"
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Invoices', href: BASE },
          { label: invoice.number },
        ]}
      />

      <Card variant="elevated" surface="books" className="rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--books-orange-bg)] text-[var(--books-orange-text)]">
            <FileText className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[var(--books-text-primary,#f8fafc)]">{invoice.number}</h2>
            <p className="text-sm text-[var(--books-text-secondary,#9ca3af)]">{invoice.customer}</p>
          </div>
          <span
            className={clsx(
              'rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase',
              'border-[color:var(--books-border)] text-[var(--books-text-secondary)]'
            )}
          >
            {invoice.status}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          theme="books"
          compact
          title="Amount"
          value={formatSalesMoney(invoice.amount)}
          icon={Hash}
          colorScheme="orange"
        />
        <KPICard
          theme="books"
          compact
          title="Balance"
          value={formatSalesMoney(invoice.balance)}
          icon={Wallet}
          colorScheme="orange"
        />
        <KPICard theme="books" compact title="Customer" value={invoice.customer} icon={User} colorScheme="orange" />
        <KPICard theme="books" compact title="Due Date" value={invoice.dueDate} icon={Calendar} colorScheme="orange" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card variant="elevated" surface="books" className="rounded-xl">
            <BooksInfoSection title="Invoice details" icon={FileText} isFirst>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <BooksInfoRow label="Number" value={invoice.number} icon={Hash} />
                <BooksInfoRow label="Customer" value={invoice.customer} icon={User} />
                <BooksInfoRow label="Amount" value={formatSalesMoney(invoice.amount)} icon={Hash} emphasize />
                <BooksInfoRow label="Balance" value={formatSalesMoney(invoice.balance)} icon={Wallet} />
                <BooksInfoRow label="Date" value={invoice.date} icon={Calendar} />
                <BooksInfoRow label="Due date" value={invoice.dueDate} icon={Calendar} />
                <BooksInfoRow label="Status" value={invoice.status} icon={Tag} />
                <BooksInfoRow label="Created" icon={Calendar}>
                  <TableCellCreated dateString={invoice.createdAt} theme="books" />
                </BooksInfoRow>
              </div>
            </BooksInfoSection>
          </Card>
        </div>
        <div>
          <Card variant="elevated" surface="books" className="rounded-xl">
            <BooksSidebarCardTitle title="Quick links" icon={FileText} />
            <div className="space-y-2">
              <Link
                href={`${BASE}/${invoice.id}/edit`}
                className="flex items-center gap-2 rounded-lg border border-[color:var(--books-border)] px-3 py-2 text-sm text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-elevated)]"
              >
                <Edit className="h-4 w-4 text-[var(--books-orange-text)]" />
                Edit invoice
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete invoice
              </button>
            </div>
          </Card>
        </div>
      </div>

      <BooksDeleteItemModal
        isOpen={showDeleteModal}
        itemName={invoice.number}
        entityLabel="Invoice"
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
