'use client'

import { useMemo } from 'react'
import { useTableSort } from '@webfudge/ui'
import { getBooksSortValue } from '@/lib/tableSortValues'
import { SORT_COLUMNS_BY_ENTITY, sortableKeysForEntity, type BooksSortEntity } from '@/lib/tableSortColumns'

type UseBooksTableSortOptions = {
  entity?: BooksSortEntity
  storageKey?: string
  data?: Record<string, unknown>[]
  defaultRules?: { key: string; direction: 'asc' | 'desc' }[]
  enabled?: boolean
}

const noop = () => {}

export function useBooksTableSort({
  entity,
  storageKey,
  data = [],
  defaultRules = [],
  enabled = true,
}: UseBooksTableSortOptions) {
  const columnOptions = entity ? SORT_COLUMNS_BY_ENTITY[entity] || [] : []
  const sortableKeys = useMemo(() => (entity ? sortableKeysForEntity(entity) : []), [entity])

  const tableSort = useTableSort({
    storageKey: enabled && entity ? storageKey : undefined,
    defaultRules: enabled ? defaultRules : [],
  })

  const sortedData = useMemo(() => {
    if (!enabled || !entity) return data
    return tableSort.sortData(data, (row: unknown, key: string) =>
      getBooksSortValue(entity, row as Record<string, unknown>, key)
    ) as Record<string, unknown>[]
  }, [data, enabled, entity, tableSort.sortData, tableSort.sortRules])

  const bindSortableColumns = (columns: unknown[]) => {
    if (!enabled || !entity) return columns
    return tableSort.bindSortableColumns(columns, sortableKeys)
  }

  if (!enabled || !entity) {
    return {
      sortRules: [],
      sortedData: data,
      bindSortableColumns: (columns: unknown[]) => columns,
      hasActiveSort: false,
      columnOptions: [],
      sortableKeys: [],
      addSortRule: noop,
      removeSortRule: noop,
      setRuleDirection: noop,
      moveSortRule: noop,
      clearSort: noop,
      maxRules: tableSort.maxRules,
    }
  }

  return {
    ...tableSort,
    columnOptions,
    sortableKeys,
    sortedData,
    bindSortableColumns,
  }
}
