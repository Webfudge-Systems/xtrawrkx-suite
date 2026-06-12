'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AlignLeft, Boxes, Calendar, Edit, FileText, Hash, Tag, Trash2 } from 'lucide-react'
import { Button, Card, KPICard, TableCellCreated, formatTableDate } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import {
  BooksInfoRow,
  BooksInfoSection,
  BooksSidebarCardTitle,
} from '@/app/_components/BooksEntityDetailSections'
import { useBooksInventoryAdjustmentsStore } from '@/lib/mock-data/useBooksInventoryAdjustmentsStore'

const BASE = '/items/inventory-adjustments'
const BOOKS_THEME = 'books' as const

export default function BooksInventoryAdjustmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteAdjustment } = useBooksInventoryAdjustmentsStore()
  const record = getById(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!record) return undefined
    return [record.reference, record.status].filter(Boolean).join(' • ')
  }, [record])

  const handleConfirmDelete = async () => {
    if (!record || deleting) return
    try {
      setDeleting(true)
      deleteAdjustment(record.id)
      setShowDeleteModal(false)
      router.push(BASE)
    } finally {
      setDeleting(false)
    }
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title="Adjustment not found"
          subtitle="This record may have been deleted or the link is invalid."
          basePath={BASE}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Inventory Adjustments', href: BASE },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Adjustment not found.</p>
          <Link href={BASE} className="mt-4 inline-block">
            <Button variant="primary">Back to adjustments</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksRecordEntityPageHeader
        title={record.name}
        subtitle={subtitle}
        basePath={BASE}
        record={record}
        exportPrefix="inventory-adjustment"
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Inventory Adjustments', href: BASE },
          { label: record.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard theme="books" compact title="Status" value={record.status} icon={Tag} colorScheme="orange" />
        <KPICard theme="books" compact title="Reference" value={record.reference || '—'} icon={Hash} colorScheme="orange" />
        <KPICard
          theme="books"
          compact
          title="Created"
          value={formatTableDate(record.createdAt)}
          icon={Calendar}
          colorScheme="orange"
        />
        <KPICard
          theme="books"
          compact
          title="Last updated"
          value={formatTableDate(record.updatedAt || record.createdAt)}
          icon={Calendar}
          colorScheme="orange"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card variant="elevated" surface="books" className="rounded-xl">
            <BooksInfoSection title="Adjustment profile" icon={Boxes} isFirst>
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <BooksInfoRow label="Name" value={record.name} icon={Boxes} />
                <BooksInfoRow label="Reference" value={record.reference} icon={Hash} />
                <BooksInfoRow label="Status" value={record.status} icon={Tag} />
                <BooksInfoRow label="Created" icon={Calendar}>
                  <TableCellCreated dateString={record.createdAt} theme={BOOKS_THEME} />
                </BooksInfoRow>
              </div>
            </BooksInfoSection>
            {record.notes ? (
              <BooksInfoSection title="Notes" icon={AlignLeft}>
                <p className="text-base leading-relaxed text-[var(--books-text-primary,#f8fafc)]">{record.notes}</p>
              </BooksInfoSection>
            ) : null}
          </Card>
        </div>
        <div className="space-y-6">
          <Card variant="elevated" surface="books" className="rounded-xl">
            <BooksSidebarCardTitle title="Quick links" icon={FileText} />
            <div className="space-y-2">
              <Link
                href={`${BASE}/${record.id}/edit`}
                className="flex items-center gap-2 rounded-lg border border-[color:var(--books-border)] px-3 py-2 text-sm text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-elevated)]"
              >
                <Edit className="h-4 w-4 text-[var(--books-orange-text)]" />
                Edit adjustment
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete adjustment
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-[color:var(--books-border)] px-3 py-2 text-left text-sm text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-elevated)]"
                onClick={() => router.push(BASE)}
              >
                <Boxes className="h-4 w-4 text-[var(--books-orange-text)]" />
                Back to adjustments
              </button>
            </div>
          </Card>
        </div>
      </div>

      <BooksDeleteItemModal
        isOpen={showDeleteModal}
        itemName={record.name}
        entityLabel="Adjustment"
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
