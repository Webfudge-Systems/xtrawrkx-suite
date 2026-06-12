'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Edit, FileText, FolderOpen, Trash2 } from 'lucide-react'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import { useBooksBankStatementsStore, useBooksDocumentsStore } from '@/lib/mock-data/documents/stores'

type Props = {
  isDocuments?: boolean
  isBankStatement?: boolean
  base?: string
}

export default function BooksDocumentDetailPage({ isDocuments, isBankStatement, base }: Props) {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const documentsStore = useBooksDocumentsStore()
  const bankStatementsStore = useBooksBankStatementsStore()

  const resolvedBase = base ?? (isBankStatement ? '/documents/bank-statements' : '/documents')
  const listLabel = isBankStatement ? 'Bank Statements' : 'Documents'
  const entityLabel = isBankStatement ? 'Bank statement' : 'Document'
  const exportPrefix = isBankStatement ? 'bank-statement' : 'document'

  const { getById, deleteDocument } = documentsStore
  const { getById: getStatementById, deleteStatement } = bankStatementsStore
  const record = isBankStatement ? getStatementById(id) : getById(id)
  const deleteRecord = isBankStatement ? deleteStatement : deleteDocument

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!record) return undefined
    return [record.status, record.updatedAt].filter(Boolean).join(' • ')
  }, [record])

  const handleConfirmDelete = async () => {
    if (!record || deleting) return
    try {
      setDeleting(true)
      deleteRecord(record.id)
      setShowDeleteModal(false)
      router.push(resolvedBase)
    } finally {
      setDeleting(false)
    }
  }

  if (!record) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title={`${entityLabel} not found`}
          basePath={resolvedBase}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: listLabel, href: resolvedBase },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">{entityLabel} not found.</p>
          <Link href={resolvedBase} className="mt-4 inline-block">
            <Button variant="primary">Back to {listLabel.toLowerCase()}</Button>
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
        basePath={resolvedBase}
        record={{ id: record.id, name: record.name }}
        exportPrefix={exportPrefix}
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: listLabel, href: resolvedBase },
          { label: record.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard theme="books" compact title="Name" value={record.name} icon={FileText} colorScheme="orange" />
        <KPICard theme="books" compact title="Status" value={record.status} icon={FolderOpen} colorScheme="orange" />
        <KPICard theme="books" compact title="Updated" value={record.updatedAt} icon={Calendar} colorScheme="orange" />
        <KPICard
          theme="books"
          compact
          title="Type"
          value={isBankStatement ? 'Bank statement' : isDocuments ? 'Document' : 'File'}
          icon={FileText}
          colorScheme="orange"
        />
      </div>

      <Card variant="elevated" surface="books" className="rounded-xl">
        <BooksInfoSection title={`${entityLabel} details`} icon={FileText} isFirst>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BooksInfoRow label="Name" value={record.name} icon={FileText} />
            <BooksInfoRow label="Status" value={record.status} icon={FolderOpen} emphasize />
            <BooksInfoRow label="Updated" value={record.updatedAt} icon={Calendar} />
            <BooksInfoRow label="Created" icon={Calendar}>
              <TableCellCreated dateString={record.createdAt} theme="books" />
            </BooksInfoRow>
          </div>
        </BooksInfoSection>
      </Card>

      <Card variant="elevated" surface="books" className="rounded-xl p-4">
        <BooksSidebarCardTitle title="Quick links" icon={FileText} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${resolvedBase}/${record.id}/edit`}>
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
        itemName={record.name}
        entityLabel={entityLabel}
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
