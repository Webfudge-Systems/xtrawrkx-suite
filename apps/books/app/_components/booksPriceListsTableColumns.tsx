'use client'

import { useMemo } from 'react'
import { Avatar } from '@webfudge/ui'
import type { PriceListRow } from '@/lib/mock-data/price-lists'
import {
  BooksPmTableCellCreated,
  BooksPmTableCellStatus,
  BooksPmTableCellText,
  booksPmTableActionsColumn,
  booksPmTableCellTheme,
} from '@/app/_components/booksPmTableCells'

type Options = {
  onRequestDelete?: (row: PriceListRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksPriceListsTableColumns(options: Options = {}) {
  const { onRequestDelete, deletingId = null, basePath = '/items/price-lists' } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'name',
        label: 'NAME',
        fixed: true,
        render: (_: unknown, row: PriceListRow) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <Avatar fallback={row.name?.[0] || 'P'} alt={row.name} size="sm" className={t.avatar} />
            <div className="min-w-0">
              <div className={t.title}>{row.name || '—'}</div>
              <div className={t.subtitle} title={row.code}>
                {row.code || 'No code'}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'code',
        visibilityKey: 'code',
        label: 'CODE',
        render: (_: unknown, row: PriceListRow) => (
          <BooksPmTableCellText value={row.code} nowrap />
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_: unknown, row: PriceListRow) => (
          <BooksPmTableCellStatus status={row.status} />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: PriceListRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: PriceListRow) => ({
          viewHref: `${basePath}/${row.id}`,
          editHref: `${basePath}/${row.id}/edit`,
          onDelete: onRequestDelete ? () => onRequestDelete(row) : undefined,
          deleteDisabled: deletingId === row.id,
        }),
        { label: 'ACTIONS', width: 132 }
      ),
    ],
    [basePath, deletingId, onRequestDelete, t.avatar, t.subtitle, t.title]
  )
}
