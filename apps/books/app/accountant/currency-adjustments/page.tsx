'use client'

import { useCallback, useMemo, useState } from 'react'
import { Banknote, FileText, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksCurrencyAdjustmentsTableColumns } from '@/app/_components/booksAccountantTableColumns'
import BooksChartPlaceholderCard from '@/app/accountant/_components/BooksChartPlaceholderCard'
import { useBooksCurrencyAdjustmentsStore } from '@/lib/mock-data/accountant/stores'
import type { CurrencyAdjustmentRow } from '@/lib/mock-data/accountant/seeds'
import { countStatusTab, matchesStatusTab, statusFilterOptions } from '@/lib/books/listHelpers'

const BASE = '/accountant/currency-adjustments'
const STATUS_GROUPS = { draft: ['draft'], posted: ['posted'] }

export default function CurrencyAdjustmentsPage() {
  const { currencyAdjustments, deleteAdjustment, getById } = useBooksCurrencyAdjustmentsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: CurrencyAdjustmentRow) => setDeleteId(row.id), [])
  const columns = useBooksCurrencyAdjustmentsTableColumns({
    onRequestDelete: handleRequestDelete,
    deletingId,
    basePath: BASE,
  })

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteAdjustment(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteAdjustment, deleteId, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All', count: currencyAdjustments.length },
      { key: 'draft', label: 'Draft', count: countStatusTab(currencyAdjustments, 'draft', 'status', STATUS_GROUPS) },
      { key: 'posted', label: 'Posted', count: countStatusTab(currencyAdjustments, 'posted', 'status', STATUS_GROUPS) },
    ],
    [currencyAdjustments]
  )

  return (
    <>
      <BooksListPageShell
        title="Currency Adjustments"
        subtitle="Record exchange rate differences and adjustments."
        kpis={[
          { title: 'All Adjustments', value: currencyAdjustments.length, subtitle: `${currencyAdjustments.length} adjustments`, icon: Banknote },
          { title: 'Draft', value: countStatusTab(currencyAdjustments, 'draft', 'status', STATUS_GROUPS), icon: FileText },
          { title: 'Posted', value: countStatusTab(currencyAdjustments, 'posted', 'status', STATUS_GROUPS), icon: TrendingUp },
          { title: 'Users', value: 1, subtitle: '1 contributor', icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesStatusTab(row, tab, 'status', STATUS_GROUPS)}
        filterFields={[{ key: 'status', label: 'Status', options: statusFilterOptions(['Draft', 'Posted']) }]}
        topBlocks={
          <>
            <BooksChartPlaceholderCard title="Exchange Difference Trend" />
            <BooksChartPlaceholderCard title="Adjustments by Currency" />
          </>
        }
        columns={columns}
        data={currencyAdjustments}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Banknote}
        emptyTitle="No currency adjustments yet"
        emptyDescription="Currency adjustments will appear here when created."
        addHref={`${BASE}/new`}
        addLabel="Add adjustment"
        searchPlaceholder="Search adjustments..."
        exportFilePrefix="books-currency-adjustments"
        sortEntity="currencyAdjustment"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.reference}
        entityLabel="Currency Adjustment"
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
