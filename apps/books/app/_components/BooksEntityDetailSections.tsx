'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'

export const booksEntityInfoLabelClass =
  'flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--books-text-secondary,#6b7280)] sm:text-sm'

export function BooksInfoSection({
  title,
  icon: Icon,
  children,
  isFirst = false,
}: {
  title: string
  icon?: LucideIcon
  children: ReactNode
  isFirst?: boolean
}) {
  return (
    <section
      className={clsx(
        isFirst ? 'pt-0' : 'border-t border-[color:var(--books-border,rgba(0,0,0,0.08))] pt-4'
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {Icon ? (
          <Icon className="h-5 w-5 shrink-0 text-[var(--books-orange-text,#f97316)]" aria-hidden />
        ) : null}
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--books-text-secondary,#6b7280)]">
          {title}
        </h3>
      </div>
      {children}
    </section>
  )
}

export function BooksInfoRow({
  label,
  value,
  icon: RowIcon,
  className = '',
  emphasize = false,
  children,
}: {
  label: string
  value?: string | number | null
  icon?: LucideIcon
  className?: string
  emphasize?: boolean
  children?: ReactNode
}) {
  const hasCustom = children != null

  if (hasCustom) {
    return (
      <div className={clsx('min-w-0', className)} role="group" aria-label={label}>
        <div className={booksEntityInfoLabelClass}>
          {RowIcon ? (
            <RowIcon className="h-4 w-4 shrink-0 text-[var(--books-text-tertiary,#9ca3af)]" aria-hidden />
          ) : null}
          <span>{label}</span>
        </div>
        <div className="mt-2.5 text-base leading-snug text-[var(--books-text-primary,#111827)]">{children}</div>
      </div>
    )
  }

  const raw = value == null ? '' : String(value).trim()
  const empty = !raw || raw === '—'
  const display = empty ? '—' : raw

  return (
    <div
      className={clsx('min-w-0', className)}
      role="group"
      aria-label={`${label}: ${empty ? 'empty' : display}`}
    >
      <div className={booksEntityInfoLabelClass}>
        {RowIcon ? (
          <RowIcon className="h-4 w-4 shrink-0 text-[var(--books-text-tertiary,#9ca3af)]" aria-hidden />
        ) : null}
        <span>{label}</span>
      </div>
      <div className="mt-2.5">
        {!empty && emphasize ? (
          <span className="inline-flex rounded-lg bg-[var(--books-orange-bg,rgba(249,115,22,0.12))] px-3 py-2 text-base font-semibold text-[var(--books-orange-text,#f97316)] shadow-sm ring-1 ring-[color:var(--books-orange-border,rgba(249,115,22,0.35))]">
            {display}
          </span>
        ) : (
          <p
            className={clsx(
              'text-base leading-snug',
              empty
                ? 'font-normal text-[var(--books-text-tertiary,#9ca3af)]'
                : 'font-semibold text-[var(--books-text-primary,#111827)]'
            )}
          >
            {display}
          </p>
        )}
      </div>
    </div>
  )
}

export function BooksSidebarCardTitle({ title, icon: Icon }: { title: string; icon?: LucideIcon }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--books-text-secondary,#6b7280)]">
      {Icon ? (
        <Icon className="h-4 w-4 shrink-0 text-[var(--books-orange-text,#f97316)]" aria-hidden />
      ) : null}
      {title}
    </h3>
  )
}
