'use client'

import { useId, useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, ChevronDown, MoreHorizontal } from 'lucide-react'
import { clsx } from 'clsx'
import { Button, Card } from '@webfudge/ui'

export type TotalBalanceWallet = {
  code: string
  balanceLabel: string
  /** Full amount for native tooltip when display uses compact notation */
  balanceTitle?: string
  limitLabel?: string
  active?: boolean
}

export type TotalBalanceCardProps = {
  title?: string
  balanceLabel: string
  /** Native tooltip when balance uses compact Lakh/Crore notation */
  balanceTitle?: string
  currencyLabel?: string
  trendLabel?: string
  trendPositive?: boolean
  walletsTitle?: string
  wallets?: TotalBalanceWallet[]
  showWallets?: boolean
  onTransfer?: () => void
  onRequest?: () => void
  transferLabel?: string
  requestLabel?: string
  className?: string
  /** Called when the user picks a currency from the header selector */
  onCurrencyChange?: (code: string) => void
}

const DEFAULT_WALLETS: TotalBalanceWallet[] = [
  { code: 'INR', balanceLabel: '—', limitLabel: 'Primary', active: true },
  { code: 'USD', balanceLabel: '—', limitLabel: 'Operating', active: true },
  { code: 'EUR', balanceLabel: '—', limitLabel: 'Savings', active: false },
]

export function TotalBalanceCard({
  title = 'Total Balance',
  balanceLabel,
  balanceTitle,
  currencyLabel = 'INR',
  trendLabel,
  trendPositive = true,
  walletsTitle = 'Wallets',
  wallets = DEFAULT_WALLETS,
  showWallets = true,
  onTransfer,
  onRequest,
  transferLabel = 'Transfer',
  requestLabel = 'Request',
  className,
  onCurrencyChange,
}: TotalBalanceCardProps) {
  const currencySelectId = useId()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const currencyOptions = useMemo(() => {
    const codes = wallets.map((w) => w.code)
    if (codes.length) return Array.from(new Set(codes))
    return [currencyLabel]
  }, [wallets, currencyLabel])

  const [selectedCode, setSelectedCode] = useState(() => currencyLabel)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const resolvedCurrencyCode = useMemo(() => {
    if (currencyOptions.includes(selectedCode)) return selectedCode
    return currencyOptions[0] ?? currencyLabel
  }, [currencyOptions, selectedCode, currencyLabel])

  const selectedWallet = useMemo(
    () => wallets.find((x) => x.code === resolvedCurrencyCode),
    [wallets, resolvedCurrencyCode]
  )

  const displayBalanceLabel = selectedWallet?.balanceLabel ?? balanceLabel
  const displayBalanceTitle = selectedWallet?.balanceTitle ?? balanceTitle

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
      <div className="flex min-h-0 flex-1 flex-col space-y-5 overflow-auto p-6 md:p-7">
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--books-border,rgba(0,0,0,0.06))] pb-4">
          <p className="text-sm font-semibold text-[var(--books-text-primary,#1a1a1a)]">{title}</p>
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              id={currencySelectId}
              type="button"
              aria-haspopup="listbox"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((o) => !o)}
              onBlur={(e) => {
                if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
                  setDropdownOpen(false)
                }
              }}
              className={clsx(
                'flex cursor-pointer items-center gap-1.5 rounded-full border py-1.5 pl-3 pr-2.5 text-xs font-semibold shadow-sm',
                'border-[color:var(--books-border,rgba(0,0,0,0.12))] bg-[var(--books-bg-elevated,#f5f5f5)] text-[var(--books-text-primary,#111827)]',
                'transition-colors duration-150 hover:border-orange-400/60 hover:bg-[var(--books-orange-bg,rgba(234,88,12,0.08))]',
                'focus:outline-none focus:ring-2 focus:ring-orange-500/25'
              )}
            >
              {resolvedCurrencyCode}
              <ChevronDown
                className={clsx(
                  'h-3.5 w-3.5 text-[var(--books-text-tertiary,#9ca3af)] transition-transform duration-150',
                  dropdownOpen && 'rotate-180'
                )}
                aria-hidden
              />
            </button>

            {dropdownOpen && currencyOptions.length > 1 && (
              <ul
                role="listbox"
                aria-labelledby={currencySelectId}
                className={clsx(
                  'absolute right-0 top-full z-50 mt-1 min-w-[6rem] overflow-hidden rounded-xl border py-1 shadow-lg',
                  'border-[color:var(--books-border,rgba(0,0,0,0.1))] bg-[var(--books-bg-card,#ffffff)]',
                  'shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
                )}
              >
                {currencyOptions.map((code) => (
                  <li
                    key={code}
                    role="option"
                    aria-selected={code === resolvedCurrencyCode}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setSelectedCode(code)
                      onCurrencyChange?.(code)
                      setDropdownOpen(false)
                    }}
                    className={clsx(
                      'cursor-pointer px-3 py-2 text-xs font-semibold transition-colors duration-100',
                      code === resolvedCurrencyCode
                        ? 'bg-[var(--books-orange-bg,rgba(234,88,12,0.1))] text-[var(--books-orange-text,#ea580c)]'
                        : 'text-[var(--books-text-primary,#111827)] hover:bg-[var(--books-bg-elevated,#f5f5f5)]'
                    )}
                  >
                    {code}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <p
            className="max-w-full truncate text-3xl font-bold tracking-tight text-[var(--books-text-primary,#1a1a1a)] sm:text-[2.35rem]"
            title={displayBalanceTitle}
          >
            {displayBalanceLabel}
          </p>
          {trendLabel ? (
            <p
              className={clsx(
                'mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                trendPositive
                  ? 'bg-[var(--books-green-bg,rgba(16,185,129,0.1))] text-[var(--books-green,#059669)]'
                  : 'bg-red-500/15 text-red-600 dark:text-red-400'
              )}
            >
              {trendLabel}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="primary"
            rounded="pill"
            className="flex-1 min-w-[7rem] bg-[var(--books-brand,#ea580c)] font-semibold text-white shadow-md hover:bg-[var(--books-brand-hover,#c2410c)] sm:flex-none"
            onClick={onTransfer}
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" aria-hidden />
            {transferLabel}
          </Button>
          <Button
            type="button"
            variant="muted"
            rounded="pill"
            className="flex-1 min-w-[7rem] border border-[color:var(--books-border,rgba(0,0,0,0.08))] bg-[var(--books-bg-elevated,#f9fafb)] font-semibold text-[var(--books-text-primary,#1a1a1a)] shadow-sm hover:border-orange-300/50 hover:bg-[var(--books-orange-bg,rgba(234,88,12,0.06))] dark:bg-[var(--books-bg-elevated,#252830)] sm:flex-none"
            onClick={onRequest}
          >
            <ArrowLeftRight className="mr-2 h-4 w-4 text-[#FF6B35]" aria-hidden />
            {requestLabel}
          </Button>
        </div>
      </div>

      {showWallets ? (
        <div className="shrink-0 border-t border-[color:var(--books-border,rgba(0,0,0,0.08))] px-6 py-5 md:px-7">
          <p className="mb-4 text-xs font-medium text-[var(--books-text-secondary,#6b7280)]">
            {walletsTitle}{' '}
            <span className="text-[var(--books-text-tertiary,#9ca3af)]">|</span> Total {wallets.length} wallets
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {wallets.map((w) => (
              <div
                key={w.code}
                className="min-w-[5.5rem] shrink-0 rounded-xl border border-[color:var(--books-border,rgba(0,0,0,0.06))] bg-[var(--books-bg-elevated,#f9fafb)] p-3 transition-colors duration-200 hover:border-orange-300/40 hover:bg-[var(--books-surface-muted,#f3f4f6)] dark:bg-[var(--books-bg-elevated)] dark:hover:bg-[var(--books-surface-muted)]"
              >
                <div className="mb-2 flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--books-text-secondary,#6b7280)]">
                    {w.code}
                  </span>
                  <button
                    type="button"
                    className="rounded-md p-0.5 text-[var(--books-text-tertiary,#9ca3af)] hover:bg-[var(--books-bg-elevated,#f3f4f6)] hover:text-[var(--books-text-primary,#111827)]"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                <p className="text-sm font-semibold text-[var(--books-text-primary,#111827)]">{w.balanceLabel}</p>
                {w.limitLabel ? (
                  <p className="mt-1 text-[10px] text-[var(--books-text-tertiary,#9ca3af)]">{w.limitLabel}</p>
                ) : null}
                <p
                  className={clsx(
                    'mt-2 text-[10px] font-semibold',
                    w.active ? 'text-[var(--books-green,#059669)]' : 'text-red-500 dark:text-red-400'
                  )}
                >
                  {w.active ? 'Active' : 'Inactive'}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  )
}
