'use client'

import { TableSortPanel } from '../TableSortPanel'

/**
 * Positioned sort-rule panel for list-page toolbars.
 *
 * Drop this directly inside the `relative` toolbar container — it renders
 * nothing when `open` is false.  Default positioning places it at the
 * top-right of the nearest positioned ancestor (same as column-picker panels).
 *
 * @param {{
 *   open: boolean,
 *   sortRules: { key: string, direction: 'asc' | 'desc' }[],
 *   columnOptions: { key: string, label: string }[],
 *   onAddRule: (key: string, direction?: 'asc'|'desc') => void,
 *   onRemoveRule: (key: string) => void,
 *   onSetDirection: (key: string, direction: 'asc'|'desc') => void,
 *   onMoveRule: (from: number, to: number) => void,
 *   onClear: () => void,
 *   maxRules?: number,
 *   className?: string,
 *   theme?: 'light' | 'books',
 * }} props
 */
export function TableSortDropdown({
  open,
  sortRules,
  columnOptions,
  onAddRule,
  onRemoveRule,
  onSetDirection,
  onMoveRule,
  onClear,
  maxRules = 5,
  className = 'absolute right-0 top-full z-40 mt-2',
  theme = 'light',
}) {
  if (!open) return null

  return (
    <TableSortPanel
      className={className}
      theme={theme}
      sortRules={sortRules}
      columnOptions={columnOptions}
      onAddRule={onAddRule}
      onRemoveRule={onRemoveRule}
      onSetDirection={onSetDirection}
      onMoveRule={onMoveRule}
      onClear={onClear}
      maxRules={maxRules}
    />
  )
}

export default TableSortDropdown
