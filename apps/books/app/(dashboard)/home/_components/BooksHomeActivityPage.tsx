'use client'

import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { Activity, Banknote, Receipt, ShoppingCart } from 'lucide-react'
import type { BooksDataColumn } from '@webfudge/ui/book-components'
import BooksHomeHubDataShell from './BooksHomeHubDataShell'
import {
  HOME_ACTIVITY_FILTER_TABS,
  HOME_ACTIVITY_MOCK,
  type HomeActivityItem,
} from '../_data/homeHubMock'

const GROUP_ORDER = ['Today', 'Yesterday', 'This week'] as const

const LIST_COLUMNS: BooksDataColumn[] = [
  { key: 'activity', title: 'Activity', width: '32%' },
  { key: 'details', title: 'Details' },
  { key: 'module', title: 'Module', width: '7rem' },
  { key: 'amount', title: 'Amount', width: '8.5rem' },
  { key: 'time', title: 'Time', width: '7.5rem' },
]

function filterByTab(items: HomeActivityItem[], tabId: string) {
  if (tabId === 'all') return items
  const map: Record<string, HomeActivityItem['module']> = {
    sales: 'Sales',
    purchases: 'Purchases',
    banking: 'Banking',
    contacts: 'Contacts',
    accountant: 'Accountant',
  }
  const mod = map[tabId]
  return mod ? items.filter((i) => i.module === mod) : items
}

function tabCount(tabId: string) {
  return filterByTab(HOME_ACTIVITY_MOCK, tabId).length
}

function ActivityListRow({ item }: { item: HomeActivityItem }) {
  const Icon = item.Icon
  return (
    <div
      className={clsx(
        'group flex items-start gap-4 border-b border-[color:var(--books-border,rgba(0,0,0,0.08))] px-6 py-4 transition-colors',
        'hover:bg-[var(--books-bg-elevated,#f9fafb)] dark:hover:bg-[var(--books-bg-elevated,#252830)]'
      )}
    >
      <div className="flex w-[32%] min-w-0 shrink-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] text-[var(--books-orange-text,#ea580c)]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <p className="truncate text-sm font-semibold text-[var(--books-text-primary,#111827)]">{item.title}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--books-text-secondary,#6b7280)]">{item.description}</p>
        <p className="mt-1 text-[11px] text-[var(--books-text-tertiary,#9ca3af)]">
          {item.actor} · {item.timeLabel}
        </p>
      </div>
      <div className="w-[7rem] shrink-0">
        <span className="inline-flex rounded-full bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] px-2 py-0.5 text-[10px] font-bold text-[var(--books-orange-text,#ea580c)]">
          {item.module}
        </span>
      </div>
      <div className="w-[8.5rem] shrink-0 text-right text-sm font-bold text-[var(--books-text-primary,#111827)]">
        {item.amountLabel ?? '—'}
      </div>
      <div className="w-[7.5rem] shrink-0 text-right text-xs text-[var(--books-text-tertiary,#9ca3af)]">
        {item.timeLabel}
      </div>
    </div>
  )
}

export default function BooksHomeActivityPage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = filterByTab(HOME_ACTIVITY_MOCK, activeTab)
    if (q) {
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.module.toLowerCase().includes(q) ||
          i.actor.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeTab, query])

  const grouped = useMemo(() => {
    const map = new Map<string, HomeActivityItem[]>()
    for (const g of GROUP_ORDER) map.set(g, [])
    for (const item of filtered) {
      const arr = map.get(item.group) ?? []
      arr.push(item)
      map.set(item.group, arr)
    }
    return GROUP_ORDER.map((g) => ({ group: g, items: map.get(g) ?? [] })).filter((x) => x.items.length > 0)
  }, [filtered])

  const kpiCounts = useMemo(() => {
    const today = HOME_ACTIVITY_MOCK.filter((i) => i.group === 'Today').length
    const sales = HOME_ACTIVITY_MOCK.filter((i) => i.module === 'Sales').length
    const purchases = HOME_ACTIVITY_MOCK.filter((i) => i.module === 'Purchases').length
    const banking = HOME_ACTIVITY_MOCK.filter((i) => i.module === 'Banking').length
    return { today, sales, purchases, banking }
  }, [])

  const hubTabs = HOME_ACTIVITY_FILTER_TABS.map((t) => ({
    id: t.id,
    label: t.label,
    count: tabCount(t.id),
  }))

  return (
    <BooksHomeHubDataShell
      kpis={[
        { title: 'Today', value: String(kpiCounts.today), subtitle: 'Actions in your org', icon: Activity },
        { title: 'Sales', value: String(kpiCounts.sales), subtitle: 'Invoices, estimates, payments', icon: Receipt },
        {
          title: 'Purchases',
          value: String(kpiCounts.purchases),
          subtitle: 'Bills, expenses, vendor pay',
          icon: ShoppingCart,
        },
        { title: 'Banking', value: String(kpiCounts.banking), subtitle: 'Feeds, transfers, match', icon: Banknote },
      ]}
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search..."
      resultCount={filtered.length}
      exportFileName="books-activity.csv"
      listColumns={LIST_COLUMNS}
      filterModalTitle="Filter activity"
      showEmpty={filtered.length === 0}
      emptyIcon={Activity}
      emptyTitle="No activity found"
      emptyDescription="When invoices, payments, and bills are recorded, they will appear in this feed."
    >
      {grouped.map(({ group, items }) => (
        <section key={group}>
          <div className="border-b border-[color:var(--books-border,rgba(0,0,0,0.06))] bg-[var(--books-bg-card)] px-6 py-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--books-text-tertiary,#9ca3af)]">
              {group}
            </h3>
          </div>
          {items.map((item) => (
            <ActivityListRow key={item.id} item={item} />
          ))}
        </section>
      ))}
    </BooksHomeHubDataShell>
  )
}
