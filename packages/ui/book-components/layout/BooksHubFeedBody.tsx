'use client'

import type { ReactNode } from 'react'
import { clsx } from 'clsx'

export type BooksHubFeedGroup<T> = {
  label: string
  items: T[]
}

type BooksHubFeedBodyProps<T> = {
  groups: BooksHubFeedGroup<T>[]
  columns: number
  renderRow: (item: T) => ReactNode
  getRowKey: (item: T) => string
}

/**
 * Grouped list body (Today / Yesterday) inside a hub table — CRM card, Zoho-style sections.
 */
export function BooksHubFeedBody<T>({ groups, columns, renderRow, getRowKey }: BooksHubFeedBodyProps<T>) {
  return (
    <tbody className="divide-y divide-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-card,#ffffff)]">
      {groups.map((group) => (
        <GroupSection
          key={group.label}
          label={group.label}
          columns={columns}
          items={group.items}
          renderRow={renderRow}
          getRowKey={getRowKey}
        />
      ))}
    </tbody>
  )
}

function GroupSection<T>({
  label,
  columns,
  items,
  renderRow,
  getRowKey,
}: {
  label: string
  columns: number
  items: T[]
  renderRow: (item: T) => ReactNode
  getRowKey: (item: T) => string
}) {
  return (
    <>
      <tr className="bg-[var(--books-surface-muted,#f5f5f5)]">
        <td
          colSpan={columns}
          className="px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--books-text-tertiary,#9ca3af)]"
        >
          {label}
        </td>
      </tr>
      {items.map((item) => (
        <tr
          key={getRowKey(item)}
          className={clsx(
            'transition-colors hover:bg-[var(--books-bg-elevated,#f9fafb)]',
            'dark:hover:bg-[var(--books-bg-elevated,#252830)]'
          )}
        >
          {renderRow(item)}
        </tr>
      ))}
    </>
  )
}
