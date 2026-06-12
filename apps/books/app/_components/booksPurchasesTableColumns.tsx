'use client'

import { useMemo } from 'react'
import { Avatar } from '@webfudge/ui'
import { formatIndianCurrency } from '@/lib/formatCurrency'
import type { PurchaseDocRow, VendorRow } from '@/lib/mock-data/purchases/seeds'
import {
  BooksPmTableCellCreated,
  BooksPmTableCellDocStatus,
  BooksPmTableCellText,
  booksPmTableActionsColumn,
  booksPmTableCellTheme,
} from '@/app/_components/booksPmTableCells'

export function formatPurchaseMoney(amount: number) {
  return formatIndianCurrency(amount)
}

type VendorOptions = {
  onRequestDelete?: (row: VendorRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksVendorsTableColumns(options: VendorOptions = {}) {
  const { onRequestDelete, deletingId = null, basePath = '/purchases/vendors' } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'name',
        label: 'NAME',
        fixed: true,
        render: (_: unknown, row: VendorRow) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <Avatar fallback={row.name?.[0] || 'V'} alt={row.name} size="sm" className={t.avatar} />
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
        render: (_: unknown, row: VendorRow) => (
          <BooksPmTableCellText value={row.company} />
        ),
      },
      {
        key: 'email',
        visibilityKey: 'email',
        label: 'EMAIL',
        render: (_: unknown, row: VendorRow) => (
          <BooksPmTableCellText value={row.email} />
        ),
      },
      {
        key: 'phone',
        visibilityKey: 'phone',
        label: 'WORK PHONE',
        render: (_: unknown, row: VendorRow) => (
          <BooksPmTableCellText value={row.phone} nowrap />
        ),
      },
      {
        key: 'payables',
        visibilityKey: 'payables',
        label: 'PAYABLES',
        render: (_: unknown, row: VendorRow) => (
          <BooksPmTableCellText value={formatPurchaseMoney(row.payables ?? 0)} emphasized />
        ),
      },
      {
        key: 'unusedCredits',
        visibilityKey: 'unusedCredits',
        label: 'UNUSED CREDITS',
        render: (_: unknown, row: VendorRow) => (
          <BooksPmTableCellText value={formatPurchaseMoney(row.unusedCredits ?? 0)} />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: VendorRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: VendorRow) => ({
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
  onRequestDelete?: (row: PurchaseDocRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksPurchaseDocTableColumns(options: DocColumnOptions = {}) {
  const {
    numberLabel = 'NUMBER',
    onRequestDelete,
    deletingId = null,
    basePath = '/purchases/expenses',
  } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'number',
        label: numberLabel,
        fixed: true,
        render: (_: unknown, row: PurchaseDocRow) => (
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
        key: 'vendor',
        visibilityKey: 'vendor',
        label: 'VENDOR',
        render: (_: unknown, row: PurchaseDocRow) => (
          <BooksPmTableCellText value={row.vendor} />
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_: unknown, row: PurchaseDocRow) => (
          <BooksPmTableCellDocStatus status={row.status} />
        ),
      },
      {
        key: 'amount',
        visibilityKey: 'amount',
        label: 'AMOUNT',
        render: (_: unknown, row: PurchaseDocRow) => (
          <BooksPmTableCellText value={row.amount} emphasized />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: PurchaseDocRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: PurchaseDocRow) => ({
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
