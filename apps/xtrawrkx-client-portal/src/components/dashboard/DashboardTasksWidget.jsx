'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  Avatar,
  EmptyState,
  LoadingSpinner,
  Table,
  TableCellCreated,
  TableCellTaskStatus,
  TableCellTitleSubtitle,
  TabsWithActions,
} from '@webfudge/ui'
import { isTaskDueOverdue } from '@webfudge/utils'
import {
  CheckSquare,
  ChevronRight,
  Eye,
  Flag,
  FolderKanban,
  Link2,
  Plus,
} from 'lucide-react'

const TAB_KEYS = {
  ALL: 'all',
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
}

const TODO_STATUSES = new Set(['ASSIGNED', 'ACCEPTED', 'SCHEDULED', 'PLANNED'])
const ONGOING_STATUSES = new Set(['IN_PROGRESS', 'ACTIVE'])
const COMPLETED_STATUSES = new Set(['COMPLETED', 'DONE', 'APPROVED'])

function isTaskOverdue(task) {
  return isTaskDueOverdue(task?.scheduledDate, task?.strapiStatus)
}

function getPriorityFlagClass(priority) {
  const key = (priority || 'medium').toLowerCase()
  if (key === 'high' || key === 'urgent') return 'fill-red-500 text-red-500'
  if (key === 'medium') return 'fill-amber-500 text-amber-500'
  return 'fill-emerald-500 text-emerald-500'
}

function getPriorityBadge(priority) {
  const key = (priority || 'medium').toLowerCase()
  if (key === 'high' || key === 'urgent') return 'bg-red-50 text-red-700 border border-red-200'
  if (key === 'medium') return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
}

function filterTasksByTab(tasks, tab) {
  if (tab === TAB_KEYS.ALL) return tasks
  return tasks.filter((task) => {
    const status = (task.strapiStatus || '').toUpperCase()
    if (tab === TAB_KEYS.UPCOMING) return TODO_STATUSES.has(status)
    if (tab === TAB_KEYS.ONGOING) return ONGOING_STATUSES.has(status)
    if (tab === TAB_KEYS.COMPLETED) return COMPLETED_STATUSES.has(status)
    return true
  })
}

function countByTab(tasks) {
  const all = tasks.length
  let upcoming = 0
  let ongoing = 0
  let completed = 0
  for (const task of tasks) {
    const status = (task.strapiStatus || '').toUpperCase()
    if (TODO_STATUSES.has(status)) upcoming += 1
    if (ONGOING_STATUSES.has(status)) ongoing += 1
    if (COMPLETED_STATUSES.has(status)) completed += 1
  }
  return { all, upcoming, ongoing, completed }
}

export default function DashboardTasksWidget({
  tasks = [],
  loading = false,
  onAddTask,
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(TAB_KEYS.ALL)

  const tabCounts = useMemo(() => countByTab(tasks), [tasks])
  const filteredTasks = useMemo(
    () => filterTasksByTab(tasks, activeTab),
    [tasks, activeTab]
  )

  const tabItems = useMemo(
    () => [
      { key: TAB_KEYS.ALL, label: 'All', badge: tabCounts.all },
      { key: TAB_KEYS.UPCOMING, label: 'Upcoming', badge: tabCounts.upcoming },
      { key: TAB_KEYS.ONGOING, label: 'Ongoing', badge: tabCounts.ongoing },
      { key: TAB_KEYS.COMPLETED, label: 'Completed', badge: tabCounts.completed },
    ],
    [tabCounts]
  )

  const columns = useMemo(
    () => [
      {
        key: 'name',
        label: 'Task name',
        width: '28%',
        className: 'align-middle py-3.5',
        render: (_, row) => {
          const initial = (row.name || 'T').trim().charAt(0).toUpperCase()
          const overdue = isTaskOverdue(row)
          return (
            <div className="flex min-w-0 items-start gap-3">
              <Avatar
                fallback={initial}
                alt={row.name}
                size="sm"
                className={`mt-0.5 shrink-0 text-white ${overdue ? 'bg-red-600' : 'bg-gray-600'}`}
              />
              <div className="min-w-0 flex-1">
                <TableCellTitleSubtitle
                  title={row.name || 'Untitled Task'}
                  subtitle={row.description || 'No description'}
                />
                {row.clientActionRequired ? (
                  <span className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Action required
                  </span>
                ) : null}
              </div>
            </div>
          )
        },
      },
      {
        key: 'assignee',
        label: 'Assignee',
        width: '16%',
        className: 'align-middle py-3.5',
        render: (_, row) => {
          const assignee = row.assignee
          if (!assignee?.name) {
            return <span className="text-sm text-gray-400">Unassigned</span>
          }
          return (
            <div className="flex items-center gap-2">
              <Avatar
                src={assignee.avatar || undefined}
                fallback={assignee.name.charAt(0).toUpperCase()}
                alt={assignee.name}
                size="sm"
                className="shrink-0 bg-gray-600 text-white"
              />
              <span className="truncate text-xs font-semibold text-gray-900">{assignee.name}</span>
            </div>
          )
        },
      },
      {
        key: 'dueDate',
        label: 'Due date',
        width: '14%',
        className: 'align-middle py-3.5',
        render: (_, row) => (
          <div className={isTaskOverdue(row) ? '[&_.font-semibold]:text-red-700 [&_.text-gray-500]:text-red-600/90' : ''}>
            {row.scheduledDate ? (
              <TableCellCreated dateString={row.scheduledDate} dateMode="calendar" />
            ) : (
              <span className="text-sm text-gray-400">Not set</span>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '16%',
        className: 'align-middle py-3.5',
        render: (_, row) => (
          <TableCellTaskStatus
            status={row.strapiStatus}
            options={[{ value: row.strapiStatus, label: row.status }]}
          />
        ),
      },
      {
        key: 'priority',
        label: 'Priority',
        width: '12%',
        className: 'align-middle py-3.5',
        render: (_, row) => {
          const priority = (row.priority || 'medium').toLowerCase()
          const label = priority.charAt(0).toUpperCase() + priority.slice(1)
          return (
            <div className="flex items-center gap-1.5">
              <Flag className={`h-3.5 w-3.5 shrink-0 ${getPriorityFlagClass(priority)}`} strokeWidth={2} />
              <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${getPriorityBadge(priority)}`}>
                {label}
              </span>
            </div>
          )
        },
      },
      {
        key: 'project',
        label: 'Project',
        width: '18%',
        className: 'align-middle py-3.5',
        render: (_, row) =>
          row.project ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/projects/${row.project.id}`)
              }}
              title={`Open project: ${row.project.name}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-orange-200/90 bg-orange-50 px-2.5 py-1.5 text-left text-xs font-semibold text-orange-900 shadow-sm transition hover:border-orange-300 hover:bg-orange-100"
            >
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-orange-600" aria-hidden />
              <span className="min-w-0 truncate">{row.project.name}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-orange-400" aria-hidden />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-2.5 py-1.5 text-xs font-medium text-gray-500">
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
              No project
            </span>
          ),
      },
      {
        key: 'actions',
        label: 'Actions',
        resizable: false,
        defaultWidth: '100px',
        className: 'align-middle whitespace-nowrap py-3.5',
        render: (_, row) => (
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-orange-600 hover:bg-orange-50"
              title="View task"
              onClick={() => router.push(`/tasks/${row.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-gray-500 hover:bg-gray-100"
              title="Copy link"
              onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/tasks/${row.id}`)}
            >
              <Link2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  )

  return (
    <Card
      outlined
      title="Tasks"
      subtitle="Track your current tasks and progress"
      actions={
        <Button type="button" size="sm" onClick={onAddTask} className="gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      }
    >
      <TabsWithActions
        variant="pill"
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-4"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="md" message="Loading tasks…" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={
            activeTab === TAB_KEYS.ALL
              ? 'Get started by creating your first task'
              : `No ${activeTab} tasks available`
          }
          className="py-12"
          action={
            activeTab === TAB_KEYS.ALL ? (
              <Button variant="primary" size="sm" onClick={onAddTask}>
                New Task
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => router.push('/tasks')}>
                View all tasks
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="max-h-[420px] overflow-y-auto overscroll-contain [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-[2] [&_thead_th]:bg-gray-50/95 [&_thead_th]:backdrop-blur-sm">
            <Table
              columns={columns}
              data={filteredTasks}
              keyField="id"
              variant="modernEmbedded"
              className="w-full"
              onRowClick={(row) => router.push(`/tasks/${row.id}`)}
              getRowClassName={(row) =>
                isTaskOverdue(row) ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-orange-50/50'
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 px-4 py-2.5">
            <p className="text-xs text-gray-600">
              Showing <span className="font-semibold text-gray-900">{filteredTasks.length}</span>
              {tasks.length > filteredTasks.length ? (
                <>
                  {' '}
                  of <span className="font-semibold text-gray-900">{tasks.length}</span>
                </>
              ) : null}{' '}
              task{filteredTasks.length !== 1 ? 's' : ''}
            </p>
            <button
              type="button"
              onClick={() => router.push('/tasks')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              View all tasks
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
