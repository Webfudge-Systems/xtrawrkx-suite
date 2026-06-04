'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { BarChart3, Info, ChevronRight, Table2 } from 'lucide-react'
import {
  Card,
  TabsWithActions,
  Table,
  Badge,
  EmptyState,
  LoadingSpinner,
  TableCellText,
  TableCellCreated,
  TableCellOwner,
  TableCellTaskStatus,
} from '@webfudge/ui'
import { fetchManagerDashboardData } from '../../../lib/api/dashboardDataService'
import { GradientStackedBarChart } from '@webfudge/ui'

const TERMINAL = new Set(['COMPLETED', 'CANCELLED'])
const TABLE_LIMIT = 50

const BUCKET_BADGE = {
  overdue: { variant: 'danger', label: 'Overdue' },
  pending: { variant: 'pending', label: 'Pending' },
  completed: { variant: 'completed', label: 'Completed' },
}

const BUCKET_SORT = { overdue: 0, pending: 1, completed: 2 }

function assigneeId(record) {
  const a = record?.assignedTo ?? record?.assignee
  if (a == null) return null
  if (typeof a === 'object') return a.id ?? a.documentId
  return a
}

function assigneeRecord(record) {
  const a = record?.assignedTo ?? record?.assignee
  return typeof a === 'object' ? a : null
}

function taskBucket(task) {
  const st = String(task?.status ?? '').toUpperCase()
  if (st === 'COMPLETED') return 'completed'
  if (TERMINAL.has(st)) return 'completed'
  const due = task?.scheduledDate || task?.dueDate
  if (due && new Date(due).getTime() < new Date().setHours(0, 0, 0, 0)) return 'overdue'
  return 'pending'
}

function taskHref(task) {
  const lc = task?.leadCompany
  if (lc && (lc.id != null || lc.documentId != null)) {
    return `/sales/lead-companies/${lc.id ?? lc.documentId}`
  }
  return '/clients/tasks'
}

function BucketBadge({ bucket }) {
  const cfg = BUCKET_BADGE[bucket] || BUCKET_BADGE.pending
  return (
    <Badge variant={cfg.variant} className="whitespace-nowrap text-[10px] font-semibold">
      {cfg.label}
    </Badge>
  )
}

function TaskDistributionChart({ data }) {
  return (
    <GradientStackedBarChart
      data={data}
      height={300}
      showSummary
      emptyMessage="Assign tasks to see distribution."
    />
  )
}

function TaskDistributionTable({ rows }) {
  if (!rows.length) {
    return (
      <EmptyState
        icon={Table2}
        title="No team tasks"
        description="Tasks assigned to team members will appear here."
        className="py-10"
      />
    )
  }

  const columns = [
    {
      key: 'name',
      label: 'Task',
      width: 220,
      render: (_, row) => (
        <Link
          href={row.href}
          className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-orange-600"
          onClick={(e) => e.stopPropagation()}
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'assignee',
      label: 'Assignee',
      width: 140,
      render: (_, row) =>
        row.assigneeUser ? (
          <TableCellOwner user={row.assigneeUser} />
        ) : (
          <TableCellText value={row.assigneeLabel} />
        ),
    },
    {
      key: 'bucket',
      label: 'Workload',
      width: 110,
      render: (_, row) => <BucketBadge bucket={row.bucket} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      render: (_, row) => <TableCellTaskStatus status={row.status} compact />,
    },
    {
      key: 'due',
      label: 'Due',
      width: 120,
      render: (_, row) => <TableCellCreated dateString={row.due} dateMode="calendar" />,
    },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <Table
        columns={columns}
        data={rows}
        variant="modernEmbedded"
        className="text-sm"
        keyField="id"
      />
      {rows.length >= TABLE_LIMIT ? (
        <p className="border-t border-gray-100 bg-gray-50/80 px-4 py-2 text-center text-xs text-gray-500">
          Showing first {TABLE_LIMIT} tasks.{' '}
          <Link href="/clients/tasks" className="font-semibold text-orange-600 hover:text-orange-700">
            View all tasks
          </Link>
        </p>
      ) : null}
    </div>
  )
}

export default function TeamTaskDistributionWidget({ className = '' }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ tasks: [], nameById: new Map() })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const d = await fetchManagerDashboardData()
      if (!cancelled) {
        setData(d)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const { taskDistribution, tableRows, taskCount } = useMemo(() => {
    const nameById = data.nameById || new Map()
    const label = (id) => nameById.get(String(id)) || `Member ${id}`

    const byMember = new Map()
    const rows = []

    for (const task of data.tasks) {
      const id = assigneeId(task)
      const bucket = taskBucket(task)
      const assigneeUser = assigneeRecord(task)

      rows.push({
        id: task.id ?? task.documentId ?? `${task.name}-${task.createdAt}`,
        name: (task.name || '').trim() || `Task #${task.id ?? '—'}`,
        assigneeLabel: id != null ? label(id) : 'Unassigned',
        assigneeUser,
        status: task.status,
        due: task.scheduledDate || task.dueDate,
        bucket,
        href: taskHref(task),
      })

      if (id == null) continue
      const key = String(id)
      if (!byMember.has(key)) {
        byMember.set(key, { name: label(key), overdue: 0, pending: 0, completed: 0 })
      }
      byMember.get(key)[bucket] += 1
    }

    rows.sort((a, b) => {
      const bd = (BUCKET_SORT[a.bucket] ?? 9) - (BUCKET_SORT[b.bucket] ?? 9)
      if (bd !== 0) return bd
      const ad = a.due ? new Date(a.due).getTime() : Infinity
      const bd2 = b.due ? new Date(b.due).getTime() : Infinity
      return ad - bd2
    })

    return {
      taskDistribution: [...byMember.values()].slice(0, 8),
      tableRows: rows.slice(0, TABLE_LIMIT),
      taskCount: data.tasks.length,
    }
  }, [data])

  const [activeTab, setActiveTab] = useState('graph')

  const tabItems = [
    { id: 'graph', label: 'Graph', badge: taskCount },
    { id: 'table', label: 'Tasks table', badge: taskCount },
  ]

  return (
    <Card className={`flex flex-col p-6 shadow-lg ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Team task distribution</h2>
            <span title="Overdue, pending, and completed by assignee">
              <Info className="h-4 w-4 text-gray-400" aria-hidden />
            </span>
          </div>
          <p className="mt-0.5 text-sm text-gray-600">
            Overdue, pending, and completed by assignee
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 shadow-sm">
            <BarChart3 className="h-5 w-5 text-orange-600" aria-hidden />
          </div>
          <Link
            href="/clients/tasks"
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-orange-200 hover:text-orange-600"
          >
            View all
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <TabsWithActions
          variant="pill"
          pillTrack="hug"
          tabs={tabItems}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {activeTab === 'graph' ? (
        loading ? (
          <div className="flex h-[21rem] items-center justify-center rounded-xl border border-gray-100 bg-gray-50/50">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <TaskDistributionChart data={taskDistribution} />
        )
      ) : loading ? (
        <div className="flex h-72 items-center justify-center">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <TaskDistributionTable rows={tableRows} />
      )}
    </Card>
  )
}
