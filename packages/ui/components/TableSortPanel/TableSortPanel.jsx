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
  theme = 'light',
}) {
  const isBooks = theme === 'books'
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
        'w-[min(100vw-2rem,22rem)] rounded-xl border p-2.5 shadow-xl',
        isBooks
          ? 'border-[color:var(--books-border,rgba(255,255,255,0.08))] bg-[var(--books-bg-elevated,#252830)] shadow-[var(--books-shell-shadow)]'
          : 'border-gray-200 bg-white',
        className
      )}
      role="dialog"
      aria-label="Table sort"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p
            className={clsx(
              'text-xs font-semibold uppercase tracking-wide',
              isBooks ? 'text-[var(--books-text-secondary,#9ca3af)]' : 'text-gray-500'
            )}
          >
            Sort
          </p>
          <p
            className={clsx(
              'mt-0.5 text-xs leading-snug',
              isBooks ? 'text-[var(--books-text-tertiary,#6b7280)]' : 'text-gray-500'
            )}
          >
            Rules apply top to bottom. Click a column header to sort; hold Shift for multiple columns.
          </p>
        </div>
        {sortRules.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className={clsx(
              'shrink-0 rounded-md p-1',
              isBooks
                ? 'text-[var(--books-text-tertiary)] hover:bg-[var(--books-bg-card)] hover:text-[var(--books-text-secondary)]'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            )}
            title="Clear all sorts"
            aria-label="Clear all sorts"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {sortRules.length === 0 ? (
        <p
          className={clsx(
            'mb-2 rounded-lg border border-dashed px-3 py-2 text-xs',
            isBooks
              ? 'border-[color:var(--books-border)] bg-[var(--books-bg-card)] text-[var(--books-text-secondary)]'
              : 'border-gray-200 bg-gray-50 text-gray-500'
          )}
        >
          No sort applied. Add a rule below or click a column header.
        </p>
      ) : (
        <ul className="mb-2 max-h-[min(40vh,16rem)] space-y-1 overflow-y-auto pr-0.5">
          {sortRules.map((rule, index) => {
            const label = columnOptions.find((c) => c.key === rule.key)?.label || rule.key
            return (
              <li
                key={rule.key}
                className={clsx(
                  'flex items-center gap-1 rounded-lg border pr-1',
                  isBooks
                    ? 'border-[color:var(--books-border)] bg-[var(--books-bg-card)]'
                    : 'border-gray-100 bg-gray-50/80'
                )}
              >
                <span
                  className="flex w-7 shrink-0 items-center justify-center text-[10px] font-bold tabular-nums text-orange-600"
                  title="Sort priority"
                >
                  {index + 1}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-1.5">
                  <span
                    className={clsx(
                      'truncate text-sm font-medium',
                      isBooks ? 'text-[var(--books-text-primary,#f8fafc)]' : 'text-gray-800'
                    )}
                  >
                    {label}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => onSetDirection?.(rule.key, 'asc')}
                      className={clsx(
                        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        rule.direction === 'asc'
                          ? isBooks
                            ? 'bg-[var(--books-orange-bg)] text-[var(--books-orange-text)]'
                            : 'bg-orange-100 text-orange-800'
                          : isBooks
                            ? 'text-[var(--books-text-secondary)] hover:bg-[var(--books-surface-muted)]'
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
                          ? isBooks
                            ? 'bg-[var(--books-orange-bg)] text-[var(--books-orange-text)]'
                            : 'bg-orange-100 text-orange-800'
                          : isBooks
                            ? 'text-[var(--books-text-secondary)] hover:bg-[var(--books-surface-muted)]'
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
                    className={clsx(
                      'rounded p-1 disabled:opacity-30',
                      isBooks
                        ? 'text-[var(--books-text-tertiary)] hover:bg-[var(--books-surface-muted)] hover:text-[var(--books-text-secondary)]'
                        : 'text-gray-400 hover:bg-white hover:text-gray-700'
                    )}
                    title="Move up (higher priority)"
                    aria-label={`Move ${label} up`}
                  >
                    <GripVertical className="h-3.5 w-3.5 rotate-180" />
                  </button>
                  <button
                    type="button"
                    disabled={index === sortRules.length - 1}
                    onClick={() => onMoveRule?.(index, index + 1)}
                    className={clsx(
                      'rounded p-1 disabled:opacity-30',
                      isBooks
                        ? 'text-[var(--books-text-tertiary)] hover:bg-[var(--books-surface-muted)] hover:text-[var(--books-text-secondary)]'
                        : 'text-gray-400 hover:bg-white hover:text-gray-700'
                    )}
                    title="Move down (lower priority)"
                    aria-label={`Move ${label} down`}
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveRule?.(rule.key)}
                  className={clsx(
                    'mr-0.5 rounded p-1.5',
                    isBooks
                      ? 'text-[var(--books-text-tertiary)] hover:bg-red-500/10 hover:text-red-400'
                      : 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                  )}
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
          <Plus
            className={clsx('h-4 w-4 shrink-0', isBooks ? 'text-[var(--books-text-tertiary)]' : 'text-gray-400')}
            aria-hidden
          />
          <select
            className={clsx(
              'min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20',
              isBooks
                ? 'border-[color:var(--books-border)] bg-[var(--books-input-bg,#252830)] text-[var(--books-input-text,#f0f0f0)] focus:border-orange-400/70'
                : 'border-gray-200 bg-white text-gray-800 focus:border-orange-400'
            )}
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
        <div
          className={clsx('mt-2 border-t pt-2', isBooks ? 'border-[color:var(--books-border)]' : 'border-gray-100')}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={clsx(
              'w-full text-sm font-medium',
              isBooks
                ? 'border-[color:var(--books-orange-text)] text-[var(--books-orange-text)] hover:bg-[var(--books-orange-bg)]'
                : 'text-gray-700'
            )}
            onClick={onClear}
          >
            Clear all sorts
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default TableSortPanel
