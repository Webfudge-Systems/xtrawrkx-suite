'use client'

import Link from 'next/link'
import { Avatar, Button, Card, Input, Select, Textarea } from '@webfudge/ui'
import {
  Activity,
  AlignLeft,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  ExternalLink,
  FolderOpen,
  ListTodo,
  ListTree,
  Paperclip,
  Repeat,
  Timer,
  User,
} from 'lucide-react'
import TaskAssigneesPicker from './TaskAssigneesPicker'
import TaskRecurrenceFormFields from './TaskRecurrenceFormFields'
import { pmTableSelectFillProps, PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from './PMStatusBadge'

function isPresent(value) {
  if (value == null) return false
  const s = String(value).trim()
  return s.length > 0 && s !== '—'
}

const detailLabelClass =
  'mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500 sm:text-sm'

function DetailCell({ label, icon: Icon, children, className = '' }) {
  return (
    <div className={`min-w-0 px-6 py-4 ${className}`}>
      <div className={detailLabelClass}>
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-gray-400" aria-hidden /> : null}
        <span>{label}</span>
      </div>
      {children}
    </div>
  )
}

function GridRow({ children, cols = 3, className = '' }) {
  const colClass =
    cols === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : cols === 2
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-3'
  return (
    <div
      className={`grid divide-y divide-gray-100 border-b border-gray-100 md:divide-x md:divide-y-0 ${colClass} ${className}`}
    >
      {children}
    </div>
  )
}

function ProgressRing({ percent, size = 44 }) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0))
  const r = 18
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  const stroke = value >= 100 ? '#10B981' : value >= 40 ? '#FF7A00' : '#94A3B8'

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className="shrink-0" aria-hidden>
      <circle cx="22" cy="22" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
      <circle
        cx="22"
        cy="22"
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 22 22)"
      />
    </svg>
  )
}

function computeTaskProgress(task) {
  const subs = task?.subtasks || []
  if (subs.length > 0) {
    const done = subs.filter((s) => s.strapiStatus === 'COMPLETED').length
    const percent = Math.round((done / subs.length) * 100)
    return {
      percent,
      title: percent >= 100 ? 'Completed' : 'In progress',
      sub: percent >= 100 ? 'All subtasks done' : `${done} of ${subs.length} subtasks done`,
    }
  }
  if (task?.strapiStatus === 'COMPLETED') {
    return { percent: 100, title: 'Completed', sub: 'Excellent work!' }
  }
  if (task?.strapiStatus === 'IN_PROGRESS') {
    return { percent: 55, title: 'In Progress', sub: 'Task is underway' }
  }
  if (task?.strapiStatus === 'INTERNAL_REVIEW') {
    return { percent: 80, title: 'In Review', sub: 'Awaiting review' }
  }
  if (task?.strapiStatus === 'ON_HOLD') {
    return { percent: 40, title: 'On Hold', sub: 'Work is paused' }
  }
  return { percent: 0, title: 'Not started', sub: 'Update status as you go' }
}

function computeChecklist(task) {
  const subs = task?.subtasks || []
  if (subs.length === 0) {
    return { done: 0, total: 0, sub: 'No subtasks yet', allDone: false }
  }
  const done = subs.filter((s) => s.strapiStatus === 'COMPLETED').length
  return {
    done,
    total: subs.length,
    sub: done === subs.length ? 'All completed' : `${subs.length - done} remaining`,
    allDone: done === subs.length,
  }
}

function AssigneeStack({ assignees = [] }) {
  if (!assignees.length) {
    return <span className="text-base text-gray-400">None assigned</span>
  }
  const visible = assignees.slice(0, 4)
  const extra = assignees.length - visible.length

  return (
    <div className="flex -space-x-2">
      {visible.map((person) => (
        <Avatar
          key={person.id}
          size="sm"
          src={person.avatar || undefined}
          fallback={person.initials || (person.name || '?').charAt(0).toUpperCase()}
          alt={person.name}
          title={person.name}
          className={`ring-2 ring-white ${person.color || 'bg-gray-500 text-white'} !h-9 !w-9 text-xs font-semibold`}
        />
      ))}
      {extra > 0 ? (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ring-2 ring-white">
          +{extra}
        </span>
      ) : null}
    </div>
  )
}

export default function TaskDetailsCard({
  task,
  editing = false,
  taskInfoDraft,
  isRecurring = false,
  draftRecurring = false,
  canEdit = false,
  saving = false,
  users = [],
  projects = [],
  userSelectOptions = [],
  statusVisual,
  StatusIcon,
  taskInfoSaveError = '',
  onStatusChange,
  onOpenSectionEdit,
  onOpenFullPageEdit,
  onCancelEdit,
  onSaveEdit,
  onTaskInfoFieldChange,
  onSetTaskInfoDraft,
  onViewProject,
  onViewFiles,
  onViewSubtasks,
  attachmentCount = 0,
  formatDate,
}) {
  const showEdit = canEdit && onOpenSectionEdit
  const projectManager = task?.projectManager
  const pmName = task?.projectManagerName || projectManager?.name || '—'
  const pmEmail = projectManager?.email || ''
  const pmInitial = (projectManager?.initials || pmName).charAt(0).toUpperCase() || 'P'

  if (editing && taskInfoDraft) {
    return (
      <Card variant="elevated" padding={false} className="overflow-hidden rounded-xl">
        <div className="border-b border-gray-100 px-6 pt-6 pb-5">
          <h2 className="text-xl font-semibold text-gray-900">Task details</h2>
          <p className="mt-1.5 text-base text-gray-500">
            {draftRecurring ? 'Edit assignment, schedule, and project.' : 'Edit assignment, dates, and project.'}
          </p>
        </div>

        <div className="space-y-5 px-6 pb-6 pt-5">
          <Input
            label="Task name"
            required
            value={taskInfoDraft.name}
            onChange={(e) => onTaskInfoFieldChange('name', e.target.value)}
            disabled={saving}
          />

          <TaskRecurrenceFormFields
            value={taskInfoDraft}
            onChange={(patch) =>
              onSetTaskInfoDraft((prev) => {
                if (!prev) return prev
                const next = { ...prev, ...patch }
                if (patch.recurrenceFrequency && patch.recurrenceFrequency !== 'none') {
                  next.scheduledDate = ''
                }
                return next
              })
            }
            disabled={saving}
          />

          <GridRow cols={2}>
            <DetailCell label="Status" className="md:border-r md:border-gray-100">
              <Select
                value={taskInfoDraft.status}
                options={TASK_STATUS_OPTIONS}
                onChange={(v) => onTaskInfoFieldChange('status', v)}
                disabled={saving}
                {...pmTableSelectFillProps(taskInfoDraft.status, 'status')}
              />
            </DetailCell>
            <DetailCell label="Priority">
              <Select
                value={taskInfoDraft.priority}
                options={PRIORITY_OPTIONS}
                onChange={(v) => onTaskInfoFieldChange('priority', v)}
                disabled={saving}
                {...pmTableSelectFillProps(taskInfoDraft.priority, 'priority')}
              />
            </DetailCell>
          </GridRow>

          <GridRow cols={4}>
            <DetailCell label="Reporter" icon={User}>
              <Select
                value={taskInfoDraft.assignerId}
                options={userSelectOptions}
                onChange={(v) => onTaskInfoFieldChange('assignerId', v)}
                disabled={saving}
                placeholder="Unassigned"
              />
            </DetailCell>
            <DetailCell label="Assignees">
              <TaskAssigneesPicker
                userIds={taskInfoDraft.assigneeUserIds || []}
                assignees={task.assignees}
                users={users}
                onChange={(next) => onTaskInfoFieldChange('assigneeUserIds', next)}
                disabled={saving}
              />
            </DetailCell>
            <DetailCell label="Project Manager" icon={User}>
              {pmName !== '—' ? (
                <div className="flex items-center gap-2.5">
                  <Avatar
                    size="sm"
                    src={projectManager?.avatar || undefined}
                    fallback={pmInitial}
                    alt={pmName}
                    className="shrink-0 bg-teal-600 text-white"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold leading-snug text-gray-900">{pmName}</p>
                    {pmEmail ? (
                      <p className="truncate text-sm text-gray-500">{pmEmail}</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <span className="text-base text-gray-400">Not assigned</span>
              )}
            </DetailCell>
            <DetailCell label="Project" icon={FolderOpen}>
              <Select
                value={taskInfoDraft.projectId}
                options={[
                  { value: '', label: 'No project' },
                  ...projects.map((p) => ({ value: String(p.id), label: p.name })),
                ]}
                onChange={(v) => onTaskInfoFieldChange('projectId', v)}
                disabled={saving}
                placeholder="No project"
                searchable
                searchPlaceholder="Search projects…"
              />
            </DetailCell>
          </GridRow>

          <GridRow cols={isRecurring ? 2 : 4}>
            <DetailCell label="Start date" icon={Calendar}>
              <Input
                type="date"
                value={taskInfoDraft.startDate}
                onChange={(e) => onTaskInfoFieldChange('startDate', e.target.value)}
                disabled={saving}
                containerClassName="!mb-0"
              />
            </DetailCell>
            {!draftRecurring ? (
              <DetailCell
                label="Due date"
                icon={Calendar}
                className="md:border-x md:border-gray-100"
              >
                <Input
                  type="date"
                  value={taskInfoDraft.scheduledDate}
                  onChange={(e) => onTaskInfoFieldChange('scheduledDate', e.target.value)}
                  disabled={saving}
                  containerClassName="!mb-0"
                />
              </DetailCell>
            ) : null}
            <DetailCell
              label="Created"
              icon={Activity}
              className={draftRecurring ? '' : 'md:border-x md:border-gray-100'}
            >
              <p className="text-base font-semibold text-gray-900">
                {formatDate(task.createdAt, 'short') || '—'}
              </p>
            </DetailCell>
            <DetailCell label="Updated" icon={Activity}>
              <p className="text-base font-semibold text-gray-900">
                {formatDate(task.updatedAt, 'short') || '—'}
              </p>
            </DetailCell>
          </GridRow>

          <section className="border-t border-gray-100 pt-4">
            <div className="mb-2 flex items-center gap-2">
              <AlignLeft className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Description
              </h3>
            </div>
            <Textarea
              rows={5}
              value={taskInfoDraft.description}
              onChange={(e) => onTaskInfoFieldChange('description', e.target.value)}
              disabled={saving}
              placeholder="Add context, acceptance criteria, or notes"
              resize="none"
            />
          </section>

          {taskInfoSaveError ? <p className="text-sm text-red-600">{taskInfoSaveError}</p> : null}

          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="primary" disabled={saving} onClick={onSaveEdit}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500">
            <button
              type="button"
              onClick={onOpenFullPageEdit}
              className="font-medium text-gray-500 hover:text-orange-600 hover:underline"
            >
              Open full edit dialog
            </button>
          </p>
        </div>
      </Card>
    )
  }

  const progress = computeTaskProgress(task)
  const checklist = computeChecklist(task)
  const assigner = task.assigner
  const assignerEmail = assigner?.email || ''
  const assignerName = task.assignerName || assigner?.name || '—'
  const assignerInitial = (assigner?.initials || assignerName).charAt(0).toUpperCase() || 'U'

  return (
    <Card variant="elevated" padding={false} className="overflow-hidden rounded-xl">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-gray-100 px-6 pt-6 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="text-xl font-semibold text-gray-900">Task details</h2>
          <p className="mt-1.5 text-base text-gray-500">
            {isRecurring ? 'Assignment, schedule, and project.' : 'Assignment, dates, and project.'}
          </p>
        </div>
        <div
          className="flex w-full shrink-0 flex-nowrap items-center gap-2.5 sm:w-auto sm:justify-end"
          role="group"
          aria-label="Task status"
        >
          <span
            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold uppercase tracking-widest shadow-sm ring-2 ${statusVisual.pillClass}`}
            role="status"
          >
            <StatusIcon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
            {statusVisual.label}
          </span>
          <Select
            value={task.strapiStatus}
            options={TASK_STATUS_OPTIONS}
            onChange={onStatusChange}
            disabled={saving}
            containerClassName="w-[148px] shrink-0"
            placeholder="Status"
          />
        </div>
      </div>

      {/* Assignment row */}
      <GridRow cols={4}>
        <DetailCell label="Reporter" icon={User}>
          {assignerName !== '—' ? (
            <div className="flex items-center gap-2.5">
              <Avatar
                size="sm"
                src={assigner?.avatar || undefined}
                fallback={assignerInitial}
                alt={assignerName}
                className={`shrink-0 text-white ${assigner?.color || 'bg-orange-500'}`}
              />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-snug text-gray-900">{assignerName}</p>
                {assignerEmail ? (
                  <p className="truncate text-sm text-gray-500">{assignerEmail}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <span className="text-base text-gray-400">Unassigned</span>
          )}
        </DetailCell>

        <DetailCell label="Assignees">
          <AssigneeStack assignees={task.assignees} />
        </DetailCell>

        <DetailCell label="Project Manager" icon={User}>
          {pmName !== '—' ? (
            <div className="flex items-center gap-2.5">
              <Avatar
                size="sm"
                src={projectManager?.avatar || undefined}
                fallback={pmInitial}
                alt={pmName}
                className="shrink-0 bg-teal-600 text-white"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-snug text-gray-900">{pmName}</p>
                {pmEmail ? (
                  <p className="truncate text-sm text-gray-500">{pmEmail}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <span className="text-base text-gray-400">Not assigned</span>
          )}
        </DetailCell>

        <DetailCell label="Project" icon={FolderOpen}>
          {task.project ? (
            <div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                {task.projectSlug ? (
                  <Link
                    href={`/projects/${task.projectSlug}`}
                    className="truncate text-base font-semibold leading-snug text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    {task.project}
                  </Link>
                ) : (
                  <span className="truncate text-base font-semibold leading-snug text-orange-600">
                    {task.project}
                  </span>
                )}
              </div>
              {task.projectSlug && onViewProject ? (
                <button
                  type="button"
                  onClick={onViewProject}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-orange-600"
                >
                  View project
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </button>
              ) : null}
            </div>
          ) : (
            <span className="text-base text-gray-400">No project</span>
          )}
        </DetailCell>
      </GridRow>

      {/* Schedule row */}
      <GridRow cols={isRecurring ? 3 : 4}>
        <DetailCell label="Start date" icon={Calendar}>
          <p className="text-base font-semibold leading-snug text-gray-900">
            {formatDate(task.startDate, 'short') || '—'}
          </p>
        </DetailCell>
        {!isRecurring ? (
          <DetailCell label="Due date" icon={Calendar} className="md:border-x md:border-gray-100">
            <p className="text-base font-semibold leading-snug text-gray-900">
              {formatDate(task.dueDate, 'short') || '—'}
            </p>
          </DetailCell>
        ) : null}
        <DetailCell
          label="Created"
          icon={Activity}
          className={isRecurring ? '' : 'md:border-x md:border-gray-100'}
        >
          <p className="text-base font-semibold leading-snug text-gray-900">
            {formatDate(task.createdAt, 'short') || '—'}
          </p>
        </DetailCell>
        <DetailCell label="Updated" icon={Activity}>
          <p className="text-base font-semibold leading-snug text-gray-900">
            {formatDate(task.updatedAt, 'short') || '—'}
          </p>
        </DetailCell>
      </GridRow>

      {/* Parent + recurrence row (when applicable) */}
      {(task.parentTask?.id ||
        (task.recurrenceFrequency && task.recurrenceFrequency !== 'none')) && (
        <GridRow cols={2}>
          <DetailCell label="Parent task" icon={ListTree}>
            {task.parentTask?.id ? (
              <Link
                href={`/tasks/${task.parentTask.id}`}
                className="text-base font-semibold leading-snug text-orange-600 hover:underline"
              >
                {task.parentTask.name || 'View parent'}
              </Link>
            ) : (
              <span className="text-base text-gray-400">—</span>
            )}
          </DetailCell>
          <DetailCell label="Repeats" icon={Repeat} className="md:border-l md:border-gray-100">
            <p className="text-base leading-snug text-gray-900">
              <span className="font-semibold">{task.recurrenceSummary || 'Does not repeat'}</span>
              {task.recurrenceEndsAt ? (
                <span className="font-normal text-gray-500">
                  {' '}
                  · Until {formatDate(task.recurrenceEndsAt, 'short')}
                </span>
              ) : null}
            </p>
          </DetailCell>
        </GridRow>
      )}

      {/* Metrics row */}
      <GridRow cols={4}>
        <DetailCell label="Time tracking" icon={Clock}>
          <div className="flex items-center gap-2.5">
            <Timer className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
            <div>
              <p className="text-base font-semibold leading-snug text-gray-900">—</p>
              <p className="text-sm text-gray-500">Not logged yet</p>
            </div>
          </div>
        </DetailCell>

        <DetailCell label="Progress" className="md:border-x md:border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <ProgressRing percent={progress.percent} />
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-gray-800">
                {progress.percent}%
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold leading-snug text-gray-900">{progress.title}</p>
              <p className="text-sm text-gray-500">{progress.sub}</p>
            </div>
          </div>
        </DetailCell>

        <DetailCell label="Checklist" icon={ListTodo} className="md:border-r md:border-gray-100">
          <div className="flex items-center gap-2.5">
            <CheckCircle2
              className={`h-5 w-5 shrink-0 ${checklist.allDone && checklist.total > 0 ? 'text-emerald-500' : 'text-gray-400'}`}
              aria-hidden
            />
            <div>
              <p className="text-base font-semibold leading-snug text-gray-900">
                {checklist.total > 0 ? `${checklist.done}/${checklist.total}` : '—'}
              </p>
              <button
                type="button"
                onClick={onViewSubtasks}
                className="text-sm text-gray-500 hover:text-orange-600 hover:underline"
              >
                {checklist.sub}
              </button>
            </div>
          </div>
        </DetailCell>

        <DetailCell label="Attachments" icon={Paperclip}>
          <div className="flex items-center gap-2.5">
            <Paperclip className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
            <div>
              <p className="text-base font-semibold leading-snug text-gray-900">{attachmentCount ?? 0}</p>
              <button
                type="button"
                onClick={onViewFiles}
                className="text-sm font-medium text-gray-500 hover:text-orange-600 hover:underline"
              >
                View files
              </button>
            </div>
          </div>
        </DetailCell>
      </GridRow>

      {/* Description */}
      <section className="border-t border-gray-100 px-6 py-4">
        <div className="mb-2 flex items-center gap-2">
          <AlignLeft className="h-5 w-5 shrink-0 text-orange-500" aria-hidden />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Description
          </h3>
        </div>
        {isPresent(task.description) ? (
          <p className="mt-2.5 whitespace-pre-wrap text-base font-normal leading-relaxed text-gray-800">
            {task.description}
          </p>
        ) : (
          <p className="mt-2.5 text-base font-normal text-gray-400">No task description yet.</p>
        )}
      </section>

      {/* Edit actions */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 text-center">
        {showEdit ? (
          <p className="text-sm text-gray-600">
            <button
              type="button"
              onClick={onOpenSectionEdit}
              className="font-semibold text-orange-600 hover:underline"
            >
              Edit task details
            </button>
            <span className="mx-2 text-gray-300" aria-hidden>
              ·
            </span>
            <button
              type="button"
              onClick={onOpenFullPageEdit}
              className="font-medium text-gray-500 hover:text-orange-600 hover:underline"
            >
              Full edit (all fields)
            </button>
          </p>
        ) : (
          <span className="text-sm text-gray-400">
            Update status above; use Comments for discussion.
          </span>
        )}
      </div>
    </Card>
  )
}
