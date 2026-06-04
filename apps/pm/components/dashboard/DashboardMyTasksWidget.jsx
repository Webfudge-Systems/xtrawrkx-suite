'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  Avatar,
  EmptyState,
  LoadingSpinner,
  Table,
  TableCellCreated,
  formatRelativeTime,
  formatTableDate,
} from '@webfudge/ui'
import { CheckSquare, ChevronRight, FolderKanban } from 'lucide-react'
import { isTaskDueOverdue, parseDisplayDate } from '@webfudge/utils'
import { PMStatusBadge } from '../PMStatusBadge'
import { usePmTableSort } from '../../hooks/usePmTableSort'

const DASHBOARD_TASK_SORT_STORAGE_KEY = 'pm.dashboard.myTasks.sort'

const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED'])

export function isOpenDashboardTask(task) {
  return task && !TERMINAL_STATUSES.has(task.strapiStatus)
}

/** Open tasks assigned to the user — overdue first, then due date, then recently updated. */
export function sortDashboardMyTasks(tasks) {
  const list = (tasks || []).filter(isOpenDashboardTask)
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
  return list
}

function isTaskOverdue(task) {
  return isTaskDueOverdue(task?.dueDate, task?.strapiStatus)
}

function taskSubtitle(row) {
  const parts = []
  const desc = (row.description || '').trim()
  if (desc) parts.push(desc)
  if (row.recurrenceSummary) parts.push(row.recurrenceSummary)
  return parts.length ? parts.join(' · ') : null
}

function DashboardTaskNameCell({ row }) {
  const initial = (row.name || 'T').trim().charAt(0).toUpperCase() || 'T'
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
          {row.name}
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

function DashboardProjectCell({ row, router }) {
  if (row.project) {
    const slugOrId = row.projectSlug || row.projectId
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          if (slugOrId != null && slugOrId !== '') {
            router.push(`/projects/${slugOrId}`)
          }
        }}
        title={`Open project: ${row.project}`}
        className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-orange-200/90 bg-orange-50 px-2.5 py-1.5 text-left text-xs font-semibold text-orange-900 shadow-sm transition hover:border-orange-300 hover:bg-orange-100"
      >
        <FolderKanban className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
        <span className="min-w-0 truncate">{row.project}</span>
        {slugOrId ? (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden />
        ) : null}
      </button>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-2.5 py-1.5 text-xs font-medium text-gray-500">
      <FolderKanban className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
      No project
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

export default function DashboardMyTasksWidget({
  tasks = [],
  totalCount,
  loading = false,
  className = '',
}) {
  const router = useRouter()
  const defaultOrdered = useMemo(() => sortDashboardMyTasks(tasks), [tasks])
  const {
    sortedData: userSorted,
    bindSortableColumns,
    hasActiveSort,
  } = usePmTableSort({
    entity: 'task',
    storageKey: DASHBOARD_TASK_SORT_STORAGE_KEY,
    data: defaultOrdered,
  })
  const visible = hasActiveSort ? userSorted : defaultOrdered
  const total = typeof totalCount === 'number' ? totalCount : (tasks?.length ?? 0)
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
        key: 'project',
        label: 'Project',
        width: '28%',
        headerClassName: 'w-[28%]',
        className: 'align-middle py-3.5',
        render: (_, row) => <DashboardProjectCell row={row} router={router} />,
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
          <PMStatusBadge
            status={isTaskOverdue(row) ? 'OVERDUE' : row.strapiStatus}
            type="task"
            className="whitespace-nowrap"
          />
        ),
      },
    ],
    [router]
  )

  const sortableColumns = useMemo(
    () => bindSortableColumns(columns),
    [columns, bindSortableColumns]
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
          onClick={() => router.push('/my-tasks')}
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
          description="Completed and cancelled tasks are hidden here. View all tasks on My Tasks."
          className="flex flex-1 flex-col justify-center py-12"
          action={
            <Button variant="primary" size="sm" onClick={() => router.push('/my-tasks')}>
              Go to My Tasks
            </Button>
          }
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[2] [&_thead_th]:bg-gray-50/95 [&_thead_th]:backdrop-blur-sm">
            <Table
              columns={sortableColumns}
              data={visible}
              keyField="id"
              variant="modernEmbedded"
              className="table-fixed w-full"
              onRowClick={(row) => router.push(`/tasks/${row.id}`)}
              getRowClassName={(row) =>
                [
                  isTaskOverdue(row) ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-orange-50/50',
                ].join(' ')
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
              onClick={() => router.push('/my-tasks')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              Open My Tasks
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
