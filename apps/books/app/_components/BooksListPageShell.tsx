'use client'

import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
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
import { booksToolbarSearchInputClassName } from '@webfudge/ui/book-components'
import { Plus } from 'lucide-react'
import { useBooksTableColumnPicker } from '@/app/_components/BooksTableColumnPicker'

type TabItem = { key: string; label: string; count: number }

export type BooksListPageShellProps<T extends Record<string, unknown>> = {
  /** Used in filter modal title; layout topbar usually shows the page title. */
  title?: string
  subtitle?: string
  kpis: Array<{
    title: string
    value: number | string
    subtitle?: string
    icon: LucideIcon
    colorScheme?: string
  }>
  tabs?: TabItem[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  columns: Array<{ key: string; title?: string; label?: string; [key: string]: unknown }>
  data: T[]
  keyField?: string
  onRowClickHref?: (row: T) => string
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  addHref?: string
  addLabel?: string
  searchPlaceholder?: string
  exportFilePrefix?: string
  filterModalBody?: ReactNode
  /** Optional charts/cards between KPI row and toolbar (accountant pages). */
  topBlocks?: ReactNode
}

export default function BooksListPageShell<T extends Record<string, unknown>>({
  title = 'Records',
  subtitle: _subtitle,
  kpis,
  tabs,
  activeTab,
  onTabChange,
  columns,
  data,
  keyField = 'id',
  onRowClickHref,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  addHref,
  addLabel = 'Add',
  searchPlaceholder = 'Search...',
  exportFilePrefix = 'books',
  filterModalBody,
  topBlocks,
}: BooksListPageShellProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const columnStorageKey = `books.table:${pathname}`

  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  const { visibleColumns, toolbarRef, onColumnVisibilityClick, columnPickerDropdown } = useBooksTableColumnPicker({
    columns: columns as { key: string; label?: string; title?: string }[],
    storageKey: columnStorageKey,
  })

  const resolvedTabs = useMemo(() => tabs ?? [{ key: 'all', label: 'All', count: data.length }], [data.length, tabs])
  const resolvedActiveTab = activeTab ?? resolvedTabs[0]?.key ?? 'all'

  const filtered = useMemo(() => {
    if (!searchQuery) return data
    const q = searchQuery.toLowerCase()
    return data.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
  }, [data, searchQuery])

  const exportCsv = () => {
    const colKeys = (visibleColumns || []).map((c) => c?.key).filter(Boolean) as string[]
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
    a.download = `${exportFilePrefix}-${title.toLowerCase().replace(/\s+/g, '-')}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

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

      {topBlocks ? <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{topBlocks}</div> : null}

      <div className="relative" ref={toolbarRef}>
        <TabsWithActions
          tabs={resolvedTabs.map((t) => ({ key: t.key, label: t.label, badge: String(t.count) }))}
          activeTab={resolvedActiveTab}
          onTabChange={(t: string) => onTabChange?.(t)}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchPlaceholder}
          showAdd
          onAddClick={addHref ? () => router.push(addHref) : () => {}}
          addTitle={addLabel}
          showFilter
          onFilterClick={() => setFilterOpen(true)}
          showColumnVisibility
          onColumnVisibilityClick={onColumnVisibilityClick}
          columnVisibilityTitle="Show or hide columns"
          variant="booksModern"
          searchInputClassName={booksToolbarSearchInputClassName}
        />
        {columnPickerDropdown}
      </div>

      <TableResultsCount count={filtered.length} theme="books" />

      <Card variant="elevated" padding={false} surface="books">
        <Table
          variant="books"
          columns={visibleColumns.length ? visibleColumns : columns}
          data={filtered as Record<string, unknown>[]}
          keyField={keyField}
          onRowClick={
            onRowClickHref
              ? (row: Record<string, unknown>) => {
                  const href = onRowClickHref(row as T)
                  if (href) router.push(href)
                }
              : undefined
          }
        />

        {filtered.length === 0 ? (
          <TableEmptyBelow
            theme="books"
            className="border-t border-[color:var(--books-border,rgba(0,0,0,0.08))]"
            icon={EmptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={
              addHref ? (
                <Button variant="primary" onClick={() => router.push(addHref)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {addLabel}
                </Button>
              ) : null
            }
          />
        ) : null}
      </Card>

      <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title={`Filter ${title}`} size="lg">
        <div className="space-y-4">
          {filterModalBody ?? (
            <p className="text-sm text-[var(--books-text-secondary,#9ca3af)]">
              Filters for {title} will match CRM/PM list pages. Use search above for quick filtering.
            </p>
          )}
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
