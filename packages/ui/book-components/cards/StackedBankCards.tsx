'use client'

import { useCallback, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { ChevronLeft, ChevronRight, CreditCard, Plus } from 'lucide-react'
import { Button, Card } from '@webfudge/ui'

export type BankCardDisplay = {
  id: string
  bankName: string
  maskedNumber: string
  expiry: string
  gradientClassName: string
}

export type StackedBankCardsProps = {
  title?: string
  cards?: BankCardDisplay[]
  className?: string
  showCardIcon?: boolean
  addNewLabel?: string
  onAddNew?: () => void
}

const DEFAULT_CARDS: BankCardDisplay[] = [
  {
    id: '1',
    bankName: 'Sunrise Bank',
    maskedNumber: '•••• •••• 6782',
    expiry: '09/27',
    gradientClassName: 'bg-gradient-to-br from-orange-500 via-orange-400 to-amber-400',
  },
  {
    id: '2',
    bankName: 'Coastal Credit',
    maskedNumber: '•••• •••• 4410',
    expiry: '03/26',
    gradientClassName: 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950',
  },
  {
    id: '3',
    bankName: 'Harbor Finance',
    maskedNumber: '•••• •••• 9921',
    expiry: '12/28',
    gradientClassName: 'bg-gradient-to-br from-indigo-400 via-blue-400 to-sky-300',
  },
]

const NAV_BTN_CLASS = clsx(
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
  'border-[color:var(--books-border-em,rgba(0,0,0,0.15))] bg-[var(--books-bg-elevated,#f3f4f6)]',
  'text-[var(--books-text-primary,#374151)] shadow-sm',
  'transition-colors hover:border-orange-300 hover:bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] hover:text-[#ea580c]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40',
  'dark:border-white/15 dark:bg-[var(--books-bg-elevated,#252830)] dark:text-[var(--books-text-primary,#f0f0f0)]'
)

function stackClasses(position: number) {
  switch (position) {
    case 0:
      return 'z-30 left-0 w-full opacity-100'
    case 1:
      return 'z-20 left-5 w-[calc(100%-1.25rem)] scale-[0.96] opacity-95 sm:left-6'
    default:
      return 'z-10 left-10 w-[calc(100%-2.5rem)] scale-[0.92] opacity-90 sm:left-12'
  }
}

function MastercardMark({ className }: { className?: string }) {
  return (
    <div className={clsx('relative h-8 w-11 shrink-0', className)} aria-hidden>
      <span className="absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white/95" />
      <span className="absolute left-3.5 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-white/75" />
    </div>
  )
}

export function StackedBankCards({
  title = 'My Wallet',
  cards = DEFAULT_CARDS,
  className,
  showCardIcon = false,
  addNewLabel = 'Add new',
  onAddNew,
}: StackedBankCardsProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + cards.length) % cards.length)
  }, [cards.length])

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % cards.length)
  }, [cards.length])

  const ordered = useMemo(() => {
    return cards.map((card, i) => {
      const position = (i - activeIndex + cards.length) % cards.length
      return { card, position }
    })
  }, [cards, activeIndex])

  return (
    <Card
      variant="elevated"
      padding={false}
      surface="books"
      className={clsx(
        'flex h-full min-h-0 flex-col border border-[color:var(--books-border,rgba(0,0,0,0.06))]',
        className
      )}
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[color:var(--books-border,rgba(0,0,0,0.06))] px-5 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {showCardIcon ? (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--books-orange-bg)] text-[var(--books-orange-text,#ea580c)]">
              <CreditCard className="h-4 w-4" aria-hidden />
            </span>
          ) : null}
          <h2 className="truncate text-base font-semibold text-[var(--books-text-primary,#111827)]">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {onAddNew ? (
            <Button
              type="button"
              variant="muted"
              size="sm"
              rounded="pill"
              className={clsx(
                'h-9 border border-[color:var(--books-border-em,rgba(0,0,0,0.12))]',
                'bg-[var(--books-bg-elevated,#f3f4f6)] px-2.5 text-[11px] font-semibold text-[var(--books-text-primary,#374151)]',
                'hover:border-orange-300 hover:bg-[var(--books-orange-bg)] hover:text-[#ea580c]',
                'dark:bg-[var(--books-bg-elevated,#252830)] dark:text-[var(--books-text-primary,#f0f0f0)]'
              )}
              onClick={onAddNew}
            >
              <Plus className="mr-0.5 h-3.5 w-3.5" aria-hidden />
              {addNewLabel}
            </Button>
          ) : null}
          <button type="button" className={NAV_BTN_CLASS} onClick={goPrev} aria-label="Previous card">
            <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <button type="button" className={NAV_BTN_CLASS} onClick={goNext} aria-label="Next card">
            <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 py-3 pb-5 md:px-5">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="relative h-full w-full max-w-[340px]" style={{ maxHeight: '248px', minHeight: '200px' }}>
            {ordered.map(({ card, position }) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setActiveIndex(cards.findIndex((c) => c.id === card.id))}
                className={clsx(
                  'absolute top-1/2 origin-center -translate-y-1/2 text-left outline-none transition-all duration-300 ease-out',
                  'focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2',
                  stackClasses(position)
                )}
                aria-label={`${card.bankName}, ${card.maskedNumber}`}
                aria-current={position === 0 ? 'true' : undefined}
              >
                <div
                  className={clsx(
                    'relative aspect-[1.586/1] w-full max-h-[228px] min-h-[168px] overflow-hidden rounded-2xl border border-white/20 p-4 text-white shadow-[0_12px_32px_rgba(0,0,0,0.35)] ring-1 ring-white/10',
                    card.gradientClassName,
                    position === 0 && 'ring-2 ring-orange-400/40'
                  )}
                >
                  <div
                    className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/10"
                    aria-hidden
                  />

                  <div className="relative flex items-start justify-between gap-2">
                    <MastercardMark />
                    {position === 0 ? (
                      <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Active
                      </span>
                    ) : null}
                  </div>

                  <div className="relative mt-5 space-y-1.5 sm:mt-6">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/75">Bank</p>
                    <p className="text-base font-bold leading-tight">{card.bankName}</p>
                    <p className="font-mono text-sm tracking-[0.12em] text-white/95">{card.maskedNumber}</p>
                    <div className="pt-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/75">Valid thru</p>
                      <p className="text-sm font-semibold">{card.expiry}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 flex shrink-0 justify-center gap-1.5">
          {cards.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                i === activeIndex
                  ? 'w-6 bg-[var(--books-brand,#ea580c)]'
                  : 'w-2 bg-[var(--books-border-em,rgba(0,0,0,0.2))] hover:bg-[var(--books-text-tertiary,#9ca3af)]'
              )}
              aria-label={`Show card ${i + 1}`}
              aria-current={i === activeIndex}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

export default StackedBankCards
