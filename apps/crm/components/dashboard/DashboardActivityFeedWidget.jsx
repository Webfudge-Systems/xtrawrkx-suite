'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, ActivitiesTimeline } from '@webfudge/ui'
import { Activity, ChevronRight } from 'lucide-react'
import { fetchGlobalActivityFeed } from '../../lib/api/crmActivityService'

const LIMIT = 12

function entityHrefForRow(row) {
  const st = String(row?.subjectType || '').toLowerCase()
  const id = row?.subjectId
  if (id == null || id === '') return null
  if (st === 'contact') return `/sales/contacts/${id}`
  if (st === 'lead_company') return `/sales/lead-companies/${id}`
  if (st === 'deal') return `/sales/deals/${id}`
  if (st === 'task') return `/clients/tasks`
  if (st === 'meeting') return `/meetings/${id}`
  if (st === 'proposal') return `/clients/proposals/${id}`
  if (st === 'invoice') return `/clients/invoices/${id}`
  return null
}

const MANAGER_SUBJECT_TYPES = new Set([
  'task',
  'meeting',
  'lead_company',
  'contact',
])

const MANAGER_ACTIONS = new Set([
  'create',
  'update',
  'comment',
])

/**
 * @param {{ variant?: 'personal' | 'manager', className?: string, limit?: number }} props
 */
export default function DashboardActivityFeedWidget({
  variant = 'personal',
  className = '',
  limit = LIMIT,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const { data } = await fetchGlobalActivityFeed({ limit: limit * 2, start: 0 })
        if (!cancelled) setItems(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load activity')
          setItems([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [limit])

  const filtered = useMemo(() => {
    if (variant !== 'manager') return items.slice(0, limit)
    return items
      .filter((row) => {
        const st = String(row?.subjectType || '').toLowerCase()
        const action = String(row?.action || '').toLowerCase()
        if (!MANAGER_SUBJECT_TYPES.has(st)) return false
        if (action === 'delete') return false
        return MANAGER_ACTIONS.has(action)
      })
      .slice(0, limit)
  }, [items, variant, limit])

  const title = variant === 'manager' ? 'Team activity' : 'Recent activity'
  const subtitle =
    variant === 'manager'
      ? 'Assignments, completions, and meetings across the team'
      : 'Tasks, meetings, proposals, invoices, and leads'

  return (
    <Card className={`flex flex-col p-6 shadow-lg ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 shadow-sm">
            <Activity className="h-[22px] w-[22px] text-orange-600" aria-hidden />
          </div>
          <Link
            href="/activities"
            className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700"
          >
            View all
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
      <ActivitiesTimeline
        items={filtered}
        loading={loading}
        error={error}
        entityHrefForRow={entityHrefForRow}
        className="max-h-[min(28rem,50vh)] overflow-y-auto pr-1 [scrollbar-width:thin]"
      />
    </Card>
  )
}
