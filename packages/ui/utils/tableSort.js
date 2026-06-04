/**
 * Client-side table sorting utilities (single- and multi-column).
 */

/** @typedef {{ key: string, direction: 'asc' | 'desc' }} SortRule */

/**
 * @param {unknown} value
 * @returns {number | string | null}
 */
export function normalizeSortValue(value) {
  if (value == null) return null
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    const asDate = Date.parse(trimmed)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed) && Number.isFinite(asDate)) {
      return asDate
    }
    return trimmed.toLowerCase()
  }
  return String(value).toLowerCase()
}

/**
 * @param {unknown} a
 * @param {unknown} b
 * @returns {number}
 */
export function compareSortValues(a, b) {
  const na = normalizeSortValue(a)
  const nb = normalizeSortValue(b)
  if (na == null && nb == null) return 0
  if (na == null) return 1
  if (nb == null) return -1
  if (typeof na === 'number' && typeof nb === 'number') {
    if (na < nb) return -1
    if (na > nb) return 1
    return 0
  }
  const sa = String(na)
  const sb = String(nb)
  return sa.localeCompare(sb, undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * @param {Array<Record<string, unknown>>} data
 * @param {SortRule[]} sortRules
 * @param {(row: Record<string, unknown>, key: string) => unknown} getValue
 */
export function sortTableData(data, sortRules, getValue) {
  if (!Array.isArray(data) || !data.length || !sortRules?.length) {
    return Array.isArray(data) ? [...data] : []
  }
  const rules = sortRules.filter((r) => r?.key && (r.direction === 'asc' || r.direction === 'desc'))
  if (!rules.length) return [...data]

  return [...data].sort((rowA, rowB) => {
    for (const rule of rules) {
      const cmp = compareSortValues(getValue(rowA, rule.key), getValue(rowB, rule.key))
      if (cmp !== 0) return rule.direction === 'desc' ? -cmp : cmp
    }
    return 0
  })
}

/**
 * @param {SortRule[]} rules
 * @param {string} key
 * @param {{ multi?: boolean, maxRules?: number }} [options]
 * @returns {SortRule[]}
 */
export function toggleSortRule(rules, key, options = {}) {
  const { multi = false, maxRules = 5 } = options
  const prev = Array.isArray(rules) ? rules : []
  const idx = prev.findIndex((r) => r.key === key)

  if (idx === -1) {
    if (!multi) return [{ key, direction: 'asc' }]
    if (prev.length >= maxRules) return prev
    return [...prev, { key, direction: 'asc' }]
  }

  const current = prev[idx]
  if (current.direction === 'asc') {
    const next = [...prev]
    next[idx] = { key, direction: 'desc' }
    return multi ? next : [{ key, direction: 'desc' }]
  }

  const without = prev.filter((_, i) => i !== idx)
  return without
}

/**
 * @param {Array<{ key?: string, sortable?: boolean, [key: string]: unknown }>} columns
 * @param {{ sortRules?: SortRule[], onHeaderClick?: (key: string, event: { shiftKey?: boolean }) => void, sortableKeys?: string[] }} options
 */
export function enrichColumnsWithSort(columns, options = {}) {
  const { sortRules = [], onHeaderClick, sortableKeys } = options

  return columns.map((column) => {
    const colKey = column.key
    if (!colKey || colKey === 'actions') return column

    const sortable =
      column.sortable !== false &&
      (sortableKeys ? sortableKeys.includes(colKey) : column.sortable === true)

    if (!sortable || !onHeaderClick) return column

    const ruleIndex = sortRules.findIndex((r) => r.key === colKey)
    const rule = ruleIndex >= 0 ? sortRules[ruleIndex] : null

    return {
      ...column,
      sortable: true,
      sortDirection: rule?.direction ?? null,
      sortPriority: rule && sortRules.length > 1 ? ruleIndex + 1 : null,
      onHeaderClick: (event) => onHeaderClick(colKey, event),
    }
  })
}

/**
 * @param {string} [storageKey]
 * @returns {SortRule[]}
 */
export function readStoredSortRules(storageKey) {
  if (!storageKey || typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((r) => r && typeof r.key === 'string' && (r.direction === 'asc' || r.direction === 'desc'))
      .map((r) => ({ key: r.key, direction: r.direction }))
  } catch {
    return []
  }
}

/**
 * @param {string} [storageKey]
 * @param {SortRule[]} rules
 */
export function writeStoredSortRules(storageKey, rules) {
  if (!storageKey || typeof window === 'undefined') return
  try {
    if (!rules?.length) {
      window.localStorage.removeItem(storageKey)
    } else {
      window.localStorage.setItem(storageKey, JSON.stringify(rules))
    }
  } catch {
    /* ignore */
  }
}
