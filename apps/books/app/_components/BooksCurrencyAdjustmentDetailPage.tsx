'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Coins, Edit, FileText, Hash, Trash2 } from 'lucide-react'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import { useBooksCurrencyAdjustmentsStore } from '@/lib/mock-data/accountant/stores'

const BASE = '/accountant/currency-adjustments'

export default function BooksCurrencyAdjustmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteAdjustment } = useBooksCurrencyAdjustmentsStore()
  const adjustment = getById(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const title = adjustment?.reference || ''
  const subtitle = useMemo(() => {
    if (!adjustment) return undefined
    return [adjustment.currency, adjustment.status].filter(Boolean).join(' • ')
  }, [adjustment])

  const handleConfirmDelete = async () => {
    if (!adjustment || deleting) return
    try {
      setDeleting(true)
      deleteAdjustment(adjustment.id)
      setShowDeleteModal(false)
      router.push(BASE)
    } finally {
      setDeleting(false)
    }
  }

  if (!adjustment) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title="Adjustment not found"
          basePath={BASE}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Currency Adjustments', href: BASE },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Currency adjustment not found.</p>
          <Link href={BASE} className="mt-4 inline-block">
            <Button variant="primary">Back to currency adjustments</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksRecordEntityPageHeader
        title={title}
        subtitle={subtitle}
        basePath={BASE}
        record={{ id: adjustment.id, name: title }}
        exportPrefix="currency-adjustment"
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Currency Adjustments', href: BASE },
          { label: title },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard theme="books" compact title="Amount" value={adjustment.amount} icon={Coins} colorScheme="orange" />
        <KPICard theme="books" compact title="Currency" value={adjustment.currency} icon={Coins} colorScheme="orange" />
        <KPICard theme="books" compact title="Date" value={adjustment.date} icon={Calendar} colorScheme="orange" />
        <KPICard theme="books" compact title="Status" value={adjustment.status} icon={FileText} colorScheme="orange" />
      </div>

      <Card variant="elevated" surface="books" className="rounded-xl">
        <BooksInfoSection title="Adjustment details" icon={Coins} isFirst>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BooksInfoRow label="Reference" value={adjustment.reference} icon={Hash} />
            <BooksInfoRow label="Currency" value={adjustment.currency} icon={Coins} />
            <BooksInfoRow label="Date" value={adjustment.date} icon={Calendar} />
            <BooksInfoRow label="Amount" value={adjustment.amount} icon={Coins} emphasize />
            <BooksInfoRow label="Status" value={adjustment.status} icon={FileText} />
            <BooksInfoRow label="Created" icon={Calendar}>
              <TableCellCreated dateString={adjustment.createdAt} theme="books" />
            </BooksInfoRow>
          </div>
        </BooksInfoSection>
      </Card>

      <Card variant="elevated" surface="books" className="rounded-xl p-4">
        <BooksSidebarCardTitle title="Quick links" icon={Coins} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${BASE}/${adjustment.id}/edit`}>
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
        itemName={title}
        entityLabel="Currency adjustment"
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
