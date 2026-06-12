'use client'

import type { ChangeEvent } from 'react'
import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Filter, MoreHorizontal } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, Card, TableRowActionMenuPortal, WorkspaceSearchInput } from '@webfudge/ui'
import {
  booksToolbarFilterButtonClassName,
  booksToolbarSearchInputClassName,
} from './booksToolbarStyles'

export type ActivityStatus = 'completed' | 'pending' | 'in_progress'

export type ActivityTableRow = {
  id: string
  orderId: string
  activityLabel: string
  Icon: LucideIcon
  priceLabel: string
  status: ActivityStatus
  dateLabel: string
  /** Customer / account name for the activity */
  customerLabel: string
  /** Invoice or document due date */
  dueDateLabel: string
  /** Outstanding balance or settled label */
  balanceLabel: string
}

export type RecentActivitiesTableProps = {
  title?: string
  subtitle?: string
  rows: ActivityTableRow[]
  searchPlaceholder?: string
  /** `feed` = CRM-style list with row backgrounds; `table` = full data table */
  variant?: 'feed' | 'table'
  onFilterClick?: () => void
  onViewActivity?: (row: ActivityTableRow) => void
  onEditActivity?: (row: ActivityTableRow) => void
  onDeleteActivity?: (row: ActivityTableRow) => void
  className?: string
}

type RowMenuAnchor = {
  rowId: string
  top: number
  left: number
  triggerEl: HTMLElement
}

const STATUS_STYLES: Record<
  ActivityStatus,
  { dot: string; text: string; label: string; feedBg: string }
> = {
  completed: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'Completed',
    feedBg: 'bg-emerald-500/10',
  },
  pending: {
    dot: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    label: 'Pending',
    feedBg: 'bg-red-500/10',
  },
  in_progress: {
    dot: 'bg-amber-400',
    text: 'text-amber-700 dark:text-amber-400',
    label: 'In Progress',
    feedBg: 'bg-amber-400/15',
  },
}

function FeedRow({
  row,
  onView,
}: {
  row: ActivityTableRow
  onView?: (row: ActivityTableRow) => void
}) {
  const st = STATUS_STYLES[row.status]
  const RowIcon = row.Icon
  return (
    <button
      type="button"
      onClick={() => onView?.(row)}
      className={clsx(
        'flex w-full gap-3 rounded-xl border border-[color:var(--books-border,rgba(0,0,0,0.06))] p-3 text-left transition-colors',
        'bg-[var(--books-bg-elevated,#f9fafb)] hover:border-[color:var(--books-border-em,rgba(0,0,0,0.12))] hover:bg-[var(--books-surface-muted,#f3f4f6)]',
        'dark:bg-[var(--books-bg-elevated,#252830)] dark:hover:bg-[var(--books-surface-muted,#2a2e38)]'
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] text-[var(--books-orange-text,#ea580c)]">
        <RowIcon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-[var(--books-text-primary,#111827)]">
              {row.activityLabel}
            </span>
            <span className="mt-0.5 block truncate text-xs text-[var(--books-text-secondary,#6b7280)]">
              {row.orderId} · {row.customerLabel}
            </span>
          </span>
          <span className="shrink-0 text-sm font-bold text-[var(--books-text-primary,#111827)]">{row.priceLabel}</span>
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={clsx(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              st.feedBg,
              st.text
            )}
          >
            <span className={clsx('h-1.5 w-1.5 rounded-full', st.dot)} aria-hidden />
            {st.label}
          </span>
          <span className="text-[11px] text-[var(--books-text-tertiary,#9ca3af)]">{row.dateLabel}</span>
        </span>
      </span>
    </button>
  )
}

export function RecentActivitiesTable({
  title = 'Recent Activities',
  subtitle = 'Latest updates and actions',
  rows,
  searchPlaceholder = 'Search anything...',
  variant = 'table',
  onFilterClick,
  onViewActivity,
  onEditActivity,
  onDeleteActivity,
  className,
}: RecentActivitiesTableProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [rowMenuAnchor, setRowMenuAnchor] = useState<RowMenuAnchor | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      const hay = [
        r.orderId,
        r.activityLabel,
        r.customerLabel,
        r.dueDateLabel,
        r.balanceLabel,
        r.priceLabel,
        r.dateLabel,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [query, rows])

  const toggle = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const closeRowMenu = () => setRowMenuAnchor(null)

  const headerToolbar = (
    <div className="flex shrink-0 items-center gap-2">
      <WorkspaceSearchInput
        placeholder={searchPlaceholder}
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        className={booksToolbarSearchInputClassName}
      />
      <Button type="button" variant="muted" size="sm" rounded="pill" className={booksToolbarFilterButtonClassName} onClick={onFilterClick}>
        <Filter className="h-4 w-4 shrink-0" aria-hidden />
        Filter
      </Button>
    </div>
  )

  if (variant === 'feed') {
    return (
      <Card
        variant="elevated"
        padding={false}
        surface="books"
        className={clsx('flex h-full min-h-0 flex-col overflow-hidden', className)}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--books-border,rgba(0,0,0,0.06))] p-5 md:p-6">
          <div className="min-w-0 pr-2">
            <h2 className="text-base font-semibold text-[var(--books-text-primary,#111827)]">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-[var(--books-text-secondary,#6b7280)]">{subtitle}</p>
            ) : null}
          </div>
          {headerToolbar}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6">
          {filtered.length === 0 ? (
            <div className="flex h-full min-h-[120px] items-center justify-center rounded-xl bg-[var(--books-bg-elevated,#f9fafb)] px-4 py-8 text-center dark:bg-[var(--books-bg-elevated,#252830)]">
              <p className="text-sm text-[var(--books-text-secondary,#6b7280)]">
                {rows.length === 0
                  ? 'No recent activity yet. Creates, updates, and deletes across Books will show here.'
                  : 'No activities match your search.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((row) => (
                <FeedRow key={row.id} row={row} onView={onViewActivity} />
              ))}
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={clsx('flex min-h-0 flex-col overflow-hidden', className)}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 p-6 md:px-7 md:pt-7">
        <h2 className="min-w-0 text-base font-semibold tracking-tight text-[var(--books-text-primary,#1a1a1a)]">
          {title}
        </h2>
        {headerToolbar}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 md:px-7 md:pb-7">
        {filtered.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-10">
            <p className="text-center text-sm text-[var(--books-text-secondary,#6b7280)]">
              No activities match your search.
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] divide-y divide-[color:var(--books-border,rgba(0,0,0,0.08))]">
                <thead>
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--books-text-secondary,#6b7280)]">
                    <th className="w-12 px-4 py-3.5" scope="col" />
                    <th className="px-4 py-3.5" scope="col">
                      Order ID
                    </th>
                    <th className="px-4 py-3.5" scope="col">
                      Customer
                    </th>
                    <th className="px-4 py-3.5" scope="col">
                      Activity
                    </th>
                    <th className="px-4 py-3.5" scope="col">
                      Total
                    </th>
                    <th className="px-4 py-3.5" scope="col">
                      Balance
                    </th>
                    <th className="px-4 py-3.5" scope="col">
                      Due
                    </th>
                    <th className="px-4 py-3.5" scope="col">
                      Status
                    </th>
                    <th className="px-4 py-3.5" scope="col">
                      Date
                    </th>
                    <th className="w-12 px-2 py-3.5" scope="col" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-card,#ffffff)]">
                  {filtered.map((row) => {
                    const st = STATUS_STYLES[row.status]
                    const RowIcon = row.Icon
                    const isSel = !!selected[row.id]
                    return (
                      <tr
                        key={row.id}
                        className={clsx(
                          'transition-colors duration-200 hover:bg-[var(--books-bg-elevated,#f9fafb)]',
                          isSel && 'bg-[var(--books-orange-bg,rgba(234,88,12,0.1))]'
                        )}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggle(row.id)}
                            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            aria-label={`Select ${row.orderId}`}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-[var(--books-text-primary,#111827)]">
                          {row.orderId}
                        </td>
                        <td className="max-w-[140px] px-4 py-4 text-sm text-[var(--books-text-primary,#1f2937)]">
                          <span className="line-clamp-2 font-medium">{row.customerLabel}</span>
                        </td>
                        <td className="max-w-[200px] px-4 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--books-bg-elevated,#f3f4f6)] text-[var(--books-text-secondary,#4b5563)]">
                              <RowIcon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="truncate text-sm font-medium text-[var(--books-text-primary,#1f2937)]">
                              {row.activityLabel}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-[var(--books-text-primary,#111827)]">
                          {row.priceLabel}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-[var(--books-text-primary,#1f2937)]">
                          {row.balanceLabel}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--books-text-secondary,#4b5563)]">
                          {row.dueDateLabel}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          <span className={clsx('inline-flex items-center gap-1.5 text-xs font-semibold', st.text)}>
                            <span className={clsx('h-2 w-2 rounded-full', st.dot)} aria-hidden />
                            {st.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-[var(--books-text-secondary,#4b5563)]">
                          {row.dateLabel}
                        </td>
                        <td className="px-2 py-4 text-center">
                          <button
                            type="button"
                            className="rounded-lg p-2 text-[var(--books-text-tertiary,#9ca3af)] transition-colors hover:bg-[var(--books-bg-elevated,#f3f4f6)] hover:text-[var(--books-text-primary,#374151)]"
                            aria-label="Row actions"
                            aria-haspopup="menu"
                            aria-expanded={rowMenuAnchor?.rowId === row.id}
                            onClick={(e) => {
                              const el = e.currentTarget
                              const r = el.getBoundingClientRect()
                              setRowMenuAnchor((prev) =>
                                prev?.rowId === row.id
                                  ? null
                                  : { rowId: row.id, top: r.bottom + 4, left: r.left, triggerEl: el }
                              )
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {rowMenuAnchor ? (
        <TableRowActionMenuPortal
          open
          anchor={{
            top: rowMenuAnchor.top,
            left: rowMenuAnchor.left,
            triggerEl: rowMenuAnchor.triggerEl,
          }}
          onClose={closeRowMenu}
          menuClassName="w-44 py-1"
          menuWidthPx={176}
        >
          {(() => {
            const target = filtered.find((r) => r.id === rowMenuAnchor.rowId)
            if (!target) return null
            return (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-orange-50/90 hover:text-gray-900"
                  onClick={() => {
                    onViewActivity?.(target)
                    closeRowMenu()
                  }}
                >
                  View details
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-orange-50/90 hover:text-gray-900"
                  onClick={() => {
                    onEditActivity?.(target)
                    closeRowMenu()
                  }}
                >
                  Edit activity
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50/90"
                  onClick={() => {
                    onDeleteActivity?.(target)
                    closeRowMenu()
                  }}
                >
                  Delete
                </button>
              </>
            )
          })()}
        </TableRowActionMenuPortal>
      ) : null}
    </Card>
  )
}
