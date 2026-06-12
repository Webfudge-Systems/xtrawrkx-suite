'use client'

import { useMemo } from 'react'
import { clsx } from 'clsx'
import { Avatar } from '@webfudge/ui'
import { formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import type { ProjectRow, TimeEntryRow } from '@/lib/mock-data/time-tracking/seeds'
import {
  BooksPmTableCellCreated,
  BooksPmTableCellText,
  booksPmTableActionsColumn,
  booksPmTableCellTheme,
} from '@/app/_components/booksPmTableCells'

type ProjectOptions = {
  onRequestDelete?: (row: ProjectRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksProjectsTableColumns(options: ProjectOptions = {}) {
  const { onRequestDelete, deletingId = null, basePath = '/time-tracking/projects' } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'name',
        label: 'PROJECT NAME',
        fixed: true,
        render: (_: unknown, row: ProjectRow) => (
          <div className="flex min-w-[220px] items-center gap-3">
            <Avatar fallback={row.name?.[0] || 'P'} alt={row.name} size="sm" className={t.avatar} />
            <div className="min-w-0">
              <div className={t.title}>{row.name || '—'}</div>
              <div className={t.subtitle}>{row.customerName || '—'}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'customerName',
        visibilityKey: 'customer',
        label: 'CUSTOMER',
        render: (_: unknown, row: ProjectRow) => (
          <BooksPmTableCellText value={row.customerName} />
        ),
      },
      {
        key: 'billingMethod',
        visibilityKey: 'billingMethod',
        label: 'BILLING METHOD',
        render: (_: unknown, row: ProjectRow) => (
          <BooksPmTableCellText value={row.billingMethod} />
        ),
      },
      {
        key: 'totalLoggedHours',
        visibilityKey: 'totalLoggedHours',
        label: 'TOTAL LOGGED HOURS',
        render: (_: unknown, row: ProjectRow) => (
          <BooksPmTableCellText value={Number(row.totalLoggedHours ?? 0).toFixed(1)} />
        ),
      },
      {
        key: 'billableHours',
        visibilityKey: 'billableHours',
        label: 'BILLABLE HOURS',
        render: (_: unknown, row: ProjectRow) => (
          <BooksPmTableCellText value={Number(row.billableHours ?? 0).toFixed(1)} />
        ),
      },
      {
        key: 'unbilledAmount',
        visibilityKey: 'unbilledAmount',
        label: 'UNBILLED AMOUNT',
        render: (_: unknown, row: ProjectRow) => (
          <BooksPmTableCellText value={formatSalesMoney(row.unbilledAmount ?? 0)} emphasized />
        ),
      },
      {
        key: 'budget',
        visibilityKey: 'budget',
        label: 'BUDGET',
        render: (_: unknown, row: ProjectRow) => (
          <BooksPmTableCellText value={formatSalesMoney(row.budget ?? 0)} />
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: ProjectRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: ProjectRow) => ({
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

type TimeEntryOptions = {
  onRequestDelete?: (row: TimeEntryRow) => void
  deletingId?: number | null
  basePath?: string
}

export function useBooksTimeEntriesTableColumns(options: TimeEntryOptions = {}) {
  const { onRequestDelete, deletingId = null, basePath = '/time-tracking/timesheet' } = options
  const t = booksPmTableCellTheme

  return useMemo(
    () => [
      {
        key: 'date',
        label: 'DATE',
        fixed: true,
        render: (_: unknown, row: TimeEntryRow) => (
          <BooksPmTableCellText value={row.date} emphasized />
        ),
      },
      {
        key: 'projectName',
        visibilityKey: 'project',
        label: 'PROJECT',
        render: (_: unknown, row: TimeEntryRow) => (
          <BooksPmTableCellText value={row.projectName} />
        ),
      },
      {
        key: 'task',
        visibilityKey: 'task',
        label: 'TASK',
        render: (_: unknown, row: TimeEntryRow) => (
          <BooksPmTableCellText value={row.task} />
        ),
      },
      {
        key: 'hours',
        visibilityKey: 'hours',
        label: 'HOURS',
        render: (_: unknown, row: TimeEntryRow) => (
          <BooksPmTableCellText value={Number(row.hours).toFixed(1)} />
        ),
      },
      {
        key: 'billable',
        visibilityKey: 'billable',
        label: 'BILLABLE',
        render: (_: unknown, row: TimeEntryRow) => (
          <span className={clsx(row.billable ? t.statusActive : t.statusDraft)}>
            {row.billable ? 'YES' : 'NO'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        visibilityKey: 'createdAt',
        label: 'CREATED',
        render: (_: unknown, row: TimeEntryRow) => (
          <BooksPmTableCellCreated dateString={row.createdAt} />
        ),
      },
      booksPmTableActionsColumn(
        (row: TimeEntryRow) => ({
          viewHref: `${basePath}/${row.id}`,
          editHref: `${basePath}/${row.id}/edit`,
          onDelete: onRequestDelete ? () => onRequestDelete(row) : undefined,
          deleteDisabled: deletingId === row.id,
        }),
        { label: 'ACTIONS', width: 132 }
      ),
    ],
    [basePath, deletingId, onRequestDelete, t.statusActive, t.statusDraft]
  )
}
