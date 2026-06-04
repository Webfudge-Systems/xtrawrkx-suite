'use client'

import { PackageCheck, Truck, TrendingUp, Users } from 'lucide-react'
import BooksSalesListShell from '../_components/BooksSalesListShell'

export default function DeliveryChallansPage() {
  return (
    <BooksSalesListShell
      title="Delivery Challans"
      subtitle="Manage delivery documents and shipment tracking."
      kpis={[
        { title: 'All Challans', value: 0, subtitle: 'No challans', icon: Truck, colorScheme: 'orange' },
        { title: 'Draft', value: 0, subtitle: 'No drafts', icon: PackageCheck, colorScheme: 'orange' },
        { title: 'Delivered', value: 0, subtitle: 'No delivered', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Customers', value: 0, subtitle: 'No activity', icon: Users, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Challans', count: 0 },
        { key: 'draft', label: 'Draft', count: 0 },
        { key: 'delivered', label: 'Delivered', count: 0 },
      ]}
      activeTab="all"
      onTabChange={() => {}}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'number', label: 'CHALLAN#' },
        { key: 'customer', label: 'CUSTOMER' },
        { key: 'status', label: 'STATUS' },
        { key: 'amount', label: 'AMOUNT' },
      ]}
      data={[]}
      emptyIcon={Truck}
      emptyTitle="No delivery challans found"
      emptyDescription="Create your first delivery challan to get started"
      addHref="/sales/delivery-challans/new"
      addLabel="Add Delivery Challan"
    />
  )
}
