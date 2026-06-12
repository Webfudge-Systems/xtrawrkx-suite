'use client'

import { useMemo } from 'react'
import { Avatar } from '@webfudge/ui'
import type { DocumentRow } from '@/lib/mock-data/documents/seeds'
import {
  BooksPmTableCellCreated,
  BooksPmTableCellDocStatus,
  BooksPmTableCellText,
  booksPmTableActionsColumn,
  booksPmTableCellTheme,
} from '@/app/_components/booksPmTableCells'

type Options = {
  onRequestDelete?: (row: DocumentRow) => void
  deletingId?: number | null
  basePath?: string
  uploadedLabel?: string
}

export function useBooksDocumentsTableColumns(options: Options = {}) {
  const {
    onRequestDelete,
    deletingId = null,
    basePath = '/documents',
    uploadedLabel = 'UPLOADED',
  } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'name',
        label: 'FILE',
        fixed: true,
        render: (_: unknown, row: DocumentRow) => (
          <div className="flex min-w-[220px] items-center gap-3">
            <Avatar fallback={row.name?.[0] || 'F'} alt={row.name} size="sm" className={t.avatar} />
            <div className="min-w-0">
              <div className={t.title}>{row.name || '—'}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_: unknown, row: DocumentRow) => (
          <BooksPmTableCellDocStatus status={row.status} />
        ),
      },
      {
        key: 'updatedAt',
        visibilityKey: 'updatedAt',
        label: uploadedLabel,
        render: (_: unknown, row: DocumentRow) => (
          <BooksPmTableCellText value={row.updatedAt} />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: DocumentRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: DocumentRow) => ({
          viewHref: `${basePath}/${row.id}`,
          editHref: `${basePath}/${row.id}/edit`,
          onDelete: onRequestDelete ? () => onRequestDelete(row) : undefined,
          deleteDisabled: deletingId === row.id,
        }),
        { label: 'ACTIONS', width: 132 }
      ),
    ],
    [basePath, deletingId, onRequestDelete, t.avatar, t.title, uploadedLabel]
  )
}
