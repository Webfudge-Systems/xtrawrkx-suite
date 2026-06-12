'use client'

import { useCallback, useMemo, useState } from 'react'
import { BarChart3, FileText, Receipt, Wallet } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksChartOfAccountsTableColumns } from '@/app/_components/booksAccountantTableColumns'
import BooksChartPlaceholderCard from '@/app/accountant/_components/BooksChartPlaceholderCard'
import { useBooksChartOfAccountsStore } from '@/lib/mock-data/accountant/stores'
import type { ChartOfAccountRow } from '@/lib/mock-data/accountant/seeds'
import { countStatusTab, matchesStatusTab } from '@/lib/books/listHelpers'

const BASE = '/accountant/chart-of-accounts'
const TYPE_GROUPS = {
  assets: ['asset'],
  liabilities: ['liability'],
  income: ['income'],
  expense: ['expense'],
}

function matchesAccountTab(row: ChartOfAccountRow, tabKey: string) {
  return matchesStatusTab(row, tabKey, 'type', TYPE_GROUPS)
}

export default function ChartOfAccountsPage() {
  const { chartOfAccounts, deleteAccount, getById } = useBooksChartOfAccountsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: ChartOfAccountRow) => setDeleteId(row.id), [])
  const columns = useBooksChartOfAccountsTableColumns({
    onRequestDelete: handleRequestDelete,
    deletingId,
    basePath: BASE,
  })

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteAccount(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteAccount, deleteId, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All', count: chartOfAccounts.length },
      { key: 'assets', label: 'Assets', count: countStatusTab(chartOfAccounts, 'assets', 'type', TYPE_GROUPS) },
      { key: 'liabilities', label: 'Liabilities', count: countStatusTab(chartOfAccounts, 'liabilities', 'type', TYPE_GROUPS) },
      { key: 'income', label: 'Income', count: countStatusTab(chartOfAccounts, 'income', 'type', TYPE_GROUPS) },
      { key: 'expense', label: 'Expense', count: countStatusTab(chartOfAccounts, 'expense', 'type', TYPE_GROUPS) },
    ],
    [chartOfAccounts]
  )

  return (
    <>
      <BooksListPageShell
        title="Chart of Accounts"
        subtitle="Manage your ledger accounts and balances."
        kpis={[
          { title: 'All Accounts', value: chartOfAccounts.length, subtitle: `${chartOfAccounts.length} accounts`, icon: BarChart3 },
          { title: 'Assets', value: countStatusTab(chartOfAccounts, 'assets', 'type', TYPE_GROUPS), icon: Wallet },
          { title: 'Liabilities', value: countStatusTab(chartOfAccounts, 'liabilities', 'type', TYPE_GROUPS), icon: Receipt },
          { title: 'Income', value: countStatusTab(chartOfAccounts, 'income', 'type', TYPE_GROUPS), icon: FileText },
        ]}
        tabs={tabs}
        tabFilter={matchesAccountTab}
        filterFields={[
          {
            key: 'type',
            label: 'Type',
            options: [
              { value: 'Asset', label: 'Asset' },
              { value: 'Liability', label: 'Liability' },
              { value: 'Income', label: 'Income' },
              { value: 'Expense', label: 'Expense' },
            ],
          },
        ]}
        topBlocks={
          <>
            <BooksChartPlaceholderCard title="Balances by Type" />
            <BooksChartPlaceholderCard title="Top Accounts" />
          </>
        }
        columns={columns}
        data={chartOfAccounts}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={BarChart3}
        emptyTitle="No accounts yet"
        emptyDescription="Chart of accounts will appear here."
        addHref={`${BASE}/new`}
        addLabel="Add account"
        searchPlaceholder="Search accounts..."
        exportFilePrefix="books-chart-of-accounts"
        sortEntity="chartOfAccount"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.name}
        entityLabel="Account"
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
