'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { BANK_ACCOUNT_FORM_SECTIONS } from '@/app/_components/bankAccountFormConfig'
import { parseIndianCurrency } from '@/lib/formatCurrency'
import { useBooksBankAccountsStore } from '@/lib/mock-data/useBooksBankAccountsStore'

const BASE = '/banking'

export default function BooksBankAccountNewPage() {
  const router = useRouter()
  const { createAccount } = useBooksBankAccountsStore()

  const handleSubmitSuccess = useCallback(
    async (values: Record<string, string>) => {
      const balance = parseIndianCurrency(values.balance) ?? 0
      const status = values.status || 'manual'
      const created = createAccount({
        name: values.name,
        institution: values.institution,
        accountType: values.accountType || 'Bank',
        balance,
        status,
        lastSyncAt: status === 'connected' ? new Date().toISOString() : null,
      })
      router.replace(`${BASE}/${created.id}`)
    },
    [createAccount, router]
  )

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title="New Bank Account"
        subtitle="Connect a bank feed or add a manual cash account."
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Banking', href: BASE },
          { label: 'New' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        sections={BANK_ACCOUNT_FORM_SECTIONS}
        submitLabel="Create Account"
        redirectOnCancelHref={BASE}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </div>
  )
}
