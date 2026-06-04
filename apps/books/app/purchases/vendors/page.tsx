'use client'

import { Users, Wallet, Receipt, FileText } from 'lucide-react'
import BooksPurchasesListShell from '../_components/BooksPurchasesListShell'

export default function VendorsPage() {
  return (
    <BooksPurchasesListShell
      kpis={[
        { title: 'All Vendors', value: 0, subtitle: 'No vendors', icon: Users, colorScheme: 'orange' },
        { title: 'Outstanding', value: 0, subtitle: '₹0 payables', icon: Wallet, colorScheme: 'orange' },
        { title: 'Bills', value: 0, subtitle: 'No bills', icon: FileText, colorScheme: 'orange' },
        { title: 'Expenses', value: 0, subtitle: 'No expenses', icon: Receipt, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Vendors', count: 0 },
        { key: 'payables', label: 'With Payables', count: 0 },
        { key: 'credits', label: 'With Credits', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'name', label: 'NAME' },
        { key: 'company', label: 'COMPANY NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'WORK PHONE' },
        { key: 'payables', label: 'PAYABLES' },
        { key: 'unusedCredits', label: 'UNUSED CREDITS' },
      ]}
      data={[]}
      emptyIcon={Users}
      emptyTitle="No vendors found"
      emptyDescription="Add your first vendor to get started"
      addHref="/purchases/vendors/new"
      addLabel="Add Vendor"
    />
  )
}
