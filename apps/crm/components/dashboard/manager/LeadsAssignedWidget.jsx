'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { Building2, ArrowUpRight } from 'lucide-react'
import {
  Card,
  Select,
  Avatar,
  EmptyState,
  TableCellCreated,
} from '@webfudge/ui'
import strapiClient from '../../../lib/strapiClient'
import leadCompanyService from '../../../lib/api/leadCompanyService'
import { canEditCRMRecord } from '../../../lib/rbac'
import { TableCellLeadStatusSelect } from '@webfudge/ui'
import { leadCompanyLabel, leadInitials } from '../leadsMeetingsShared'

const PAGE_SIZE = 100
const TABLE_LIMIT = 10

const COMPACT_HEADER = '!px-3 !py-2.5'
const COMPACT_CELL = '!px-3 !py-2.5'

function assigneeId(record) {
  const assigned = record?.assignedTo
  if (assigned == null) return null
  if (typeof assigned === 'object') return assigned.id ?? assigned.documentId ?? null
  return assigned
}

function displayName(user) {
  if (!user) return 'Unknown'
  const first = user.firstName || user.first_name || ''
  const last = user.lastName || user.last_name || ''
  const full = `${first} ${last}`.trim()
  if (full) return full
  if (user.username) return user.username
  if (user.email) return String(user.email).split('@')[0]
  return 'Team member'
}

async function fetchAllLeads() {
  let page = 1
  const all = []
  let pageCount = 1
  do {
    const res = await leadCompanyService.getAll({
      'pagination[page]': page,
      'pagination[pageSize]': PAGE_SIZE,
      populate: ['assignedTo'],
      sort: 'updatedAt:desc',
    })
    const batch = Array.isArray(res?.data) ? res.data : []
    all.push(...batch)
    pageCount = res?.meta?.pagination?.pageCount ?? 1
    page += 1
  } while (page <= pageCount)
  return all
}

function LeadsAssignedTable({ rows, hasMore, onStatusChange, savingByLeadId }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Building2}
        title="No leads assigned"
        description="This team member has no lead companies assigned yet."
        className="py-10"
      />
    )
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-100 bg-white">
      <table className="w-full table-fixed border-collapse text-sm">
        <colgroup>
          <col style={{ width: '44%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '26%' }} />
        </colgroup>
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className={`text-left text-xs font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}>
              Company
            </th>
            <th className={`text-left text-xs font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}>
              Status
            </th>
            <th className={`text-left text-xs font-bold uppercase tracking-wide text-gray-700 ${COMPACT_HEADER}`}>
              Updated
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-blue-50/50">
              <td className={COMPACT_CELL}>
                <Link
                  href={row.href}
                  className="group flex min-w-0 items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Avatar
                    size="sm"
                    fallback={row.initials}
                    className="shrink-0 bg-gradient-to-br from-orange-400 to-orange-600 text-white ring-2 ring-orange-100"
                  />
                  <span className="truncate text-sm font-semibold text-gray-900 group-hover:text-orange-600">
                    {row.company}
                  </span>
                </Link>
              </td>
              <td className={COMPACT_CELL}>
                <TableCellLeadStatusSelect
                  company={row.lead}
                  onStatusChange={onStatusChange}
                  saving={Boolean(
                    savingByLeadId[String(row.lead?.id ?? row.lead?.documentId ?? '')]
                  )}
                  canEdit={canEditCRMRecord('leads', row.lead)}
                  containerClassName="w-full min-w-0 max-w-full"
                />
              </td>
              <td className={COMPACT_CELL}>
                <TableCellCreated dateString={row.updatedAt} dateMode="calendar" className="text-xs" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore ? (
        <p className="border-t border-gray-100 bg-gray-50/80 px-4 py-2 text-center text-xs text-gray-500">
          Showing latest {TABLE_LIMIT} leads.{' '}
          <Link
            href="/sales/lead-companies"
            className="font-semibold text-orange-600 hover:text-orange-700"
          >
            View all leads
          </Link>
        </p>
      ) : null}
    </div>
  )
}

export default function LeadsAssignedWidget({ className = '' }) {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [leads, setLeads] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [savingByLeadId, setSavingByLeadId] = useState({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [usersRes, allLeads] = await Promise.all([
          strapiClient.getXtrawrkxUsers({ pageSize: PAGE_SIZE }).catch(() => ({ data: [] })),
          fetchAllLeads(),
        ])
        if (cancelled) return
        const userList = Array.isArray(usersRes?.data) ? usersRes.data : []
        userList.sort((a, b) => displayName(a).localeCompare(displayName(b)))
        setUsers(userList)
        setLeads(allLeads)

        const assigneeIds = new Set(
          allLeads.map(assigneeId).filter((id) => id != null).map(String)
        )
        const defaultUser =
          userList.find((u) => assigneeIds.has(String(u.id))) ?? userList[0]
        setSelectedUserId(defaultUser ? String(defaultUser.id) : '')
      } catch (e) {
        console.error('LeadsAssignedWidget:', e)
        if (!cancelled) {
          setUsers([])
          setLeads([])
          setSelectedUserId('')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleStatusChange = useCallback(async (companyId, newStatus) => {
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
      console.error('LeadsAssignedWidget status update:', e)
      alert('Failed to update status. Please try again.')
    } finally {
      setSavingByLeadId((prev) => ({ ...prev, [key]: false }))
    }
  }, [leads])

  const userOptions = useMemo(
    () =>
      users.map((u) => ({
        value: String(u.id),
        label: displayName(u),
      })),
    [users]
  )

  const { memberLeadCount, filteredRows } = useMemo(() => {
    if (!selectedUserId) return { memberLeadCount: 0, filteredRows: [] }
    const memberLeads = leads.filter(
      (lead) => String(assigneeId(lead) ?? '') === selectedUserId
    )
    const rows = memberLeads.slice(0, TABLE_LIMIT).map((lead) => {
      const id = lead?.id ?? lead?.documentId
      return {
        id: id ?? leadCompanyLabel(lead),
        lead,
        company: leadCompanyLabel(lead),
        initials: leadInitials(lead),
        updatedAt: lead.updatedAt || lead.createdAt,
        href: id != null ? `/sales/lead-companies/${id}` : '/sales/lead-companies',
      }
    })
    return { memberLeadCount: memberLeads.length, filteredRows: rows }
  }, [leads, selectedUserId])

  const selectedUser = users.find((u) => String(u.id) === selectedUserId)
  const selectedLabel = selectedUser ? displayName(selectedUser) : 'team member'

  return (
    <Card className={`flex flex-col p-6 shadow-lg ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900">Leads assigned</h2>
          <p className="mt-0.5 text-sm text-gray-600">Lead companies by team member</p>
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

      <div className="mb-4">
        <label
          htmlFor="leads-assigned-user"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          Team member
        </label>
        <Select
          id="leads-assigned-user"
          value={selectedUserId}
          onChange={setSelectedUserId}
          options={userOptions}
          placeholder="Select team member"
          allowEmpty={false}
          disabled={loading || !userOptions.length}
          containerClassName="w-full"
          searchable={userOptions.length > 7}
        />
      </div>

      <div className="min-h-[12rem]">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : !userOptions.length ? (
          <EmptyState
            icon={Building2}
            title="No team members"
            description="Add organization users to filter leads by assignee."
            className="py-8"
          />
        ) : (
          <>
            <p className="mb-3 text-xs text-gray-500">
              <span className="font-semibold text-gray-700">{memberLeadCount}</span>
              {memberLeadCount === 1 ? ' lead' : ' leads'} for{' '}
              <span className="font-semibold text-gray-700">{selectedLabel}</span>
              {memberLeadCount > TABLE_LIMIT ? (
                <span className="text-gray-400"> · showing latest {TABLE_LIMIT}</span>
              ) : null}
            </p>
            <LeadsAssignedTable
              rows={filteredRows}
              hasMore={memberLeadCount > TABLE_LIMIT}
              onStatusChange={handleStatusChange}
              savingByLeadId={savingByLeadId}
            />
          </>
        )}
      </div>
    </Card>
  )
}
