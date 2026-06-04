'use client'

import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '@webfudge/ui'

export type BooksQuickAction = {
  id: string
  title: string
  description?: string
  icon: LucideIcon
  onAction: () => void
}

export type BooksQuickActionsCardProps = {
  title?: string
  subtitle?: string
  actions: BooksQuickAction[]
  className?: string
}

export function BooksQuickActionsCard({
  title = 'Quick actions',
  subtitle = 'Jump to key areas',
  actions,
  className,
}: BooksQuickActionsCardProps) {
  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={clsx('flex min-h-0 flex-col overflow-hidden', className)}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6 md:p-7">
        <div className="shrink-0">
          <h2 className="text-base font-semibold tracking-tight text-[var(--books-text-primary,#1A1A1A)]">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-xs font-medium text-[var(--books-text-secondary,#6b7280)]">{subtitle}</p>
          ) : null}
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onAction}
              className={clsx(
                'group flex min-h-[5.5rem] w-full flex-col items-start gap-3 rounded-xl bg-[var(--books-bg-elevated,#f9fafb)] p-4 text-left',
                'transition-all duration-200 hover:bg-[var(--books-surface-muted,#f3f4f6)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35]/25'
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--books-orange-bg)] text-[var(--books-orange-text,#ea580c)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-[var(--books-text-primary,#1A1A1A)]">
                  {action.title}
                </span>
                {action.description ? (
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--books-text-secondary,#6b7280)]">
                    {action.description}
                  </span>
                ) : null}
              </span>
              <span className="mt-auto flex w-full items-center justify-end text-[11px] font-semibold text-[var(--books-text-tertiary,#9ca3af)] transition-colors group-hover:text-[#FF6B35]">
                Open
                <ChevronRight className="ml-0.5 h-4 w-4" aria-hidden />
              </span>
            </button>
          )
        })}
        </div>
      </div>
    </Card>
  )
}
