'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  Avatar,
  EmptyState,
  LoadingSpinner,
  Table,
  TableCellTaskStatus,
  formatRelativeTime,
  formatTableDate,
} from '@webfudge/ui'
import { CheckSquare, ChevronRight, Building2 } from 'lucide-react'
import { isTaskDueOverdue, parseDisplayDate } from '@webfudge/utils'
import taskService from '../../lib/api/taskService'
import { currentUserIds } from '../../lib/rbac'
import { leadCompanyLabel } from './leadsMeetingsShared'

const TASK_LIMIT = 25

const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED'])

function isOpenDashboardTask(task) {
  const st = String(task?.strapiStatus ?? task?.status ?? '').toUpperCase()
  return st && !TERMINAL_STATUSES.has(st)
}

function isTaskOverdue(task) {
  return isTaskDueOverdue(task?.dueDate, task?.strapiStatus)
}

function taskInitial(name) {
  const n = (name || 'T').trim()
  const match = n.match(/[A-Za-z0-9]/)
  return match ? match[0].toUpperCase() : 'T'
}

function accountLabel(acc) {
  if (!acc) return ''
  if (typeof acc === 'object') {
    return acc.companyName || acc.name || acc.tradeName || ''
  }
  return String(acc)
}

function relatedContext(task) {
  const lc = task?.leadCompany
  const lcId = lc && typeof lc === 'object' ? lc.id ?? lc.documentId : lc
  const lcLabel = leadCompanyLabel(lc)
  if (lcId != null && lcLabel && !lcLabel.startsWith('Lead ')) {
    return { label: lcLabel, href: `/sales/lead-companies/${lcId}` }
  }

  const acc = task?.clientAccount
  const accId = acc && typeof acc === 'object' ? acc.id ?? acc.documentId : acc
  const accLabel = accountLabel(acc)
  if (accId != null && accLabel) {
    return { label: accLabel, href: `/clients/accounts/${accId}` }
  }

  const deal = task?.deal
  const dealId = deal && typeof deal === 'object' ? deal.id ?? deal.documentId : deal
  const dealLabel = deal && typeof deal === 'object' ? deal.name || deal.title || '' : ''
  if (dealId != null && dealLabel) {
    return { label: dealLabel, href: `/sales/deals/${dealId}` }
  }

  return { label: null, href: null }
}

function taskHref(task) {
  const ctx = relatedContext(task)
  if (ctx.href) return ctx.href
  return '/clients/tasks'
}

function normalizeTask(task) {
  return {
    ...task,
    strapiStatus: String(task?.status ?? '').toUpperCase(),
    dueDate: task?.scheduledDate || null,
  }
}

/** Open tasks assigned to the user — overdue first, then due date, then recently updated. */
function sortDashboardMyTasks(tasks) {
  const list = (tasks || []).map(normalizeTask).filter(isOpenDashboardTask)
  list.sort((a, b) => {
    const aOver = isTaskOverdue(a)
    const bOver = isTaskOverdue(b)
    if (aOver !== bOver) return aOver ? -1 : 1
    const aParsed = a.dueDate ? parseDisplayDate(a.dueDate) : null
    const bParsed = b.dueDate ? parseDisplayDate(b.dueDate) : null
    const aDue = aParsed ? aParsed.getTime() : Number.POSITIVE_INFINITY
    const bDue = bParsed ? bParsed.getTime() : Number.POSITIVE_INFINITY
    if (aDue !== bDue) return aDue - bDue
    const aUpd = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bUpd = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return bUpd - aUpd
  })
  return list.slice(0, TASK_LIMIT)
}

function taskSubtitle(row) {
  const parts = []
  const desc = (row.description || '').trim()
  if (desc) parts.push(desc)
  if (row.recurrenceSummary) parts.push(row.recurrenceSummary)
  return parts.length ? parts.join(' · ') : null
}

function DashboardTaskNameCell({ row }) {
  const initial = taskInitial(row.name)
  const subtitle = taskSubtitle(row)
  const overdue = isTaskOverdue(row)

  return (
    <div className="flex min-w-0 items-start gap-3 py-0.5">
      <Avatar
        fallback={initial}
        alt={row.name}
        size="sm"
        className={`shrink-0 text-white ${overdue ? 'bg-red-600' : 'bg-gray-600'}`}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold leading-snug ${
            overdue ? 'text-red-900' : 'text-gray-900'
          }`}
          title={row.name}
        >
          {row.name || 'Untitled task'}
        </p>
        {subtitle ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-gray-500" title={subtitle}>
            {subtitle}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-gray-400">No description</p>
        )}
      </div>
    </div>
  )
}

function DashboardRelatedCell({ row, router }) {
  const ctx = relatedContext(row)

  if (ctx.label) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (ctx.href) router.push(ctx.href)
        }}
        title={`Open: ${ctx.label}`}
        className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-orange-200/90 bg-orange-50 px-2.5 py-1.5 text-left text-xs font-semibold text-orange-900 shadow-sm transition hover:border-orange-300 hover:bg-orange-100"
      >
        <Building2 className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
        <span className="min-w-0 truncate">{ctx.label}</span>
        {ctx.href ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden />
        ) : null}
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-2.5 py-1.5 text-xs font-medium text-gray-500">
      <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
      No related record
    </span>
  )
}

function DashboardDueDateCell({ row }) {
  const overdue = isTaskOverdue(row)
  if (!row.dueDate) {
    return <span className="text-sm font-medium text-gray-400">—</span>
  }

  const dateLabel = formatTableDate(row.dueDate, { dateMode: 'calendar' })
  const displayDate = dateLabel === 'N/A' ? '—' : dateLabel
  const relative = formatRelativeTime(row.dueDate, { dateMode: 'calendar' })

  return (
    <div className="text-right sm:text-left">
      <p
        className={`text-sm font-semibold tabular-nums ${overdue ? 'text-red-700' : 'text-gray-900'}`}
      >
        {displayDate}
      </p>
      {relative ? (
        <p className={`mt-0.5 text-xs font-medium ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
          {relative}
        </p>
      ) : null}
    </div>
  )
}

export default function DashboardMyTasksWidget({ className = '' }) {
  const router = useRouter()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const loadTasks = useCallback(async () => {
    const userId = currentUserIds()[0]
    if (!userId) {
      setTasks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data } = await taskService.getAll({
        sort: 'scheduledDate:asc',
        'pagination[pageSize]': 100,
        'filters[assignee][id][$eq]': userId,
        populate: ['assignee', 'leadCompany', 'clientAccount', 'deal'],
      })
      setTasks(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('DashboardMyTasksWidget:', e)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const visible = useMemo(() => sortDashboardMyTasks(tasks), [tasks])
  const total = tasks.map(normalizeTask).filter(isOpenDashboardTask).length
  const showing = visible.length

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Task name',
        width: '25%',
        headerClassName: 'w-[28%] max-w-[220px]',
        className: 'align-middle py-3.5 max-w-[220px]',
        render: (_, row) => <DashboardTaskNameCell row={row} />,
      },
      {
        key: 'related',
        label: 'Related to',
        width: '28%',
        headerClassName: 'w-[28%]',
        className: 'align-middle py-3.5',
        render: (_, row) => <DashboardRelatedCell row={row} router={router} />,
      },
      {
        key: 'dueDate',
        label: 'Due date',
        width: '22%',
        headerClassName: 'w-[22%]',
        className: 'align-middle py-3.5',
        render: (_, row) => <DashboardDueDateCell row={row} />,
      },
      {
        key: 'status',
        label: 'Status',
        width: '22%',
        headerClassName: 'w-[22%]',
        className: 'align-middle py-3.5',
        render: (_, row) => (
          <TableCellTaskStatus
            status={isTaskOverdue(row) ? 'OVERDUE' : row.strapiStatus}
            className="whitespace-nowrap"
          />
        ),
      },
    ],
    [router]
  )

  return (
    <Card glass className={`flex h-full min-h-0 flex-col ${className}`}>
      <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
            {showing > 0 ? (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800">
                {showing}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">Open tasks assigned to you</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/clients/tasks')}
          className="shrink-0 text-xs font-semibold text-orange-600 hover:text-orange-700"
        >
          View all
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <LoadingSpinner size="md" message="Loading tasks…" />
        </div>
      ) : showing === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No open tasks"
          description="Completed and cancelled tasks are hidden here. View all tasks on Tasks."
          className="flex flex-1 flex-col justify-center py-12"
          action={
            <Button variant="primary" size="sm" onClick={() => router.push('/clients/tasks')}>
              Go to Tasks
            </Button>
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[2] [&_thead_th]:bg-gray-50/95 [&_thead_th]:backdrop-blur-sm">
            <Table
              columns={columns}
              data={visible}
              keyField="id"
              variant="modernEmbedded"
              className="table-fixed w-full"
              onRowClick={(row) => router.push(taskHref(row))}
              getRowClassName={(row) =>
                isTaskOverdue(row) ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-orange-50/50'
              }
            />
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 px-4 py-2.5">
            <p className="text-xs text-gray-600">
              Showing <span className="font-semibold text-gray-900">{showing}</span>
              {total > showing ? (
                <>
                  {' '}
                  of <span className="font-semibold text-gray-900">{total}</span>
                </>
              ) : null}{' '}
              task{showing !== 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={() => router.push('/clients/tasks')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Open tasks
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
