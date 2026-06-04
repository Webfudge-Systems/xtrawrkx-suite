'use client'

import type { LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '@webfudge/ui'

export type FintechMetricItem = {
  title: string
  value: string
  trendLabel: string
  trendDirection: 'up' | 'down'
  icon: LucideIcon
  /** First card in ref layout uses orange gradient */
  highlight?: boolean
}

export type FintechMetricsQuadProps = {
  items: FintechMetricItem[]
  className?: string
}

export function FintechMetricsQuad({ items, className }: FintechMetricsQuadProps) {
  const display = items.slice(0, 4)
  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={clsx(
        'overflow-hidden',
        className
      )}
    >
      <div className="grid h-full min-h-0 grid-cols-2 auto-rows-fr gap-x-6 gap-y-8 p-6 md:p-7">
        {display.map((item) => {
          const Icon = item.icon
          const up = item.trendDirection === 'up'
          return (
            <div
              key={item.title}
              className={clsx(
                'flex h-full min-h-0 flex-col',
                item.highlight &&
                  'rounded-2xl bg-gradient-to-br from-[#FF6B35] via-[#FF6B35] to-amber-500 p-5 text-white md:p-6'
              )}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <p
                  className={clsx(
                    'text-[11px] font-semibold uppercase tracking-[0.08em]',
                    item.highlight ? 'text-white/90' : 'text-[var(--books-text-secondary,#6b7280)]'
                  )}
                >
                  {item.title}
                </p>
                <Icon
                  className={clsx(
                    'h-5 w-5 shrink-0',
                    item.highlight ? 'text-white' : 'text-[var(--books-orange-text,#ea580c)]'
                  )}
                  aria-hidden
                />
              </div>
              <p
                className={clsx(
                  'text-2xl font-bold tracking-tight',
                  item.highlight ? 'text-white' : 'text-[var(--books-text-primary,#111827)]'
                )}
              >
                {item.value}
              </p>
              <p
                className={clsx(
                  'mt-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  item.highlight
                    ? up
                      ? 'bg-white/20 text-white'
                      : 'bg-white/15 text-white'
                    : up
                      ? 'bg-[var(--books-green-bg,rgba(16,185,129,0.1))] text-[var(--books-green,#059669)]'
                      : 'bg-red-500/15 text-red-600 dark:text-red-400'
                )}
              >
                {item.trendLabel}
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
