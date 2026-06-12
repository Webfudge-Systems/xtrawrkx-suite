'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Briefcase, Calendar, Clock, Edit, FileText, Trash2 } from 'lucide-react'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import { useBooksTimeEntriesStore } from '@/lib/mock-data/time-tracking/stores'

const BASE = '/time-tracking/timesheet'

export default function BooksTimeEntryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteTimeEntry } = useBooksTimeEntriesStore()
  const entry = getById(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const title = entry ? entry.task || `Time entry on ${entry.date}` : ''
  const subtitle = useMemo(() => {
    if (!entry) return undefined
    return [entry.projectName, entry.date].filter(Boolean).join(' • ')
  }, [entry])

  const handleConfirmDelete = async () => {
    if (!entry || deleting) return
    try {
      setDeleting(true)
      deleteTimeEntry(entry.id)
      setShowDeleteModal(false)
      router.push(BASE)
    } finally {
      setDeleting(false)
    }
  }

  if (!entry) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title="Time entry not found"
          basePath={BASE}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Timesheet', href: BASE },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Time entry not found.</p>
          <Link href={BASE} className="mt-4 inline-block">
            <Button variant="primary">Back to timesheet</Button>
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
        record={{ id: entry.id, name: title }}
        exportPrefix="time-entry"
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Timesheet', href: BASE },
          { label: title },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard theme="books" compact title="Hours" value={Number(entry.hours).toFixed(1)} icon={Clock} colorScheme="orange" />
        <KPICard
          theme="books"
          compact
          title="Billable"
          value={entry.billable ? 'Yes' : 'No'}
          icon={FileText}
          colorScheme="orange"
        />
        <KPICard
          theme="books"
          compact
          title="Invoiced"
          value={entry.invoiced ? 'Yes' : 'No'}
          icon={FileText}
          colorScheme="orange"
        />
        <KPICard theme="books" compact title="Date" value={entry.date} icon={Calendar} colorScheme="orange" />
      </div>

      <Card variant="elevated" surface="books" className="rounded-xl">
        <BooksInfoSection title="Time entry details" icon={Clock} isFirst>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BooksInfoRow label="Task" value={entry.task} icon={FileText} />
            <BooksInfoRow label="Project" value={entry.projectName} icon={Briefcase} />
            <BooksInfoRow label="Date" value={entry.date} icon={Calendar} />
            <BooksInfoRow label="Hours" value={Number(entry.hours).toFixed(1)} icon={Clock} emphasize />
            <BooksInfoRow label="Billable" value={entry.billable ? 'Yes' : 'No'} icon={FileText} />
            <BooksInfoRow label="Invoiced" value={entry.invoiced ? 'Yes' : 'No'} icon={FileText} />
            <BooksInfoRow label="Created" icon={Calendar}>
              <TableCellCreated dateString={entry.createdAt} theme="books" />
            </BooksInfoRow>
          </div>
        </BooksInfoSection>
      </Card>

      <Card variant="elevated" surface="books" className="rounded-xl p-4">
        <BooksSidebarCardTitle title="Quick links" icon={Clock} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${BASE}/${entry.id}/edit`}>
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
        entityLabel="Time entry"
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
