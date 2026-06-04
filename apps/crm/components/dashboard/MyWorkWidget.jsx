'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, Button, EmptyState, LoadingSpinner } from '@webfudge/ui'
import { CheckSquare, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { calendarDayDiff, parseDisplayDate, startOfLocalDay } from '@webfudge/utils'
import { fetchMyWorkSummary } from '../../lib/api/taskService'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const TASK_LIMIT = 3
const TASK_ROW_MIN_H = '3.25rem'
/** Fixed height for 3 deadline rows — matches PM UpcomingDeadlinesWidget */
const TASKS_SECTION_MIN_H = `calc(${TASK_LIMIT} * ${TASK_ROW_MIN_H})`
const CALENDAR_SECTION_MIN_H = '14rem'

const DEADLINE_DOT_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-violet-500']

function daysUntil(dueDate) {
  const due = parseDisplayDate(dueDate)
  if (!due) return NaN
  return calendarDayDiff(due)
}

function formatDaysLeft(days) {
  if (Number.isNaN(days)) return 'No date'
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  if (days === 1) return '1d left'
  return `${days}d left`
}

function dateKey(d) {
  const x = parseDisplayDate(d)
  if (!x) return ''
  const local = startOfLocalDay(x)
  return `${local.getFullYear()}-${local.getMonth()}-${local.getDate()}`
}

function monthMatrix(viewYear, viewMonth) {
  const first = new Date(viewYear, viewMonth, 1)
  const startPad = first.getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startPad; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function flattenMyWork(myWork) {
  const byId = new Map()
  for (const key of ['overdue', 'today', 'upcoming']) {
    for (const task of myWork[key]?.items ?? []) {
      if (task?.id != null) byId.set(task.id, task)
    }
  }
  return [...byId.values()]
    .map((task) => ({
      ...task,
      dueDate: task.scheduledDate || null,
      daysLeft: task.scheduledDate ? daysUntil(task.scheduledDate) : NaN,
    }))
    .sort((a, b) => {
      const aHas = Boolean(a.dueDate)
      const bHas = Boolean(b.dueDate)
      if (aHas !== bHas) return aHas ? -1 : 1
      if (aHas && bHas) {
        const aT = parseDisplayDate(a.dueDate)?.getTime() ?? 0
        const bT = parseDisplayDate(b.dueDate)?.getTime() ?? 0
        if (aT !== bT) return aT - bT
      }
      return String(a.name || '').localeCompare(String(b.name || ''))
    })
}

function taskHref(t) {
  const lc = t.leadCompany
  if (lc && lc.id != null) return `/sales/lead-companies/${lc.id}`
  return '/clients/tasks'
}

function taskContext(task) {
  const lc = task.leadCompany
  if (lc?.companyName) return lc.companyName
  return 'CRM task'
}

export default function MyWorkWidget({ className = '' }) {
  const router = useRouter()
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const loadMyWork = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchMyWorkSummary()
      setTasks(flattenMyWork(data))
    } catch (e) {
      console.error('Dashboard my work:', e)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMyWork()
    const interval = setInterval(loadMyWork, 60000)
    return () => clearInterval(interval)
  }, [loadMyWork])

  const upcoming = useMemo(() => tasks.slice(0, TASK_LIMIT), [tasks])

  const deadlineDays = useMemo(() => {
    const map = new Map()
    tasks.forEach((t, i) => {
      const key = dateKey(t.dueDate)
      if (!key) return
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(i % DEADLINE_DOT_COLORS.length)
    })
    return map
  }, [tasks])

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })

  const cells = monthMatrix(viewYear, viewMonth)
  const calendarRowCount = Math.max(1, Math.ceil(cells.length / 7))

  const taskSlots = useMemo(() => {
    const slots = upcoming.map((task) => ({ type: 'task', task }))
    while (slots.length < TASK_LIMIT) {
      slots.push({ type: 'empty' })
    }
    return slots
  }, [upcoming])

  const shiftMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  return (
    <Card glass className={`flex h-full min-h-0 flex-col ${className}`}>
      <div className="mb-3 flex shrink-0 items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">My work</h2>
          <p className="mt-0.5 text-xs text-gray-500">Next {TASK_LIMIT} scheduled tasks</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/clients/tasks')}
          className="shrink-0 text-xs"
        >
          View all tasks
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center py-8">
          <LoadingSpinner size="md" message="Loading tasks…" />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Deadlines — fixed row band (~45% in PM); rows grow when panel is tall */}
          <div
            className="flex min-h-0 flex-[1] flex-col divide-y divide-gray-100"
            style={{ minHeight: TASKS_SECTION_MIN_H }}
          >
            {upcoming.length === 0 ? (
              <div
                className="flex flex-1 items-center justify-center p-4"
                style={{ minHeight: TASKS_SECTION_MIN_H }}
              >
                <EmptyState
                  icon={CheckSquare}
                  title="No upcoming tasks"
                  description="Tasks assigned to you will appear here."
                  className="py-4"
                />
              </div>
            ) : (
              taskSlots.map((slot, index) => {
                if (slot.type === 'empty') {
                  return (
                    <div
                      key={`task-empty-${index}`}
                      className="flex flex-1 items-center justify-center bg-gray-50/40 px-3"
                      style={{ minHeight: TASK_ROW_MIN_H }}
                      aria-hidden
                    />
                  )
                }

                const task = slot.task
                const due = task.dueDate ? parseDisplayDate(task.dueDate) : null
                const month = due
                  ? due.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
                  : '—'
                const day = due ? due.getDate() : '·'
                const urgent = !Number.isNaN(task.daysLeft) && task.daysLeft <= 2

                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => router.push(taskHref(task))}
                    className="flex w-full flex-1 items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-orange-50/40"
                    style={{ minHeight: TASK_ROW_MIN_H }}
                  >
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wide ${
                          urgent ? 'text-red-600' : 'text-gray-500'
                        }`}
                      >
                        {month}
                      </span>
                      <span className="text-sm font-bold leading-none text-gray-900">{day}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
                        {task.name || `Task #${task.id}`}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-gray-500">{taskContext(task)}</p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold tabular-nums ${
                        urgent ? 'text-red-600' : 'text-gray-500'
                      }`}
                    >
                      {formatDaysLeft(task.daysLeft)}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {/* Mini calendar — fills remaining height (matches PM flex-[1.15]) */}
          <div
            className="flex min-h-0 flex-[1.15] flex-col border-t border-gray-100 bg-gradient-to-b from-orange-50/50 to-white px-3 pb-3 pt-2.5"
            style={{ minHeight: CALENDAR_SECTION_MIN_H }}
          >
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <Link
                href="/clients/tasks"
                className="group flex min-w-0 items-center gap-1.5 text-left"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600 ring-1 ring-orange-200/80">
                  <Calendar className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="truncate text-sm font-semibold text-gray-900 group-hover:text-orange-700">
                  {monthLabel}
                </span>
              </Link>
              <div className="flex shrink-0 items-center rounded-lg border border-gray-200/80 bg-white p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="rounded-md p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="mb-1 grid shrink-0 grid-cols-7 gap-px text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {WEEKDAYS.map((w, i) => (
                <div key={`${w}-${i}`} className="py-0.5">
                  {w}
                </div>
              ))}
            </div>

            <div
              className="grid min-h-0 flex-1 grid-cols-7 gap-1 rounded-lg bg-gray-100/80 p-1"
              style={{ gridTemplateRows: `repeat(${calendarRowCount}, minmax(2rem, 1fr))` }}
            >
              {cells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`e-${idx}`} className="min-h-[2rem] rounded-md" />
                }
                const key = dateKey(cell)
                const dots = deadlineDays.get(key) || []
                const isToday = dateKey(today) === key
                const hasDeadline = dots.length > 0

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => router.push('/clients/tasks')}
                    className={`relative flex min-h-[2rem] items-center justify-center rounded-md text-xs font-medium transition ${
                      isToday
                        ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-200'
                        : hasDeadline
                          ? 'bg-white text-gray-900 hover:bg-orange-50'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    title={
                      hasDeadline ? `${cell.getDate()} — scheduled task` : String(cell.getDate())
                    }
                  >
                    {cell.getDate()}
                    {hasDeadline && !isToday ? (
                      <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                        {dots.slice(0, 3).map((colorIdx, i) => (
                          <span
                            key={i}
                            className={`h-1 w-1 rounded-full ${DEADLINE_DOT_COLORS[colorIdx]}`}
                          />
                        ))}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
