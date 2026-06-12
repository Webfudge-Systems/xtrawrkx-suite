'use client'

import { useCallback, useMemo, useState } from 'react'
import { Building2, Receipt, Users, Wallet } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksCustomersTableColumns, formatSalesMoney } from '@/app/_components/booksSalesTableColumns'
import { useBooksCustomersStore } from '@/lib/mock-data/sales/stores'
import type { CustomerRow } from '@/lib/mock-data/sales/seeds'

function matchesCustomerTab(row: CustomerRow, tabKey: string) {
  if (tabKey === 'all') return true
  if (tabKey === 'receivables') return (row.receivables ?? 0) > 0
  if (tabKey === 'credits') return (row.unusedCredits ?? 0) > 0
  if (tabKey === 'no_receivables') return (row.receivables ?? 0) <= 0
  return true
}

export default function CustomersPage() {
  const { customers, deleteCustomer, getById } = useBooksCustomersStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const summary = useMemo(() => {
    const totalBilled = customers.reduce((sum, item) => sum + (item.lifetimeBilled ?? 0), 0)
    const outstanding = customers.reduce((sum, item) => sum + (item.receivables ?? 0), 0)
    const unusedCredits = customers.reduce((sum, item) => sum + (item.unusedCredits ?? 0), 0)
    return { totalBilled, outstanding, unusedCredits }
  }, [customers])

  const handleRequestDelete = useCallback((row: CustomerRow) => {
    setDeleteId(row.id)
  }, [])

  const columns = useBooksCustomersTableColumns({ onRequestDelete: handleRequestDelete, deletingId })

  const deleteTarget = deleteId != null ? getById(deleteId) : null

  const confirmDelete = useCallback(async () => {
    if (deleteId == null || deletingId) return
    try {
      setDeletingId(deleteId)
      deleteCustomer(deleteId)
      setDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }, [deleteCustomer, deleteId, deletingId])

  const tabs = useMemo(
    () => [
      { key: 'all', label: 'All Customers', count: customers.length },
      {
        key: 'receivables',
        label: 'With Receivables',
        count: customers.filter((c) => (c.receivables ?? 0) > 0).length,
      },
      {
        key: 'credits',
        label: 'With Unused Credits',
        count: customers.filter((c) => (c.unusedCredits ?? 0) > 0).length,
      },
      {
        key: 'no_receivables',
        label: 'No Receivables',
        count: customers.filter((c) => (c.receivables ?? 0) <= 0).length,
      },
    ],
    [customers]
  )

  return (
    <>
      <BooksListPageShell
        title="Customers"
        subtitle="View and manage your customer list."
        kpis={[
          {
            title: 'Total Customers',
            value: customers.length,
            subtitle: `${customers.length} customer${customers.length === 1 ? '' : 's'}`,
            icon: Users,
          },
          {
            title: 'Lifetime Billed',
            value: formatSalesMoney(summary.totalBilled),
            subtitle: 'Total billed',
            icon: Wallet,
          },
          {
            title: 'Receivables',
            value: formatSalesMoney(summary.outstanding),
            subtitle: 'Open receivables',
            icon: Receipt,
          },
          {
            title: 'Unused Credits',
            value: formatSalesMoney(summary.unusedCredits),
            subtitle: 'Available credits',
            icon: Wallet,
          },
        ]}
        tabs={tabs}
        tabFilter={matchesCustomerTab}
        filterFields={[
          {
            key: 'type',
            label: 'Client Type',
            options: [
              { value: 'AgencyClient', label: 'Agency Client' },
              { value: 'DirectClient', label: 'Direct Client' },
              { value: 'Partner', label: 'Partner' },
            ],
          },
        ]}
        columns={columns}
        data={customers}
        onRowClickHref={(row) => `/sales/customers/${row.id}`}
        emptyIcon={Building2}
        emptyTitle="No customers yet"
        emptyDescription="Add your first customer to get started."
        addHref="/sales/customers/new"
        addLabel="Add customer"
        searchPlaceholder="Search customers..."
        exportFilePrefix="books-customers"
        sortEntity="customer"
      />

      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={deleteTarget?.name}
        entityLabel="Customer"
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
