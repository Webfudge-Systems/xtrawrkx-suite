'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StackedBankCards } from '@webfudge/ui/book-components'
import type { BankCardDisplay } from '@webfudge/ui/book-components'
import BooksAddBankModal from '@/app/_components/BooksAddBankModal'
import { useBooksBankAccountsStore } from '@/lib/mock-data/useBooksBankAccountsStore'
import { mapBankAccountsToWalletCards } from '@/lib/wallet/mapBankAccountsToWalletCards'

type BooksWalletPanelProps = {
  className?: string
  title?: string
}

export default function BooksWalletPanel({ className, title = 'My Wallet' }: BooksWalletPanelProps) {
  const router = useRouter()
  const { accounts, createAccount } = useBooksBankAccountsStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeCardId, setActiveCardId] = useState<string | null>(null)

  const cards = useMemo(() => mapBankAccountsToWalletCards(accounts), [accounts])

  const handleAddSubmit = useCallback(
    (values: {
      name: string
      institution: string
      accountType: string
      balance: number
      status: string
    }) => {
      setSaving(true)
      try {
        const created = createAccount({
          name: values.name,
          institution: values.institution,
          accountType: values.accountType,
          balance: values.balance,
          status: values.status,
          lastSyncAt: values.status === 'connected' ? new Date().toISOString() : null,
        })
        setActiveCardId(String(created.id))
        setShowAddModal(false)
      } finally {
        setSaving(false)
      }
    },
    [createAccount]
  )

  const handleCardSelect = useCallback(
    (card: BankCardDisplay) => {
      router.push(`/banking/${card.id}`)
    },
    [router]
  )

  return (
    <>
      <StackedBankCards
        className={className}
        title={title}
        cards={cards}
        showCardIcon
        addNewLabel="Add new"
        activeCardId={activeCardId}
        onAddNew={() => setShowAddModal(true)}
        onCardSelect={handleCardSelect}
      />

      <BooksAddBankModal
        isOpen={showAddModal}
        saving={saving}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
      />
    </>
  )
}
