'use client'

import { useMemo } from 'react'
import { Avatar } from '@webfudge/ui'
import type { ItemRow } from '@/lib/mock-data'
import { formatIndianCurrency } from '@/lib/formatCurrency'
import {
  BooksPmTableCellCreated,
  BooksPmTableCellOrangePill,
  BooksPmTableCellStatus,
  BooksPmTableCellText,
  booksPmTableActionsColumn,
  booksPmTableCellTheme,
} from '@/app/_components/booksPmTableCells'

type BooksItemsTableColumnsOptions = {
  onRequestDelete?: (row: ItemRow) => void
  deletingId?: number | null
}

export function useBooksItemsTableColumns(options: BooksItemsTableColumnsOptions = {}) {
  const { onRequestDelete, deletingId = null } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'name',
        label: 'NAME',
        fixed: true,
        render: (_: unknown, row: ItemRow) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <Avatar
              fallback={row.name?.[0] || 'I'}
              alt={row.name}
              size="sm"
              className={t.avatar}
            />
            <div className="min-w-0">
              <div className={t.title}>{row.name || '—'}</div>
              <div className={t.subtitle} title={row.sku}>
                {row.sku || 'No SKU'}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'sku',
        visibilityKey: 'sku',
        label: 'SKU',
        render: (_: unknown, row: ItemRow) => (
          <BooksPmTableCellText value={row.sku} nowrap />
        ),
      },
      {
        key: 'type',
        visibilityKey: 'type',
        label: 'TYPE',
        render: (_: unknown, row: ItemRow) => (
          <BooksPmTableCellOrangePill value={row.type} />
        ),
      },
      {
        key: 'rate',
        visibilityKey: 'rate',
        label: 'RATE',
        render: (_: unknown, row: ItemRow) => (
          <BooksPmTableCellText value={formatIndianCurrency(row.rate)} emphasized />
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_: unknown, row: ItemRow) => <BooksPmTableCellStatus status={row.status} />,
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: ItemRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: ItemRow) => ({
          viewHref: `/items/all/${row.id}`,
          editHref: `/items/all/${row.id}/edit`,
          onDelete: onRequestDelete ? () => onRequestDelete(row) : undefined,
          deleteDisabled: deletingId === row.id,
        }),
        { label: 'ACTIONS', width: 132 }
      ),
    ],
    [deletingId, onRequestDelete, t.avatar, t.subtitle, t.title]
  )
}
