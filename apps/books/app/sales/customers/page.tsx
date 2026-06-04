// @ts-nocheck
'use client'

import { useEffect, useMemo, useState } from 'react'
import { booksApi } from '@/lib/api'
import type { Customer } from '@/lib/types'
import { Building2, Receipt, Users, Wallet } from 'lucide-react'
import { formatCurrency } from '@webfudge/utils'
import BooksSalesListShell from '../_components/BooksSalesListShell'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'receivables' | 'credits' | 'no_receivables'>('all')

  useEffect(() => {
    booksApi.fetchCustomers().then((res) => setCustomers(res.data ?? [])).catch(() => setCustomers([]))
  }, [])

  const summary = useMemo(() => {
    const totalBilled = customers.reduce((sum, item) => sum + (item.lifetimeBilled ?? 0), 0)
    const outstanding = customers.reduce((sum, item) => sum + (item.receivables ?? 0), 0)
    const unusedCredits = customers.reduce((sum, item) => sum + (item.unusedCredits ?? 0), 0)
    return { totalBilled, outstanding, unusedCredits }
  }, [customers])

  const tabStats = useMemo(() => {
    const receivables = customers.filter((c) => (c.receivables ?? 0) > 0).length
    const credits = customers.filter((c) => (c.unusedCredits ?? 0) > 0).length
    const no_receivables = customers.filter((c) => (c.receivables ?? 0) <= 0).length
    return {
      all: customers.length,
      receivables,
      credits,
      no_receivables,
    }
  }, [customers])

  const tabFilteredCustomers = useMemo(() => {
    if (activeTab === 'all') return customers
    if (activeTab === 'receivables') return customers.filter((c) => (c.receivables ?? 0) > 0)
    if (activeTab === 'credits') return customers.filter((c) => (c.unusedCredits ?? 0) > 0)
    if (activeTab === 'no_receivables') return customers.filter((c) => (c.receivables ?? 0) <= 0)
    return customers
  }, [activeTab, customers])

  return (
    <BooksSalesListShell
      title="Customers"
      subtitle="View and manage your customer list"
      kpis={[
        {
          title: 'Total Customers',
          value: customers.length,
          subtitle: customers.length === 0 ? 'No customers' : `${customers.length} customer${customers.length === 1 ? '' : 's'}`,
          icon: Users,
          colorScheme: 'orange',
        },
        {
          title: 'Lifetime Billed',
          value: formatCurrency(summary.totalBilled),
          subtitle: 'Total billed',
          icon: Wallet,
          colorScheme: 'orange',
        },
        {
          title: 'Receivables',
          value: formatCurrency(summary.outstanding),
          subtitle: 'Open receivables',
          icon: Receipt,
          colorScheme: 'orange',
        },
        {
          title: 'Unused Credits',
          value: formatCurrency(summary.unusedCredits),
          subtitle: 'Available credits',
          icon: Wallet,
          colorScheme: 'orange',
        },
      ]}
      columns={[
        { key: 'name', label: 'NAME' },
        { key: 'company', label: 'COMPANY NAME' },
        { key: 'email', label: 'EMAIL' },
        { key: 'phone', label: 'WORK PHONE' },
        { key: 'receivables', label: 'RECEIVABLES', render: (v: number) => formatCurrency(v ?? 0) },
        { key: 'unusedCredits', label: 'UNUSED CREDITS', render: (v: number) => formatCurrency(v ?? 0) },
      ]}
      tabs={[
        { key: 'all', label: 'All Customers', count: tabStats.all },
        { key: 'receivables', label: 'With Receivables', count: tabStats.receivables },
        { key: 'credits', label: 'With Unused Credits', count: tabStats.credits },
        { key: 'no_receivables', label: 'No Receivables', count: tabStats.no_receivables },
      ]}
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t as typeof activeTab)}
      data={tabFilteredCustomers}
      emptyIcon={Building2}
      emptyTitle="No customers found"
      emptyDescription="Add your first customer to get started"
      addHref="/sales/customers/new"
      addLabel="Add Customer"
    />
  )
}
