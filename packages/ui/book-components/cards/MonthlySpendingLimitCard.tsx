'use client'

import { useEffect, useId, useState } from 'react'
import { clsx } from 'clsx'
import { Card } from '@webfudge/ui'
import { Pencil, TrendingUp } from 'lucide-react'

export type MonthlySpendingLimitCardProps = {
  title?: string
  subtitle?: string
  spent: number
  limit: number
  spentLabel: string
  limitLabel: string
  className?: string
  onSetLimitClick?: () => void
  onEditLimitClick?: () => void
}

const SEGMENT_COUNT = 40
const RING_CX = 50
const RING_CY = 50
const RING_INNER = 35
const RING_OUTER = 44
const TICK_WIDTH = 2.75
/** 12 o'clock, progresses clockwise */
const RING_START = -Math.PI / 2

function activeSegmentCount(pct: number, hasLimit: boolean) {
  if (!hasLimit) return 0
  return Math.min(SEGMENT_COUNT, Math.max(0, Math.round((pct / 100) * SEGMENT_COUNT)))
}

function SegmentedProgressRing({
  uid,
  hasLimit,
  animatedPct,
  overBudget,
}: {
  uid: string
  hasLimit: boolean
  animatedPct: number
  overBudget: boolean
}) {
  const filled = activeSegmentCount(animatedPct, hasLimit)
  const activeColor = overBudget ? '#ef4444' : '#f97316'
  const idleColor = 'var(--books-border, rgba(148,163,184,0.38))'

  return (
    <>
      <circle
        cx={RING_CX}
        cy={RING_CY}
        r={RING_INNER - 5}
        fill="none"
        stroke="var(--books-orange-bg, rgba(234,88,12,0.14))"
        strokeWidth={1}
      />
      {Array.from({ length: SEGMENT_COUNT }, (_, index) => {
        const angle = RING_START + (index / SEGMENT_COUNT) * Math.PI * 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const x1 = RING_CX + RING_INNER * cos
        const y1 = RING_CY + RING_INNER * sin
        const x2 = RING_CX + RING_OUTER * cos
        const y2 = RING_CY + RING_OUTER * sin
        const isFilled = hasLimit && index < filled

        return (
          <line
            key={`${uid}-seg-${index}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isFilled ? activeColor : idleColor}
            strokeWidth={TICK_WIDTH}
            strokeLinecap="round"
            className="transition-[stroke] duration-500 ease-out"
          />
        )
      })}
    </>
  )
}

export function MonthlySpendingLimitCard({
  title = 'Spending Overview',
  subtitle = 'Track spend against your monthly cap',
  spent,
  limit,
  spentLabel,
  limitLabel,
  className,
  onSetLimitClick,
  onEditLimitClick,
}: MonthlySpendingLimitCardProps) {
  const uid = useId().replace(/:/g, '')
  const hasLimit = limit > 0
  const pctRaw = hasLimit ? (spent / limit) * 100 : 0
  const pct = Math.min(100, Math.max(0, pctRaw))
  const overBudget = hasLimit && spent > limit
  const remaining = Math.max(0, limit - spent)

  const remainingLabel = hasLimit
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(remaining)
    : null

  const [animatedPct, setAnimatedPct] = useState(0)

  useEffect(() => {
    const target = hasLimit ? pct : 0
    const frame = requestAnimationFrame(() => setAnimatedPct(target))
    return () => cancelAnimationFrame(frame)
  }, [hasLimit, pct])

  const centerPrimary = hasLimit
    ? overBudget
      ? `${Math.round(pctRaw)}%`
      : `${Math.round(pct)}%`
    : spentLabel
  const centerSecondary = hasLimit
    ? overBudget
      ? 'Over monthly cap'
      : 'Budget used'
    : 'Spent this month'

  const openLimitEditor = onEditLimitClick ?? onSetLimitClick

  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={clsx(
        'relative flex h-full min-h-0 flex-col border border-[color:var(--books-border,rgba(0,0,0,0.06))]',
        className
      )}
    >
      <div className="flex h-full min-h-0 flex-col p-5">
        <div className="mb-2 flex shrink-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--books-text-primary,#111827)]">{title}</h2>
            {subtitle ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-[var(--books-text-secondary,#6b7280)]">{subtitle}</p>
            ) : null}
          </div>
          {hasLimit && openLimitEditor ? (
            <button
              type="button"
              onClick={openLimitEditor}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--books-text-tertiary,#9ca3af)] transition-colors hover:bg-[var(--books-bg-elevated,#f3f4f6)] hover:text-[var(--books-orange-text,#ea580c)]"
              aria-label="Edit monthly cap"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-1">
          <div className="relative mx-auto aspect-square w-full max-w-[156px]">
            <svg className="h-full w-full" viewBox="0 0 100 100" aria-hidden role="presentation">
              <SegmentedProgressRing
                uid={uid}
                hasLimit={hasLimit}
                animatedPct={overBudget ? 100 : animatedPct}
                overBudget={overBudget}
              />
            </svg>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
              <p
                className={clsx(
                  'font-bold leading-tight tabular-nums text-[var(--books-text-primary,#111827)]',
                  hasLimit ? 'text-2xl' : 'text-lg'
                )}
              >
                {centerPrimary}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-[var(--books-text-secondary,#6b7280)]">
                {centerSecondary}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-auto grid shrink-0 grid-cols-2 gap-2.5 pt-2">
          <div className="rounded-xl border border-[color:var(--books-border,rgba(0,0,0,0.06))] bg-[var(--books-bg-elevated,#f8fafc)] px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--books-text-secondary,#6b7280)]">
              Amount spent
            </p>
            <p className="mt-1 truncate text-base font-bold tabular-nums text-[var(--books-text-primary,#111827)]">
              {spentLabel}
            </p>
            {hasLimit ? (
              <span
                className={clsx(
                  'mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  overBudget
                    ? 'bg-red-500/15 text-red-500 dark:text-red-400'
                    : 'bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] text-[var(--books-orange-text,#ea580c)]'
                )}
              >
                {!overBudget ? <TrendingUp className="h-3 w-3" aria-hidden /> : null}
                {overBudget ? 'Over cap' : `${Math.round(pct)}% used`}
              </span>
            ) : (
              <span className="mt-1.5 inline-flex text-[10px] font-medium text-[var(--books-text-tertiary,#9ca3af)]">
                This month
              </span>
            )}
          </div>

          <div className="rounded-xl border border-[color:var(--books-border,rgba(0,0,0,0.06))] bg-[var(--books-bg-elevated,#f8fafc)] px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--books-text-secondary,#6b7280)]">
              Monthly limit
            </p>
            <p className="mt-1 truncate text-base font-bold tabular-nums text-[var(--books-text-primary,#111827)]">
              {hasLimit ? limitLabel : '—'}
            </p>
            {hasLimit ? (
              <button
                type="button"
                onClick={openLimitEditor}
                className="mt-1.5 inline-flex rounded-full bg-[var(--books-surface-muted,#e5e7eb)] px-2 py-0.5 text-[10px] font-semibold text-[var(--books-text-secondary,#6b7280)] transition-colors hover:bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] hover:text-[var(--books-orange-text,#ea580c)]"
              >
                {remainingLabel} left · Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={onSetLimitClick}
                className="mt-1.5 inline-flex rounded-full border border-dashed border-[color:var(--books-border,rgba(0,0,0,0.2))] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--books-orange-text,#ea580c)] transition-colors hover:border-orange-400/60 hover:bg-[var(--books-orange-bg,rgba(234,88,12,0.1))]"
              >
                Set limit
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
