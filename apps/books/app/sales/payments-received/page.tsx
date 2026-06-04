'use client'

import { CreditCard, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksSalesListShell from '../_components/BooksSalesListShell'

export default function PaymentsReceivedPage() {
  return (
    <BooksSalesListShell
      title="Payments Received"
      subtitle="Track customer payments and settlements."
      kpis={[
        { title: 'All Payments', value: 0, subtitle: 'No payments', icon: CreditCard, colorScheme: 'orange' },
        { title: 'This Month', value: 0, subtitle: '₹0 collected', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Invoices', value: 0, subtitle: 'No matches', icon: Receipt, colorScheme: 'orange' },
        { title: 'Customers', value: 0, subtitle: 'No activity', icon: Users, colorScheme: 'orange' },
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
        { key: 'customer', label: 'CUSTOMER' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={CreditCard}
      emptyTitle="No payments found"
      emptyDescription="Payments will appear here when recorded"
      addHref="/sales/payments-received/new"
      addLabel="Add Payment"
    />
  )
}
