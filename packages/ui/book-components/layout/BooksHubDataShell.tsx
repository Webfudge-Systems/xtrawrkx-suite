'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Button, Card, Modal, TableEmptyBelow, TableResultsCount, TabsWithActions } from '@webfudge/ui'
import { booksToolbarSearchInputClassName } from '../tables/booksToolbarStyles'

export type BooksHubTab = {
  key: string
  label: string
  count: number
}

export type BooksHubDataShellProps = {
  /** Optional KPI row above the toolbar */
  kpis?: ReactNode
  /** e.g. featured announcement card */
  beforeToolbar?: ReactNode
  tabs: BooksHubTab[]
  activeTab: string
  onTabChange: (tab: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  searchPlaceholder?: string
  resultCount: number
  showFilter?: boolean
  showExport?: boolean
  onExportClick?: () => void
  filterModalTitle?: string
  children: ReactNode
  empty?: {
    icon?: LucideIcon
    title: string
    description: string
  }
  className?: string
}

/**
 * CRM / Books list chrome for home hub pages: `TabsWithActions` (booksModern) → results count → elevated table card.
 */
export function BooksHubDataShell({
  kpis,
  beforeToolbar,
  tabs,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  resultCount,
  showFilter = true,
  showExport = true,
  onExportClick,
  filterModalTitle = 'Filter',
  children,
  empty,
  className,
}: BooksHubDataShellProps) {
  const [filterOpen, setFilterOpen] = useState(false)
  const showEmpty = empty && resultCount === 0

  return (
    <div className={className ?? 'min-h-full space-y-6 pb-4 pt-2'}>
      {kpis}

      {beforeToolbar}

      <TabsWithActions
        tabs={tabs.map((t) => ({ key: t.key, label: t.label, badge: String(t.count) }))}
        activeTab={activeTab}
        onTabChange={onTabChange}
        showSearch
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        showAdd={false}
        showFilter={showFilter}
        onFilterClick={() => setFilterOpen(true)}
        showColumnVisibility={false}
        showExport={showExport}
        onExportClick={onExportClick ?? (() => {})}
        exportTitle="Export"
        variant="booksModern"
        searchInputClassName={booksToolbarSearchInputClassName}
      />

      <TableResultsCount count={resultCount} theme="books" />

      <Card variant="elevated" padding={false} surface="books">
        {showEmpty ? null : children}
        {showEmpty ? (
          <TableEmptyBelow
            theme="books"
            className="border-t border-[color:var(--books-border,rgba(0,0,0,0.08))]"
            icon={empty.icon}
            title={empty.title}
            description={empty.description}
          />
        ) : null}
      </Card>

      {showFilter ? (
        <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title={filterModalTitle} size="lg">
          <div className="space-y-4">
            <p className="text-sm text-[var(--books-text-secondary,#6b7280)]">
              Filter options will connect to your data when this hub is wired to the API.
            </p>
            <div className="flex justify-end gap-2 border-t border-[color:var(--books-border)] pt-4">
              <Button variant="muted" onClick={() => setFilterOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

/** Shared thead row for hub feed/table layouts inside Books list `Card` (`surface="books"`). */
export function BooksHubTableHead({ columns }: { columns: string[] }) {
  return (
    <thead className="bg-[var(--books-surface-muted,#f5f5f5)] border-b border-[color:var(--books-border,rgba(0,0,0,0.08))]">
      <tr>
        {columns.map((col) => (
          <th
            key={col}
            className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-[var(--books-text-secondary,#4b5563)]"
          >
            {col}
          </th>
        ))}
      </tr>
    </thead>
  )
}
