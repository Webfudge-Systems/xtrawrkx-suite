'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksPurchaseDocTableColumns } from '@/app/_components/booksPurchasesTableColumns'
import { useBooksRecurringBillsStore } from '@/lib/mock-data/purchases/stores'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'
import {
  countPurchaseDocTab,
  matchesPurchaseDocStatuses,
  purchaseDocStatusOptions,
} from '@/lib/purchases/listHelpers'

const BASE = '/purchases/recurring-bills'
const STATUS_GROUPS = {
  active: ['active'],
}

export default function RecurringBillsPage() {
  const { recurringBills, deleteRecord, getById } = useBooksRecurringBillsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const active = countPurchaseDocTab(recurringBills, 'active', STATUS_GROUPS)
  const monthlyTotal = recurringBills[0]?.amount ?? '₹0.00'
  const vendorCount = useMemo(() => new Set(recurringBills.map((r) => r.vendor)).size, [recurringBills])

  const handleRequestDelete = useCallback((row: PurchaseDocRow) => setDeleteId(row.id), [])
  const columns = useBooksPurchaseDocTableColumns({
    numberLabel: 'PROFILE#',
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
      { key: 'all', label: 'All Profiles', count: recurringBills.length },
      { key: 'active', label: 'Active', count: active },
    ],
    [active, recurringBills.length]
  )

  return (
    <>
      <BooksListPageShell
        title="Recurring Bills"
        subtitle="Automate recurring vendor bills."
        kpis={[
          {
            title: 'All Profiles',
            value: recurringBills.length,
            subtitle: `${recurringBills.length} profiles`,
            icon: Receipt,
          },
          { title: 'Active', value: active, subtitle: `${active} active`, icon: TrendingUp },
          { title: 'Monthly', value: monthlyTotal, subtitle: 'Recurring total', icon: FileText },
          { title: 'Vendors', value: vendorCount, subtitle: `${vendorCount} vendor${vendorCount === 1 ? '' : 's'}`, icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesPurchaseDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[{ key: 'status', label: 'Status', options: purchaseDocStatusOptions(['Active']) }]}
        columns={columns}
        data={recurringBills}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Receipt}
        emptyTitle="No recurring bills yet"
        emptyDescription="Recurring bills will appear here when created."
        addHref={`${BASE}/new`}
        addLabel="Add profile"
        searchPlaceholder="Search recurring bills..."
        exportFilePrefix="books-recurring-bills"
        sortEntity="recurringBill"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Recurring Bill"
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
