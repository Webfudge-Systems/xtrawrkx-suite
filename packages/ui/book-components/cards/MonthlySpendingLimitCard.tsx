'use client'

import { useId } from 'react'
import { clsx } from 'clsx'
import { Card } from '@webfudge/ui'
import { MoreHorizontal } from 'lucide-react'

export type MonthlySpendingLimitCardProps = {
  title?: string
  subtitle?: string
  spent: number
  limit: number
  spentLabel: string
  limitLabel: string
  className?: string
}

const SEGMENT_COUNT = 24
const CX = 100
const CY = 90
const INNER_R = 46
const OUTER_R = 84

function segmentPath(index: number, total: number) {
  const startAngle = Math.PI * (1 - index / total)
  const endAngle = Math.PI * (1 - (index + 1) / total)
  const x1o = CX + OUTER_R * Math.cos(startAngle)
  const y1o = CY - OUTER_R * Math.sin(startAngle)
  const x2o = CX + OUTER_R * Math.cos(endAngle)
  const y2o = CY - OUTER_R * Math.sin(endAngle)
  const x1i = CX + INNER_R * Math.cos(endAngle)
  const y1i = CY - INNER_R * Math.sin(endAngle)
  const x2i = CX + INNER_R * Math.cos(startAngle)
  const y2i = CY - INNER_R * Math.sin(startAngle)
  return `M ${x1o} ${y1o} A ${OUTER_R} ${OUTER_R} 0 0 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${INNER_R} ${INNER_R} 0 0 0 ${x2i} ${y2i} Z`
}

export function MonthlySpendingLimitCard({
  title = 'Spending Overview',
  subtitle = 'Track spend against your monthly cap',
  spent,
  limit,
  spentLabel,
  limitLabel,
  className,
}: MonthlySpendingLimitCardProps) {
  const uid = useId().replace(/:/g, '')
  const pctRaw = limit > 0 ? (spent / limit) * 100 : 0
  const pct = Math.min(100, Math.max(0, pctRaw))
  const overBudget = limit > 0 && spent > limit
  const filledSegments = Math.round((pct / 100) * SEGMENT_COUNT)
  const pctDisplay = limit > 0 ? `${pct.toFixed(1)}%` : '—'
  const remaining = Math.max(0, limit - spent)
  const remainingLabel =
    limit > 0
      ? new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(remaining)
      : '—'

  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={clsx(
        'relative flex min-h-0 flex-col overflow-hidden border border-[color:var(--books-border,rgba(0,0,0,0.06))]',
        className
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col p-5 md:p-6">
        <div className="mb-3 flex shrink-0 items-start justify-between gap-2 border-b border-[color:var(--books-border,rgba(0,0,0,0.06))] pb-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-[var(--books-text-primary,#111827)]">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-xs font-medium text-[var(--books-text-secondary,#6b7280)]">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-elevated,#f9fafb)] text-[var(--books-text-tertiary,#9ca3af)] transition-colors hover:bg-[var(--books-surface-muted,#f3f4f6)] hover:text-[var(--books-text-secondary,#6b7280)]"
            aria-label="Spending options"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="relative mx-auto flex min-h-0 w-full max-w-[280px] flex-1 flex-col items-center justify-center py-1">
          <svg viewBox="0 0 200 100" className="h-auto w-full max-h-[152px] min-h-[130px]" aria-hidden role="presentation">
            <defs>
              <linearGradient id={`msl-seg-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
            {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
              const filled = i < filledSegments
              const isEdge = filled && (i === filledSegments - 1 || i === 0)
              return (
                <path
                  key={i}
                  d={segmentPath(i, SEGMENT_COUNT)}
                  fill={
                    overBudget && filled
                      ? '#ef4444'
                      : filled
                        ? `url(#msl-seg-grad-${uid})`
                        : 'var(--books-border, rgba(148,163,184,0.25))'
                  }
                  opacity={filled ? (isEdge ? 1 : 0.92 - (i / SEGMENT_COUNT) * 0.35) : 1}
                  className="transition-all duration-500"
                />
              )
            })}
          </svg>

          <div className="pointer-events-none absolute inset-x-0 top-[36%] flex flex-col items-center text-center">
            <p className="text-[1.9rem] font-bold leading-none tracking-tight text-[var(--books-text-primary,#111827)] sm:text-[2.15rem]">
              {pctDisplay}
            </p>
            <p className="mt-1 text-xs font-medium text-[var(--books-text-secondary,#6b7280)]">
              {overBudget ? 'Over budget' : limit > 0 ? 'Budget used' : 'No limit set'}
            </p>
          </div>
        </div>

        <div className="mt-3 grid shrink-0 grid-cols-2 gap-3">
          <div className="rounded-xl border border-[color:var(--books-border,rgba(0,0,0,0.06))] bg-[var(--books-bg-elevated,#f8fafc)] px-3 py-3 dark:bg-[var(--books-bg-elevated,#252830)]">
            <p className="text-[11px] font-medium text-[var(--books-text-secondary,#6b7280)]">Amount spent</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold tracking-tight text-[var(--books-text-primary,#111827)]">{spentLabel}</p>
              {limit > 0 ? (
                <span
                  className={clsx(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold text-white',
                    overBudget ? 'bg-red-500' : 'bg-[#ea580c]'
                  )}
                >
                  {overBudget ? '↑ Over' : `${Math.round(pct)}%`}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-[color:var(--books-border,rgba(0,0,0,0.06))] bg-[var(--books-bg-elevated,#f8fafc)] px-3 py-3 dark:bg-[var(--books-bg-elevated,#252830)]">
            <p className="text-[11px] font-medium text-[var(--books-text-secondary,#6b7280)]">Monthly limit</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold tracking-tight text-[var(--books-text-primary,#111827)]">{limitLabel}</p>
              {limit > 0 ? (
                <span className="rounded-full bg-[var(--books-text-primary,#374151)] px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-[var(--books-surface-muted,#3a3d45)]">
                  {remainingLabel} left
                </span>
              ) : (
                <span className="rounded-full bg-[var(--books-surface-muted,#e5e7eb)] px-2 py-0.5 text-[10px] font-semibold text-[var(--books-text-secondary,#6b7280)] dark:bg-[var(--books-bg-elevated,#252830)]">
                  Set limit
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
