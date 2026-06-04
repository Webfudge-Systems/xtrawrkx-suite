'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { FileText, ChevronRight, Table2 } from 'lucide-react'
import {
  Card,
  TabsWithActions,
  EmptyState,
  LoadingSpinner,
  TableCellText,
  TableCellProposalStatusSelect,
} from '@webfudge/ui'
import { COMPACT_HEADER, COMPACT_CELL, DashboardDocRowActions } from './dashboardDocTableShared'
import { formatCurrency } from '@webfudge/utils'
import proposalService from '../../../lib/api/proposalService'
import { canEditCRMRecord } from '../../../lib/rbac'
import { DASHBOARD_CHART_ACCENT, DashboardBarTooltip, DASHBOARD_BAR_TOOLTIP_CURSOR } from '@webfudge/ui'

const PAGE_SIZE = 100
const TABLE_LIMIT = 25

const STATUS_ORDER = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']

const STATUS_CONFIG = {
  DRAFT: { variant: 'default', label: 'Draft' },
  SENT: { variant: 'info', label: 'Sent' },
  ACCEPTED: { variant: 'success', label: 'Accepted' },
  REJECTED: { variant: 'danger', label: 'Rejected' },
  EXPIRED: { variant: 'warning', label: 'Expired' },
}

async function fetchAllProposals() {
  let page = 1
  const all = []
  let pageCount = 1
  do {
    const res = await proposalService.getAll({
      'pagination[page]': page,
      'pagination[pageSize]': PAGE_SIZE,
      sort: 'updatedAt:desc',
      populate: ['clientAccount', 'leadCompany'],
    })
    const batch = Array.isArray(res?.data) ? res.data : []
    all.push(...batch)
    pageCount = res?.meta?.pagination?.pageCount ?? 1
    page += 1
  } while (page <= pageCount)
  return all
}

function ProposalsStatusChart({ data }) {
  if (!data.length || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[21rem] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 text-sm text-gray-500">
        No proposals yet. Create a proposal to see status distribution.
      </div>
    )
  }

  return (
    <div className="h-[21rem] w-full min-w-0 rounded-xl border border-gray-100 bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
          <Tooltip
            content={
              <DashboardBarTooltip
                unit={(v) => `proposal${v === 1 ? '' : 's'}`}
              />
            }
            cursor={DASHBOARD_BAR_TOOLTIP_CURSOR}
          />
          <Bar dataKey="count" fill={DASHBOARD_CHART_ACCENT} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ProposalsTable({ rows, onStatusChange, savingById }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Table2}
        title="No proposals"
        description="Proposals you create will appear here."
        className="py-10"
      />
    )
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col style={{ width: '36%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '24%' }} />
          <col style={{ width: '26%' }} />
        </colgroup>
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className={`text-left text-[10px] font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}>
              Proposal
            </th>
            <th className={`text-left text-[10px] font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}>
              Value
            </th>
            <th className={`text-left text-[10px] font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}>
              Status
            </th>
            <th className={`text-right text-[10px] font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-orange-50/30">
              <td className={COMPACT_CELL}>
                <Link
                  href={row.href}
                  className="block min-w-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="block truncate text-sm font-semibold text-gray-900 hover:text-orange-600">
                    {row.title}
                  </span>
                  <span className="block truncate text-xs text-gray-500">{row.client}</span>
                </Link>
              </td>
              <td className={COMPACT_CELL}>
                <TableCellText
                  value={formatCurrency(row.value, { notation: 'compact' })}
                  emphasized
                  className="text-xs"
                />
              </td>
              <td className={COMPACT_CELL}>
                <TableCellProposalStatusSelect
                  proposal={row.proposal}
                  onStatusChange={onStatusChange}
                  saving={Boolean(savingById?.[row.recordKey])}
                  canEdit={canEditCRMRecord('proposals', row.proposal)}
                />
              </td>
              <td className={COMPACT_CELL}>
                <DashboardDocRowActions viewHref={row.href} editHref={row.editHref} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length >= TABLE_LIMIT ? (
        <p className="border-t border-gray-100 bg-gray-50/80 px-3 py-2 text-center text-xs text-gray-500">
          Showing first {TABLE_LIMIT} proposals.{' '}
          <Link href="/clients/proposals" className="font-semibold text-orange-600 hover:text-orange-700">
            View all
          </Link>
        </p>
      ) : null}
    </div>
  )
}

export default function SalesProposalsWidget({ className = '' }) {
  const [loading, setLoading] = useState(true)
  const [proposals, setProposals] = useState([])
  const [savingById, setSavingById] = useState({})
  const [activeTab, setActiveTab] = useState('graph')

  const handleStatusChange = useCallback(
    async (recordId, newStatus) => {
      if (!recordId || !newStatus) return
      const target = proposals.find((p) => String(p.id ?? p.documentId) === String(recordId))
      if (!canEditCRMRecord('proposals', target)) {
        alert('You do not have permission to update this proposal.')
        return
      }

      const key = String(recordId)
      setSavingById((prev) => ({ ...prev, [key]: true }))
      try {
        await proposalService.update(recordId, { status: newStatus })
        setProposals((prev) =>
          prev.map((p) => {
            const id = p.id ?? p.documentId
            if (String(id) !== key) return p
            return { ...p, status: newStatus }
          })
        )
      } catch (e) {
        console.error('SalesProposalsWidget status update:', e)
        alert('Failed to update status. Please try again.')
      } finally {
        setSavingById((prev) => ({ ...prev, [key]: false }))
      }
    },
    [proposals]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await fetchAllProposals()
        if (!cancelled) setProposals(list)
      } catch (e) {
        console.error('SalesProposalsWidget:', e)
        if (!cancelled) setProposals([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const { chartData, tableRows, count } = useMemo(() => {
    const chart = STATUS_ORDER.map((status) => {
      const cfg = STATUS_CONFIG[status]
      return {
        name: cfg.label,
        count: proposals.filter((p) => String(p.status || '').toUpperCase() === status).length,
      }
    })

    const rows = proposals.slice(0, TABLE_LIMIT).map((p) => {
      const id = p.documentId ?? p.id
      const recordKey = String(id ?? p.proposalNumber ?? Math.random())
      return {
        id: recordKey,
        recordKey,
        proposal: p,
        title: (p.title || p.projectName || p.proposalNumber || 'Untitled').trim(),
        client: (p.clientCompanyName || p.clientAccount?.name || '—').trim(),
        value: Number(p.totalValue) || 0,
        status: String(p.status || 'DRAFT').toUpperCase(),
        updatedAt: p.updatedAt || p.createdAt,
        href: `/clients/proposals/${id}`,
        editHref: `/clients/proposals/${id}/edit`,
      }
    })

    return { chartData: chart, tableRows: rows, count: proposals.length }
  }, [proposals])

  const tabItems = [
    { id: 'graph', label: 'Graph', badge: count },
    { id: 'table', label: 'Proposals table', badge: count },
  ]

  return (
    <Card className={`flex min-w-0 flex-col p-6 shadow-lg ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900">Proposals</h2>
          <p className="mt-0.5 text-sm text-gray-600">Status distribution and recent proposals</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 shadow-sm">
            <FileText className="h-5 w-5 text-orange-600" aria-hidden />
          </div>
          <Link
            href="/clients/proposals"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-orange-200 hover:text-orange-600"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <TabsWithActions
          variant="pill"
          pillTrack="hug"
          tabs={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {activeTab === 'graph' ? (
        loading ? (
          <div className="flex h-[21rem] items-center justify-center rounded-xl border border-gray-100 bg-gray-50/50">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <ProposalsStatusChart data={chartData} />
        )
      ) : loading ? (
        <div className="flex h-72 items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <ProposalsTable
          rows={tableRows}
          onStatusChange={handleStatusChange}
          savingById={savingById}
        />
      )}
    </Card>
  )
}
