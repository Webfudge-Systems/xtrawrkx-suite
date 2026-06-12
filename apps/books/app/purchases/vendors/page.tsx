'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Receipt, Users, Wallet } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksVendorsTableColumns } from '@/app/_components/booksPurchasesTableColumns'
import {
  useBooksBillsStore,
  useBooksExpensesStore,
  useBooksVendorsStore,
} from '@/lib/mock-data/purchases/stores'
import type { VendorRow } from '@/lib/mock-data/purchases/seeds'

function matchesVendorTab(row: VendorRow, tabKey: string) {
  if (tabKey === 'all') return true
  if (tabKey === 'payables') return (row.payables ?? 0) > 0
  if (tabKey === 'credits') return (row.unusedCredits ?? 0) > 0
  return true
}

export default function VendorsPage() {
  const { vendors, deleteVendor, getById } = useBooksVendorsStore()
  const { bills } = useBooksBillsStore()
  const { expenses } = useBooksExpensesStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const summary = useMemo(() => {
    const outstanding = vendors.filter((v) => (v.payables ?? 0) > 0).length
    const totalPayables = vendors.reduce((sum, v) => sum + (v.payables ?? 0), 0)
    return { outstanding, totalPayables }
  }, [vendors])

  const handleRequestDelete = useCallback((row: VendorRow) => setDeleteId(row.id), [])
  const columns = useBooksVendorsTableColumns({ onRequestDelete: handleRequestDelete, deletingId })
  const deleteTarget = deleteId != null ? getById(deleteId) : null

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteVendor(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteId, deleteVendor, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Vendors', count: vendors.length },
      { key: 'payables', label: 'With Payables', count: summary.outstanding },
      {
        key: 'credits',
        label: 'With Credits',
        count: vendors.filter((v) => (v.unusedCredits ?? 0) > 0).length,
      },
    ],
    [summary.outstanding, vendors]
  )

  return (
    <>
      <BooksListPageShell
        title="Vendors"
        subtitle="Manage vendors, expenses, and payables."
        kpis={[
          {
            title: 'All Vendors',
            value: vendors.length,
            subtitle: `${vendors.length} vendor${vendors.length === 1 ? '' : 's'}`,
            icon: Users,
          },
          {
            title: 'Outstanding',
            value: summary.outstanding,
            subtitle: `${summary.outstanding} with payables`,
            icon: Wallet,
          },
          {
            title: 'Bills',
            value: bills.length,
            subtitle: `${bills.length} bills recorded`,
            icon: FileText,
          },
          {
            title: 'Expenses',
            value: expenses.length,
            subtitle: `${expenses.length} expenses`,
            icon: Receipt,
          },
        ]}
        tabs={tabs}
        tabFilter={matchesVendorTab}
        columns={columns}
        data={vendors}
        onRowClickHref={(row) => `/purchases/vendors/${row.id}`}
        emptyIcon={Users}
        emptyTitle="No vendors yet"
        emptyDescription="Add your first vendor to get started."
        addHref="/purchases/vendors/new"
        addLabel="Add vendor"
        searchPlaceholder="Search vendors..."
        exportFilePrefix="books-vendors"
        sortEntity="vendor"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={deleteTarget?.name}
        entityLabel="Vendor"
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
