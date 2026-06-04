'use client'

import { FileText, Target, TrendingUp, Users } from 'lucide-react'
import BooksSalesListShell from '../_components/BooksSalesListShell'

export default function EstimatesPage() {
  return (
    <BooksSalesListShell
      title="Estimates"
      subtitle="Proposal status and approval tracking."
      kpis={[
        { title: 'All Estimates', value: 0, subtitle: 'No estimates', icon: FileText, colorScheme: 'orange' },
        { title: 'Draft', value: 0, subtitle: 'No drafts', icon: Target, colorScheme: 'orange' },
        { title: 'Sent', value: 0, subtitle: 'No sent', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Accepted', value: 0, subtitle: 'No accepted', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Estimates', count: 0 },
        { key: 'draft', label: 'Draft', count: 0 },
        { key: 'sent', label: 'Sent', count: 0 },
        { key: 'accepted', label: 'Accepted', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'number', label: 'ESTIMATE#' },
        { key: 'customer', label: 'CUSTOMER' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={FileText}
      emptyTitle="No estimates found"
      emptyDescription="Create your first estimate to get started"
      addHref="/sales/estimates/new"
      addLabel="Add Estimate"
    />
  )
}
