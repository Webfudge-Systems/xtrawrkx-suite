'use client'

import Link from 'next/link'
import { Card, Avatar } from '@webfudge/ui'
import {
  ArrowUpRight,
  CalendarDays,
  Video,
  Building2,
  ChevronRight,
} from 'lucide-react'
import { isAssignedToCurrentUser } from '../../lib/rbac'

export const LEADS_LIMIT = 8
export const MEETINGS_LIMIT = 10

export const scrollbarClass =
  'max-h-[min(22rem,calc(100vh-14rem))] overflow-y-auto overscroll-contain [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300'

export function formatRelativePast(iso) {
  if (!iso) return '—'
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return '—'
  const secs = Math.floor((Date.now() - t) / 1000)
  if (secs < 45) return 'Just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins === 1 ? '1 minute' : `${mins} minutes`} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours === 1 ? '1 hour' : `${hours} hours`} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days === 1 ? '1 day' : `${days} days`} ago`
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export function formatMeetingStart(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function inferPlatform(location, isVirtual) {
  const u = String(location || '').toLowerCase()
  if (u.includes('meet.google')) return 'googleMeet'
  if (u.includes('zoom.us') || u.includes('zoom')) return 'zoom'
  if (u.includes('teams.microsoft') || u.includes('teams.live')) return 'teams'
  if (isVirtual || /^https?:\/\//i.test(String(location || '').trim())) return 'virtual'
  return 'other'
}

function PlatformBadge({ meeting }) {
  const p = inferPlatform(meeting?.location, meeting?.isVirtual)
  const wrapper =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm '
  switch (p) {
    case 'googleMeet':
      return (
        <div className={wrapper + 'border-emerald-200/80 bg-emerald-600'} title="Google Meet">
          <Video className="h-5 w-5 text-white" aria-hidden />
        </div>
      )
    case 'zoom':
      return (
        <div className={wrapper + 'border-blue-300/70 bg-blue-600'} title="Zoom">
          <Video className="h-5 w-5 text-white" aria-hidden />
        </div>
      )
    case 'teams':
      return (
        <div className={wrapper + 'border-indigo-300/70 bg-indigo-700'} title="Teams">
          <Video className="h-5 w-5 text-white" aria-hidden />
        </div>
      )
    default:
      return (
        <div className={wrapper + 'border-gray-200 bg-gray-50'} title="Meeting">
          <CalendarDays className="h-5 w-5 text-gray-600" aria-hidden />
        </div>
      )
  }
}

export function leadCompanyLabel(lead) {
  const n = (lead?.companyName || lead?.name || lead?.tradeName || '').trim()
  return n || `Lead ${lead?.id ?? ''}`
}

export function leadInitials(lead) {
  const raw = leadCompanyLabel(lead)
  const parts = raw.split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function groupUpcomingMeetings(meetings) {
  const now = Date.now()
  const bucketFor = (startMs) => {
    const mins = (startMs - now) / 60000
    if (mins <= 35) return 'In 30 min'
    if (mins <= 135) return 'In 2 hours'
    if (mins <= 1440) return 'Later today'
    return new Date(startMs).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }
  const order = []
  const map = new Map()
  const pushOrdered = (key, meeting) => {
    if (!map.has(key)) {
      map.set(key, [])
      order.push(key)
    }
    map.get(key).push(meeting)
  }
  for (const m of meetings) {
    if (!m?.startTime) continue
    const t = new Date(m.startTime).getTime()
    if (Number.isNaN(t) || t <= now) continue
    pushOrdered(bucketFor(t), m)
  }
  return order.map((k) => ({ label: k, meetings: map.get(k) }))
}

export function MeetingsCard({ loading, meetingGroups, className = '' }) {
  return (
    <Card className={`flex h-full min-h-[22rem] flex-col p-6 shadow-lg ${className}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Meetings</h2>
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-2 ring-emerald-400/35"
              title="Scheduled meetings"
            />
          </div>
          <p className="mt-0.5 text-sm text-gray-600">What&apos;s next on your calendar</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 shadow-sm">
            <CalendarDays className="h-[22px] w-[22px] text-orange-600" aria-hidden />
          </div>
          <Link
            href="/meetings"
            className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            View all
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[4.75rem] animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : meetingGroups.every((g) => !g.meetings.length) ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-12 text-center">
            <CalendarDays className="mb-2 h-10 w-10 text-gray-300" aria-hidden />
            <p className="text-sm text-gray-500">No upcoming meetings scheduled.</p>
            <Link
              href="/meetings/new"
              className="mt-3 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              Schedule a meeting
            </Link>
          </div>
        ) : (
          <div className={`flex-1 space-y-6 ${scrollbarClass}`}>
            {meetingGroups.map(({ label, meetings: group }) =>
              group.length ? (
                <section key={label} aria-label={label}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {label}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {group.map((m) => {
                      const id = m?.id ?? m?.documentId
                      return (
                        <li key={id}>
                          <Link
                            href={id != null ? `/meetings/${id}` : '/meetings'}
                            className="group flex items-center gap-3 rounded-xl border border-gray-200/90 bg-gradient-to-br from-white to-gray-50/80 px-3.5 py-3 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
                          >
                            <PlatformBadge meeting={m} />
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900">
                                {m.title?.trim() || 'Untitled meeting'}
                              </p>
                              {m.startTime ? (
                                <p className="mt-1 text-xs text-gray-500">
                                  {formatMeetingStart(m.startTime)}
                                </p>
                              ) : null}
                            </div>
                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-orange-500" />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ) : null
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export function LatestLeadsCard({
  loading,
  leads,
  title = 'Latest Leads',
  subtitle = 'New companies captured recently',
  className = '',
}) {
  return (
    <Card className={`flex h-full min-h-[22rem] flex-col p-6 shadow-lg ${className}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>
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
      <div className="flex min-h-0 flex-1 flex-col">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-12 text-center">
            <Building2 className="mb-2 h-10 w-10 text-gray-300" aria-hidden />
            <p className="text-sm text-gray-500">No leads to show.</p>
            <Link
              href="/sales/lead-companies/new"
              className="mt-3 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              Add a lead
            </Link>
          </div>
        ) : (
          <ul className={`flex-1 space-y-2 ${scrollbarClass}`}>
            {leads.map((lead) => {
              const id = lead?.id ?? lead?.documentId
              const label = leadCompanyLabel(lead)
              return (
                <li key={id ?? label}>
                  <Link
                    href={id != null ? `/sales/lead-companies/${id}` : '/sales/lead-companies'}
                    className="group flex items-center gap-3 rounded-xl border border-gray-200/90 bg-gradient-to-br from-white to-gray-50/80 px-3.5 py-3 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
                  >
                    <Avatar
                      size="sm"
                      fallback={leadInitials(lead)}
                      className="bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-sm ring-2 ring-orange-100"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                      {label}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs tabular-nums text-gray-500">
                      {formatRelativePast(lead.createdAt)}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-orange-500" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}
