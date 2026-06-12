'use client'

import { useMemo } from 'react'
import { Avatar } from '@webfudge/ui'
import { formatCurrency } from '@webfudge/utils'
import type { BankAccountRow } from '@/lib/mock-data/banking'
import {
  BooksPmTableCellCreated,
  BooksPmTableCellDocStatus,
  BooksPmTableCellText,
  booksPmTableActionsColumn,
  booksPmTableCellTheme,
} from '@/app/_components/booksPmTableCells'

function formatBalance(amount: number) {
  return formatCurrency(amount, { currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

type Options = {
  onRequestDelete?: (row: BankAccountRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksBankAccountsTableColumns(options: Options = {}) {
  const { onRequestDelete, deletingId = null, basePath = '/banking' } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'name',
        label: 'NAME',
        fixed: true,
        render: (_: unknown, row: BankAccountRow) => (
          <div className="flex min-w-[200px] items-center gap-3">
            <Avatar fallback={row.name?.[0] || 'B'} alt={row.name} size="sm" className={t.avatar} />
            <div className="min-w-0">
              <div className={t.title}>{row.name || '—'}</div>
              <div className={t.subtitle} title={row.accountType}>
                {row.accountType || 'Account'}
              </div>
            </div>
          </div>
        ),
      },
      {
        key: 'institution',
        visibilityKey: 'institution',
        label: 'BANK / SOURCE',
        render: (_: unknown, row: BankAccountRow) => (
          <BooksPmTableCellText value={row.institution} />
        ),
      },
      {
        key: 'balance',
        visibilityKey: 'balance',
        label: 'BALANCE',
        render: (_: unknown, row: BankAccountRow) => (
          <BooksPmTableCellText value={formatBalance(row.balance)} emphasized />
        ),
      },
      {
        key: 'status',
        visibilityKey: 'status',
        label: 'STATUS',
        render: (_: unknown, row: BankAccountRow) => (
          <BooksPmTableCellDocStatus status={row.status} />
        ),
      },
      {
        key: 'lastSyncAt',
        visibilityKey: 'lastSyncAt',
        label: 'LAST SYNC',
        render: (_: unknown, row: BankAccountRow) =>
          row.lastSyncAt ? (
            <BooksPmTableCellCreated dateString={row.lastSyncAt} />
          ) : (
            <BooksPmTableCellText value="—" />
          ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: BankAccountRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: BankAccountRow) => ({
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
