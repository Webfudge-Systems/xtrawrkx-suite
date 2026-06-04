'use client'

import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksSalesListShell from '../_components/BooksSalesListShell'

export default function CreditNotesPage() {
  return (
    <BooksSalesListShell
      title="Credit Notes"
      subtitle="Track issued credits and adjustments."
      kpis={[
        { title: 'All Credits', value: 0, subtitle: 'No credit notes', icon: Receipt, colorScheme: 'orange' },
        { title: 'Draft', value: 0, subtitle: 'No drafts', icon: FileText, colorScheme: 'orange' },
        { title: 'Issued', value: 0, subtitle: 'No issued', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Customers', value: 0, subtitle: 'No activity', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Credit Notes', count: 0 },
        { key: 'draft', label: 'Draft', count: 0 },
        { key: 'issued', label: 'Issued', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'number', label: 'CREDIT NOTE#' },
        { key: 'customer', label: 'CUSTOMER' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={Receipt}
      emptyTitle="No credit notes found"
      emptyDescription="Credit notes will appear here when created"
      addHref="/sales/credit-notes/new"
      addLabel="Add Credit Note"
    />
  )
}
