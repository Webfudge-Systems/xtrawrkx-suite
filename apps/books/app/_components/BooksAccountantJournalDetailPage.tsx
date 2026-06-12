'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { BookOpen, Calendar, Edit, FileText, Hash, Trash2 } from 'lucide-react'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import {
  useBooksBulkUpdatesStore,
  useBooksManualJournalsStore,
  useBooksTransactionLocksStore,
} from '@/lib/mock-data/accountant/stores'

type JournalModuleKey = 'manual-journals' | 'bulk-update' | 'transaction-locking'

const MODULE_CONFIG: Record<
  JournalModuleKey,
  { base: string; listLabel: string; entityLabel: string; exportPrefix: string }
> = {
  'manual-journals': {
    base: '/accountant/manual-journals',
    listLabel: 'Manual Journals',
    entityLabel: 'Journal',
    exportPrefix: 'manual-journal',
  },
  'bulk-update': {
    base: '/accountant/bulk-update',
    listLabel: 'Bulk Update',
    entityLabel: 'Bulk update',
    exportPrefix: 'bulk-update',
  },
  'transaction-locking': {
    base: '/accountant/transaction-locking',
    listLabel: 'Transaction Locking',
    entityLabel: 'Lock',
    exportPrefix: 'transaction-lock',
  },
}

type Props = {
  moduleKey: JournalModuleKey
}

export default function BooksAccountantJournalDetailPage({ moduleKey }: Props) {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const config = MODULE_CONFIG[moduleKey]

  const manualStore = useBooksManualJournalsStore()
  const bulkStore = useBooksBulkUpdatesStore()
  const lockStore = useBooksTransactionLocksStore()
  const { getById, deleteRecord } =
    moduleKey === 'manual-journals' ? manualStore : moduleKey === 'bulk-update' ? bulkStore : lockStore

  const record = getById(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!record) return undefined
    return [record.date, record.status].filter(Boolean).join(' • ')
  }, [record])

  const handleConfirmDelete = async () => {
    if (!record || deleting) return
    try {
      setDeleting(true)
      deleteRecord(record.id)
      setShowDeleteModal(false)
      router.push(config.base)
    } finally {
      setDeleting(false)
    }
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title={`${config.entityLabel} not found`}
          basePath={config.base}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: config.listLabel, href: config.base },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">{config.entityLabel} not found.</p>
          <Link href={config.base} className="mt-4 inline-block">
            <Button variant="primary">Back to {config.listLabel.toLowerCase()}</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksRecordEntityPageHeader
        title={record.journalNumber}
        subtitle={subtitle}
        basePath={config.base}
        record={{ id: record.id, name: record.journalNumber }}
        exportPrefix={config.exportPrefix}
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: config.listLabel, href: config.base },
          { label: record.journalNumber },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard theme="books" compact title="Journal #" value={record.journalNumber} icon={Hash} colorScheme="orange" />
        <KPICard theme="books" compact title="Date" value={record.date} icon={Calendar} colorScheme="orange" />
        <KPICard theme="books" compact title="Reference" value={record.referenceNumber || '—'} icon={FileText} colorScheme="orange" />
        <KPICard theme="books" compact title="Status" value={record.status} icon={BookOpen} colorScheme="orange" />
      </div>

      <Card variant="elevated" surface="books" className="rounded-xl">
        <BooksInfoSection title={`${config.entityLabel} details`} icon={BookOpen} isFirst>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BooksInfoRow label="Journal number" value={record.journalNumber} icon={Hash} />
            <BooksInfoRow label="Date" value={record.date} icon={Calendar} />
            <BooksInfoRow label="Reference" value={record.referenceNumber} icon={FileText} />
            <BooksInfoRow label="Status" value={record.status} icon={BookOpen} emphasize />
            <BooksInfoRow label="Notes" value={record.notes || '—'} icon={FileText} />
            <BooksInfoRow label="Created" icon={Calendar}>
              <TableCellCreated dateString={record.createdAt} theme="books" />
            </BooksInfoRow>
          </div>
        </BooksInfoSection>
      </Card>

      <Card variant="elevated" surface="books" className="rounded-xl p-4">
        <BooksSidebarCardTitle title="Quick links" icon={BookOpen} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${config.base}/${record.id}/edit`}>
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
        itemName={record.journalNumber}
        entityLabel={config.entityLabel}
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
