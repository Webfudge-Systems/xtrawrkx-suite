'use client'

import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksSalesListShell from '../_components/BooksSalesListShell'

export default function RetainerInvoicesPage() {
  return (
    <BooksSalesListShell
      title="Retainer Invoices"
      subtitle="Remaining retainer balance is highlighted in this module."
      kpis={[
        { title: 'All Retainers', value: 0, subtitle: 'No retainers', icon: Receipt, colorScheme: 'orange' },
        { title: 'Draft', value: 0, subtitle: 'No drafts', icon: FileText, colorScheme: 'orange' },
        { title: 'Sent', value: 0, subtitle: 'No sent', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Customers', value: 0, subtitle: 'No activity', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Retainers', count: 0 },
        { key: 'draft', label: 'Draft', count: 0 },
        { key: 'sent', label: 'Sent', count: 0 },
        { key: 'paid', label: 'Paid', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'number', label: 'INVOICE#' },
        { key: 'customer', label: 'CUSTOMER' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={Receipt}
      emptyTitle="No retainer invoices found"
      emptyDescription="Create your first retainer invoice to get started"
      addHref="/sales/retainer-invoices/new"
      addLabel="Add Retainer Invoice"
    />
  )
}
