'use client'

import { clsx } from 'clsx'
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2, X } from 'lucide-react'
import { Button } from '../Button'

/**
 * Multi-column sort builder panel.
 *
 * @param {{
 *   sortRules: { key: string, direction: 'asc' | 'desc' }[],
 *   columnOptions: { key: string, label: string }[],
 *   onAddRule: (key: string, direction?: 'asc' | 'desc') => void,
 *   onRemoveRule: (key: string) => void,
 *   onSetDirection: (key: string, direction: 'asc' | 'desc') => void,
 *   onMoveRule: (fromIndex: number, toIndex: number) => void,
 *   onClear: () => void,
 *   maxRules?: number,
 *   className?: string,
 * }} props
 */
export function TableSortPanel({
  sortRules = [],
  columnOptions = [],
  onAddRule,
  onRemoveRule,
  onSetDirection,
  onMoveRule,
  onClear,
  maxRules = 5,
  className,
}) {
  const usedKeys = new Set(sortRules.map((r) => r.key))
  const available = columnOptions.filter((c) => !usedKeys.has(c.key))
  const canAddMore = sortRules.length < maxRules && available.length > 0

  const handleAddSelect = (event) => {
    const key = event.target.value
    if (!key) return
    onAddRule?.(key, 'asc')
    event.target.value = ''
  }

  return (
    <div
      className={clsx(
        'w-[min(100vw-2rem,22rem)] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl',
        className
      )}
      role="dialog"
      aria-label="Table sort"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sort</p>
          <p className="mt-0.5 text-xs leading-snug text-gray-500">
            Rules apply top to bottom. Click a column header to sort; hold Shift for multiple columns.
          </p>
        </div>
        {sortRules.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Clear all sorts"
            aria-label="Clear all sorts"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {sortRules.length === 0 ? (
        <p className="mb-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
          No sort applied. Add a rule below or click a column header.
        </p>
      ) : (
        <ul className="mb-2 max-h-[min(40vh,16rem)] space-y-1 overflow-y-auto pr-0.5">
          {sortRules.map((rule, index) => {
            const label = columnOptions.find((c) => c.key === rule.key)?.label || rule.key
            return (
              <li
                key={rule.key}
                className="flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50/80 pr-1"
              >
                <span
                  className="flex w-7 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums text-orange-600"
                  title="Sort priority"
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-1.5">
                  <span className="truncate text-sm font-medium text-gray-800">{label}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onSetDirection?.(rule.key, 'asc')}
                      className={clsx(
                        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        rule.direction === 'asc'
                          ? 'bg-orange-100 text-orange-800'
                          : 'text-gray-500 hover:bg-gray-100'
                      )}
                    >
                      <ArrowUp className="h-3 w-3" />
                      Asc
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetDirection?.(rule.key, 'desc')}
                      className={clsx(
                        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        rule.direction === 'desc'
                          ? 'bg-orange-100 text-orange-800'
                          : 'text-gray-500 hover:bg-gray-100'
                      )}
                    >
                      <ArrowDown className="h-3 w-3" />
                      Desc
                    </button>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-0.5">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onMoveRule?.(index, index - 1)}
                    className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-30"
                    title="Move up (higher priority)"
                    aria-label={`Move ${label} up`}
                  >
                    <GripVertical className="h-3.5 w-3.5 rotate-180" />
                  </button>
                  <button
                    type="button"
                    disabled={index === sortRules.length - 1}
                    onClick={() => onMoveRule?.(index, index + 1)}
                    className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-30"
                    title="Move down (lower priority)"
                    aria-label={`Move ${label} down`}
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveRule?.(rule.key)}
                  className="mr-0.5 rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Remove sort"
                  aria-label={`Remove sort by ${label}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {canAddMore ? (
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
          <select
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-800 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            defaultValue=""
            onChange={handleAddSelect}
            aria-label="Add sort field"
          >
            <option value="" disabled>
              Add sort field…
            </option>
            {available.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {sortRules.length > 0 ? (
        <div className="mt-2 border-t border-gray-100 pt-2">
          <Button type="button" variant="outline" size="sm" className="w-full text-sm font-medium text-gray-700" onClick={onClear}>
            Clear all sorts
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default TableSortPanel
