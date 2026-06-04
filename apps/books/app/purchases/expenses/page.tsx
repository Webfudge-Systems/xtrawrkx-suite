'use client'

import { Receipt, TrendingUp, Users, Wallet } from 'lucide-react'
import BooksPurchasesListShell from '../_components/BooksPurchasesListShell'

export default function ExpensesPage() {
  return (
    <BooksPurchasesListShell
      kpis={[
        { title: 'All Expenses', value: 0, subtitle: 'No expenses', icon: Receipt, colorScheme: 'orange' },
        { title: 'Billable', value: 0, subtitle: '₹0 billable', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Reimbursable', value: 0, subtitle: '₹0 reimbursable', icon: Wallet, colorScheme: 'orange' },
        { title: 'Vendors', value: 0, subtitle: 'No vendors', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Expenses', count: 0 },
        { key: 'billable', label: 'Billable', count: 0 },
        { key: 'reimbursable', label: 'Reimbursable', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'vendor', label: 'VENDOR' },
        { key: 'category', label: 'CATEGORY' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={Receipt}
      emptyTitle="No expenses found"
      emptyDescription="Expenses will appear here when recorded"
      addHref="/purchases/expenses/new"
      addLabel="Add Expense"
    />
  )
}
