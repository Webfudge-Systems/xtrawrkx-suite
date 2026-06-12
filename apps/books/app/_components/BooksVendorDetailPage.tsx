'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Building2, Edit, Mail, Phone, Receipt, Trash2, Wallet } from 'lucide-react'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import { formatPurchaseMoney } from '@/app/_components/booksPurchasesTableColumns'
import { useBooksVendorsStore } from '@/lib/mock-data/purchases/stores'

const BASE = '/purchases/vendors'

export default function BooksVendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteVendor } = useBooksVendorsStore()
  const vendor = getById(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!vendor) return undefined
    return [vendor.company, vendor.email].filter(Boolean).join(' • ')
  }, [vendor])

  const handleConfirmDelete = async () => {
    if (!vendor || deleting) return
    try {
      setDeleting(true)
      deleteVendor(vendor.id)
      setShowDeleteModal(false)
      router.push(BASE)
    } finally {
      setDeleting(false)
    }
  }

  if (!vendor) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title="Vendor not found"
          basePath={BASE}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Vendors', href: BASE },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Vendor not found.</p>
          <Link href={BASE} className="mt-4 inline-block">
            <Button variant="primary">Back to vendors</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksRecordEntityPageHeader
        title={vendor.name}
        subtitle={subtitle}
        basePath={BASE}
        record={{ id: vendor.id, name: vendor.name }}
        exportPrefix="vendor"
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Vendors', href: BASE },
          { label: vendor.name },
        ]}
      />

      <Card variant="elevated" surface="books" className="rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--books-orange-bg)] text-[var(--books-orange-text)]">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[var(--books-text-primary,#f8fafc)]">{vendor.name}</h2>
            <p className="text-sm text-[var(--books-text-secondary,#9ca3af)]">{vendor.company}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          theme="books"
          compact
          title="Payables"
          value={formatPurchaseMoney(vendor.payables ?? 0)}
          icon={Wallet}
          colorScheme="orange"
        />
        <KPICard
          theme="books"
          compact
          title="Unused Credits"
          value={formatPurchaseMoney(vendor.unusedCredits ?? 0)}
          icon={Receipt}
          colorScheme="orange"
        />
        <KPICard theme="books" compact title="Email" value={vendor.email || '—'} icon={Mail} colorScheme="orange" />
        <KPICard theme="books" compact title="Phone" value={vendor.phone || '—'} icon={Phone} colorScheme="orange" />
      </div>

      <Card variant="elevated" surface="books" className="rounded-xl">
        <BooksInfoSection title="Vendor details" icon={Building2} isFirst>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BooksInfoRow label="Name" value={vendor.name} icon={Building2} />
            <BooksInfoRow label="Company" value={vendor.company} icon={Building2} />
            <BooksInfoRow label="Email" value={vendor.email} icon={Mail} />
            <BooksInfoRow label="Phone" value={vendor.phone} icon={Phone} />
            <BooksInfoRow label="Payables" value={formatPurchaseMoney(vendor.payables ?? 0)} icon={Wallet} emphasize />
            <BooksInfoRow
              label="Unused credits"
              value={formatPurchaseMoney(vendor.unusedCredits ?? 0)}
              icon={Receipt}
            />
            <BooksInfoRow label="Created" icon={Building2}>
              <TableCellCreated dateString={vendor.createdAt} theme="books" />
            </BooksInfoRow>
          </div>
        </BooksInfoSection>
      </Card>

      <Card variant="elevated" surface="books" className="rounded-xl p-4">
        <BooksSidebarCardTitle title="Quick links" icon={Building2} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${BASE}/${vendor.id}/edit`}>
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
        itemName={vendor.name}
        entityLabel="Vendor"
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
