'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { BarChart3, Calendar, Edit, Hash, Tag, Trash2, Wallet } from 'lucide-react'
import { Button, Card, KPICard, TableCellCreated } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import { BooksInfoRow, BooksInfoSection, BooksSidebarCardTitle } from '@/app/_components/BooksEntityDetailSections'
import { useBooksChartOfAccountsStore } from '@/lib/mock-data/accountant/stores'

const BASE = '/accountant/chart-of-accounts'

export default function BooksChartOfAccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteAccount } = useBooksChartOfAccountsStore()
  const account = getById(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!account) return undefined
    return [account.code, account.type].filter(Boolean).join(' • ')
  }, [account])

  const handleConfirmDelete = async () => {
    if (!account || deleting) return
    try {
      setDeleting(true)
      deleteAccount(account.id)
      setShowDeleteModal(false)
      router.push(BASE)
    } finally {
      setDeleting(false)
    }
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <BooksRecordEntityPageHeader
          title="Account not found"
          basePath={BASE}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Chart of Accounts', href: BASE },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Account not found.</p>
          <Link href={BASE} className="mt-4 inline-block">
            <Button variant="primary">Back to chart of accounts</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksRecordEntityPageHeader
        title={account.name}
        subtitle={subtitle}
        basePath={BASE}
        record={{ id: account.id, name: account.name }}
        exportPrefix="chart-of-account"
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Chart of Accounts', href: BASE },
          { label: account.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard theme="books" compact title="Balance" value={account.balance} icon={Wallet} colorScheme="orange" />
        <KPICard theme="books" compact title="Code" value={account.code} icon={Hash} colorScheme="orange" />
        <KPICard theme="books" compact title="Type" value={account.type} icon={Tag} colorScheme="orange" />
        <KPICard theme="books" compact title="Updated" value={account.updatedAt} icon={Calendar} colorScheme="orange" />
      </div>

      <Card variant="elevated" surface="books" className="rounded-xl">
        <BooksInfoSection title="Account details" icon={BarChart3} isFirst>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <BooksInfoRow label="Name" value={account.name} icon={BarChart3} />
            <BooksInfoRow label="Code" value={account.code} icon={Hash} />
            <BooksInfoRow label="Type" value={account.type} icon={Tag} />
            <BooksInfoRow label="Balance" value={account.balance} icon={Wallet} emphasize />
            <BooksInfoRow label="Updated" value={account.updatedAt} icon={Calendar} />
            <BooksInfoRow label="Created" icon={Calendar}>
              <TableCellCreated dateString={account.createdAt} theme="books" />
            </BooksInfoRow>
          </div>
        </BooksInfoSection>
      </Card>

      <Card variant="elevated" surface="books" className="rounded-xl p-4">
        <BooksSidebarCardTitle title="Quick links" icon={BarChart3} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`${BASE}/${account.id}/edit`}>
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
        itemName={account.name}
        entityLabel="Account"
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
