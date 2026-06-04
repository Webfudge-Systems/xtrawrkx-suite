'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Card,
  Avatar,
  Button,
  EmptyState,
  LoadingSpinner,
  ownerDisplayFromUser,
} from '@webfudge/ui'
import {
  Activity,
  CheckCircle2,
  MessageSquare,
  Circle,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react'
import { fetchPmActivityFeed } from '../../lib/api/pmInboxService'

const AVATAR_PALETTES = [
  'bg-orange-500',
  'bg-violet-500',
  'bg-blue-500',
  'bg-pink-500',
  'bg-emerald-500',
  'bg-amber-500',
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function avatarPalette(userId) {
  const n = Number(userId) || 0
  return AVATAR_PALETTES[Math.abs(n) % AVATAR_PALETTES.length]
}

function extractQuotedName(summary) {
  const m = String(summary || '').match(/"([^"]+)"/)
  return m ? m[1] : null
}

function actionPresentation(action, subjectType) {
  const a = String(action || 'update').toLowerCase()
  const st = String(subjectType || 'record').toLowerCase()
  const entity =
    st === 'task' ? 'task' : st === 'project' ? 'project' : 'record'

  if (a === 'create') {
    return { verb: `created the ${entity}`, Icon: Plus, iconClass: 'text-emerald-600' }
  }
  if (a === 'delete') {
    return { verb: `deleted the ${entity}`, Icon: Trash2, iconClass: 'text-red-600' }
  }
  if (a === 'comment') {
    return { verb: `commented on the ${entity}`, Icon: MessageSquare, iconClass: 'text-blue-600' }
  }
  if (a.includes('complete') || a === 'done') {
    return { verb: `completed the ${entity}`, Icon: CheckCircle2, iconClass: 'text-emerald-600' }
  }
  if (a === 'update') {
    return { verb: `updated the ${entity}`, Icon: Circle, iconClass: 'text-orange-500 fill-orange-500' }
  }
  return { verb: `${a} the ${entity}`, Icon: Pencil, iconClass: 'text-gray-500' }
}

function pmHref(row) {
  const st = String(row?.subjectType || '').toLowerCase()
  const id = row?.subjectId
  if (id == null || id === '') return null
  if (st === 'project') return `/projects/${id}`
  if (st === 'task') return `/tasks/${id}`
  return null
}

function normalizeRow(row) {
  const actor = row?.actor && typeof row.actor === 'object' ? row.actor : null
  const derived = actor ? ownerDisplayFromUser(actor) : { label: 'System', avatarFallback: '?' }
  const actorName =
    derived.label && derived.label !== 'Unassigned' ? derived.label : 'Someone'
  const { verb, Icon, iconClass } = actionPresentation(row.action, row.subjectType)
  const entityName =
    extractQuotedName(row.summary) ||
    (row.subjectType === 'task' ? 'Task' : row.subjectType === 'project' ? 'Project' : 'Record')

  return {
    id: row.id,
    actorName,
    actor,
    verb,
    entityName,
    summary: row.summary,
    createdAt: row.createdAt,
    Icon,
    iconClass,
    href: pmHref(row),
    raw: row,
  }
}

export default function DashboardActivityFeedWidget({ className = '', limit = 8 }) {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await fetchPmActivityFeed({ limit, start: 0 })
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Dashboard activity feed:', e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  const rows = useMemo(() => items.map(normalizeRow), [items])

  return (
    <Card glass className={`flex flex-col ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>
          <p className="mt-0.5 text-sm text-gray-500">Recent project and task activity in your org</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/inbox')} className="shrink-0">
          View All
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <LoadingSpinner size="md" message="Loading activity…" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Updates to projects and tasks will show up here."
          className="py-10"
        />
      ) : (
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white/90">
          {rows.map((row) => {
            const { Icon, iconClass } = row
            const palette = avatarPalette(row.actor?.id)
            const fallback = row.actor
              ? ownerDisplayFromUser(row.actor).avatarFallback
              : '?'

            const inner = (
              <>
                <Avatar
                  fallback={fallback}
                  alt={row.actorName}
                  size="sm"
                  className={`shrink-0 text-white ${palette}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{row.actorName}</span>{' '}
                    <span className="font-normal text-gray-700">{row.verb}</span>
                  </p>
                  <p className="mt-0.5 truncate text-sm text-gray-500">{row.entityName}</p>
                </div>
                <span className="shrink-0 text-xs font-medium tabular-nums text-gray-400">
                  {timeAgo(row.createdAt)}
                </span>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center ${iconClass}`}>
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
              </>
            )

            return (
              <li key={row.id}>
                {row.href ? (
                  <Link
                    href={row.href}
                    className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50/90"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3.5">{inner}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
