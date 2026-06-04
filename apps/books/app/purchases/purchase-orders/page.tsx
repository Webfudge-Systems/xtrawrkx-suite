'use client'

import { FileText, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import BooksPurchasesListShell from '../_components/BooksPurchasesListShell'

export default function PurchaseOrdersPage() {
  return (
    <BooksPurchasesListShell
      kpis={[
        { title: 'All Orders', value: 0, subtitle: 'No orders', icon: ShoppingCart, colorScheme: 'orange' },
        { title: 'Draft', value: 0, subtitle: 'No drafts', icon: FileText, colorScheme: 'orange' },
        { title: 'Approved', value: 0, subtitle: 'No approved', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Vendors', value: 0, subtitle: 'No vendors', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Orders', count: 0 },
        { key: 'draft', label: 'Draft', count: 0 },
        { key: 'approved', label: 'Approved', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'number', label: 'PO#' },
        { key: 'vendor', label: 'VENDOR' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={ShoppingCart}
      emptyTitle="No purchase orders found"
      emptyDescription="Create your first purchase order to get started"
      addHref="/purchases/purchase-orders/new"
      addLabel="Add Purchase Order"
    />
  )
}
