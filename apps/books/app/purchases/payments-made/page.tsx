'use client'

import { CreditCard, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksPurchasesListShell from '../_components/BooksPurchasesListShell'

export default function PaymentsMadePage() {
  return (
    <BooksPurchasesListShell
      kpis={[
        { title: 'All Payments', value: 0, subtitle: 'No payments', icon: CreditCard, colorScheme: 'orange' },
        { title: 'This Month', value: 0, subtitle: '₹0 paid', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Bills', value: 0, subtitle: 'No bills', icon: Receipt, colorScheme: 'orange' },
        { title: 'Vendors', value: 0, subtitle: 'No vendors', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Payments', count: 0 },
        { key: 'cleared', label: 'Cleared', count: 0 },
        { key: 'pending', label: 'Pending', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'number', label: 'PAYMENT#' },
        { key: 'vendor', label: 'VENDOR' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={CreditCard}
      emptyTitle="No payments found"
      emptyDescription="Payments will appear here when recorded"
      addHref="/purchases/payments-made/new"
      addLabel="Add Payment"
    />
  )
}
