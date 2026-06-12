'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksSalesDocTableColumns } from '@/app/_components/booksSalesTableColumns'
import { useBooksRecurringInvoicesStore } from '@/lib/mock-data/sales/stores'
import type { SalesDocRow } from '@/lib/mock-data/sales/seeds'
import { countSalesDocTab, matchesSalesDocStatuses, salesDocStatusOptions } from '@/lib/sales/listHelpers'

const BASE = '/sales/recurring-invoices'
const STATUS_GROUPS = {
  active: ['active'],
  paused: ['paused'],
}

export default function RecurringInvoicesPage() {
  const { recurringInvoices, deleteRecord, getById } = useBooksRecurringInvoicesStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: SalesDocRow) => setDeleteId(row.id), [])
  const columns = useBooksSalesDocTableColumns({
    numberLabel: 'RECURRING#',
    basePath: BASE,
    onRequestDelete: handleRequestDelete,
    deletingId,
  })

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteRecord(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteId, deleteRecord, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Profiles', count: recurringInvoices.length },
      { key: 'active', label: 'Active', count: countSalesDocTab(recurringInvoices, 'active', STATUS_GROUPS) },
      { key: 'paused', label: 'Paused', count: countSalesDocTab(recurringInvoices, 'paused', STATUS_GROUPS) },
    ],
    [recurringInvoices]
  )

  return (
    <>
      <BooksListPageShell
        title="Recurring Invoices"
        subtitle="Automated billing schedules."
        kpis={[
          { title: 'All Profiles', value: recurringInvoices.length, subtitle: 'Total recurring profiles', icon: Receipt },
          { title: 'Active', value: countSalesDocTab(recurringInvoices, 'active', STATUS_GROUPS), icon: TrendingUp },
          { title: 'Paused', value: countSalesDocTab(recurringInvoices, 'paused', STATUS_GROUPS), icon: FileText },
          { title: 'Customers', value: new Set(recurringInvoices.map((r) => r.customer)).size, icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesSalesDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[{ key: 'status', label: 'Status', options: salesDocStatusOptions(['Active', 'Paused']) }]}
        columns={columns}
        data={recurringInvoices}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={Receipt}
        emptyTitle="No recurring invoices yet"
        emptyDescription="Create your first recurring invoice profile to get started."
        addHref={`${BASE}/new`}
        addLabel="New recurring invoice"
        searchPlaceholder="Search recurring invoices..."
        exportFilePrefix="books-recurring-invoices"
        sortEntity="recurringInvoice"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Recurring Invoice"
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
