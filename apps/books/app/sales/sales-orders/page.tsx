'use client'

import { FileText, Package, TrendingUp, Users } from 'lucide-react'
import BooksSalesListShell from '../_components/BooksSalesListShell'

export default function SalesOrdersPage() {
  return (
    <BooksSalesListShell
      title="Sales Orders"
      subtitle="Track confirmed orders and fulfillment."
      kpis={[
        { title: 'All Orders', value: 0, subtitle: 'No orders', icon: Package, colorScheme: 'orange' },
        { title: 'Draft', value: 0, subtitle: 'No drafts', icon: FileText, colorScheme: 'orange' },
        { title: 'Confirmed', value: 0, subtitle: 'No confirmed', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Customers', value: 0, subtitle: 'No activity', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Orders', count: 0 },
        { key: 'draft', label: 'Draft', count: 0 },
        { key: 'confirmed', label: 'Confirmed', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'number', label: 'ORDER#' },
        { key: 'customer', label: 'CUSTOMER' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={Package}
      emptyTitle="No sales orders found"
      emptyDescription="Create your first sales order to get started"
      addHref="/sales/sales-orders/new"
      addLabel="Add Sales Order"
    />
  )
}
