'use client'

import { useMemo } from 'react'
import { Avatar } from '@webfudge/ui'
import { formatCurrency } from '@webfudge/utils'
import type { CustomerRow } from '@/lib/mock-data/sales/seeds'
import {
  BooksPmTableCellCreated,
  BooksPmTableCellDocStatus,
  BooksPmTableCellText,
  booksPmTableActionsColumn,
  booksPmTableCellTheme,
} from '@/app/_components/booksPmTableCells'

export function formatSalesMoney(amount: number) {
  return formatCurrency(amount, { currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

type Options = {
  onRequestDelete?: (row: CustomerRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksCustomersTableColumns(options: Options = {}) {
  const { onRequestDelete, deletingId = null, basePath = '/sales/customers' } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'name',
        label: 'NAME',
        fixed: true,
        render: (_: unknown, row: CustomerRow) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <Avatar fallback={row.name?.[0] || 'C'} alt={row.name} size="sm" className={t.avatar} />
            <div className="min-w-0">
              <div className={t.title}>{row.name || '—'}</div>
              <div className={t.subtitle} title={row.company}>
                {row.company || 'No company'}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'company',
        visibilityKey: 'company',
        label: 'COMPANY NAME',
        render: (_: unknown, row: CustomerRow) => (
          <BooksPmTableCellText value={row.company} />
        ),
      },
      {
        key: 'email',
        visibilityKey: 'email',
        label: 'EMAIL',
        render: (_: unknown, row: CustomerRow) => (
          <BooksPmTableCellText value={row.email} />
        ),
      },
      {
        key: 'phone',
        visibilityKey: 'phone',
        label: 'WORK PHONE',
        render: (_: unknown, row: CustomerRow) => (
          <BooksPmTableCellText value={row.phone} nowrap />
        ),
      },
      {
        key: 'receivables',
        visibilityKey: 'receivables',
        label: 'RECEIVABLES',
        render: (_: unknown, row: CustomerRow) => (
          <BooksPmTableCellText value={formatSalesMoney(row.receivables ?? 0)} emphasized />
        ),
      },
      {
        key: 'unusedCredits',
        visibilityKey: 'unusedCredits',
        label: 'UNUSED CREDITS',
        render: (_: unknown, row: CustomerRow) => (
          <BooksPmTableCellText value={formatSalesMoney(row.unusedCredits ?? 0)} />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: CustomerRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: CustomerRow) => ({
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

type DocColumnOptions = {
  numberLabel?: string
  onRequestDelete?: (row: import('@/lib/mock-data/sales/seeds').SalesDocRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksSalesDocTableColumns(options: DocColumnOptions = {}) {
  const {
    numberLabel = 'NUMBER',
    onRequestDelete,
    deletingId = null,
    basePath = '/sales/estimates',
  } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'number',
        label: numberLabel,
        fixed: true,
        render: (_: unknown, row: import('@/lib/mock-data/sales/seeds').SalesDocRow) => (
          <div className="flex min-w-[180px] items-center gap-3">
            <Avatar fallback={row.number?.[0] || '#'} alt={row.number} size="sm" className={t.avatar} />
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
        render: (_: unknown, row: import('@/lib/mock-data/sales/seeds').SalesDocRow) => (
          <BooksPmTableCellText value={row.customer} />
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_: unknown, row: import('@/lib/mock-data/sales/seeds').SalesDocRow) => (
          <BooksPmTableCellDocStatus status={row.status} />
        ),
      },
      {
        key: 'amount',
        visibilityKey: 'amount',
        label: 'AMOUNT',
        render: (_: unknown, row: import('@/lib/mock-data/sales/seeds').SalesDocRow) => (
          <BooksPmTableCellText value={row.amount} emphasized />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: import('@/lib/mock-data/sales/seeds').SalesDocRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: import('@/lib/mock-data/sales/seeds').SalesDocRow) => ({
          viewHref: `${basePath}/${row.id}`,
          editHref: `${basePath}/${row.id}/edit`,
          onDelete: onRequestDelete ? () => onRequestDelete(row) : undefined,
          deleteDisabled: deletingId === row.id,
        }),
        { label: 'ACTIONS', width: 132 }
      ),
    ],
    [basePath, deletingId, numberLabel, onRequestDelete, t.avatar, t.subtitle, t.title]
  )
}
