'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Button,
  KPICard,
  Modal,
  Select,
  Table,
  TableEmptyBelow,
  TableResultsCount,
  TableSortDropdown,
  TabsWithActions,
} from '@webfudge/ui'
import { booksToolbarSearchInputClassName } from '@webfudge/ui/book-components'
import { Plus } from 'lucide-react'
import { useBooksTableColumnPicker } from '@/app/_components/BooksTableColumnPicker'
import { useRegisterBooksShellActions } from '@/context/BooksShellActionsContext'
import { useBooksTableSort } from '@/hooks/useBooksTableSort'
import type { BooksSortEntity } from '@/lib/tableSortColumns'

type TabItem = { key: string; label: string; count: number }

export type BooksFilterField = {
  key: string
  label: string
  placeholder?: string
  options: Array<{ value: string; label: string }>
}

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
  /** When set, rows are filtered by the active tab key. */
  tabFilter?: (row: T, tabKey: string) => boolean
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
  filterFields?: BooksFilterField[]
  /** Enables PM-style multi-column sort (toolbar button + header click). */
  sortEntity?: BooksSortEntity
  /** Optional tabs/cards between KPI row and toolbar (accountant pages). */
  topBlocks?: ReactNode
}

export default function BooksListPageShell<T extends Record<string, unknown>>({
  title = 'Records',
  subtitle: _subtitle,
  kpis,
  tabs,
  activeTab,
  onTabChange,
  tabFilter,
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
  filterFields,
  sortEntity,
  topBlocks,
}: BooksListPageShellProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const columnStorageKey = `books.table:${pathname}`
  const sortStorageKey = `${columnStorageKey}.sort`

  const [searchQuery, setSearchQuery] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [sortPickerOpen, setSortPickerOpen] = useState(false)
  const [filterValues, setFilterValues] = useState<Record<string, string>>({})
  const [draftFilterValues, setDraftFilterValues] = useState<Record<string, string>>({})

  const {
    visibleColumns,
    toolbarRef,
    closeColumnPicker,
    onColumnVisibilityClick,
    columnPickerDropdown,
  } = useBooksTableColumnPicker({
    columns: columns as { key: string; label?: string; title?: string }[],
    storageKey: columnStorageKey,
  })

  const resolvedTabs = useMemo(() => tabs ?? [{ key: 'all', label: 'All', count: data.length }], [data.length, tabs])
  const isTabControlled = activeTab !== undefined
  const [internalTab, setInternalTab] = useState(resolvedTabs[0]?.key ?? 'all')
  const resolvedActiveTab = isTabControlled ? activeTab : internalTab

  const handleTabChange = useCallback(
    (tabKey: string) => {
      if (!isTabControlled) setInternalTab(tabKey)
      onTabChange?.(tabKey)
    },
    [isTabControlled, onTabChange]
  )

  const tabFiltered = useMemo(() => {
    if (!tabFilter) return data
    return data.filter((row) => tabFilter(row, resolvedActiveTab))
  }, [data, resolvedActiveTab, tabFilter])

  const fieldFiltered = useMemo(() => {
    let rows = tabFiltered
    for (const field of filterFields ?? []) {
      const val = filterValues[field.key]
      if (!val) continue
      rows = rows.filter((row) => String((row as Record<string, unknown>)[field.key] ?? '') === val)
    }
    return rows
  }, [filterFields, filterValues, tabFiltered])

  const filtered = useMemo(() => {
    if (!searchQuery) return fieldFiltered
    const q = searchQuery.toLowerCase()
    return fieldFiltered.filter((row) => JSON.stringify(row).toLowerCase().includes(q))
  }, [fieldFiltered, searchQuery])

  const {
    sortedData,
    bindSortableColumns,
    hasActiveSort,
    sortRules,
    columnOptions: sortColumnOptions,
    addSortRule,
    removeSortRule,
    setRuleDirection,
    moveSortRule,
    clearSort,
    maxRules: sortMaxRules,
  } = useBooksTableSort({
    entity: sortEntity,
    storageKey: sortStorageKey,
    data: filtered as Record<string, unknown>[],
    enabled: Boolean(sortEntity),
  })

  const tableData = sortEntity ? sortedData : filtered
  const baseTableColumns = (visibleColumns.length ? visibleColumns : columns) as Array<{
    key: string
    title?: string
    label?: string
    [key: string]: unknown
  }>
  const tableColumns = sortEntity ? bindSortableColumns(baseTableColumns) : baseTableColumns

  const hasActiveFilters = useMemo(
    () => Object.values(filterValues).some((v) => Boolean(v)),
    [filterValues]
  )

  const openFilterModal = useCallback(() => {
    setDraftFilterValues({ ...filterValues })
    setFilterOpen(true)
  }, [filterValues])

  const applyFilters = useCallback(() => {
    setFilterValues({ ...draftFilterValues })
    setFilterOpen(false)
  }, [draftFilterValues])

  const clearFilters = useCallback(() => {
    setDraftFilterValues({})
    setFilterValues({})
    setFilterOpen(false)
  }, [])

  const exportCsv = useCallback(() => {
    const colKeys = (visibleColumns || []).map((c) => c?.key).filter(Boolean) as string[]
    const safeKeys = colKeys.length ? colKeys : Object.keys((tableData[0] as Record<string, unknown>) || {})

    const esc = (v: unknown) => {
      if (v == null) return ''
      const s = String(v)
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    }

    const header = safeKeys.join(',')
    const rows = (tableData as T[]).map((row) => safeKeys.map((k) => esc((row as Record<string, unknown>)[k])).join(','))
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
  }, [exportFilePrefix, tableData, title, visibleColumns])

  const handleColumnVisibilityClick = useCallback(() => {
    setSortPickerOpen(false)
    onColumnVisibilityClick()
  }, [onColumnVisibilityClick])

  const handleSortClick = useCallback(() => {
    closeColumnPicker()
    setSortPickerOpen((open) => !open)
  }, [closeColumnPicker])

  useEffect(() => {
    if (!sortPickerOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setSortPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [sortPickerOpen, toolbarRef])

  const onImport = useCallback(() => {
    // Import wiring is page-specific; header file picker delegates here when implemented.
  }, [])

  useRegisterBooksShellActions({
    onFilter: openFilterModal,
    onExport: exportCsv,
    onImport,
    hasActiveFilters,
  })

  const tabItemsWithCounts = useMemo(() => {
    return resolvedTabs.map((t) => {
      const count = tabFilter
        ? data.filter((row) => tabFilter(row, t.key)).length
        : t.count
      return { key: t.key, label: t.label, badge: String(count) }
    })
  }, [data, resolvedTabs, tabFilter])

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

      <div className="relative z-20" ref={toolbarRef}>
        <TabsWithActions
          tabs={tabItemsWithCounts}
          activeTab={resolvedActiveTab}
          onTabChange={handleTabChange}
          showSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={searchPlaceholder}
          showAdd={Boolean(addHref)}
          addHref={addHref}
          addTitle={addLabel}
          showFilter
          onFilterClick={openFilterModal}
          showColumnVisibility
          onColumnVisibilityClick={handleColumnVisibilityClick}
          columnVisibilityTitle="Show or hide columns"
          showSort={Boolean(sortEntity)}
          onSortClick={handleSortClick}
          hasActiveSort={hasActiveSort}
          sortTitle="Sort table (Shift+click headers for multi-sort)"
          variant="booksModern"
          searchInputClassName={booksToolbarSearchInputClassName}
        />
        {sortEntity ? (
          <TableSortDropdown
            open={sortPickerOpen}
            theme="books"
            className="absolute right-0 top-full z-50 mt-2"
            sortRules={sortRules}
            columnOptions={sortColumnOptions}
            onAddRule={addSortRule}
            onRemoveRule={removeSortRule}
            onSetDirection={setRuleDirection}
            onMoveRule={moveSortRule}
            onClear={clearSort}
            maxRules={sortMaxRules}
          />
        ) : null}
        {columnPickerDropdown}
      </div>

      <TableResultsCount count={tableData.length} theme="books" />

      <div className="books-pm-data-table">
        <Table
          variant="modernEmbedded"
          columns={tableColumns}
          data={tableData as Record<string, unknown>[]}
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

        {tableData.length === 0 ? (
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
      </div>

      <Modal isOpen={filterOpen} onClose={() => setFilterOpen(false)} title={`Filter ${title}`} size="lg" theme="books">
        <div className="space-y-4">
          {filterModalBody ??
            (filterFields?.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filterFields.map((field) => (
                  <Select
                    key={field.key}
                    label={field.label}
                    placeholder={field.placeholder ?? 'All'}
                    value={draftFilterValues[field.key] ?? ''}
                    onChange={(v: string) =>
                      setDraftFilterValues((prev) => ({ ...prev, [field.key]: v }))
                    }
                    options={[{ value: '', label: 'All' }, ...field.options]}
                    className="rounded-lg border-[color:var(--books-input-border,rgba(255,255,255,0.1))] bg-[var(--books-input-bg,#252830)] text-[var(--books-input-text,#f0f0f0)]"
                    containerClassName="[&_label]:text-[var(--books-text-secondary,#9ca3af)]"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--books-text-secondary,#9ca3af)]">
                Filters for {title} will match CRM/PM list pages. Use search above for quick filtering.
              </p>
            ))}
          <div className="flex flex-wrap justify-end gap-2 border-t border-[color:var(--books-border)] pt-4">
            {filterFields?.length ? (
              <Button
                variant="muted"
                className="!border-0 !bg-transparent !text-[var(--books-text-secondary,#9ca3af)] !shadow-none hover:!text-[var(--books-text-primary,#f8fafc)]"
                onClick={clearFilters}
              >
                Clear
              </Button>
            ) : null}
            <Button
              variant="muted"
              className="!border-0 !bg-[var(--books-bg-card,#1f2937)] !text-[var(--books-text-secondary,#9ca3af)] !shadow-none hover:!bg-[var(--books-surface-muted,#2a2e38)] hover:!text-[var(--books-text-primary,#f8fafc)]"
              onClick={() => setFilterOpen(false)}
            >
              Close
            </Button>
            {filterFields?.length ? (
              <Button variant="primary" onClick={applyFilters}>
                Apply filters
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  )
}
