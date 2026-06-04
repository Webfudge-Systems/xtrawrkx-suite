'use client'

import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksPurchasesListShell from '../_components/BooksPurchasesListShell'

export default function VendorCreditsPage() {
  return (
    <BooksPurchasesListShell
      kpis={[
        { title: 'All Credits', value: 0, subtitle: 'No vendor credits', icon: Receipt, colorScheme: 'orange' },
        { title: 'Draft', value: 0, subtitle: 'No drafts', icon: FileText, colorScheme: 'orange' },
        { title: 'Issued', value: 0, subtitle: 'No issued', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Vendors', value: 0, subtitle: 'No vendors', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Vendor Credits', count: 0 },
        { key: 'draft', label: 'Draft', count: 0 },
        { key: 'issued', label: 'Issued', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'number', label: 'CREDIT#' },
        { key: 'vendor', label: 'VENDOR' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={Receipt}
      emptyTitle="No vendor credits found"
      emptyDescription="Vendor credits will appear here when created"
      addHref="/purchases/vendor-credits/new"
      addLabel="Add Vendor Credit"
    />
  )
}
