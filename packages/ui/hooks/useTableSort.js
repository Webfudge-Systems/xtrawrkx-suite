'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  enrichColumnsWithSort,
  readStoredSortRules,
  sortTableData,
  toggleSortRule,
  writeStoredSortRules,
} from '../utils/tableSort'

/**
 * @param {{
 *   storageKey?: string,
 *   defaultRules?: { key: string, direction: 'asc' | 'desc' }[],
 *   maxRules?: number,
 * }} options
 */
export function useTableSort(options = {}) {
  const { storageKey, defaultRules = [], maxRules = 5 } = options

  const [sortRules, setSortRules] = useState(() => {
    const stored = readStoredSortRules(storageKey)
    if (stored.length) return stored
    return defaultRules
  })

  useEffect(() => {
    writeStoredSortRules(storageKey, sortRules)
  }, [storageKey, sortRules])

  const handleHeaderClick = useCallback(
    (key, event) => {
      const multi = Boolean(event?.shiftKey)
      setSortRules((prev) => toggleSortRule(prev, key, { multi, maxRules }))
    },
    [maxRules]
  )

  const clearSort = useCallback(() => setSortRules([]), [])

  const addSortRule = useCallback(
    (key, direction = 'asc') => {
      if (!key) return
      setSortRules((prev) => {
        if (prev.some((r) => r.key === key)) {
          return prev.map((r) => (r.key === key ? { ...r, direction } : r))
        }
        if (prev.length >= maxRules) return prev
        return [...prev, { key, direction }]
      })
    },
    [maxRules]
  )

  const removeSortRule = useCallback((key) => {
    setSortRules((prev) => prev.filter((r) => r.key !== key))
  }, [])

  const setRuleDirection = useCallback((key, direction) => {
    setSortRules((prev) => prev.map((r) => (r.key === key ? { ...r, direction } : r)))
  }, [])

  const moveSortRule = useCallback((fromIndex, toIndex) => {
    setSortRules((prev) => {
      if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
        return prev
      }
      const next = [...prev]
      const [item] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, item)
      return next
    })
  }, [])

  const sortData = useCallback(
    (data, getValue) => sortTableData(data, sortRules, getValue),
    [sortRules]
  )

  const bindSortableColumns = useCallback(
    (columns, sortableKeys) =>
      enrichColumnsWithSort(columns, {
        sortRules,
        onHeaderClick: handleHeaderClick,
        sortableKeys,
      }),
    [sortRules, handleHeaderClick]
  )

  const hasActiveSort = sortRules.length > 0

  const sortSummary = useMemo(
    () =>
      sortRules
        .map((r, i) => `${i + 1}. ${r.key} (${r.direction})`)
        .join(', '),
    [sortRules]
  )

  return {
    sortRules,
    setSortRules,
    handleHeaderClick,
    clearSort,
    addSortRule,
    removeSortRule,
    setRuleDirection,
    moveSortRule,
    sortData,
    bindSortableColumns,
    hasActiveSort,
    sortSummary,
    maxRules,
  }
}

export default useTableSort
