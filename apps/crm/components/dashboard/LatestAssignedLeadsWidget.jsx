'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  Avatar,
  EmptyState,
  LoadingSpinner,
  TableCellCreated,
  TableCellLeadStatusSelect,
  TableCellNextConnect,
} from '@webfudge/ui'
import {
  Building2,
  ArrowUpRight,
  Pencil,
  Mail,
  Eye,
  Phone,
} from 'lucide-react'
import leadCompanyService from '../../lib/api/leadCompanyService'
import { canEditCRMRecord, currentUserIds } from '../../lib/rbac'
import { leadCompanyLabel, leadInitials } from './leadsMeetingsShared'

const LEADS_LIMIT = 10

const COMPACT_HEADER = '!px-3 !py-2.5'
const COMPACT_CELL = '!px-3 !py-2.5'

function primaryContactName(company) {
  const contact = company?.contacts?.[0]
  if (contact) {
    return `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || '—'
  }
  return 'No primary contact'
}

function primaryEmail(company) {
  const contact = company?.contacts?.[0]
  return contact?.email || company?.email || ''
}

function primaryPhone(company) {
  const contact = company?.contacts?.[0]
  return contact?.phone || company?.phone || ''
}

function AssignedLeadsTable({ rows, onStatusChange, savingByLeadId, router }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Building2}
        title="No assigned leads"
        description="Lead companies assigned to you will appear here."
        className="py-10"
        action={
          <Button variant="primary" size="sm" onClick={() => router.push('/sales/lead-companies/new')}>
            Add a lead
          </Button>
        }
      />
    )
  }

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden rounded-xl border border-gray-100 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th
              className={`text-left text-xs font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}
              style={{ width: '28%' }}
            >
              Company
            </th>
            <th
              className={`text-left text-xs font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}
              style={{ width: '22%' }}
            >
              Contact
            </th>
            <th
              className={`text-left text-xs font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}
              style={{ width: '14%' }}
            >
              Status
            </th>
            <th
              className={`text-left text-xs font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}
              style={{ width: '14%' }}
            >
              Next connect
            </th>
            <th
              className={`text-left text-xs font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}
              style={{ width: '12%' }}
            >
              Updated
            </th>
            <th
              className={`text-left text-xs font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}
              style={{ width: '10%' }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((company) => {
            const id = company?.id ?? company?.documentId
            const canEdit = canEditCRMRecord('leads', company)
            const email = primaryEmail(company)
            const phone = primaryPhone(company)
            const saving = Boolean(savingByLeadId[String(id ?? '')])

            return (
              <tr
                key={id ?? leadCompanyLabel(company)}
                className="cursor-pointer transition-colors hover:bg-orange-50/40"
                onClick={() => {
                  if (id != null) router.push(`/sales/lead-companies/${id}`)
                }}
              >
                <td className={COMPACT_CELL}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar
                      size="sm"
                      fallback={leadInitials(company)}
                      className="shrink-0 bg-gradient-to-br from-orange-400 to-orange-600 text-white ring-2 ring-orange-100"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {leadCompanyLabel(company)}
                      </p>
                      <p className="truncate text-xs text-gray-500">{primaryContactName(company)}</p>
                    </div>
                  </div>
                </td>
                <td className={COMPACT_CELL}>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                      <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                      <span className="truncate">{email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                      <span className="truncate">{phone || 'No phone'}</span>
                    </div>
                  </div>
                </td>
                <td className={COMPACT_CELL} onClick={(e) => e.stopPropagation()}>
                  <TableCellLeadStatusSelect
                    company={company}
                    onStatusChange={onStatusChange}
                    saving={saving}
                    canEdit={canEdit}
                    containerClassName="w-full min-w-0 max-w-full"
                  />
                </td>
                <td className={COMPACT_CELL}>
                  <TableCellNextConnect date={company.nextConnectDate} />
                </td>
                <td className={COMPACT_CELL}>
                  <TableCellCreated
                    dateString={company.updatedAt || company.createdAt}
                    dateMode="calendar"
                    className="text-xs"
                  />
                </td>
                <td className={COMPACT_CELL} onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-slate-700 hover:bg-slate-100"
                      title="View"
                      onClick={() => {
                        if (id != null) router.push(`/sales/lead-companies/${id}`)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-emerald-600 hover:bg-emerald-50"
                        title="Edit"
                        onClick={() => {
                          if (id != null) router.push(`/sales/lead-companies/${id}/edit`)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-orange-600 hover:bg-orange-50 disabled:opacity-40"
                      title="Send mail"
                      disabled={!email}
                      onClick={() => {
                        if (email) window.location.href = `mailto:${email}`
                      }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function LatestAssignedLeadsWidget({ className = '' }) {
  const router = useRouter()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingByLeadId, setSavingByLeadId] = useState({})

  const loadLeads = useCallback(async () => {
    const userId = currentUserIds()[0]
    if (!userId) {
      setLeads([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const res = await leadCompanyService.getAll({
        sort: 'updatedAt:desc',
        'pagination[pageSize]': LEADS_LIMIT,
        'filters[assignedTo][id][$eq]': userId,
        populate: ['assignedTo'],
        mergeContactsFromContactsApi: true,
      })
      const raw = Array.isArray(res?.data) ? res.data : []
      setLeads(raw)
    } catch (e) {
      console.error('LatestAssignedLeadsWidget:', e)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const handleStatusChange = useCallback(
    async (companyId, newStatus) => {
      if (!companyId || !newStatus) return
      const target = leads.find((l) => (l?.id ?? l?.documentId) === companyId)
      if (!canEditCRMRecord('leads', target)) {
        alert('You can only update lead companies assigned to you.')
        return
      }

      const key = String(companyId)
      setSavingByLeadId((prev) => ({ ...prev, [key]: true }))
      try {
        await leadCompanyService.update(companyId, { status: newStatus.toUpperCase() })
        setLeads((prev) =>
          prev.map((lead) => {
            const id = lead?.id ?? lead?.documentId
            if (id !== companyId) return lead
            return { ...lead, status: newStatus.toLowerCase() }
          })
        )
      } catch (e) {
        console.error('LatestAssignedLeadsWidget status update:', e)
        alert('Failed to update status. Please try again.')
      } finally {
        setSavingByLeadId((prev) => ({ ...prev, [key]: false }))
      }
    },
    [leads]
  )

  return (
    <Card className={`flex flex-col p-6 shadow-lg ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900">Latest Assigned Leads</h2>
          <p className="mt-0.5 text-sm text-gray-600">Lead companies assigned to you</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 shadow-sm">
            <Building2 className="h-[22px] w-[22px] text-orange-600" aria-hidden />
          </div>
          <Link
            href="/sales/lead-companies"
            className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            See all
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="min-h-[12rem]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" message="Loading leads…" />
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-gray-500">
              Showing{' '}
              <span className="font-semibold text-gray-700">{leads.length}</span>
              {leads.length === 1 ? ' lead' : ' leads'}
            </p>
            <AssignedLeadsTable
              rows={leads}
              onStatusChange={handleStatusChange}
              savingByLeadId={savingByLeadId}
              router={router}
            />
          </>
        )}
      </div>
    </Card>
  )
}
