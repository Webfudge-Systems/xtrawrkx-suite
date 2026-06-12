'use client'

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button, Input, Modal } from '@webfudge/ui'
import { Target } from 'lucide-react'
import { formatKpiIndianCurrencyFull, parseIndianCurrency } from '@/lib/formatCurrency'

type BooksSetSpendLimitModalProps = {
  isOpen: boolean
  currentLimit?: number
  spentThisMonth?: number
  onClose: () => void
  onSave: (limit: number) => void
  onClear?: () => void
}

const INPUT_CLASS =
  'rounded-lg border-[color:var(--books-input-border,rgba(255,255,255,0.1))] bg-[var(--books-input-bg,#252830)] text-[var(--books-input-text,#f0f0f0)] shadow-sm placeholder:text-[var(--books-input-placeholder,#6b7280)] focus:border-orange-400/70 focus:ring-orange-500/25'

export default function BooksSetSpendLimitModal({
  isOpen,
  currentLimit = 0,
  spentThisMonth = 0,
  onClose,
  onSave,
  onClear,
}: BooksSetSpendLimitModalProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValue(currentLimit > 0 ? String(currentLimit) : '')
    setError(null)
  }, [currentLimit, isOpen])

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      const limit = parseIndianCurrency(value)
      if (limit === null || limit <= 0) {
        setError('Enter a monthly cap greater than zero.')
        return
      }
      setError(null)
      onSave(limit)
    },
    [onSave, value]
  )

  const suggestFromSpend = spentThisMonth > 0 ? Math.max(Math.ceil(spentThisMonth * 1.2), 1000) : 50000

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentLimit > 0 ? 'Edit monthly cap' : 'Set monthly cap'}
      size="md"
      theme="books"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-[color:var(--books-border,rgba(255,255,255,0.1))] bg-[var(--books-bg-elevated,#252830)] p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] text-[var(--books-orange-text,#ea580c)]">
            <Target className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--books-text-primary,#f8fafc)]">
              Monthly spending cap
            </p>
            <p className="mt-0.5 text-xs text-[var(--books-text-secondary,#9ca3af)]">
              Spent this month: {formatKpiIndianCurrencyFull(spentThisMonth)}. Progress updates as you log expenses.
            </p>
          </div>
        </div>

        <div className="[&_label]:text-[var(--books-text-secondary,#9ca3af)]">
          <Input
            label="Monthly limit (INR) *"
            placeholder="₹50,000"
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
            className={INPUT_CLASS}
          />
        </div>

        <button
          type="button"
          className="text-xs font-semibold text-[var(--books-orange-text,#ea580c)] hover:underline"
          onClick={() => setValue(String(suggestFromSpend))}
        >
          Suggest {formatKpiIndianCurrencyFull(suggestFromSpend)} from current spend
        </button>

        {error ? (
          <p className="text-sm font-medium text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {currentLimit > 0 && onClear ? (
            <Button
              type="button"
              variant="muted"
              className="!border-0 !bg-transparent !text-red-400 !shadow-none hover:!text-red-300"
              onClick={() => {
                onClear()
                onClose()
              }}
            >
              Remove cap
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="muted"
              className="!border-0 !bg-[var(--books-bg-card,#1f2937)] !text-[var(--books-text-secondary,#9ca3af)] !shadow-none hover:!bg-[var(--books-surface-muted,#2a2e38)]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="min-w-[9rem] rounded-xl py-2.5">
              Save cap
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
