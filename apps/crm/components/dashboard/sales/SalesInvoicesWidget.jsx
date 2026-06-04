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
import { Receipt, ChevronRight, Table2 } from 'lucide-react'
import {
  Card,
  TabsWithActions,
  EmptyState,
  LoadingSpinner,
  TableCellText,
  TableCellInvoiceStatusSelect,
} from '@webfudge/ui'
import { COMPACT_HEADER, COMPACT_CELL, DashboardDocRowActions } from './dashboardDocTableShared'
import { formatCurrency } from '@webfudge/utils'
import invoiceService from '../../../lib/api/invoiceService'
import { canEditCRMRecord } from '../../../lib/rbac'
import { DASHBOARD_CHART_ACCENT, DashboardBarTooltip, DASHBOARD_BAR_TOOLTIP_CURSOR } from '@webfudge/ui'

const PAGE_SIZE = 100
const TABLE_LIMIT = 25

const STATUS_ORDER = ['DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED']

const STATUS_CONFIG = {
  DRAFT: { variant: 'default', label: 'Draft' },
  SENT: { variant: 'info', label: 'Sent' },
  PARTIAL: { variant: 'warning', label: 'Partial' },
  PAID: { variant: 'success', label: 'Paid' },
  OVERDUE: { variant: 'danger', label: 'Overdue' },
  CANCELLED: { variant: 'default', label: 'Cancelled' },
}

async function fetchAllInvoices() {
  let page = 1
  const all = []
  let pageCount = 1
  do {
    const res = await invoiceService.getAll({
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

function InvoicesStatusChart({ data }) {
  if (!data.length || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[21rem] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/80 text-sm text-gray-500">
        No invoices yet. Create an invoice to see status distribution.
      </div>
    )
  }

  return (
    <div className="h-[21rem] w-full min-w-0 rounded-xl border border-gray-100 bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={48} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
          <Tooltip
            content={
              <DashboardBarTooltip
                unit={(v) => `invoice${v === 1 ? '' : 's'}`}
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

function InvoicesTable({ rows, onStatusChange, savingById }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Table2}
        title="No invoices"
        description="Invoices you create will appear here."
        className="py-10"
      />
    )
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col style={{ width: '26%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className={`text-left text-[10px] font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}>
              Invoice
            </th>
            <th className={`text-left text-[10px] font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}>
              Bill to
            </th>
            <th className={`text-left text-[10px] font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}>
              Total
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
                  className="block truncate text-sm font-semibold text-gray-900 hover:text-orange-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.number}
                </Link>
              </td>
              <td className={COMPACT_CELL}>
                <span className="block truncate text-xs text-gray-700" title={row.client}>
                  {row.client}
                </span>
              </td>
              <td className={COMPACT_CELL}>
                <TableCellText
                  value={formatCurrency(row.total, { notation: 'compact' })}
                  emphasized
                  className="text-xs"
                />
              </td>
              <td className={COMPACT_CELL}>
                <TableCellInvoiceStatusSelect
                  invoice={row.invoice}
                  onStatusChange={onStatusChange}
                  saving={Boolean(savingById?.[row.recordKey])}
                  canEdit={canEditCRMRecord('client_invoices', row.invoice)}
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
          Showing first {TABLE_LIMIT} invoices.{' '}
          <Link href="/clients/invoices" className="font-semibold text-orange-600 hover:text-orange-700">
            View all
          </Link>
        </p>
      ) : null}
    </div>
  )
}

export default function SalesInvoicesWidget({ className = '' }) {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState([])
  const [savingById, setSavingById] = useState({})
  const [activeTab, setActiveTab] = useState('graph')

  const handleStatusChange = useCallback(
    async (recordId, newStatus) => {
      if (!recordId || !newStatus) return
      const target = invoices.find((inv) => String(inv.id ?? inv.documentId) === String(recordId))
      if (!canEditCRMRecord('client_invoices', target)) {
        alert('You do not have permission to update this invoice.')
        return
      }

      const key = String(recordId)
      setSavingById((prev) => ({ ...prev, [key]: true }))
      try {
        await invoiceService.update(recordId, { status: newStatus })
        setInvoices((prev) =>
          prev.map((inv) => {
            const id = inv.id ?? inv.documentId
            if (String(id) !== key) return inv
            return { ...inv, status: newStatus }
          })
        )
      } catch (e) {
        console.error('SalesInvoicesWidget status update:', e)
        alert('Failed to update status. Please try again.')
      } finally {
        setSavingById((prev) => ({ ...prev, [key]: false }))
      }
    },
    [invoices]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await fetchAllInvoices()
        if (!cancelled) setInvoices(list)
      } catch (e) {
        console.error('SalesInvoicesWidget:', e)
        if (!cancelled) setInvoices([])
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
        count: invoices.filter((i) => String(i.status || '').toUpperCase() === status).length,
      }
    })

    const rows = invoices.slice(0, TABLE_LIMIT).map((inv) => {
      const id = inv.documentId ?? inv.id
      const recordKey = String(id ?? inv.invoiceNumber ?? Math.random())
      return {
        id: recordKey,
        recordKey,
        invoice: inv,
        number: (inv.invoiceNumber || '—').trim(),
        client: (inv.billToCompany || inv.billToName || inv.clientAccount?.name || '—').trim(),
        total: Number(inv.total ?? inv.balanceDue) || 0,
        status: String(inv.status || 'DRAFT').toUpperCase(),
        dueDate: inv.dueDate,
        updatedAt: inv.updatedAt || inv.createdAt,
        href: `/clients/invoices/${id}`,
        editHref: `/clients/invoices/${id}/edit`,
      }
    })

    return { chartData: chart, tableRows: rows, count: invoices.length }
  }, [invoices])

  const tabItems = [
    { id: 'graph', label: 'Graph', badge: count },
    { id: 'table', label: 'Invoices table', badge: count },
  ]

  return (
    <Card className={`flex min-w-0 flex-col p-6 shadow-lg ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900">Invoices</h2>
          <p className="mt-0.5 text-sm text-gray-600">Status distribution and recent invoices</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 shadow-sm">
            <Receipt className="h-5 w-5 text-orange-600" aria-hidden />
          </div>
          <Link
            href="/clients/invoices"
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
          <InvoicesStatusChart data={chartData} />
        )
      ) : loading ? (
        <div className="flex h-72 items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <InvoicesTable
          rows={tableRows}
          onStatusChange={handleStatusChange}
          savingById={savingById}
        />
      )}
    </Card>
  )
}
