'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  Button,
  Card,
  KPICard,
  Modal,
  Table,
  TableEmptyBelow,
  TableResultsCount,
  TabsWithActions,
} from '@webfudge/ui'
import { booksToolbarSearchInputClassName, type BooksDataColumn } from '@webfudge/ui/book-components'
import { formatCurrency } from '@webfudge/utils'
import { ArrowLeftRight, Building2, Landmark, PiggyBank, Plus, Wallet } from 'lucide-react'
import { useBooksTableColumnPicker } from '@/app/_components/BooksTableColumnPicker'
import { bankingApi } from '@/lib/api'

type BankingAccountRow = {
  id: number
  name: string
  institution: string
  balance: number
  status: string
  lastSync: string
}

type BankingOverviewPayload = {
  totalBalance: number
  bankAccountsCount: number
  uncategorizedCount: number
  cashAndManual: number
  accounts: Array<{
    id: number
    accountName: string
    accountType?: string
    bankName?: string
    balance: number
    status?: string
    lastSyncAt?: string | null
  }>
}

const TABLE_COLUMNS = [
  { key: 'name', title: 'ACCOUNT' },
  { key: 'institution', title: 'BANK / SOURCE' },
  {
    key: 'balance',
    title: 'BALANCE',
    render: (value: unknown) => formatCurrency(Number(value) ?? 0),
  },
  { key: 'status', title: 'STATUS' },
  { key: 'lastSync', title: 'LAST SYNC' },
] as const

export default function BankingOverview() {
  const pathname = usePathname()
  const columnStorageKey = `books.table:${pathname}`

  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<BankingOverviewPayload>({
    totalBalance: 0,
    bankAccountsCount: 0,
    uncategorizedCount: 0,
    cashAndManual: 0,
    accounts: [],
  })

  const { visibleColumns, toolbarRef, onColumnVisibilityClick, columnPickerDropdown } = useBooksTableColumnPicker({
    columns: [...TABLE_COLUMNS],
    storageKey: columnStorageKey,
  })

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    bankingApi
      .overview()
      .then((res) => {
        if (!mounted) return
        const next = (res as { data?: BankingOverviewPayload })?.data
        setOverview(
          next ?? {
            totalBalance: 0,
            bankAccountsCount: 0,
            uncategorizedCount: 0,
            cashAndManual: 0,
            accounts: [],
          }
        )
      })
      .catch(() => {
        if (!mounted) return
        setError('Unable to load banking overview. Please retry.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const data = useMemo<BankingAccountRow[]>(
    () =>
      (overview.accounts ?? []).map((a) => ({
        id: a.id,
        name: a.accountName,
        institution: a.bankName || '—',
        balance: a.balance || 0,
        status: a.status || 'manual',
        lastSync: a.lastSyncAt ? new Date(a.lastSyncAt).toLocaleDateString() : '—',
      })),
    [overview.accounts]
  )

  const filtered = useMemo(() => {
    if (!searchQuery) return data
    const q = searchQuery.toLowerCase()
    return data.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
  }, [data, searchQuery])

  const exportCsv = () => {
    const colKeys = (visibleColumns.length ? visibleColumns : [...TABLE_COLUMNS]).map((c) => c.key).filter(Boolean)
    const safeKeys = colKeys.length ? colKeys : Object.keys(filtered[0] || {})

    const esc = (v: unknown) => {
      if (v == null) return ''
      const s = String(v)
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    }

    const header = safeKeys.join(',')
    const rows = filtered.map((row) => safeKeys.map((k) => esc((row as Record<string, unknown>)[k])).join(','))
    const csv = [header, ...rows].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'books-banking-accounts.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const kpis = useMemo(
    () => [
      {
        title: 'Total balance',
        value: formatCurrency(overview.totalBalance ?? 0),
        subtitle: 'Across connected accounts',
        icon: Wallet,
      },
      {
        title: 'Bank accounts',
        value: overview.bankAccountsCount ?? 0,
        subtitle: 'Linked for feeds',
        icon: Landmark,
      },
      {
        title: 'Uncategorized',
        value: overview.uncategorizedCount ?? 0,
        subtitle: 'Transactions to review',
        icon: ArrowLeftRight,
      },
      {
        title: 'Cash & manual',
        value: formatCurrency(overview.cashAndManual ?? 0),
        subtitle: 'Off-bank balances',
        icon: PiggyBank,
      },
    ],
    [overview]
  )

  return (
    <div className="min-h-full space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <KPICard
            key={idx}
            theme="books"
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            icon={kpi.icon}
          />
        ))}
      </div>

      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          tabs={[{ key: 'accounts', label: 'Accounts', badge: String(data.length) }]}
          activeTab="accounts"
          onTabChange={() => {}}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search accounts..."
          showAdd
          onAddClick={() => {}}
          addTitle="Add account"
          showFilter
          onFilterClick={() => setFilterOpen(true)}
          showColumnVisibility
          onColumnVisibilityClick={onColumnVisibilityClick}
          columnVisibilityTitle="Show or hide columns"
          showExport
          onExportClick={exportCsv}
          exportTitle="Export"
          variant="booksModern"
          searchInputClassName={booksToolbarSearchInputClassName}
        />
        {columnPickerDropdown}
      </div>

      <TableResultsCount count={filtered.length} theme="books" />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card variant="elevated" padding={false} surface="books">
        <div className="border-b border-[color:var(--books-border,rgba(0,0,0,0.08))] px-6 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-orange-bg,rgba(234,88,12,0.1))] text-[var(--books-orange-text,#ea580c)]">
              <Building2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-[var(--books-text-primary,#111827)]">Accounts</h2>
              <p className="mt-0.5 text-sm text-[var(--books-text-secondary,#6b7280)]">
                Balances, feeds, and reconciliation status.
              </p>
            </div>
          </div>
        </div>

        <Table
          variant="books"
          columns={visibleColumns.length ? visibleColumns : [...TABLE_COLUMNS]}
          data={filtered as unknown as Record<string, unknown>[]}
          keyField="id"
        />

        {!loading && filtered.length === 0 ? (
          <TableEmptyBelow
            theme="books"
            className="border-t border-[color:var(--books-border,rgba(0,0,0,0.08))]"
            icon={Building2}
            title="No accounts match"
            description="Try adjusting your search or filters."
            action={
              <Button variant="primary" onClick={() => setSearchQuery('')}>
                <Plus className="mr-2 h-4 w-4" />
                Clear search
              </Button>
            }
          />
        ) : null}
      </Card>

      <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filter banking" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-[var(--books-text-secondary,#6b7280)]">
            Filter options will match other Books list pages when banking data is connected.
          </p>
          <div className="flex justify-end gap-2 border-t border-[color:var(--books-border)] pt-4">
            <Button variant="muted" onClick={() => setFilterOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
