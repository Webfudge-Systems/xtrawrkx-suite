'use client'

import { useCallback, useMemo, useState } from 'react'
import { Calendar, FileText, Receipt, TrendingUp } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksSalesInvoicesTableColumns } from '@/app/_components/booksSalesInvoicesTableColumns'
import { formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import { useBooksSalesInvoicesStore } from '@/lib/mock-data/sales/stores'
import type { SalesInvoiceRow } from '@/lib/mock-data/sales/seeds'
import { normStatus } from '@/lib/mock-data/helpers'
import { salesDocStatusOptions } from '@/lib/sales/listHelpers'

const BASE = '/sales/invoices'
const STATUS_GROUPS = {
  draft: ['draft'],
  sent: ['sent', 'viewed', 'partial'],
  paid: ['paid'],
  overdue: ['overdue'],
}

function matchesInvoiceTab(row: SalesInvoiceRow, tabKey: string) {
  if (tabKey === 'all') return true
  const allowed = STATUS_GROUPS[tabKey as keyof typeof STATUS_GROUPS]
  if (!allowed) return true
  return allowed.includes(normStatus(row.status))
}

function countInvoiceTab(rows: SalesInvoiceRow[], tabKey: string) {
  return rows.filter((row) => matchesInvoiceTab(row, tabKey)).length
}

export default function InvoicesPage() {
  const { invoices, deleteInvoice, getById } = useBooksSalesInvoicesStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const summary = useMemo(() => {
    const totalBilled = invoices.reduce((sum, row) => sum + (row.amount ?? 0), 0)
    const outstanding = invoices.reduce((sum, row) => sum + (row.balance ?? 0), 0)
    const overdueTotal = invoices
      .filter((row) => matchesInvoiceTab(row, 'overdue'))
      .reduce((sum, row) => sum + (row.balance ?? 0), 0)
    const collected = invoices
      .filter((row) => matchesInvoiceTab(row, 'paid'))
      .reduce((sum, row) => sum + (row.amount ?? 0), 0)
    return { totalBilled, outstanding, overdueTotal, collected }
  }, [invoices])

  const handleRequestDelete = useCallback((row: SalesInvoiceRow) => setDeleteId(row.id), [])
  const columns = useBooksSalesInvoicesTableColumns({
    basePath: BASE,
    onRequestDelete: handleRequestDelete,
    deletingId,
  })

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteInvoice(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteId, deleteInvoice, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Invoices', count: invoices.length },
      { key: 'draft', label: 'Draft', count: countInvoiceTab(invoices, 'draft') },
      { key: 'sent', label: 'Sent', count: countInvoiceTab(invoices, 'sent') },
      { key: 'paid', label: 'Paid', count: countInvoiceTab(invoices, 'paid') },
      { key: 'overdue', label: 'Overdue', count: countInvoiceTab(invoices, 'overdue') },
    ],
    [invoices]
  )

  return (
    <>
      <BooksListPageShell
        title="Invoices"
        subtitle="Manage invoices and track payment status."
        kpis={[
          {
            title: 'All Invoices',
            value: invoices.length,
            subtitle: `${invoices.length} invoice${invoices.length === 1 ? '' : 's'}`,
            icon: Receipt,
          },
          {
            title: 'Total Billed',
            value: formatSalesMoney(summary.totalBilled),
            subtitle: 'Invoice value',
            icon: TrendingUp,
          },
          {
            title: 'Outstanding',
            value: formatSalesMoney(summary.outstanding),
            subtitle: 'Open balance',
            icon: FileText,
          },
          {
            title: 'Overdue',
            value: formatSalesMoney(summary.overdueTotal),
            subtitle: 'Needs attention',
            icon: Calendar,
          },
        ]}
        tabs={tabs}
        tabFilter={matchesInvoiceTab}
        filterFields={[
          { key: 'status', label: 'Status', options: salesDocStatusOptions(['Draft', 'Sent', 'Paid', 'Overdue']) },
        ]}
        columns={columns}
        data={invoices}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Receipt}
        emptyTitle="No invoices yet"
        emptyDescription="Create your first invoice to get started."
        addHref={`${BASE}/new`}
        addLabel="New invoice"
        searchPlaceholder="Search invoices..."
        exportFilePrefix="books-sales-invoices"
        sortEntity="salesInvoice"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Invoice"
        deleting={deletingId != null}
        onClose={() => {
          if (deletingId) return
          setDeleteId(null)
        }}
        onConfirm={confirmDelete}
      />
    </>
  )
}
