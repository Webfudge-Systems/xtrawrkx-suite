'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksPurchaseDocTableColumns } from '@/app/_components/booksPurchasesTableColumns'
import { useBooksExpensesStore } from '@/lib/mock-data/purchases/stores'
import type { PurchaseDocRow } from '@/lib/mock-data/purchases/seeds'
import {
  countPurchaseDocTab,
  matchesPurchaseDocStatuses,
  purchaseDocStatusOptions,
} from '@/lib/purchases/listHelpers'

const BASE = '/purchases/expenses'
const STATUS_GROUPS = {
  billable: ['billable'],
  recorded: ['recorded'],
}

export default function ExpensesPage() {
  const { expenses, deleteRecord, getById } = useBooksExpensesStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const vendorCount = useMemo(
    () => new Set(expenses.map((e) => e.vendor).filter((v) => v && v !== '—')).size,
    [expenses]
  )

  const handleRequestDelete = useCallback((row: PurchaseDocRow) => setDeleteId(row.id), [])
  const columns = useBooksPurchaseDocTableColumns({
    numberLabel: 'EXPENSE#',
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
      { key: 'all', label: 'All Expenses', count: expenses.length },
      { key: 'billable', label: 'Billable', count: countPurchaseDocTab(expenses, 'billable', STATUS_GROUPS) },
      { key: 'recorded', label: 'Recorded', count: countPurchaseDocTab(expenses, 'recorded', STATUS_GROUPS) },
    ],
    [expenses]
  )

  return (
    <>
      <BooksListPageShell
        title="Expenses"
        subtitle="Record and track business expenses."
        kpis={[
          { title: 'All Expenses', value: expenses.length, subtitle: `${expenses.length} expenses`, icon: Receipt },
          {
            title: 'Billable',
            value: countPurchaseDocTab(expenses, 'billable', STATUS_GROUPS),
            subtitle: 'Billable to clients',
            icon: FileText,
          },
          { title: 'This Month', value: expenses.length, subtitle: 'May 2026', icon: TrendingUp },
          { title: 'Vendors', value: vendorCount, subtitle: `${vendorCount} vendors`, icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesPurchaseDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[
          {
            key: 'status',
            label: 'Status',
            options: purchaseDocStatusOptions(['Recorded', 'Billable']),
          },
        ]}
        columns={columns}
        data={expenses}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Receipt}
        emptyTitle="No expenses yet"
        emptyDescription="Expenses will appear here when recorded."
        addHref={`${BASE}/new`}
        addLabel="Add expense"
        searchPlaceholder="Search expenses..."
        exportFilePrefix="books-expenses"
        sortEntity="purchaseExpense"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Expense"
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
