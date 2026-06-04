'use client'

import { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { ArrowRight, CalendarDays, Megaphone } from 'lucide-react'
import { Badge, Button, Card } from '@webfudge/ui'
import type { BooksDataColumn } from '@webfudge/ui/book-components'
import BooksHomeHubDataShell from './BooksHomeHubDataShell'
import {
  HOME_ANNOUNCEMENT_FILTER_TABS,
  HOME_ANNOUNCEMENTS_MOCK,
  type HomeAnnouncement,
} from '../_data/homeHubMock'

const BADGE_VARIANT: Record<HomeAnnouncement['badge'], string> = {
  New: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  Webinar: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  Update: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  Tip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
}

const LIST_COLUMNS: BooksDataColumn[] = [
  { key: 'title', title: 'Announcement' },
  { key: 'category', title: 'Category', width: '7rem' },
  { key: 'date', title: 'Date', width: '11rem' },
  { key: 'action', title: 'Actions', width: '8rem' },
]

function filterByTab(items: HomeAnnouncement[], tabId: string) {
  const list = items.filter((a) => !a.featured)
  if (tabId === 'all') return list
  const cat = tabId.charAt(0).toUpperCase() + tabId.slice(1)
  return list.filter((a) => a.category.toLowerCase() === cat.toLowerCase())
}

function tabCount(tabId: string) {
  return filterByTab(HOME_ANNOUNCEMENTS_MOCK, tabId).length
}

function AnnouncementListRow({ item }: { item: HomeAnnouncement }) {
  return (
    <div
      className={clsx(
        'group flex items-center gap-4 border-b border-[color:var(--books-border,rgba(0,0,0,0.08))] px-6 py-4 transition-colors',
        'hover:bg-[var(--books-bg-elevated,#f9fafb)] dark:hover:bg-[var(--books-bg-elevated,#252830)]'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              'inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
              BADGE_VARIANT[item.badge]
            )}
          >
            {item.badge}
          </span>
          <p className="text-sm font-semibold text-[var(--books-text-primary,#111827)]">{item.title}</p>
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-[var(--books-text-secondary,#6b7280)]">{item.summary}</p>
      </div>
      <div className="w-[7rem] shrink-0 text-xs font-semibold text-[var(--books-text-secondary)]">{item.category}</div>
      <div className="flex w-[11rem] shrink-0 items-center gap-1.5 text-xs text-[var(--books-text-tertiary)]">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{item.dateLabel}</span>
      </div>
      <div className="w-[8rem] shrink-0 text-right">
        <Button
          type="button"
          variant="muted"
          size="sm"
          rounded="pill"
          className="border border-[color:var(--books-border)] bg-[var(--books-bg-card)] text-xs font-semibold text-[var(--books-orange-text,#ea580c)] hover:bg-[var(--books-orange-bg)]"
        >
          {item.ctaLabel}
          <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

export default function BooksHomeAnnouncementsPage() {
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const featured = HOME_ANNOUNCEMENTS_MOCK.find((a) => a.featured)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = filterByTab(HOME_ANNOUNCEMENTS_MOCK, activeTab)
    if (q) {
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q)
      )
    }
    return list
  }, [activeTab, query])

  const hubTabs = HOME_ANNOUNCEMENT_FILTER_TABS.map((t) => ({
    id: t.id,
    label: t.label,
    count: tabCount(t.id),
  }))

  const featuredBanner = featured ? (
    <Card
      variant="elevated"
      padding={false}
      className="overflow-hidden !bg-[var(--books-bg-card)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.38)]"
    >
      <div className="border-b border-[color:var(--books-border)] bg-gradient-to-br from-orange-500/10 via-transparent to-transparent p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <Badge className="mb-3 bg-orange-500 text-white">Featured</Badge>
            <h2 className="text-lg font-semibold text-[var(--books-text-primary)]">{featured.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--books-text-secondary)]">{featured.summary}</p>
            <p className="mt-3 text-xs text-[var(--books-text-tertiary)]">{featured.dateLabel}</p>
          </div>
          <Button type="button" variant="primary" rounded="pill" className="shrink-0 self-start md:self-center">
            {featured.ctaLabel}
          </Button>
        </div>
      </div>
    </Card>
  ) : null

  return (
    <BooksHomeHubDataShell
      tabs={hubTabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      searchQuery={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search..."
      resultCount={filtered.length}
      exportFileName="books-announcements.csv"
      listColumns={LIST_COLUMNS}
      filterModalTitle="Filter announcements"
      aboveToolbar={featuredBanner}
      showEmpty={filtered.length === 0}
      emptyIcon={Megaphone}
      emptyTitle="Never miss an announcement"
      emptyDescription="Product updates, webinars, and maintenance notices will appear here when published."
    >
      {filtered.map((item) => (
        <AnnouncementListRow key={item.id} item={item} />
      ))}
    </BooksHomeHubDataShell>
  )
}
