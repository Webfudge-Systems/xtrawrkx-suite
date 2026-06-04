'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Clock3, History, Pencil, User } from 'lucide-react'
import { Table } from '@webfudge/ui'
import type { BooksDataColumn } from '@webfudge/ui/book-components'
import { useBooksTableColumnPicker } from '@/app/_components/BooksTableColumnPicker'
import BooksHomeHubDataShell from './BooksHomeHubDataShell'
import { HOME_RECENT_UPDATES_MOCK, HOME_UPDATES_FILTER_TABS } from '../_data/homeHubMock'

const ACTION_STYLES: Record<string, string> = {
  Created: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  Updated: 'bg-sky-500/12 text-sky-700 dark:text-sky-400',
  Deleted: 'bg-red-500/12 text-red-600 dark:text-red-400',
  Emailed: 'bg-violet-500/12 text-violet-700 dark:text-violet-400',
  Paid: 'bg-orange-500/12 text-[var(--books-orange-text,#ea580c)]',
}

function ActionPill({ action }: { action: string }) {
  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        ACTION_STYLES[action] ?? 'bg-[var(--books-bg-elevated)] text-[var(--books-text-secondary)]'
      )}
    >
      {action}
    </span>
  )
}

const columns: BooksDataColumn[] = [
  {
    key: 'dateLabel',
    title: 'Date',
    width: '7.5rem',
    render: (value, row) => (
      <div>
        <div className="font-medium text-[var(--books-text-primary)]">{String(value ?? '')}</div>
        <div className="text-xs text-[var(--books-text-tertiary)]">{String(row.timeLabel ?? '')}</div>
      </div>
    ),
  },
  {
    key: 'module',
    title: 'Module',
    width: '6.5rem',
    render: (value) => (
      <span className="text-xs font-semibold text-[var(--books-text-secondary)]">{String(value ?? '')}</span>
    ),
  },
  {
    key: 'recordLabel',
    title: 'Record',
    render: (_v, row) => (
      <div>
        <div className="font-medium text-[var(--books-text-primary)]">
          {String(row.recordLabel ?? '')}{' '}
          <span className="font-normal text-[var(--books-text-tertiary)]">#{String(row.recordId ?? '')}</span>
        </div>
        <div className="mt-0.5 text-xs text-[var(--books-text-secondary)]">{String(row.details ?? '')}</div>
      </div>
    ),
  },
  {
    key: 'action',
    title: 'Action',
    width: '6.5rem',
    render: (value) => <ActionPill action={String(value ?? '')} />,
  },
  {
    key: 'user',
    title: 'User',
    width: '8rem',
    render: (value) => (
      <span className="inline-flex items-center gap-1.5 text-sm text-[var(--books-text-primary)]">
        <User className="h-3.5 w-3.5 text-[var(--books-text-tertiary)]" aria-hidden />
        {String(value ?? '')}
      </span>
    ),
  },
]

function filterByTab(
  items: typeof HOME_RECENT_UPDATES_MOCK,
  tabId: string
): typeof HOME_RECENT_UPDATES_MOCK {
  if (tabId === 'all') return items
  const mod = tabId.charAt(0).toUpperCase() + tabId.slice(1)
  return items.filter((r) => r.module.toLowerCase() === mod.toLowerCase())
}

function tabCount(tabId: string) {
  return filterByTab(HOME_RECENT_UPDATES_MOCK, tabId).length
}

export default function BooksHomeRecentUpdatesPage() {
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const { visibleColumns, toolbarRef, onColumnVisibilityClick, columnPickerDropdown } = useBooksTableColumnPicker({
    columns: columns as { key: string; label?: string; title?: string }[],
    storageKey: `books.table:${pathname}`,
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = filterByTab(HOME_RECENT_UPDATES_MOCK, activeTab)
    if (q) {
      list = list.filter(
        (r) =>
          r.recordId.toLowerCase().includes(q) ||
          r.recordLabel.toLowerCase().includes(q) ||
          r.module.toLowerCase().includes(q) ||
          r.user.toLowerCase().includes(q) ||
          r.details.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeTab, query])

  const tableData = useMemo(
    () => filtered.map((r) => ({ ...r })) as Record<string, unknown>[],
    [filtered]
  )

  const todayCount = HOME_RECENT_UPDATES_MOCK.filter((r) => r.dateLabel.includes('May 27')).length
  const youCount = HOME_RECENT_UPDATES_MOCK.filter((r) => r.user === 'You').length

  const hubTabs = HOME_UPDATES_FILTER_TABS.map((t) => ({
    id: t.id,
    label: t.label,
    count: tabCount(t.id),
  }))

  const resolvedColumns = visibleColumns.length ? visibleColumns : columns

  return (
    <BooksHomeHubDataShell
      toolbarRef={toolbarRef}
      onColumnVisibilityClick={onColumnVisibilityClick}
      toolbarSlot={columnPickerDropdown}
      kpis={[
          { title: 'Updates today', value: String(todayCount), subtitle: 'Across all modules', icon: History },
          {
            title: 'This week',
            value: String(HOME_RECENT_UPDATES_MOCK.length),
            subtitle: 'Audit trail entries',
            icon: Clock3,
          },
          { title: 'By you', value: String(youCount), subtitle: 'Your changes', icon: User },
          { title: 'Record edits', value: '5', subtitle: 'Created or updated', icon: Pencil },
        ]}
        tabs={hubTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search..."
        resultCount={filtered.length}
        exportFileName="books-recent-updates.csv"
        filterModalTitle="Filter recent updates"
        showEmpty={filtered.length === 0}
        emptyIcon={History}
        emptyTitle="Your recent activity will show here"
        emptyDescription="When you create or edit invoices, bills, expenses, and journals, the latest changes appear in this log."
      >
        {filtered.length > 0 ? (
          <Table
            variant="books"
            columns={resolvedColumns}
            data={tableData}
            keyField="id"
          />
        ) : null}
    </BooksHomeHubDataShell>
  )
}
