'use client'

import { useCallback, useMemo, useState } from 'react'
import { CreditCard, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksPurchaseDocTableColumns } from '@/app/_components/booksPurchasesTableColumns'
import { useBooksVendorCreditsStore } from '@/lib/mock-data/purchases/stores'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'
import {
  countPurchaseDocTab,
  matchesPurchaseDocStatuses,
  purchaseDocStatusOptions,
} from '@/lib/purchases/listHelpers'

const BASE = '/purchases/vendor-credits'
const STATUS_GROUPS = {
  open: ['open'],
  draft: ['draft'],
}

export default function VendorCreditsPage() {
  const { vendorCredits, deleteRecord, getById } = useBooksVendorCreditsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const vendorCount = useMemo(() => new Set(vendorCredits.map((c) => c.vendor)).size, [vendorCredits])

  const handleRequestDelete = useCallback((row: PurchaseDocRow) => setDeleteId(row.id), [])
  const columns = useBooksPurchaseDocTableColumns({
    numberLabel: 'CREDIT#',
    basePath: BASE,
    onRequestDelete: handleRequestDelete,
    deletingId,
  })

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteRecord(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteId, deleteRecord, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Credits', count: vendorCredits.length },
      { key: 'open', label: 'Open', count: countPurchaseDocTab(vendorCredits, 'open', STATUS_GROUPS) },
      { key: 'draft', label: 'Draft', count: countPurchaseDocTab(vendorCredits, 'draft', STATUS_GROUPS) },
    ],
    [vendorCredits]
  )

  return (
    <>
      <BooksListPageShell
        title="Vendor Credits"
        subtitle="Track vendor credits and adjustments."
        kpis={[
          {
            title: 'All Credits',
            value: vendorCredits.length,
            subtitle: `${vendorCredits.length} credits`,
            icon: CreditCard,
          },
          {
            title: 'Open',
            value: countPurchaseDocTab(vendorCredits, 'open', STATUS_GROUPS),
            subtitle: 'Open credits',
            icon: Receipt,
          },
          { title: 'This Month', value: vendorCredits.length, subtitle: 'May 2026', icon: TrendingUp },
          { title: 'Vendors', value: vendorCount, subtitle: `${vendorCount} vendors`, icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesPurchaseDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[
          { key: 'status', label: 'Status', options: purchaseDocStatusOptions(['Open', 'Draft', 'Issued']) },
        ]}
        columns={columns}
        data={vendorCredits}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={CreditCard}
        emptyTitle="No vendor credits yet"
        emptyDescription="Vendor credits will appear here when issued."
        addHref={`${BASE}/new`}
        addLabel="Add credit"
        searchPlaceholder="Search vendor credits..."
        exportFilePrefix="books-vendor-credits"
        sortEntity="vendorCredit"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Vendor Credit"
        deleting={deletingId != null}
        onClose={() => {
          if (deletingId) return
          setDeleteId(null)
        }}
        onConfirm={confirmDelete}
      />
    </>
  )
}
