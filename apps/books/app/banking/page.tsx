'use client'

import { useCallback, useMemo, useState } from 'react'
import { ArrowLeftRight, Building2, Landmark, PiggyBank, Wallet } from 'lucide-react'
import { formatCurrency } from '@webfudge/utils'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksBankAccountsTableColumns } from '@/app/_components/booksBankAccountsTableColumns'
import { computeBankingMetrics, type BankAccountRow } from '@/lib/mock-data/banking'
import { useBooksBankAccountsStore } from '@/lib/mock-data/useBooksBankAccountsStore'

function matchesAccountTab(row: BankAccountRow, tabKey: string) {
  if (tabKey === 'all') return true
  if (tabKey === 'connected') return row.status.toLowerCase() === 'connected'
  if (tabKey === 'manual') return row.status.toLowerCase() === 'manual'
  return true
}

function formatKpiMoney(amount: number) {
  return formatCurrency(amount, { currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function BankingPage() {
  const { accounts, uncategorizedCount, deleteAccount, getById } = useBooksBankAccountsStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const metrics = useMemo(() => computeBankingMetrics(accounts), [accounts])

  const handleRequestDelete = useCallback((row: BankAccountRow) => {
    setDeleteId(row.id)
  }, [])

  const columns = useBooksBankAccountsTableColumns({
    onRequestDelete: handleRequestDelete,
    deletingId,
  })

  const deleteTarget = deleteId != null ? getById(deleteId) : null

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

  const kpis = useMemo(
    () => [
      {
        title: 'Total balance',
        value: formatKpiMoney(metrics.totalBalance),
        subtitle: 'Across connected accounts',
        icon: Wallet,
      },
      {
        title: 'Bank accounts',
        value: metrics.bankAccountsCount,
        subtitle: 'Linked for feeds',
        icon: Landmark,
      },
      {
        title: 'Uncategorized',
        value: uncategorizedCount,
        subtitle: 'Transactions to review',
        icon: ArrowLeftRight,
      },
      {
        title: 'Cash & manual',
        value: formatKpiMoney(metrics.cashAndManual),
        subtitle: 'Off-bank balances',
        icon: PiggyBank,
      },
    ],
    [metrics, uncategorizedCount]
  )

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Accounts', count: accounts.length },
      {
        key: 'connected',
        label: 'Connected',
        count: accounts.filter((r) => r.status.toLowerCase() === 'connected').length,
      },
      {
        key: 'manual',
        label: 'Manual',
        count: accounts.filter((r) => r.status.toLowerCase() === 'manual').length,
      },
    ],
    [accounts]
  )

  const filterFields = useMemo(
    () => [
      {
        key: 'status',
        label: 'Feed Status',
        options: [
          { value: 'connected', label: 'Connected' },
          { value: 'manual', label: 'Manual' },
        ],
      },
      {
        key: 'accountType',
        label: 'Account Type',
        options: [
          { value: 'Bank', label: 'Bank' },
          { value: 'Cash', label: 'Cash' },
        ],
      },
    ],
    []
  )

  return (
    <>
      <BooksListPageShell
        title="Banking"
        subtitle="Manage accounts, transfers, and reconciliation."
        kpis={kpis}
        tabs={tabs}
        tabFilter={matchesAccountTab}
        filterFields={filterFields}
        columns={columns}
        data={accounts}
        onRowClickHref={(row) => `/banking/${row.id}`}
        emptyIcon={Building2}
        emptyTitle="No accounts yet"
        emptyDescription="Connect a bank feed or add a manual cash account."
        addHref="/banking/new"
        addLabel="Add account"
        searchPlaceholder="Search accounts..."
        exportFilePrefix="books-banking"
        sortEntity="bankAccount"
      />

      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={deleteTarget?.name}
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
