'use client'

import { Calendar, Receipt, Repeat, Users } from 'lucide-react'
import BooksSalesListShell from '../_components/BooksSalesListShell'

export default function RecurringInvoicesPage() {
  return (
    <BooksSalesListShell
      title="Recurring Invoices"
      subtitle="Automate recurring billing cycles."
      kpis={[
        { title: 'All Recurring', value: 0, subtitle: 'No recurring invoices', icon: Repeat, colorScheme: 'orange' },
        { title: 'Active', value: 0, subtitle: 'No active', icon: Receipt, colorScheme: 'orange' },
        { title: 'Next Due', value: 0, subtitle: 'No schedules', icon: Calendar, colorScheme: 'orange' },
        { title: 'Customers', value: 0, subtitle: 'No activity', icon: Users, colorScheme: 'orange' },
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
        { key: 'customer', label: 'CUSTOMER' },
        { key: 'frequency', label: 'FREQUENCY' },
        { key: 'nextDate', label: 'NEXT DATE' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={Repeat}
      emptyTitle="No recurring invoices found"
      emptyDescription="Set up recurring invoices to automate billing"
      addHref="/sales/recurring-invoices/new"
      addLabel="Add Recurring Invoice"
    />
  )
}
