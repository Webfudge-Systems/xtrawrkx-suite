'use client'

import Link from 'next/link'
import { clsx } from 'clsx'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { formatRelativeTime, formatTableDate } from '@webfudge/ui' // table date helpers (PM production parity)
import { booksPmTableCellTheme } from '@/lib/booksPmTableCellTheme'

const t = booksPmTableCellTheme

type TextProps = {
  value: unknown
  emphasized?: boolean
  nowrap?: boolean
  className?: string
}

export function BooksPmTableCellText({ value, emphasized = false, nowrap = false, className }: TextProps) {
  const display = value != null && value !== '' ? String(value) : null
  return (
    <span
      className={clsx(
        'inline-block text-sm',
        emphasized && t.emphasized,
        !emphasized && nowrap && clsx('whitespace-nowrap', t.body),
        !emphasized && !nowrap && 'max-w-[200px] truncate whitespace-nowrap',
        !emphasized && !nowrap && t.body,
        className
      )}
      title={display || ''}
    >
      {display || '—'}
    </span>
  )
}

export function BooksPmTableCellOrangePill({
  value,
  emptyLabel = '—',
  className,
}: {
  value: unknown
  emptyLabel?: string
  className?: string
}) {
  const raw = value != null && String(value).trim() !== '' ? String(value).replace(/_/g, ' ').trim() : ''
  if (!raw) {
    return <span className={clsx('text-sm', t.textMuted, className)}>{emptyLabel}</span>
  }
  return <span className={clsx(t.orangePill, className)}>{raw.toUpperCase()}</span>
}

export function BooksPmTableCellStatus({ status }: { status: string }) {
  const normalized = (status || 'Draft').trim()
  const isActive = normalized.toLowerCase() === 'active'
  return (
    <span className={clsx(isActive ? t.statusActive : t.statusDraft)}>{normalized.toUpperCase()}</span>
  )
}

export function BooksPmTableCellDocStatus({ status }: { status: string }) {
  const normalized = (status || 'Draft').trim()
  const lower = normalized.toLowerCase()
  const isPositive = [
    'active',
    'accepted',
    'confirmed',
    'completed',
    'paid',
    'sent',
    'issued',
    'delivered',
    'connected',
  ].includes(lower)
  const isWarning = ['overdue', 'in transit', 'paused', 'partial'].includes(lower)
  return (
    <span
      className={clsx(
        isPositive ? t.statusActive : isWarning ? t.orangePill : t.statusDraft
      )}
    >
      {normalized.toUpperCase()}
    </span>
  )
}

export function BooksPmTableCellCreated({
  dateString,
  showRelative = true,
  dateMode = 'auto' as 'auto' | 'calendar',
  className,
}: {
  dateString?: string | null
  showRelative?: boolean
  dateMode?: 'auto' | 'calendar'
  className?: string
}) {
  const dateOpts = dateMode === 'auto' ? {} : { dateMode }
  const date = formatTableDate(dateString, dateOpts)
  const relative = showRelative ? formatRelativeTime(dateString, dateOpts) : ''
  return (
    <div className={clsx('min-w-[130px]', className)}>
      <div className={t.createdDate}>{date}</div>
      {showRelative ? <div className={t.createdRelative}>{relative || '—'}</div> : null}
    </div>
  )
}

type RowActions = {
  viewHref?: string
  editHref?: string
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  deleteDisabled?: boolean
}

export function BooksPmTableCellRowActions({
  viewHref,
  editHref,
  onView,
  onEdit,
  onDelete,
  deleteDisabled = false,
}: RowActions) {
  return (
    <div className="flex min-w-0 items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      {viewHref ? (
        <Link href={viewHref} className={t.actionView} title="View" aria-label="View">
          <Eye className="h-4 w-4" />
        </Link>
      ) : onView ? (
        <button type="button" className={t.actionView} title="View" aria-label="View" onClick={onView}>
          <Eye className="h-4 w-4" />
        </button>
      ) : null}
      {editHref ? (
        <Link href={editHref} className={t.actionEdit} title="Edit" aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Link>
      ) : onEdit ? (
        <button type="button" className={t.actionEdit} title="Edit" aria-label="Edit" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          className={t.actionDelete}
          title="Delete"
          aria-label="Delete"
          disabled={deleteDisabled}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

export function booksPmTableActionsColumn(
  getActions: (row: never) => RowActions,
  { width = 132, label = 'ACTIONS' } = {}
) {
  return {
    key: 'actions',
    label,
    fixed: 'end' as const,
    width,
    headerClassName: 'text-right !px-4',
    className: 'text-right !px-4',
    render: (_: unknown, row: never) => <BooksPmTableCellRowActions {...(getActions(row) || {})} />,
  }
}

export { booksPmTableCellTheme }
