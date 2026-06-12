'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  AlignLeft,
  Calendar,
  Edit,
  FileText,
  Hash,
  Layers,
  Package,
  Receipt,
  Tag,
  Trash2,
} from 'lucide-react'
import {
  Button,
  Card,
  KPICard,
  TabsWithActions,
  TableCellCreated,
  TableCellOrangePill,
  formatTableDate,
} from '@webfudge/ui'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import ItemEntityPageHeader from '@/app/_components/ItemEntityPageHeader'
import {
  BooksInfoRow,
  BooksInfoSection,
  BooksSidebarCardTitle,
} from '@/app/_components/BooksEntityDetailSections'
import { formatItemUnit, useBooksItemsStore } from '@/lib/mock-data/useBooksItemsStore'
import { formatIndianCurrency } from '@/lib/formatCurrency'

const BOOKS_THEME = 'books' as const

function itemTypeLabel(type: string) {
  return type.replace(/([a-z])([A-Z])/g, '$1 $2')
}

export default function BooksItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, deleteItem } = useBooksItemsStore()
  const item = getById(id)

  const [detailTab, setDetailTab] = useState('overview')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const subtitle = useMemo(() => {
    if (!item) return undefined
    return [itemTypeLabel(item.type), item.sku, item.status].filter(Boolean).join(' • ')
  }, [item])

  const formattedRate = useMemo(() => (item ? formatIndianCurrency(item.rate) : ''), [item])

  const detailTabs = useMemo(
    () => [
      { key: 'overview', label: 'Overview' },
      { key: 'pricing', label: 'Pricing' },
      { key: 'activity', label: 'Activity', badge: '0' },
    ],
    []
  )

  const handleConfirmDelete = async () => {
    if (!item || deleting) return
    try {
      setDeleting(true)
      deleteItem(item.id)
      setShowDeleteModal(false)
      router.push('/items/all')
    } finally {
      setDeleting(false)
    }
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <ItemEntityPageHeader
          title="Item not found"
          subtitle="This item may have been deleted or the link is invalid."
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'All Items', href: '/items/all' },
            { label: 'Not found' },
          ]}
          showToolbar={false}
        />
        <Card variant="elevated" surface="books" className="p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Item not found.</p>
          <Link href="/items/all" className="mt-4 inline-block">
            <Button variant="primary">Back to items</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ItemEntityPageHeader
        title={item.name}
        subtitle={subtitle}
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'All Items', href: '/items/all' },
          { label: item.name },
        ]}
        item={item}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <KPICard theme="books" compact title="Unit rate" value={formattedRate} icon={Receipt} colorScheme="orange" />
        <KPICard
          theme="books"
          compact
          title="Status"
          value={item.status}
          icon={Layers}
          colorScheme="orange"
        />
        <KPICard theme="books" compact title="Billing unit" value={formatItemUnit(item.unit)} icon={Tag} colorScheme="orange" />
        <KPICard
          theme="books"
          compact
          title="Last updated"
          value={formatTableDate(item.updatedAt || item.createdAt)}
          icon={Calendar}
          colorScheme="orange"
        />
      </div>

      <TabsWithActions
        variant="pill"
        pillTheme="books"
        pillTrack="hug"
        tabs={detailTabs}
        activeTab={detailTab}
        onTabChange={setDetailTab}
      />

      {detailTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card variant="elevated" surface="books" className="rounded-xl">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[var(--books-text-primary,#f8fafc)]">Item information</h2>
                <p className="mt-1.5 text-base text-[var(--books-text-secondary,#9ca3af)]">
                  Catalog profile, pricing unit, and description.
                </p>
              </div>

              <BooksInfoSection title="Item profile" icon={Package} isFirst>
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <BooksInfoRow label="Item name" value={item.name} icon={Package} />
                  <BooksInfoRow label="SKU" value={item.sku} icon={Hash} />
                  <BooksInfoRow label="Type" icon={Layers}>
                    <TableCellOrangePill value={item.type} theme={BOOKS_THEME} />
                  </BooksInfoRow>
                  <BooksInfoRow label="Status" value={item.status} icon={Tag} />
                  <BooksInfoRow label="Created" icon={Calendar}>
                    <TableCellCreated dateString={item.createdAt} theme={BOOKS_THEME} />
                  </BooksInfoRow>
                  <BooksInfoRow
                    label="Last updated"
                    value={formatTableDate(item.updatedAt || item.createdAt)}
                    icon={Calendar}
                  />
                </div>
              </BooksInfoSection>

              {item.description ? (
                <BooksInfoSection title="Description" icon={AlignLeft}>
                  <p className="text-base leading-relaxed text-[var(--books-text-primary,#f8fafc)]">{item.description}</p>
                </BooksInfoSection>
              ) : null}
            </Card>
          </div>

          <div className="space-y-6">
            <Card variant="elevated" surface="books" className="rounded-xl">
              <BooksSidebarCardTitle title="Quick links" icon={FileText} />
              <div className="space-y-2">
                <Link
                  href={`/items/all/${item.id}/edit`}
                  className="flex items-center gap-2 rounded-lg border border-[color:var(--books-border)] px-3 py-2 text-sm text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-elevated)]"
                >
                  <Edit className="h-4 w-4 text-[var(--books-orange-text)]" />
                  Edit item
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete item
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg border border-[color:var(--books-border)] px-3 py-2 text-left text-sm text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-elevated)]"
                  onClick={() => router.push('/items/all')}
                >
                  <Package className="h-4 w-4 text-[var(--books-orange-text)]" />
                  Back to all items
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {detailTab === 'pricing' && (
        <Card variant="elevated" surface="books" className="rounded-xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[var(--books-text-primary,#f8fafc)]">Pricing</h2>
            <p className="mt-1.5 text-base text-[var(--books-text-secondary,#9ca3af)]">
              Default rate used on invoices, estimates, and retainers.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <BooksInfoRow label="Unit rate" value={formattedRate} icon={Receipt} emphasize />
            <BooksInfoRow label="Billing unit" value={formatItemUnit(item.unit)} icon={Tag} />
            <BooksInfoRow label="Status" value={item.status} icon={Layers} />
          </div>
        </Card>
      )}

      {detailTab === 'activity' && (
        <Card variant="elevated" surface="books" className="rounded-xl p-12 text-center">
          <p className="text-[var(--books-text-secondary,#9ca3af)]">Activity timeline will appear here when connected to the backend.</p>
        </Card>
      )}

      <BooksDeleteItemModal
        isOpen={showDeleteModal}
        itemName={item.name}
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
