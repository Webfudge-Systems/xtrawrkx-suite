'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, LoadingSpinner, Avatar, EmptyState } from '@webfudge/ui'
import { Users, ChevronRight, Info } from 'lucide-react'
import { fetchTeamPerformanceSummary } from '../../lib/api/teamPerformanceService'
import TeamMemberPerformanceModal from './manager/TeamMemberPerformanceModal'

const PRIMARY_ORANGE_SHADES = ['#FF7A20', '#ea580c', '#fb923c', '#c2410c', '#f97316', '#fdba74']

function shortenMemberLabel(name) {
  const s = String(name || '').trim()
  if (s.includes('@')) {
    const local = s.split('@')[0]
    return local.length > 18 ? `${local.slice(0, 16)}…` : local
  }
  return s.length > 22 ? `${s.slice(0, 20)}…` : s
}

function WorkloadBar({ percent, color }) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0))
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-orange-100">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${Math.max(value, value > 0 ? 8 : 0)}%`,
            backgroundColor: color,
          }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-gray-800">
        {value}%
      </span>
    </div>
  )
}

export default function TeamPerformanceWidget({ className = '' }) {
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchTeamPerformanceSummary()
      setMembers(data.members || [])
    } catch (e) {
      console.error('TeamPerformanceWidget:', e)
      setMembers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 120000)
    return () => clearInterval(interval)
  }, [load])

  const totals = members.reduce(
    (acc, m) => ({
      tasks: acc.tasks + (m.openTasks || 0),
      leads: acc.leads + (m.openLeads || 0),
      deals: acc.deals + (m.openDeals || 0),
    }),
    { tasks: 0, leads: 0, deals: 0 }
  )

  return (
    <>
      <Card className={`flex min-h-0 flex-col p-6 shadow-lg ${className}`}>
        <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900">Team performance</h2>
              <span title="Click a member for detailed performance">
                <Info className="h-4 w-4 text-gray-400" aria-hidden />
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-600">Open tasks, leads, and deals by assignee</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 shadow-sm">
              <Users className="h-[22px] w-[22px] text-orange-600" aria-hidden />
            </div>
            <Link
              href="/clients/tasks"
              className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              View all
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        {!loading && members.length > 0 ? (
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800 ring-1 ring-orange-200/80">
              <span className="tabular-nums">{totals.tasks}</span> tasks
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200/90">
              <span className="tabular-nums">{totals.leads}</span> leads
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200/90">
              <span className="tabular-nums">{totals.deals}</span> deals
            </span>
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="md" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No team workload yet"
            description="Assign leads, deals, or tasks to see team performance."
            className="py-10"
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col style={{ width: '36%' }} />
                <col style={{ width: '28%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {['Member', 'Workload', 'Tasks', 'Leads', 'Deals'].map((label, i) => (
                    <th
                      key={label}
                      className={`px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-700 ${
                        i > 1 ? 'text-center' : 'text-left'
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((member, index) => {
                  const barColor = PRIMARY_ORANGE_SHADES[index % PRIMARY_ORANGE_SHADES.length]
                  return (
                    <tr
                      key={member.id}
                      className="cursor-pointer bg-white transition-colors hover:bg-orange-50/40"
                      onClick={() => setSelectedMember(member)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedMember(member)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`View performance for ${member.name}`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar
                            size="sm"
                            fallback={member.initials}
                            alt={member.name}
                            className="!h-9 !w-9 shrink-0 text-xs font-semibold text-white"
                            style={{ backgroundColor: barColor }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900" title={member.name}>
                              {shortenMemberLabel(member.name)}
                            </p>
                            <p className="truncate text-xs text-gray-500">{member.role || 'Member'}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" aria-hidden />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <WorkloadBar percent={member.percent} color={barColor} />
                      </td>
                      <td className="px-3 py-3 text-center font-bold tabular-nums text-gray-900">
                        {member.openTasks}
                      </td>
                      <td className="px-3 py-3 text-center font-bold tabular-nums text-gray-900">
                        {member.openLeads}
                      </td>
                      <td className="px-3 py-3 text-center font-bold tabular-nums text-gray-900">
                        {member.openDeals}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex shrink-0 items-center gap-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
          <Users className="h-4 w-4 text-orange-500" aria-hidden />
          <span>
            <span className="font-semibold text-gray-900">{members.length}</span> active member
            {members.length === 1 ? '' : 's'}
          </span>
          {members.length > 0 ? (
            <span className="text-xs text-gray-400">· Click a row for details</span>
          ) : null}
        </div>
      </Card>

      <TeamMemberPerformanceModal
        member={selectedMember}
        isOpen={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
      />
    </>
  )
}
