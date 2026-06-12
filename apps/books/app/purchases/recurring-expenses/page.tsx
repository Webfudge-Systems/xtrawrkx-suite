'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksPurchaseDocTableColumns } from '@/app/_components/booksPurchasesTableColumns'
import { useBooksRecurringExpensesStore } from '@/lib/mock-data/purchases/stores'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'
import {
  countPurchaseDocTab,
  matchesPurchaseDocStatuses,
  purchaseDocStatusOptions,
} from '@/lib/purchases/listHelpers'

const BASE = '/purchases/recurring-expenses'
const STATUS_GROUPS = {
  active: ['active'],
}

export default function RecurringExpensesPage() {
  const { recurringExpenses, deleteRecord, getById } = useBooksRecurringExpensesStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const active = countPurchaseDocTab(recurringExpenses, 'active', STATUS_GROUPS)
  const monthlyTotal = recurringExpenses[0]?.amount ?? '₹0.00'
  const vendorCount = useMemo(
    () => new Set(recurringExpenses.map((r) => r.vendor)).size,
    [recurringExpenses]
  )

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
      { key: 'all', label: 'All Profiles', count: recurringExpenses.length },
      { key: 'active', label: 'Active', count: active },
    ],
    [active, recurringExpenses.length]
  )

  return (
    <>
      <BooksListPageShell
        title="Recurring Expenses"
        subtitle="Automate recurring expense profiles."
        kpis={[
          {
            title: 'All Profiles',
            value: recurringExpenses.length,
            subtitle: `${recurringExpenses.length} profiles`,
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
        data={recurringExpenses}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Receipt}
        emptyTitle="No recurring expenses yet"
        emptyDescription="Recurring expenses will appear here when created."
        addHref={`${BASE}/new`}
        addLabel="Add profile"
        searchPlaceholder="Search recurring expenses..."
        exportFilePrefix="books-recurring-expenses"
        sortEntity="recurringExpense"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Recurring Expense"
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
