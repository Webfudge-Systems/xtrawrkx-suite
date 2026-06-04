'use client'

import { Calendar, Lock, Shield, Users } from 'lucide-react'
import BooksAccountantListShell from '../_components/BooksAccountantListShell'
import BooksChartPlaceholderCard from '../_components/BooksChartPlaceholderCard'

export default function TransactionLockingPage() {
  return (
    <BooksAccountantListShell
      kpis={[
        { title: 'Lock Rules', value: 0, subtitle: 'No rules', icon: Lock, colorScheme: 'orange' },
        { title: 'Locked Periods', value: 0, subtitle: 'None', icon: Calendar, colorScheme: 'orange' },
        { title: 'Overrides', value: 0, subtitle: 'None', icon: Shield, colorScheme: 'orange' },
        { title: 'Users', value: 0, subtitle: 'No activity', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All', count: 0 },
        { key: 'active', label: 'Active', count: 0 },
        { key: 'archived', label: 'Archived', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      topBlocks={
        <>
          <BooksChartPlaceholderCard title="Locks Over Time" />
          <BooksChartPlaceholderCard title="Recent Changes" />
        </>
      }
      columns={[
        { key: 'name', label: 'RULE' },
        { key: 'period', label: 'PERIOD' },
        { key: 'status', label: 'STATUS' },
        { key: 'createdAt', label: 'CREATED' },
        { key: 'updatedAt', label: 'UPDATED' },
      ]}
      data={[]}
      emptyIcon={Lock}
      emptyTitle="No transaction locks found"
      emptyDescription="Lock rules will appear here when configured"
      addHref="/accountant/transaction-locking/new"
      addLabel="Add Transaction Lock"
    />
  )
}
