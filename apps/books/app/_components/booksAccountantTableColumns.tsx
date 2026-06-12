'use client'

import { useMemo } from 'react'
import { clsx } from 'clsx'
import { Avatar } from '@webfudge/ui'
import type {
  AccountantJournalRow,
  ChartOfAccountRow,
  CurrencyAdjustmentRow,
} from '@/lib/mock-data/accountant/seeds'
import {
  BooksPmTableCellCreated,
  BooksPmTableCellText,
  booksPmTableActionsColumn,
  booksPmTableCellTheme,
} from '@/app/_components/booksPmTableCells'

type JournalOptions = {
  numberLabel?: string
  onRequestDelete?: (row: AccountantJournalRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksAccountantJournalTableColumns(options: JournalOptions = {}) {
  const {
    numberLabel = 'JOURNAL#',
    onRequestDelete,
    deletingId = null,
    basePath = '/accountant/manual-journals',
  } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'journalNumber',
        label: numberLabel,
        fixed: true,
        render: (_: unknown, row: AccountantJournalRow) => (
          <div className="flex min-w-[180px] items-center gap-3">
            <Avatar fallback={row.journalNumber?.[0] || '#'} alt={row.journalNumber} size="sm" className={t.avatar} />
            <div className="min-w-0">
              <div className={t.title}>{row.journalNumber || '—'}</div>
              <div className={t.subtitle}>{row.date || '—'}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'referenceNumber',
        visibilityKey: 'reference',
        label: 'REFERENCE',
        render: (_: unknown, row: AccountantJournalRow) => (
          <BooksPmTableCellText value={row.referenceNumber} />
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_: unknown, row: AccountantJournalRow) => {
          const lower = (row.status || '').trim().toLowerCase()
          const isPositive = ['published', 'posted', 'completed', 'locked', 'active'].includes(lower)
          return (
            <span className={clsx(isPositive ? t.statusActive : t.statusDraft)}>
              {(row.status || '—').toUpperCase()}
            </span>
          )
        },
      },
      {
        key: 'notes',
        visibilityKey: 'notes',
        label: 'NOTES',
        render: (_: unknown, row: AccountantJournalRow) => (
          <BooksPmTableCellText value={row.notes} />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: AccountantJournalRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: AccountantJournalRow) => ({
          viewHref: `${basePath}/${row.id}`,
          editHref: `${basePath}/${row.id}/edit`,
          onDelete: onRequestDelete ? () => onRequestDelete(row) : undefined,
          deleteDisabled: deletingId === row.id,
        }),
        { label: 'ACTIONS', width: 132 }
      ),
    ],
    [basePath, deletingId, numberLabel, onRequestDelete, t.avatar, t.statusActive, t.statusDraft, t.subtitle, t.title]
  )
}

type ChartOptions = {
  onRequestDelete?: (row: ChartOfAccountRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksChartOfAccountsTableColumns(options: ChartOptions = {}) {
  const { onRequestDelete, deletingId = null, basePath = '/accountant/chart-of-accounts' } = options

  return useMemo(
    () => [
      {
        key: 'code',
        label: 'CODE',
        fixed: true,
        render: (_: unknown, row: ChartOfAccountRow) => (
          <BooksPmTableCellText value={row.code} emphasized />
        ),
      },
      {
        key: 'name',
        visibilityKey: 'name',
        label: 'ACCOUNT NAME',
        render: (_: unknown, row: ChartOfAccountRow) => (
          <BooksPmTableCellText value={row.name} />
        ),
      },
      {
        key: 'type',
        visibilityKey: 'type',
        label: 'TYPE',
        render: (_: unknown, row: ChartOfAccountRow) => (
          <BooksPmTableCellText value={row.type} />
        ),
      },
      {
        key: 'balance',
        visibilityKey: 'balance',
        label: 'BALANCE',
        render: (_: unknown, row: ChartOfAccountRow) => (
          <BooksPmTableCellText value={row.balance} emphasized />
        ),
      },
      {
        key: 'updatedAt',
        visibilityKey: 'updatedAt',
        label: 'UPDATED',
        render: (_: unknown, row: ChartOfAccountRow) => (
          <BooksPmTableCellText value={row.updatedAt} />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: ChartOfAccountRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: ChartOfAccountRow) => ({
          viewHref: `${basePath}/${row.id}`,
          editHref: `${basePath}/${row.id}/edit`,
          onDelete: onRequestDelete ? () => onRequestDelete(row) : undefined,
          deleteDisabled: deletingId === row.id,
        }),
        { label: 'ACTIONS', width: 132 }
      ),
    ],
    [basePath, deletingId, onRequestDelete]
  )
}

type CurrencyOptions = {
  onRequestDelete?: (row: CurrencyAdjustmentRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksCurrencyAdjustmentsTableColumns(options: CurrencyOptions = {}) {
  const { onRequestDelete, deletingId = null, basePath = '/accountant/currency-adjustments' } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'reference',
        label: 'REFERENCE',
        fixed: true,
        render: (_: unknown, row: CurrencyAdjustmentRow) => (
          <div className="min-w-[160px]">
            <div className={t.title}>{row.reference || '—'}</div>
            <div className={t.subtitle}>{row.date || '—'}</div>
          </div>
        ),
      },
      {
        key: 'currency',
        visibilityKey: 'currency',
        label: 'CURRENCY',
        render: (_: unknown, row: CurrencyAdjustmentRow) => (
          <BooksPmTableCellText value={row.currency} />
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_: unknown, row: CurrencyAdjustmentRow) => {
          const lower = (row.status || '').trim().toLowerCase()
          const isPositive = ['published', 'posted', 'completed', 'locked', 'active'].includes(lower)
          return (
            <span className={clsx(isPositive ? t.statusActive : t.statusDraft)}>
              {(row.status || '—').toUpperCase()}
            </span>
          )
        },
      },
      {
        key: 'amount',
        visibilityKey: 'amount',
        label: 'AMOUNT',
        render: (_: unknown, row: CurrencyAdjustmentRow) => (
          <BooksPmTableCellText value={row.amount} emphasized />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: CurrencyAdjustmentRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: CurrencyAdjustmentRow) => ({
          viewHref: `${basePath}/${row.id}`,
          editHref: `${basePath}/${row.id}/edit`,
          onDelete: onRequestDelete ? () => onRequestDelete(row) : undefined,
          deleteDisabled: deletingId === row.id,
        }),
        { label: 'ACTIONS', width: 132 }
      ),
    ],
    [basePath, deletingId, onRequestDelete, t.statusActive, t.statusDraft, t.subtitle, t.title]
  )
}
