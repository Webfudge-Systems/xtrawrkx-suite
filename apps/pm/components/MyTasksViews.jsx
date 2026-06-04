'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Avatar, Button, Select, TableCellTaskStatusSelect, PM_TASK_STATUS_OPTIONS } from '@webfudge/ui'
import { ChevronRight, FolderKanban, GripVertical } from 'lucide-react'
import { pmTableSelectFillProps, PRIORITY_OPTIONS } from './PMStatusBadge'
import TaskAssigneesPicker from './TaskAssigneesPicker'
import { formatCalendarTableDate, isTaskDueOverdue } from '@webfudge/utils'

const KANBAN_STAGES = [
  { key: 'SCHEDULED', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'INTERNAL_REVIEW', label: 'In Review' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
]

const STAGE_STYLES = {
  SCHEDULED: {
    header: 'bg-blue-50 border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    dropActive: 'border-blue-400 bg-blue-50/80 shadow-lg shadow-blue-100',
  },
  IN_PROGRESS: {
    header: 'bg-amber-50 border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    dropActive: 'border-amber-400 bg-amber-50/80 shadow-lg shadow-amber-100',
  },
  INTERNAL_REVIEW: {
    header: 'bg-violet-50 border-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-100 text-violet-700',
    dropActive: 'border-violet-400 bg-violet-50/80 shadow-lg shadow-violet-100',
  },
  ON_HOLD: {
    header: 'bg-sky-50 border-sky-200',
    text: 'text-sky-700',
    badge: 'bg-sky-100 text-sky-700',
    dropActive: 'border-sky-400 bg-sky-50/80 shadow-lg shadow-sky-100',
  },
  COMPLETED: {
    header: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    dropActive: 'border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-100',
  },
  CANCELLED: {
    header: 'bg-red-50 border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    dropActive: 'border-red-400 bg-red-50/80 shadow-lg shadow-red-100',
  },
}

const PRIORITY_PILL = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-gray-100 text-gray-500',
}

export function isTaskOverdue(task) {
  return isTaskDueOverdue(task?.dueDate, task?.strapiStatus)
}

function formatShortDate(iso) {
  if (!iso) return ''
  const label = formatCalendarTableDate(iso)
  return label === 'N/A' ? '' : label
}

function TaskKanbanCardInner({ task, router }) {
  const overdue = isTaskOverdue(task)
  const pri = (task.priority || '').toLowerCase()

  return (
    <>
      <div className="flex items-start justify-between gap-1">
        <button
          type="button"
          onClick={() => router.push(`/tasks/${task.id}`)}
          className="line-clamp-2 flex-1 text-left text-sm font-semibold leading-snug text-gray-900 hover:text-orange-600"
        >
          {task.name || 'Untitled'}
        </button>
        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {task.project ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            const slugOrId = task.projectSlug || task.projectId
            if (slugOrId != null && slugOrId !== '') router.push(`/projects/${slugOrId}`)
          }}
          className="mt-1 inline-flex max-w-full items-center gap-1 truncate rounded-md border border-orange-100 bg-orange-50/80 px-2 py-0.5 text-left text-[11px] font-semibold text-orange-900 hover:border-orange-200"
        >
          <FolderKanban className="h-3 w-3 shrink-0 text-orange-600" />
          <span className="truncate">{task.project}</span>
        </button>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {task.priority ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              PRIORITY_PILL[pri] || 'bg-gray-100 text-gray-500'
            }`}
          >
            {task.priority}
          </span>
        ) : null}
        {task.dueDate ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Due {formatShortDate(task.dueDate)}
          </span>
        ) : null}
      </div>
    </>
  )
}

function TaskKanbanCard({ task, router, overlay = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(task.id),
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={[
        'group relative cursor-grab rounded-xl border bg-white p-3.5 transition-all active:cursor-grabbing',
        isDragging
          ? 'opacity-25 shadow-none'
          : 'border-gray-200 shadow-sm hover:border-orange-200 hover:shadow-md',
        overlay
          ? 'rotate-1 border-orange-300 shadow-2xl ring-2 ring-orange-400/30 !opacity-100'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <TaskKanbanCardInner task={task} router={router} />
    </div>
  )
}

function KanbanColumn({ stageKey, label, tasks, isOver, router }) {
  const { setNodeRef } = useDroppable({ id: stageKey })
  const style = STAGE_STYLES[stageKey] || STAGE_STYLES.SCHEDULED

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex min-h-[420px] min-w-[272px] max-w-[300px] flex-shrink-0 flex-col rounded-2xl border transition-all duration-150',
        isOver ? style.dropActive : 'border-gray-200 bg-gray-50/60',
      ].join(' ')}
    >
      <div
        className={`flex items-center justify-between rounded-t-2xl border-b px-4 py-3 ${style.header}`}
      >
        <h3 className={`text-[11px] font-extrabold uppercase tracking-widest ${style.text}`}>
          {label}
        </h3>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style.badge}`}>
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div
            className={`flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center transition-colors ${
              isOver ? 'border-current bg-white/80' : 'border-gray-200 bg-white/40'
            }`}
          >
            <p className="text-[11px] text-gray-400">
              {isOver ? 'Release to move here' : 'No tasks'}
            </p>
          </div>
        ) : (
          tasks.map((t) => <TaskKanbanCard key={t.id} task={t} router={router} />)
        )}
      </div>
    </div>
  )
}

/**
 * CRM pipeline-style kanban: columns by task status, drag cards to change status.
 */
export function MyTasksKanbanBoard({ tasks, router, updateTask, activeTab }) {
  const [activeId, setActiveId] = useState(null)
  const [overId, setOverId] = useState(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  )

  const stagesData = useMemo(() => {
    const by = {}
    KANBAN_STAGES.forEach(({ key }) => {
      by[key] = []
    })
    for (const t of tasks) {
      const k = t.strapiStatus && by[t.strapiStatus] != null ? t.strapiStatus : 'SCHEDULED'
      if (!by[k]) by[k] = []
      by[k].push(t)
    }
    return KANBAN_STAGES.map(({ key, label }) => ({
      key,
      label,
      tasks: by[key] || [],
    }))
  }, [tasks])

  const filteredStages = useMemo(() => {
    if (activeTab === 'all' || activeTab === 'MY_TASKS' || activeTab === 'OVERDUE') return stagesData
    return stagesData.filter((s) => s.key === activeTab)
  }, [stagesData, activeTab])

  const activeTask = useMemo(() => {
    if (!activeId) return null
    return tasks.find((t) => String(t.id) === activeId) ?? null
  }, [activeId, tasks])

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(String(active.id))
  }, [])

  const handleDragOver = useCallback(({ over }) => {
    setOverId(over?.id ?? null)
  }, [])

  const handleDragEnd = useCallback(
    async ({ active, over }) => {
      setActiveId(null)
      setOverId(null)
      if (!over) return
      const taskId = String(active.id)
      const newStatus = String(over.id)
      const task = tasks.find((t) => String(t.id) === taskId)
      if (!task || task.strapiStatus === newStatus) return
      await updateTask(task, { status: newStatus })
    },
    [tasks, updateTask]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-4 pb-5 md:p-5">
        {filteredStages.map(({ key, label, tasks: colTasks }) => (
          <KanbanColumn
            key={key}
            stageKey={key}
            label={label}
            tasks={colTasks}
            isOver={overId === key}
            router={router}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeTask ? (
          <div className="w-[272px] rotate-1 rounded-xl border border-orange-300 bg-white p-3.5 shadow-2xl ring-2 ring-orange-400/30">
            <TaskKanbanCardInner task={activeTask} router={router} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

/**
 * List grouped by workflow status (same order as kanban columns).
 */
export function MyTasksListByStatus({ tasks, router, updateTask, savingId }) {
  const grouped = useMemo(() => {
    const by = {}
    KANBAN_STAGES.forEach(({ key }) => {
      by[key] = []
    })
    for (const t of tasks) {
      const k = t.strapiStatus && by[t.strapiStatus] != null ? t.strapiStatus : 'SCHEDULED'
      if (!by[k]) by[k] = []
      by[k].push(t)
    }
    return KANBAN_STAGES.map(({ key, label }) => ({
      key,
      label,
      tasks: by[key] || [],
    })).filter((g) => g.tasks.length > 0)
  }, [tasks])

  if (!tasks.length) {
    return (
      <div className="border-t border-gray-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-700">No tasks found</h3>
        <p className="mt-2 text-sm text-gray-500">Try another tab or clear search.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {grouped.map((section) => (
        <section key={section.key} className="px-4 py-5 md:px-6">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-500">
              {section.label}
            </h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
              {section.tasks.length}
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-[980px] w-full table-fixed">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="w-[170px] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                    Update status
                  </th>
                  <th className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                    Task
                  </th>
                  <th className="w-[210px] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                    Project
                  </th>
                  <th className="w-[160px] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                    Priority
                  </th>
                  <th className="w-[150px] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                    Assignees
                  </th>
                  <th className="w-[120px] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600">
                    Due date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {section.tasks.map((row) => {
                  const initial = (row.name || 'T').trim().charAt(0).toUpperCase() || 'T'
                  const overdue = isTaskOverdue(row)
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/70">
                      <td className="px-3 py-2.5 align-top">
                        <TableCellTaskStatusSelect
                          status={row.strapiStatus}
                          onStatusChange={(status) => updateTask(row, { status })}
                          saving={savingId === row.id}
                          options={PM_TASK_STATUS_OPTIONS}
                          fillStyle="pm"
                        />
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <button
                          type="button"
                          onClick={() => router.push(`/tasks/${row.id}`)}
                          className="flex min-w-0 items-start gap-3 text-left"
                        >
                          <Avatar
                            fallback={initial}
                            alt={row.name}
                            size="sm"
                            className="flex-shrink-0 bg-gray-600 text-white"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-gray-900 hover:text-orange-600">
                              {row.name}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                              {(row.description || 'No description').trim()}
                              {row.recurrenceSummary ? ` · ${row.recurrenceSummary}` : ''}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {row.project ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              const slugOrId = row.projectSlug || row.projectId
                              if (slugOrId != null && slugOrId !== '')
                                router.push(`/projects/${slugOrId}`)
                            }}
                            className="inline-flex max-w-[190px] items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-900 shadow-sm hover:border-orange-300"
                          >
                            <FolderKanban className="h-3.5 w-3.5 shrink-0 text-orange-600" />
                            <span className="truncate">{row.project}</span>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={row.priority}
                            options={PRIORITY_OPTIONS}
                            onChange={(priority) => updateTask(row, { priority })}
                            disabled={savingId === row.id}
                            {...pmTableSelectFillProps(row.priority, 'priority')}
                            containerClassName="min-w-[120px]"
                            placeholder="Priority"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <TaskAssigneesPicker
                          userIds={row.assigneeUserIds || []}
                          assignees={row.assignees}
                          users={[]}
                          disabled
                          compact
                        />
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div
                          className={`text-xs ${overdue ? 'text-red-700' : 'text-gray-600'}`}
                        >
                          <p className="font-semibold">
                            {row.dueDate ? formatShortDate(row.dueDate) : '—'}
                          </p>
                          <p className="text-[10px] text-gray-400">Due</p>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * Simple Gantt-style strip: horizontal bars from start → due (or single milestone).
 */
export function MyTasksTimelineView({ tasks, router }) {
  const { range, rows, unscheduled } = useMemo(() => {
    const withDates = []
    const unsched = []
    const times = []
    for (const t of tasks) {
      const s = t.startDate ? new Date(t.startDate).getTime() : null
      const d = t.dueDate ? new Date(t.dueDate).getTime() : null
      const sOk = s != null && !Number.isNaN(s)
      const dOk = d != null && !Number.isNaN(d)
      if (!sOk && !dOk) {
        unsched.push(t)
        continue
      }
      let startMs = sOk ? s : d
      let endMs = dOk ? d : s
      if (endMs < startMs) [startMs, endMs] = [endMs, startMs]
      const dayMs = 86400000
      if (endMs === startMs) endMs = startMs + dayMs * 0.5
      times.push(startMs, endMs)
      withDates.push({ task: t, startMs, endMs })
    }
    if (!times.length) {
      return { range: null, rows: [], unscheduled: tasks }
    }
    const pad = 86400000
    const minT = Math.min(...times) - pad
    const maxT = Math.max(...times) + pad
    const span = Math.max(maxT - minT, 86400000)
    return { range: { minT, maxT, span }, rows: withDates, unscheduled: unsched }
  }, [tasks])

  if (!tasks.length) {
    return (
      <div className="border-t border-gray-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-700">No tasks found</h3>
        <p className="mt-2 text-sm text-gray-500">Try another tab or clear search.</p>
      </div>
    )
  }

  if (!range) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-gray-600">
          No start or due dates on these tasks. Add dates on task detail to see the timeline.
        </p>
        <ul className="space-y-2">
          {unscheduled.map((t) => (
            <li key={t.id}>
              <Button
                variant="ghost"
                className="h-auto justify-start px-2 py-1 text-left font-medium"
                onClick={() => router.push(`/tasks/${t.id}`)}
              >
                {t.name}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const tickCount = 6
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const ts = range.minT + (range.span * i) / (tickCount - 1)
    return {
      ts,
      label: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }
  })

  const trackMinWidth = 520

  return (
    <div className="overflow-x-auto p-4 md:p-6">
      <div className="min-w-[720px] space-y-1">
        <div className="mb-2 flex pl-[200px]">
          <div className="relative h-6 flex-1" style={{ minWidth: trackMinWidth }}>
            {ticks.map((tk, i) => (
              <span
                key={i}
                className="absolute top-0 -translate-x-1/2 text-[10px] font-semibold text-gray-400"
                style={{ left: `${(100 * (tk.ts - range.minT)) / range.span}%` }}
              >
                {tk.label}
              </span>
            ))}
          </div>
        </div>
        {rows.map(({ task: t, startMs, endMs }) => {
          const left = ((startMs - range.minT) / range.span) * 100
          const width = Math.max(((endMs - startMs) / range.span) * 100, 1.2)
          const overdue = isTaskOverdue(t)
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 border-b border-gray-50 py-2.5 last:border-0"
            >
              <button
                type="button"
                onClick={() => router.push(`/tasks/${t.id}`)}
                className="w-[188px] shrink-0 truncate text-left text-sm font-semibold text-gray-900 hover:text-orange-600"
              >
                {t.name}
              </button>
              <div
                className="relative h-8 flex-1 rounded-md bg-gray-100/80"
                style={{ minWidth: trackMinWidth }}
              >
                <button
                  type="button"
                  onClick={() => router.push(`/tasks/${t.id}`)}
                  className={`absolute top-1/2 h-5 -translate-y-1/2 rounded-md shadow-sm transition hover:opacity-95 ${
                    overdue
                      ? 'bg-gradient-to-r from-red-400 to-red-500'
                      : 'bg-gradient-to-r from-orange-400 to-pink-400'
                  }`}
                  style={{ left: `${left}%`, width: `${width}%`, minWidth: 8 }}
                  title={`${formatShortDate(t.startDate) || '—'} → ${formatShortDate(t.dueDate) || '—'}`}
                />
              </div>
            </div>
          )
        })}
      </div>
      {unscheduled.length > 0 ? (
        <div className="mt-8 border-t border-gray-200 pt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
            No schedule
          </p>
          <ul className="flex flex-wrap gap-2">
            {unscheduled.map((t) => (
              <li key={t.id}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-medium"
                  onClick={() => router.push(`/tasks/${t.id}`)}
                >
                  {t.name}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
