'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency } from '@webfudge/utils'
import BooksCrmAddEntityPage from '@/app/_components/BooksCrmAddEntityPage'
import BooksEntityPageHeader from '@/app/_components/BooksEntityPageHeader'
import { BANK_ACCOUNT_FORM_SECTIONS } from '@/app/_components/bankAccountFormConfig'
import { parseIndianCurrency } from '@/lib/formatCurrency'
import { useBooksBankAccountsStore } from '@/lib/mock-data/useBooksBankAccountsStore'

const BASE = '/banking'

function formatBalanceInput(amount: number) {
  return formatCurrency(amount, { currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function BooksBankAccountEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { getById, updateAccount } = useBooksBankAccountsStore()
  const account = getById(id)

  const initialValues = useMemo(() => {
    if (!account) return undefined
    return {
      name: account.name,
      institution: account.institution,
      accountType: account.accountType,
      balance: formatBalanceInput(account.balance),
      status: account.status,
    }
  }, [account])

  if (!account) {
    return (
      <div className="space-y-6">
        <BooksEntityPageHeader
          title="Account not found"
          breadcrumb={[
            { label: 'Dashboard', href: '/home' },
            { label: 'Banking', href: BASE },
            { label: 'Edit' },
          ]}
        />
        <p className="text-[var(--books-text-secondary,#9ca3af)]">Account not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BooksEntityPageHeader
        title={`Edit ${account.name}`}
        subtitle="Update account details and feed status."
        breadcrumb={[
          { label: 'Dashboard', href: '/home' },
          { label: 'Banking', href: BASE },
          { label: account.name, href: `${BASE}/${account.id}` },
          { label: 'Edit' },
        ]}
      />
      <BooksCrmAddEntityPage
        theme="books"
        embedded
        sections={BANK_ACCOUNT_FORM_SECTIONS}
        submitLabel="Update Account"
        redirectOnCancelHref={`${BASE}/${account.id}`}
        initialValues={initialValues}
        onSubmitSuccess={async (values) => {
          const balance = parseIndianCurrency(values.balance) ?? account.balance
          updateAccount(account.id, {
            name: values.name,
            institution: values.institution,
            accountType: values.accountType || account.accountType,
            balance,
            status: values.status || account.status,
          })
          router.replace(`${BASE}/${account.id}`)
        }}
      />
    </div>
  )
}
