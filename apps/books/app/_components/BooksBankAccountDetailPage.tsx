'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Calendar, Edit, FileText, Landmark, Tag, Trash2, Wallet } from 'lucide-react'
import { formatCurrency } from '@webfudge/utils'
import { Button, Card, KPICard, TableCellCreated, formatTableDate } from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import BooksRecordEntityPageHeader from '@/app/_components/BooksRecordEntityPageHeader'
import {
  BooksInfoRow,
  BooksInfoSection,
  BooksSidebarCardTitle,
} from '@/app/_components/BooksEntityDetailSections'
import { useBooksBankAccountsStore } from '@/lib/mock-data/useBooksBankAccountsStore'

const BASE = '/banking'
const BOOKS_THEME = 'books' as const

function formatBalance(amount: number) {
  return formatCurrency(amount, { currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function BooksBankAccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteAccount } = useBooksBankAccountsStore()
  const account = getById(id)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!account) return undefined
    return [account.institution, account.status].filter(Boolean).join(' • ')
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
          subtitle="This account may have been removed or the link is invalid."
          basePath={BASE}
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Banking', href: BASE },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Account not found.</p>
          <Link href={BASE} className="mt-4 inline-block">
            <Button variant="primary">Back to banking</Button>
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
        exportPrefix="bank-account"
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Banking', href: BASE },
          { label: account.name },
        ]}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard theme="books" compact title="Balance" value={formatBalance(account.balance)} icon={Wallet} colorScheme="orange" />
        <KPICard theme="books" compact title="Type" value={account.accountType} icon={Landmark} colorScheme="orange" />
        <KPICard theme="books" compact title="Status" value={account.status} icon={Tag} colorScheme="orange" />
        <KPICard
          theme="books"
          compact
          title="Last sync"
          value={account.lastSyncAt ? formatTableDate(account.lastSyncAt) : '—'}
          icon={Calendar}
          colorScheme="orange"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card variant="elevated" surface="books" className="rounded-xl">
            <BooksInfoSection title="Account profile" icon={Landmark} isFirst>
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <BooksInfoRow label="Account name" value={account.name} icon={Landmark} />
                <BooksInfoRow label="Bank / source" value={account.institution} icon={Landmark} />
                <BooksInfoRow label="Account type" value={account.accountType} icon={Tag} />
                <BooksInfoRow label="Balance" value={formatBalance(account.balance)} icon={Wallet} emphasize />
                <BooksInfoRow label="Created" icon={Calendar}>
                  <TableCellCreated dateString={account.createdAt} theme={BOOKS_THEME} />
                </BooksInfoRow>
                <BooksInfoRow label="Last sync" icon={Calendar}>
                  {account.lastSyncAt ? (
                    <TableCellCreated dateString={account.lastSyncAt} theme={BOOKS_THEME} />
                  ) : (
                    '—'
                  )}
                </BooksInfoRow>
              </div>
            </BooksInfoSection>
          </Card>
        </div>
        <div className="space-y-6">
          <Card variant="elevated" surface="books" className="rounded-xl">
            <BooksSidebarCardTitle title="Quick links" icon={FileText} />
            <div className="space-y-2">
              <Link
                href={`${BASE}/${account.id}/edit`}
                className="flex items-center gap-2 rounded-lg border border-[color:var(--books-border)] px-3 py-2 text-sm text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-elevated)]"
              >
                <Edit className="h-4 w-4 text-[var(--books-orange-text)]" />
                Edit account
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete account
              </button>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg border border-[color:var(--books-border)] px-3 py-2 text-left text-sm text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-elevated)]"
                onClick={() => router.push(BASE)}
              >
                <Landmark className="h-4 w-4 text-[var(--books-orange-text)]" />
                Back to banking
              </button>
            </div>
          </Card>
        </div>
      </div>

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
