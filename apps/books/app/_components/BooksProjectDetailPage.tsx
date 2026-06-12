'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Briefcase, Calendar, Clock, Edit, Trash2, User, Wallet } from 'lucide-react'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import { formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import { useBooksProjectsStore } from '@/lib/mock-data/time-tracking/stores'

const BASE = '/time-tracking/projects'

export default function BooksProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteProject } = useBooksProjectsStore()
  const project = getById(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!project) return undefined
    return [project.customerName, project.status].filter(Boolean).join(' • ')
  }, [project])

  const handleConfirmDelete = async () => {
    if (!project || deleting) return
    try {
      setDeleting(true)
      deleteProject(project.id)
      setShowDeleteModal(false)
      router.push(BASE)
    } finally {
      setDeleting(false)
    }
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title="Project not found"
          basePath={BASE}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Projects', href: BASE },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Project not found.</p>
          <Link href={BASE} className="mt-4 inline-block">
            <Button variant="primary">Back to projects</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksRecordEntityPageHeader
        title={project.name}
        subtitle={subtitle}
        basePath={BASE}
        record={{ id: project.id, name: project.name }}
        exportPrefix="project"
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Projects', href: BASE },
          { label: project.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          theme="books"
          compact
          title="Unbilled Amount"
          value={formatSalesMoney(project.unbilledAmount ?? 0)}
          icon={Wallet}
          colorScheme="orange"
        />
        <KPICard
          theme="books"
          compact
          title="Budget"
          value={formatSalesMoney(project.budget ?? 0)}
          icon={Briefcase}
          colorScheme="orange"
        />
        <KPICard
          theme="books"
          compact
          title="Logged Hours"
          value={Number(project.totalLoggedHours ?? 0).toFixed(1)}
          icon={Clock}
          colorScheme="orange"
        />
        <KPICard
          theme="books"
          compact
          title="Billable Hours"
          value={Number(project.billableHours ?? 0).toFixed(1)}
          icon={Clock}
          colorScheme="orange"
        />
      </div>

      <Card variant="elevated" surface="books" className="rounded-xl">
        <BooksInfoSection title="Project details" icon={Briefcase} isFirst>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BooksInfoRow label="Name" value={project.name} icon={Briefcase} />
            <BooksInfoRow label="Customer" value={project.customerName} icon={User} />
            <BooksInfoRow label="Billing method" value={project.billingMethod} icon={Briefcase} />
            <BooksInfoRow label="Status" value={project.status} icon={Briefcase} />
            <BooksInfoRow label="Budget" value={formatSalesMoney(project.budget ?? 0)} icon={Wallet} emphasize />
            <BooksInfoRow
              label="Unbilled amount"
              value={formatSalesMoney(project.unbilledAmount ?? 0)}
              icon={Wallet}
            />
            <BooksInfoRow label="Created" icon={Calendar}>
              <TableCellCreated dateString={project.createdAt} theme="books" />
            </BooksInfoRow>
          </div>
        </BooksInfoSection>
      </Card>

      <Card variant="elevated" surface="books" className="rounded-xl p-4">
        <BooksSidebarCardTitle title="Quick links" icon={Briefcase} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${BASE}/${project.id}/edit`}>
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
        itemName={project.name}
        entityLabel="Project"
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
