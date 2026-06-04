'use client'

import { Calendar, FileText, Repeat, Users } from 'lucide-react'
import BooksPurchasesListShell from '../_components/BooksPurchasesListShell'

export default function RecurringBillsPage() {
  return (
    <BooksPurchasesListShell
      kpis={[
        { title: 'All Recurring', value: 0, subtitle: 'No recurring bills', icon: Repeat, colorScheme: 'orange' },
        { title: 'Active', value: 0, subtitle: 'No active', icon: FileText, colorScheme: 'orange' },
        { title: 'Next Due', value: 0, subtitle: 'No schedules', icon: Calendar, colorScheme: 'orange' },
        { title: 'Vendors', value: 0, subtitle: 'No vendors', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All', count: 0 },
        { key: 'active', label: 'Active', count: 0 },
        { key: 'paused', label: 'Paused', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'name', label: 'NAME' },
        { key: 'vendor', label: 'VENDOR' },
        { key: 'frequency', label: 'FREQUENCY' },
        { key: 'nextDate', label: 'NEXT DATE' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={Repeat}
      emptyTitle="No recurring bills found"
      emptyDescription="Set up recurring bills to automate entries"
      addHref="/purchases/recurring-bills/new"
      addLabel="Add Recurring Bill"
    />
  )
}
