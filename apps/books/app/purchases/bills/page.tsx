'use client'

import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksPurchasesListShell from '../_components/BooksPurchasesListShell'

export default function BillsPage() {
  return (
    <BooksPurchasesListShell
      kpis={[
        { title: 'All Bills', value: 0, subtitle: 'No bills', icon: FileText, colorScheme: 'orange' },
        { title: 'Unpaid', value: 0, subtitle: '₹0 unpaid', icon: Receipt, colorScheme: 'orange' },
        { title: 'Overdue', value: 0, subtitle: 'No overdue', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Vendors', value: 0, subtitle: 'No vendors', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Bills', count: 0 },
        { key: 'unpaid', label: 'Unpaid', count: 0 },
        { key: 'overdue', label: 'Overdue', count: 0 },
        { key: 'paid', label: 'Paid', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'number', label: 'BILL#' },
        { key: 'vendor', label: 'VENDOR' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={FileText}
      emptyTitle="No bills found"
      emptyDescription="Bills will appear here when recorded"
      addHref="/purchases/bills/new"
      addLabel="Add Bill"
    />
  )
}
