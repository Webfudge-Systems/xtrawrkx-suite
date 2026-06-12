'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Building2, Edit, Mail, Phone, Receipt, Tag, Trash2, User, Wallet } from 'lucide-react'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import { formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import { useBooksCustomersStore } from '@/lib/mock-data/sales/stores'

const BASE = '/sales/customers'

export default function BooksCustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteCustomer } = useBooksCustomersStore()
  const customer = getById(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!customer) return undefined
    return [customer.company, customer.type].filter(Boolean).join(' • ')
  }, [customer])

  const handleConfirmDelete = async () => {
    if (!customer || deleting) return
    try {
      setDeleting(true)
      deleteCustomer(customer.id)
      setShowDeleteModal(false)
      router.push(BASE)
    } finally {
      setDeleting(false)
    }
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title="Customer not found"
          basePath={BASE}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Customers', href: BASE },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Customer not found.</p>
          <Link href={BASE} className="mt-4 inline-block">
            <Button variant="primary">Back to customers</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksRecordEntityPageHeader
        title={customer.name}
        subtitle={subtitle}
        basePath={BASE}
        record={{ id: customer.id, name: customer.name }}
        exportPrefix="customer"
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Customers', href: BASE },
          { label: customer.name },
        ]}
      />

      <Card variant="elevated" surface="books" className="rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--books-orange-bg)] text-[var(--books-orange-text)]">
            <User className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[var(--books-text-primary,#f8fafc)]">{customer.name}</h2>
            <p className="text-sm text-[var(--books-text-secondary,#9ca3af)]">{customer.company}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          theme="books"
          compact
          title="Lifetime Billed"
          value={formatSalesMoney(customer.lifetimeBilled ?? 0)}
          icon={Wallet}
          colorScheme="orange"
        />
        <KPICard
          theme="books"
          compact
          title="Receivables"
          value={formatSalesMoney(customer.receivables ?? 0)}
          icon={Receipt}
          colorScheme="orange"
        />
        <KPICard
          theme="books"
          compact
          title="Unused Credits"
          value={formatSalesMoney(customer.unusedCredits ?? 0)}
          icon={Wallet}
          colorScheme="orange"
        />
        <KPICard theme="books" compact title="Type" value={customer.type ?? '—'} icon={Tag} colorScheme="orange" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card variant="elevated" surface="books" className="rounded-xl">
            <BooksInfoSection title="Customer profile" icon={User} isFirst>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <BooksInfoRow label="Name" value={customer.name} icon={User} />
                <BooksInfoRow label="Company" value={customer.company} icon={Building2} />
                <BooksInfoRow label="Email" value={customer.email} icon={Mail} />
                <BooksInfoRow label="Phone" value={customer.phone} icon={Phone} />
                <BooksInfoRow label="Type" value={customer.type} icon={Tag} />
                <BooksInfoRow label="Currency" value={customer.currency} icon={Wallet} />
                <BooksInfoRow label="Created" icon={Tag}>
                  <TableCellCreated dateString={customer.createdAt} theme="books" />
                </BooksInfoRow>
              </div>
            </BooksInfoSection>
          </Card>
        </div>
        <div>
          <Card variant="elevated" surface="books" className="rounded-xl">
            <BooksSidebarCardTitle title="Quick links" icon={User} />
            <div className="space-y-2">
              <Link
                href={`${BASE}/${customer.id}/edit`}
                className="flex items-center gap-2 rounded-lg border border-[color:var(--books-border)] px-3 py-2 text-sm text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-elevated)]"
              >
                <Edit className="h-4 w-4 text-[var(--books-orange-text)]" />
                Edit customer
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete customer
              </button>
            </div>
          </Card>
        </div>
      </div>

      <BooksDeleteItemModal
        isOpen={showDeleteModal}
        itemName={customer.name}
        entityLabel="Customer"
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
