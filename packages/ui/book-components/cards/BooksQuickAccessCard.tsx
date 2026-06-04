'use client'

import type { LucideIcon } from 'lucide-react'
import { Loader2, Target } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '@webfudge/ui'

export type BooksQuickAccessShortcut = {
  id: string
  title: string
  count: number
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
}

export type BooksQuickAccessCardProps = {
  title?: string
  subtitle?: string
  shortcuts: BooksQuickAccessShortcut[]
  loading?: boolean
  className?: string
}

const shortcutButtonClass = clsx(
  'group min-h-0 rounded-2xl border p-3 text-left transition-all duration-200 sm:p-3.5',
  'border-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-elevated,#f9fafb)]',
  'hover:border-orange-300/80 hover:bg-[var(--books-orange-bg,rgba(234,88,12,0.08))] hover:shadow-md',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/35',
  'dark:border-[color:var(--books-border,rgba(255,255,255,0.1))] dark:bg-[var(--books-bg-elevated,#252830)]',
  'dark:hover:border-orange-500/40 dark:hover:bg-[var(--books-orange-bg,rgba(234,88,12,0.12))]'
)

export function BooksQuickAccessCard({
  title = 'Quick Access',
  subtitle = 'Navigate to key sections',
  shortcuts,
  loading = false,
  className,
}: BooksQuickAccessCardProps) {
  const display = shortcuts.slice(0, 6)

  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={clsx(
        'flex min-h-0 flex-col overflow-hidden border border-[color:var(--books-border,rgba(0,0,0,0.06))]',
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--books-border,rgba(0,0,0,0.06))] px-5 py-4 md:px-6">
        <div>
          <h2 className="text-base font-semibold text-[var(--books-text-primary,#111827)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--books-text-secondary,#6b7280)]">{subtitle}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--books-orange-bg,rgba(234,88,12,0.1))] text-[var(--books-orange-text,#ea580c)]">
          <Target className="h-4 w-4" aria-hidden />
        </span>
      </div>

      <div className="min-h-0 flex-1 p-4 md:p-5">
        <div className="grid h-full grid-cols-2 grid-rows-3 gap-3">
          {display.map((shortcut) => {
            const IconComponent = shortcut.icon
            return (
              <button
                key={shortcut.id}
                type="button"
                onClick={() => {
                  if (shortcut.disabled) return
                  shortcut.onClick()
                }}
                disabled={shortcut.disabled}
                className={clsx(
                  shortcutButtonClass,
                  shortcut.disabled && 'cursor-not-allowed opacity-50 hover:shadow-none'
                )}
              >
                <div className="flex h-full min-h-0 flex-col items-center justify-center gap-1.5 text-center sm:gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-200/80 bg-[var(--books-bg-card,#ffffff)] shadow-sm sm:h-10 sm:w-10 dark:border-orange-500/30 dark:bg-[var(--books-bg-card,#1e2128)]">
                    <IconComponent
                      className="h-4 w-4 text-[var(--books-orange-text,#ea580c)] sm:h-[18px] sm:w-[18px]"
                      aria-hidden
                    />
                  </span>
                  <span className="line-clamp-1 text-[11px] font-semibold text-[var(--books-text-secondary,#6b7280)] group-hover:text-[var(--books-text-primary,#111827)] sm:text-xs">
                    {shortcut.title}
                  </span>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--books-orange-text,#ea580c)] sm:h-5 sm:w-5" aria-hidden />
                  ) : (
                    <>
                      <span className="text-xl font-bold tracking-tight text-[var(--books-text-primary,#111827)] sm:text-2xl">
                        {shortcut.count.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--books-text-tertiary,#9ca3af)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--books-orange-text,#ea580c)]" aria-hidden />
                        Total items
                      </span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
