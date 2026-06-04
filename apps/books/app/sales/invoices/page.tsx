'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@webfudge/ui'
import { booksApi } from '@/lib/api'
import type { Invoice } from '@/lib/types'
import { Calendar, FileText, Receipt, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@webfudge/utils'
import BooksSalesListShell from '../_components/BooksSalesListShell'

type InvoiceRow = {
  id: number
  date: string
  number: string
  customer: string
  status: string
  dueDate: string
  amount: number
  balance: number
}

const statusVariant: Record<string, 'gray' | 'primary' | 'info' | 'warning' | 'success' | 'danger'> = {
  Draft: 'gray',
  Sent: 'primary',
  Viewed: 'info',
  Partial: 'warning',
  Paid: 'success',
  Overdue: 'danger',
  Void: 'gray',
}

export default function InvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all')

  useEffect(() => {
    booksApi.fetchInvoices().then((res) => setRows(res.data ?? [])).catch(() => setRows([]))
  }, [])

  const tableData: InvoiceRow[] = useMemo(
    () =>
      rows.map((item) => ({
        id: item.id,
        date: item.date,
        number: item.number,
        customer: String(item.customerId ?? ''),
        status: item.status,
        dueDate: item.dueDate,
        amount: item.total ?? 0,
        balance: item.balanceDue ?? item.total ?? 0,
      })),
    [rows]
  )

  const invoiceStats = useMemo(() => {
    const norm = (s: string) => String(s || '').toLowerCase()
    const draft = tableData.filter((i) => norm(i.status) === 'draft').length
    const sent = tableData.filter((i) => norm(i.status) === 'sent' || norm(i.status) === 'viewed' || norm(i.status) === 'partial').length
    const paid = tableData.filter((i) => norm(i.status) === 'paid').length
    const overdue = tableData.filter((i) => norm(i.status) === 'overdue').length
    return { all: tableData.length, draft, sent, paid, overdue }
  }, [tableData])

  const filtered = useMemo(() => {
    const norm = (s: string) => String(s || '').toLowerCase()
    if (activeTab === 'all') return tableData
    if (activeTab === 'draft') return tableData.filter((i) => norm(i.status) === 'draft')
    if (activeTab === 'paid') return tableData.filter((i) => norm(i.status) === 'paid')
    if (activeTab === 'overdue') return tableData.filter((i) => norm(i.status) === 'overdue')
    // sent
    return tableData.filter((i) => ['sent', 'viewed', 'partial'].includes(norm(i.status)))
  }, [activeTab, tableData])

  return (
    <BooksSalesListShell
      title="Invoices"
      subtitle="Manage invoices and track payment status"
      kpis={[
        { title: 'All Invoices', value: invoiceStats.all, subtitle: invoiceStats.all === 0 ? 'No invoices' : 'Total invoices', icon: Receipt, colorScheme: 'orange' },
        { title: 'Draft', value: invoiceStats.draft, subtitle: invoiceStats.draft === 0 ? 'No drafts' : 'Needs review', icon: FileText, colorScheme: 'orange' },
        { title: 'Sent', value: invoiceStats.sent, subtitle: invoiceStats.sent === 0 ? 'No sent invoices' : 'Awaiting payment', icon: TrendingUp, colorScheme: 'orange' },
        { title: 'Overdue', value: invoiceStats.overdue, subtitle: invoiceStats.overdue === 0 ? 'No overdue' : 'Needs attention', icon: Calendar, colorScheme: 'orange' },
      ]}
      tabs={[
        { key: 'all', label: 'All Invoices', count: invoiceStats.all },
        { key: 'draft', label: 'Draft', count: invoiceStats.draft },
        { key: 'sent', label: 'Sent', count: invoiceStats.sent },
        { key: 'paid', label: 'Paid', count: invoiceStats.paid },
        { key: 'overdue', label: 'Overdue', count: invoiceStats.overdue },
      ]}
      activeTab={activeTab}
      onTabChange={(t) => setActiveTab(t as any)}
      columns={[
        { key: 'date', label: 'DATE' },
        { key: 'number', label: 'INVOICE#' },
        { key: 'customer', label: 'CUSTOMER' },
        {
          key: 'status',
          label: 'STATUS',
          render: (value: string) => <Badge variant={statusVariant[value] ?? 'gray'}>{value}</Badge>,
        },
        { key: 'dueDate', label: 'DUE DATE' },
        { key: 'amount', label: 'AMOUNT', render: (v: number) => formatCurrency(v ?? 0) },
        { key: 'balance', label: 'BALANCE DUE', render: (v: number) => formatCurrency(v ?? 0) },
      ]}
      data={filtered}
      emptyIcon={Receipt}
      emptyTitle="No invoices found"
      emptyDescription="Create your first invoice to get started"
      addHref="/sales/invoices/new"
      addLabel="Add Invoice"
    />
  )
}
