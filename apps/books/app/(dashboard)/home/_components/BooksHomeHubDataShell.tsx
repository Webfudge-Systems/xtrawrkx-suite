'use client'

import type { LucideIcon } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { useCallback, useState } from 'react'
import {
  Button,
  Card,
  KPICard,
  Modal,
  TableEmptyBelow,
  TableResultsCount,
  TabsWithActions,
} from '@webfudge/ui'
import { booksToolbarSearchInputClassName, type BooksDataColumn } from '@webfudge/ui/book-components'
import { useRegisterBooksShellActions } from '@/context/BooksShellActionsContext'

export type BooksHomeHubTab = {
  id: string
  label: string
  count: number
}

export type BooksHomeHubKpi = {
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
}

export type BooksHomeHubDataShellProps = {
  kpis?: BooksHomeHubKpi[]
  tabs: BooksHomeHubTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  resultCount: number
  exportFileName: string
  /** Optional table header row inside the card (CRM list columns). */
  listColumns?: BooksDataColumn[]
  children: ReactNode
  showEmpty?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  filterModalTitle?: string
  /** Rendered between KPIs and the list toolbar (e.g. featured announcement). */
  aboveToolbar?: ReactNode
  onColumnVisibilityClick?: () => void
  toolbarRef?: RefObject<HTMLDivElement>
  toolbarSlot?: ReactNode
}

export default function BooksHomeHubDataShell({
  kpis = [],
  tabs,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  resultCount,
  exportFileName,
  listColumns,
  children,
  showEmpty = false,
  emptyIcon,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your search or filters.',
  filterModalTitle = 'Filter',
  aboveToolbar,
  onColumnVisibilityClick,
  toolbarRef,
  toolbarSlot,
}: BooksHomeHubDataShellProps) {
  const [filterOpen, setFilterOpen] = useState(false)

  const exportCsv = useCallback(() => {
    const blob = new Blob([`Books export\nRows: ${resultCount}\n`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFileName
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [exportFileName, resultCount])

  const openFilterModal = useCallback(() => setFilterOpen(true), [])

  useRegisterBooksShellActions({
    onFilter: openFilterModal,
    onExport: exportCsv,
  })

  return (
    <div className="min-h-full space-y-6 pb-4 pt-2">
      {kpis.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KPICard
              key={kpi.title}
              theme="books"
              title={kpi.title}
              value={kpi.value}
              subtitle={kpi.subtitle}
              icon={kpi.icon}
            />
          ))}
        </div>
      ) : null}

      {aboveToolbar}

      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          tabs={tabs.map((t) => ({ key: t.id, id: t.id, label: t.label, badge: String(t.count) }))}
          activeTab={activeTab}
          onTabChange={onTabChange}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          showAdd={false}
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
        {toolbarSlot}
      </div>

      <TableResultsCount count={resultCount} theme="books" />

      <Card variant="elevated" padding={false} surface="books">
        {listColumns && listColumns.length > 0 ? (
          <div
            className="flex border-b border-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-surface-muted,#f5f5f5)]"
            role="row"
          >
            {listColumns.map((col) => (
              <div
                key={col.key}
                className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-[var(--books-text-secondary,#4b5563)]"
                style={col.width ? { width: col.width, minWidth: col.width, flexShrink: 0 } : { flex: 1, minWidth: 0 }}
              >
                {col.title ?? col.label}
              </div>
            ))}
          </div>
        ) : null}

        {children}

        {showEmpty && emptyIcon ? (
          <TableEmptyBelow
            theme="books"
            className="border-t border-[color:var(--books-border,rgba(0,0,0,0.08))]"
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : null}
      </Card>

      <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title={filterModalTitle} size="lg" theme="books">
        <div className="space-y-4">
          <p className="text-sm text-[var(--books-text-secondary,#6b7280)]">
            Filter controls will connect to your data when backend wiring is added. This matches the CRM list filter
            pattern.
          </p>
          <div className="flex justify-end gap-2 border-t border-[color:var(--books-border)] pt-4">
            <Button
              variant="muted"
              className="!border-0 !bg-[var(--books-bg-card,#1f2937)] !text-[var(--books-text-secondary,#9ca3af)] !shadow-none hover:!bg-[var(--books-surface-muted,#2a2e38)] hover:!text-[var(--books-text-primary,#f8fafc)]"
              onClick={() => setFilterOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
