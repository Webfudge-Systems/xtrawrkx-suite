'use client'

import { useCallback, useMemo, useState } from 'react'
import { FileText, Target, TrendingUp, Users } from 'lucide-react'
import BooksListPageShell from '@/app/_components/BooksListPageShell'
import BooksDeleteItemModal from '@/app/_components/BooksDeleteItemModal'
import { useBooksSalesDocTableColumns } from '@/app/_components/booksSalesTableColumns'
import { useBooksEstimatesStore } from '@/lib/mock-data/sales/stores'
import type { SalesDocRow } from '@/lib/mock-data/sales/seeds'
import { countSalesDocTab, matchesSalesDocStatuses, salesDocStatusOptions } from '@/lib/sales/listHelpers'

const BASE = '/sales/estimates'
const STATUS_GROUPS = {
  draft: ['draft'],
  sent: ['sent'],
  accepted: ['accepted'],
}

export default function EstimatesPage() {
  const { estimates, deleteRecord, getById } = useBooksEstimatesStore()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleRequestDelete = useCallback((row: SalesDocRow) => setDeleteId(row.id), [])
  const columns = useBooksSalesDocTableColumns({
    numberLabel: 'ESTIMATE#',
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
      { key: 'all', label: 'All Estimates', count: estimates.length },
      { key: 'draft', label: 'Draft', count: countSalesDocTab(estimates, 'draft', STATUS_GROUPS) },
      { key: 'sent', label: 'Sent', count: countSalesDocTab(estimates, 'sent', STATUS_GROUPS) },
      { key: 'accepted', label: 'Accepted', count: countSalesDocTab(estimates, 'accepted', STATUS_GROUPS) },
    ],
    [estimates]
  )

  return (
    <>
      <BooksListPageShell
        title="Estimates"
        subtitle="Proposal status and approval tracking."
        kpis={[
          { title: 'All Estimates', value: estimates.length, subtitle: 'Total estimates', icon: FileText },
          { title: 'Draft', value: countSalesDocTab(estimates, 'draft', STATUS_GROUPS), icon: Target },
          { title: 'Sent', value: countSalesDocTab(estimates, 'sent', STATUS_GROUPS), icon: TrendingUp },
          { title: 'Accepted', value: countSalesDocTab(estimates, 'accepted', STATUS_GROUPS), icon: Users },
        ]}
        tabs={tabs}
        tabFilter={(row, tab) => matchesSalesDocStatuses(row, tab, STATUS_GROUPS)}
        filterFields={[{ key: 'status', label: 'Status', options: salesDocStatusOptions(['Draft', 'Sent', 'Accepted']) }]}
        columns={columns}
        data={estimates}
        onRowClickHref={(row) => `${BASE}/${row.id}`}
        emptyIcon={FileText}
        emptyTitle="No estimates yet"
        emptyDescription="Create your first estimate to get started."
        addHref={`${BASE}/new`}
        addLabel="New estimate"
        searchPlaceholder="Search estimates..."
        exportFilePrefix="books-estimates"
        sortEntity="salesEstimate"
      />
      <BooksDeleteItemModal
        isOpen={deleteId != null}
        itemName={getById(deleteId ?? 0)?.number}
        entityLabel="Estimate"
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
