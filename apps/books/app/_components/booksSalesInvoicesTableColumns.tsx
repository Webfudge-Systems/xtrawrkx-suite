'use client'

import { useMemo } from 'react'
import { Avatar } from '@webfudge/ui'
import type { SalesInvoiceRow } from '@/lib/mock-data/sales/seeds'
import { formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import {
  BooksPmTableCellCreated,
  BooksPmTableCellDocStatus,
  BooksPmTableCellText,
  booksPmTableActionsColumn,
  booksPmTableCellTheme,
} from '@/app/_components/booksPmTableCells'

type Options = {
  onRequestDelete?: (row: SalesInvoiceRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksSalesInvoicesTableColumns(options: Options = {}) {
  const { onRequestDelete, deletingId = null, basePath = '/sales/invoices' } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'number',
        label: 'INVOICE#',
        fixed: true,
        render: (_: unknown, row: SalesInvoiceRow) => (
          <div className="flex min-w-[180px] items-center gap-3">
            <Avatar fallback={row.number?.[0] || 'I'} alt={row.number} size="sm" className={t.avatar} />
            <div className="min-w-0">
              <div className={t.title}>{row.number || '—'}</div>
              <div className={t.subtitle}>{row.date || '—'}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'customer',
        visibilityKey: 'customer',
        label: 'CUSTOMER',
        render: (_: unknown, row: SalesInvoiceRow) => (
          <BooksPmTableCellText value={row.customer} />
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_: unknown, row: SalesInvoiceRow) => (
          <BooksPmTableCellDocStatus status={row.status} />
        ),
      },
      {
        key: 'dueDate',
        visibilityKey: 'dueDate',
        label: 'DUE DATE',
        render: (_: unknown, row: SalesInvoiceRow) => (
          <BooksPmTableCellCreated dateString={row.dueDate} />
        ),
      },
      {
        key: 'amount',
        visibilityKey: 'amount',
        label: 'AMOUNT',
        render: (_: unknown, row: SalesInvoiceRow) => (
          <BooksPmTableCellText value={formatSalesMoney(row.amount)} emphasized />
        ),
      },
      {
        key: 'balance',
        visibilityKey: 'balance',
        label: 'BALANCE DUE',
        render: (_: unknown, row: SalesInvoiceRow) => (
          <BooksPmTableCellText value={formatSalesMoney(row.balance)} />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: SalesInvoiceRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: SalesInvoiceRow) => ({
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
