'use client'

import { useMemo, useState } from 'react'
import { MonthlySpendingLimitCard } from '@webfudge/ui/book-components'
import BooksSetSpendLimitModal from '@/app/_components/BooksSetSpendLimitModal'
import { formatKpiIndianCurrency } from '@/lib/formatCurrency'
import { sumExpenseAmountInMonth } from '@/lib/home/dashboardMetrics'
import { useBooksMonthlySpendLimit } from '@/lib/home/useBooksMonthlySpendLimit'
import { useBooksExpensesStore } from '@/lib/mock-data/purchases/stores'

type BooksSpendingOverviewPanelProps = {
  className?: string
}

export default function BooksSpendingOverviewPanel({ className }: BooksSpendingOverviewPanelProps) {
  const { expenses } = useBooksExpensesStore()
  const { limit, setLimit, clearLimit, hasLimit } = useBooksMonthlySpendLimit()
  const [showLimitModal, setShowLimitModal] = useState(false)

  const spentThisMonth = useMemo(() => {
    const now = new Date()
    return sumExpenseAmountInMonth(expenses, now.getFullYear(), now.getMonth())
  }, [expenses])

  return (
    <>
      <MonthlySpendingLimitCard
        className={className}
        spent={spentThisMonth}
        limit={limit}
        spentLabel={formatKpiIndianCurrency(spentThisMonth)}
        limitLabel={hasLimit ? formatKpiIndianCurrency(limit) : '—'}
        onSetLimitClick={() => setShowLimitModal(true)}
        onEditLimitClick={() => setShowLimitModal(true)}
      />

      <BooksSetSpendLimitModal
        isOpen={showLimitModal}
        currentLimit={limit}
        spentThisMonth={spentThisMonth}
        onClose={() => setShowLimitModal(false)}
        onSave={(next) => {
          setLimit(next)
          setShowLimitModal(false)
        }}
        onClear={clearLimit}
      />
    </>
  )
}
