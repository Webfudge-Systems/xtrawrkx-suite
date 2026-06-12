'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Avatar, LoadingSpinner } from '@webfudge/ui'
import {
  Activity,
  ChevronRight,
  UserPlus,
  CheckSquare,
  Calendar,
  FileText,
  Receipt,
  MessageCircle,
  Building2,
  Clock,
} from 'lucide-react'
import { fetchCrmActivityFeed } from '../../../lib/api/crmActivityService'

const LIMIT = 8

function formatWhen(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

function actorName(actor) {
  if (!actor || typeof actor !== 'object') return 'Someone'
  const u = actor.username?.trim()
  const e = actor.email?.trim()
  if (u) return u
  if (e) return e.split('@')[0]
  return actor.id != null ? `User ${actor.id}` : 'Someone'
}

function actorInitials(actor) {
  const n = actorName(actor)
  const parts = n.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return n.slice(0, 2).toUpperCase()
}

function parseMeta(meta) {
  if (meta == null) return null
  if (typeof meta === 'string') {
    try {
      return JSON.parse(meta)
    } catch {
      return null
    }
  }
  return typeof meta === 'object' ? meta : null
}

function entityLabel(row, meta) {
  return (
    meta?.entityName ||
    meta?.name ||
    meta?.title ||
    row?.subjectLabel ||
    row?.summary?.split("'")[1] ||
    ''
  )
}

function companyLabel(row, meta) {
  return meta?.companyName || meta?.leadCompanyName || meta?.clientName || meta?.organizationName || ''
}

/** Map feed row → visual theme + copy */
function describeActivity(row) {
  const st = String(row?.subjectType || '').toLowerCase()
  const action = String(row?.action || '').toLowerCase()
  const who = actorName(row?.actor)
  const meta = parseMeta(row?.meta)
  const entity = entityLabel(row, meta) || 'record'
  const company = companyLabel(row, meta)

  if (st === 'lead_company' && action === 'create') {
    return {
      tone: 'orange',
      Icon: UserPlus,
      line: (
        <>
          <span className="font-medium text-gray-800">{who}</span> assigned a new lead{' '}
          <span className="font-semibold text-orange-600">&apos;{entity}&apos;</span>
        </>
      ),
      sub: company,
      role: 'Sales',
    }
  }
  if (st === 'task' && (action === 'update' || action === 'create')) {
    const completed = /complet/i.test(row?.summary || '')
    if (completed) {
      return {
        tone: 'purple',
        Icon: CheckSquare,
        line: (
          <>
            <span className="font-medium text-gray-800">{who}</span> completed task{' '}
            <span className="font-semibold text-violet-600">&apos;{entity}&apos;</span>
          </>
        ),
        sub: 'Task completed',
        role: 'Sales',
      }
    }
  }
  if (st === 'meeting') {
    return {
      tone: 'green',
      Icon: Calendar,
      line: (
        <>
          <span className="font-medium text-gray-800">{who}</span> scheduled a meeting{' '}
          <span className="font-semibold text-emerald-600">&apos;{entity}&apos;</span>
        </>
      ),
      sub: company,
      role: who.toLowerCase().includes('manager') ? 'Manager' : 'Sales',
    }
  }
  if (st === 'proposal') {
    return {
      tone: 'blue',
      Icon: FileText,
      line: (
        <>
          <span className="font-medium text-gray-800">{who}</span> created a proposal{' '}
          <span className="font-semibold text-blue-600">&apos;{entity}&apos;</span>
        </>
      ),
      sub: company,
      role: 'Sales',
    }
  }
  if (st === 'invoice') {
    return {
      tone: 'amber',
      Icon: Receipt,
      line: (
        <>
          <span className="font-medium text-gray-800">{who}</span> updated invoice{' '}
          <span className="font-semibold text-amber-700">{entity}</span>
        </>
      ),
      sub: company,
      role: 'Sales',
    }
  }
  if (action === 'comment') {
    return {
      tone: 'pink',
      Icon: MessageCircle,
      line: (
        <>
          <span className="font-medium text-gray-800">{who}</span> added a comment on{' '}
          <span className="font-semibold text-pink-600">{entity}</span>
        </>
      ),
      sub: company,
      role: 'Manager',
    }
  }

  return {
    tone: 'slate',
    Icon: Activity,
    line: <span className="text-gray-800">{row?.summary || 'Activity update'}</span>,
    sub: company,
    role: 'Member',
  }
}

const TONE_STYLES = {
  orange: {
    dot: 'bg-orange-500',
    iconBg: 'bg-orange-50 text-orange-600 border-orange-100',
  },
  purple: {
    dot: 'bg-violet-500',
    iconBg: 'bg-violet-50 text-violet-600 border-violet-100',
  },
  green: {
    dot: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  blue: {
    dot: 'bg-blue-500',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  amber: {
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  pink: {
    dot: 'bg-pink-500',
    iconBg: 'bg-pink-50 text-pink-600 border-pink-100',
  },
  slate: {
    dot: 'bg-gray-400',
    iconBg: 'bg-gray-50 text-gray-600 border-gray-100',
  },
}

export default function TeamActivityFeedWidget({ className = '' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await fetchCrmActivityFeed({ limit: LIMIT, start: 0 })
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const entries = items

  return (
    <Card className={`flex flex-col p-6 shadow-lg ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team activity feed</h2>
          <p className="mt-0.5 text-sm text-gray-600">
            Leads, contacts, deals, meetings, and client account updates
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-200 bg-orange-50">
            <Activity className="h-5 w-5 text-orange-600" />
          </div>
          <Link
            href="/activities"
            className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            View all activities
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 py-10 text-center text-sm text-gray-500">
          No team activity yet.
        </p>
      ) : (
        <ul className="relative space-y-0" aria-label="Team activity">
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gray-200" aria-hidden />
          {entries.map((row, i) => {
            const d = describeActivity(row)
            const styles = TONE_STYLES[d.tone] || TONE_STYLES.slate
            const Icon = d.Icon
            return (
              <li
                key={row.id ?? i}
                className="relative flex gap-4 border-b border-gray-100 py-4 last:border-b-0"
              >
                <div
                  className={`relative z-[1] mt-3 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white ${styles.dot}`}
                  aria-hidden
                />
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${styles.iconBg}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm leading-snug text-gray-700">{d.line}</p>
                  {d.sub ? (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      {d.sub}
                    </p>
                  ) : null}
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatWhen(row.createdAt)}
                  </p>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-0.5 sm:flex">
                  <Avatar
                    size="sm"
                    fallback={actorInitials(row.actor)}
                    className="!h-9 !w-9 bg-orange-500 text-xs font-semibold text-white"
                  />
                  <span className="text-xs font-semibold text-gray-900">{actorName(row.actor)}</span>
                  <span className="text-[10px] text-gray-500">{d.role}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
