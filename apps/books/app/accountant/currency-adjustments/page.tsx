'use client'

import { Banknote, FileText, TrendingUp, Users } from 'lucide-react'
import BooksAccountantListShell from '../_components/BooksAccountantListShell'
import BooksChartPlaceholderCard from '../_components/BooksChartPlaceholderCard'

export default function CurrencyAdjustmentsPage() {
  return (
    <BooksAccountantListShell
      kpis={[
        { title: 'All Adjustments', value: 0, subtitle: 'No adjustments', icon: Banknote, colorScheme: 'orange' },
        { title: 'Draft', value: 0, subtitle: 'No drafts', icon: FileText, colorScheme: 'orange' },
        { title: 'Posted', value: 0, subtitle: 'No posted', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Users', value: 0, subtitle: 'No activity', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All', count: 0 },
        { key: 'draft', label: 'Draft', count: 0 },
        { key: 'posted', label: 'Posted', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      topBlocks={
        <>
          <BooksChartPlaceholderCard title="Exchange Difference Trend" />
          <BooksChartPlaceholderCard title="Adjustments by Currency" />
        </>
      }
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'reference', label: 'REFERENCE' },
        { key: 'currency', label: 'CURRENCY' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={Banknote}
      emptyTitle="No currency adjustments found"
      emptyDescription="Currency adjustments will appear here when created"
      addHref="/accountant/currency-adjustments/new"
      addLabel="Add Currency Adjustment"
    />
  )
}
