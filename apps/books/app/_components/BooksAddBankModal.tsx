'use client'

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button, Input, Modal, Select } from '@webfudge/ui'
import { Landmark } from 'lucide-react'
import { parseIndianCurrency } from '@/lib/formatCurrency'

type BooksAddBankModalProps = {
  isOpen: boolean
  saving?: boolean
  onClose: () => void
  onSubmit: (values: {
    name: string
    institution: string
    accountType: string
    balance: number
    status: string
  }) => void
}

const INPUT_CLASS =
  'rounded-lg border-[color:var(--books-input-border,rgba(255,255,255,0.1))] bg-[var(--books-input-bg,#252830)] text-[var(--books-input-text,#f0f0f0)] shadow-sm placeholder:text-[var(--books-input-placeholder,#6b7280)] focus:border-orange-400/70 focus:ring-orange-500/25'

const SELECT_CLASS =
  'rounded-lg border-[color:var(--books-input-border,rgba(255,255,255,0.1))] bg-[var(--books-input-bg,#252830)] text-[var(--books-input-text,#f0f0f0)]'

const EMPTY_FORM = {
  name: '',
  institution: '',
  accountType: 'Bank',
  balance: '',
  status: 'manual',
}

export default function BooksAddBankModal({
  isOpen,
  saving = false,
  onClose,
  onSubmit,
}: BooksAddBankModalProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setForm(EMPTY_FORM)
    setError(null)
  }, [isOpen])

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      const name = form.name.trim()
      const institution = form.institution.trim()
      if (!name) {
        setError('Account name is required.')
        return
      }
      if (!institution) {
        setError('Bank / source is required.')
        return
      }
      const balance = parseIndianCurrency(form.balance) ?? 0
      if (!form.balance.trim()) {
        setError('Opening balance is required.')
        return
      }
      setError(null)
      onSubmit({
        name,
        institution,
        accountType: form.accountType,
        balance,
        status: form.status,
      })
    },
    [form, onSubmit]
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (saving) return
        onClose()
      }}
      title="Add Bank Account"
      size="md"
      theme="books"
      closeOnBackdrop={!saving}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-[color:var(--books-border,rgba(255,255,255,0.1))] bg-[var(--books-bg-elevated,#252830)] p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--books-orange-bg,rgba(234,88,12,0.12))] text-[var(--books-orange-text,#ea580c)]">
            <Landmark className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--books-text-primary,#f8fafc)]">
              Connect or add manually
            </p>
            <p className="mt-0.5 text-xs text-[var(--books-text-secondary,#9ca3af)]">
              New accounts appear in your wallet and Banking module.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 [&_label]:text-[var(--books-text-secondary,#9ca3af)]">
            <Input
              label="Account Name *"
              placeholder="HDFC Operating"
              value={form.name}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className={INPUT_CLASS}
              disabled={saving}
            />
          </div>
          <div className="[&_label]:text-[var(--books-text-secondary,#9ca3af)]">
            <Input
              label="Bank / Source *"
              placeholder="HDFC Bank"
              value={form.institution}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, institution: e.target.value }))
              }
              className={INPUT_CLASS}
              disabled={saving}
            />
          </div>
          <div className="[&_label]:text-[var(--books-text-secondary,#9ca3af)]">
            <Select
              label="Account Type"
              value={form.accountType}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setForm((prev) => ({ ...prev, accountType: e.target.value }))
              }
              className={SELECT_CLASS}
              disabled={saving}
              options={[
                { value: 'Bank', label: 'Bank' },
                { value: 'Cash', label: 'Cash' },
              ]}
            />
          </div>
          <div className="[&_label]:text-[var(--books-text-secondary,#9ca3af)]">
            <Input
              label="Opening Balance *"
              placeholder="₹12,50,000"
              value={form.balance}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setForm((prev) => ({ ...prev, balance: e.target.value }))
              }
              className={INPUT_CLASS}
              disabled={saving}
            />
          </div>
          <div className="[&_label]:text-[var(--books-text-secondary,#9ca3af)]">
            <Select
              label="Feed Status"
              value={form.status}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setForm((prev) => ({ ...prev, status: e.target.value }))
              }
              className={SELECT_CLASS}
              disabled={saving}
              options={[
                { value: 'connected', label: 'Connected' },
                { value: 'manual', label: 'Manual' },
              ]}
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm font-medium text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="muted"
            disabled={saving}
            className="!border-0 !bg-[var(--books-bg-card,#1f2937)] !text-[var(--books-text-secondary,#9ca3af)] !shadow-none hover:!bg-[var(--books-surface-muted,#2a2e38)] hover:!text-[var(--books-text-primary,#f8fafc)]"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving} className="min-w-[9rem] rounded-xl py-2.5">
            {saving ? 'Adding…' : 'Add Bank'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
