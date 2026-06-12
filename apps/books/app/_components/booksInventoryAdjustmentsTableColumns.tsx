'use client'

import { useMemo } from 'react'
import { clsx } from 'clsx'
import { Avatar } from '@webfudge/ui'
import type { InventoryAdjustmentRow } from '@/lib/mock-data/inventory-adjustments'
import {
  BooksPmTableCellCreated,
  BooksPmTableCellText,
  booksPmTableActionsColumn,
  booksPmTableCellTheme,
} from '@/app/_components/booksPmTableCells'

type Options = {
  onRequestDelete?: (row: InventoryAdjustmentRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksInventoryAdjustmentsTableColumns(options: Options = {}) {
  const { onRequestDelete, deletingId = null, basePath = '/items/inventory-adjustments' } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'name',
        label: 'NAME',
        fixed: true,
        render: (_: unknown, row: InventoryAdjustmentRow) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <Avatar fallback={row.name?.[0] || 'A'} alt={row.name} size="sm" className={t.avatar} />
            <div className="min-w-0">
              <div className={t.title}>{row.name || '—'}</div>
              <div className={t.subtitle} title={row.reference}>
                {row.reference || 'No reference'}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'reference',
        visibilityKey: 'reference',
        label: 'REFERENCE',
        render: (_: unknown, row: InventoryAdjustmentRow) => (
          <BooksPmTableCellText value={row.reference} nowrap />
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_: unknown, row: InventoryAdjustmentRow) => {
          const normalized = (row.status || 'Draft').trim()
          const isPosted = normalized.toLowerCase() === 'posted'
          return (
            <span className={clsx(isPosted ? t.statusActive : t.statusDraft)}>
              {normalized.toUpperCase()}
            </span>
          )
        },
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: InventoryAdjustmentRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: InventoryAdjustmentRow) => ({
          viewHref: `${basePath}/${row.id}`,
          editHref: `${basePath}/${row.id}/edit`,
          onDelete: onRequestDelete ? () => onRequestDelete(row) : undefined,
          deleteDisabled: deletingId === row.id,
        }),
        { label: 'ACTIONS', width: 132 }
      ),
    ],
    [basePath, deletingId, onRequestDelete, t.avatar, t.statusActive, t.statusDraft, t.subtitle, t.title]
  )
}
