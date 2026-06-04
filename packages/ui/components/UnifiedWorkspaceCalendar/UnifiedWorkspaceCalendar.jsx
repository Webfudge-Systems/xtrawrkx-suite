'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Video, MapPin, CheckSquare, FolderKanban, Clock, User, Repeat } from 'lucide-react'

const MEETING_TYPE_COLORS = {
  discovery: '#7c3aed',
  demo: '#2563eb',
  follow_up: '#d97706',
  check_in: '#0d9488',
  review: '#4f46e5',
  internal: '#6b7280',
  other: '#ea580c',
}

const MEETING_TYPE_LABELS = {
  discovery: 'Discovery',
  demo: 'Demo',
  follow_up: 'Follow-up',
  check_in: 'Check-in',
  review: 'Review',
  internal: 'Internal',
  other: 'Other',
}

/** Pastel header + body + title — ref “Manageko” style */
const MEETING_PASTEL = {
  discovery: { header: '#7c3aed', body: '#f5f3ff', title: '#5b21b6' },
  demo: { header: '#2563eb', body: '#eff6ff', title: '#1d4ed8' },
  follow_up: { header: '#d97706', body: '#fffbeb', title: '#b45309' },
  check_in: { header: '#0d9488', body: '#f0fdfa', title: '#0f766e' },
  review: { header: '#4f46e5', body: '#eef2ff', title: '#4338ca' },
  internal: { header: '#64748b', body: '#f8fafc', title: '#475569' },
  other: { header: '#ea580c', body: '#fff7ed', title: '#c2410c' },
}

/** Task / project strips — readable on the grid without heavy contrast */
const TASK_CAL = {
  border: '#7dd3fc',
  bg: '#f0f9ff',
  dot: '#0ea5e9',
  ring: 'rgba(14, 165, 233, 0.14)',
}

const PROJECT_CAL = {
  border: '#c4b5fd',
  bgFrom: '#ede9fe',
  bgTo: '#f5f3ff',
  ring: 'rgba(139, 92, 246, 0.14)',
}

const MEETING_STATUS_LABELS = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
}

const MEETING_STATUS_OPACITY = {
  cancelled: 0.55,
  no_show: 0.55,
  completed: 0.88,
  scheduled: 1,
}

function meetingRelatedSnippet(meeting) {
  if (!meeting) return null
  if (meeting.deal?.name) return meeting.deal.name
  if (meeting.clientAccount?.companyName) return meeting.clientAccount.companyName
  if (meeting.leadCompany?.companyName) return meeting.leadCompany.companyName
  if (meeting.contact) {
    const n = [meeting.contact.firstName, meeting.contact.lastName].filter(Boolean).join(' ')
    return n || meeting.contact.email || null
  }
  return null
}

function organizerSnippet(meeting) {
  const o = meeting?.organizer
  if (!o || typeof o !== 'object') return null
  const n = [o.firstName, o.lastName].filter(Boolean).join(' ').trim()
  return n || o.name || o.username || o.email || null
}

function locationBodyLine(meeting) {
  if (!meeting) return null
  if (meeting.isVirtual) {
    const loc = meeting.location?.trim()
    return loc ? `Virtual · ${loc}` : 'Virtual meeting'
  }
  const loc = meeting.location?.trim()
  return loc || null
}

function formatRange(start, end, allDay) {
  if (!start) return ''
  try {
    const s = start instanceof Date ? start : new Date(start)
    if (isNaN(s.getTime())) return ''
    const opts = { month: 'short', day: 'numeric', year: 'numeric' }
    if (allDay && end) {
      const e = end instanceof Date ? end : new Date(end)
      if (!isNaN(e.getTime())) {
        return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', opts)}`
      }
    }
    const timeOpts = { ...opts, hour: 'numeric', minute: '2-digit' }
    if (end) {
      const e = end instanceof Date ? end : new Date(end)
      if (!isNaN(e.getTime())) {
        return `${s.toLocaleString('en-US', timeOpts)} – ${e.toLocaleString('en-US', timeOpts)}`
      }
    }
    return s.toLocaleString('en-US', timeOpts)
  } catch {
    return ''
  }
}

function PastelEventShell({
  headerBg,
  bodyBg,
  titleColor,
  headerContent,
  title,
  children,
  opacity = 1,
  roundedClassName = 'rounded-md',
}) {
  return (
    <div
      className={`wf-cal-event-card wf-cal-pastel-card w-full min-w-0 overflow-hidden ${roundedClassName} text-left shadow-sm ring-1 ring-black/[0.06] transition-shadow duration-150`}
      style={{ opacity }}
    >
      <div
        className="flex min-h-[1.5rem] items-center gap-1 px-2 py-1 text-[10px] font-bold tabular-nums text-white"
        style={{ backgroundColor: headerBg }}
      >
        {headerContent}
      </div>
      <div className="px-2 py-1.5" style={{ backgroundColor: bodyBg }}>
        <div className="truncate text-xs font-bold leading-tight" style={{ color: titleColor }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  )
}

function MeetingEventCard({ arg }) {
  const meeting = arg.event.extendedProps?.entity
  const typeKey = meeting?.meetingType || 'other'
  const palette = MEETING_PASTEL[typeKey] || MEETING_PASTEL.other
  const typeLabel = MEETING_TYPE_LABELS[typeKey] || MEETING_TYPE_LABELS.other
  const status = meeting?.status || 'scheduled'
  const statusLabel = MEETING_STATUS_LABELS[status] || status
  const opacity = MEETING_STATUS_OPACITY[status] ?? 1
  const cancelled = status === 'cancelled'
  const accent = MEETING_TYPE_COLORS[typeKey] || MEETING_TYPE_COLORS.other
  const related = meetingRelatedSnippet(meeting)
  const host = organizerSnippet(meeting)
  const where = locationBodyLine(meeting)
  const attendeeCount = Array.isArray(meeting?.attendees) ? meeting.attendees.filter(Boolean).length : 0

  const headerRow = (
    <>
      <span className="truncate">{arg.timeText}</span>
      {meeting?.isVirtual ? (
        <Video className="h-3 w-3 shrink-0 opacity-95" aria-hidden />
      ) : meeting?.location ? (
        <MapPin className="h-3 w-3 shrink-0 opacity-95" aria-hidden title={meeting.location} />
      ) : null}
    </>
  )

  return (
    <PastelEventShell
      roundedClassName="rounded-lg"
      headerBg={palette.header}
      bodyBg={palette.body}
      titleColor={palette.title}
      headerContent={headerRow}
      title={
        <span className={cancelled ? 'line-through decoration-gray-400/80' : undefined}>
          {arg.event.title || 'Untitled'}
        </span>
      }
      opacity={opacity}
    >
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <span
          className="inline-flex max-w-[50%] truncate rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: accent }}
        >
          {typeLabel}
        </span>
        <span className="inline-flex max-w-[45%] truncate rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-gray-700 ring-1 ring-black/[0.06]">
          {statusLabel}
        </span>
      </div>
      {related && (
        <p className="mt-1 truncate text-[10px] font-semibold leading-snug text-gray-700" title={related}>
          {related}
        </p>
      )}
      {host && (
        <p className="mt-0.5 truncate text-[10px] text-gray-600" title={host}>
          Host · {host}
        </p>
      )}
      {where && (
        <p className="mt-0.5 flex min-w-0 items-center gap-1 truncate text-[10px] text-gray-500">
          {meeting?.isVirtual ? (
            <Video className="h-3 w-3 shrink-0 text-sky-600" aria-hidden />
          ) : (
            <MapPin className="h-3 w-3 shrink-0 text-gray-400" aria-hidden />
          )}
          <span className="min-w-0 truncate" title={where}>
            {where}
          </span>
        </p>
      )}
      {attendeeCount > 0 && (
        <p className="mt-0.5 text-[10px] font-medium text-gray-500">
          {attendeeCount} attendee{attendeeCount === 1 ? '' : 's'}
        </p>
      )}
    </PastelEventShell>
  )
}

function TaskEventCard({ arg }) {
  const task = arg.event.extendedProps?.entity
  const recurrenceSummary = arg.event.extendedProps?.recurrenceSummary
  const isRepeating =
    Boolean(recurrenceSummary) ||
    (task?.recurrenceFrequency && task.recurrenceFrequency !== 'none')

  return (
    <div
      className="wf-cal-task-minimal wf-cal-pastel-card flex min-h-[1.625rem] w-full min-w-0 items-center gap-1.5 rounded-md border px-2 py-1 shadow-sm"
      style={{
        borderColor: TASK_CAL.border,
        backgroundColor: TASK_CAL.bg,
        boxShadow: `0 1px 2px rgb(14 165 233 / 0.06), 0 0 0 1px ${TASK_CAL.ring}`,
      }}
      title={arg.event.title || 'Task'}
    >
      <CheckSquare className="h-3 w-3 shrink-0 text-sky-600" aria-hidden />
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full ring-2 ring-white/80"
        style={{ backgroundColor: TASK_CAL.dot }}
        aria-hidden
      />
      <span
        className="min-w-0 flex-1 truncate text-left text-[11px] font-semibold leading-tight tracking-tight"
        style={{ color: '#0c4a6e' }}
      >
        {arg.event.title}
      </span>
      {isRepeating && (
        <Repeat
          className="h-3 w-3 shrink-0 text-sky-600"
          aria-hidden
          title={recurrenceSummary || 'Repeating task'}
        />
      )}
    </div>
  )
}

function ProjectEventCard({ arg }) {
  return (
    <div
      className="wf-cal-project-minimal wf-cal-pastel-card flex w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-md border px-2.5 py-1.5 shadow-sm"
      style={{
        borderColor: PROJECT_CAL.border,
        background: `linear-gradient(90deg, ${PROJECT_CAL.bgFrom} 0%, ${PROJECT_CAL.bgTo} 100%)`,
        boxShadow: `0 1px 2px rgb(124 58 237 / 0.06), 0 0 0 1px ${PROJECT_CAL.ring}`,
      }}
      title={arg.event.title || 'Project'}
    >
      <span
        className="min-w-0 flex-1 truncate text-left text-[11px] font-bold leading-tight tracking-tight"
        style={{ color: '#5b21b6' }}
      >
        {arg.event.title}
      </span>
      <FolderKanban className="h-3.5 w-3.5 shrink-0 text-violet-600" aria-hidden />
    </div>
  )
}

function renderEventCard(arg) {
  const kind = arg.event.extendedProps?.kind
  if (kind === 'task') return <TaskEventCard arg={arg} />
  if (kind === 'project') return <ProjectEventCard arg={arg} />
  return <MeetingEventCard arg={arg} />
}

function Pill({ children, active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        active ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
      }`}
    >
      {children}
    </span>
  )
}

function HoverDetailPopover({ hover }) {
  if (!hover || typeof document === 'undefined') return null

  const { rect, kind, title, start, end, allDay, entity, recurrenceSummary } = hover
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const panelW = 280
  let left = rect.left + rect.width / 2 - panelW / 2
  left = Math.max(12, Math.min(left, vw - panelW - 12))
  let top = rect.bottom + 8
  if (top + 320 > vh) {
    top = Math.max(12, rect.top - 8 - 300)
  }

  const timeLine = formatRange(start, end, allDay)

  let body = null
  if (kind === 'meeting' && entity) {
    const typeKey = entity.meetingType || 'other'
    const typeLabel = MEETING_TYPE_LABELS[typeKey] || MEETING_TYPE_LABELS.other
    const statusLabel = MEETING_STATUS_LABELS[entity.status] || entity.status
    const related = meetingRelatedSnippet(entity)
    body = (
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex flex-wrap gap-1">
          <Pill active>Meetings</Pill>
          <Pill>{typeLabel}</Pill>
          <Pill>{statusLabel}</Pill>
        </div>
        {related && <p className="text-xs text-gray-600">{related}</p>}
        {(entity.isVirtual || entity.location) && (
          <p className="flex items-start gap-2 text-xs text-gray-600">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            <span>
              {entity.isVirtual ? entity.location || 'Virtual meeting' : entity.location}
            </span>
          </p>
        )}
        {entity.agenda && String(entity.agenda).trim() && (
          <p className="border-t border-gray-100 pt-2 text-xs leading-relaxed text-gray-500 line-clamp-4">
            {entity.agenda}
          </p>
        )}
      </div>
    )
  } else if (kind === 'task' && entity) {
    const projectLabel =
      entity.project ||
      (Array.isArray(entity.projects) && entity.projects[0]?.name) ||
      entity.projectSlug
    const assigneeDisplay =
      entity.assigneeName ||
      entity.assignee?.name ||
      [entity.assignee?.firstName, entity.assignee?.lastName].filter(Boolean).join(' ') ||
      entity.assignee?.email
    body = (
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex flex-wrap gap-1">
          <Pill active>Tasks</Pill>
          {entity.status && <Pill>{entity.status}</Pill>}
          {entity.priority && <Pill>{entity.priority}</Pill>}
        </div>
        {projectLabel && (
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-500">Project:</span> {projectLabel}
          </p>
        )}
        {assigneeDisplay && (
          <p className="flex items-center gap-2 text-xs text-gray-600">
            <User className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
            {assigneeDisplay}
          </p>
        )}
        {recurrenceSummary && (
          <p className="flex items-start gap-2 border-t border-gray-100 pt-2 text-xs leading-snug text-gray-600">
            <Repeat className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden />
            {recurrenceSummary}
          </p>
        )}
        {entity.description && String(entity.description).trim() && (
          <p className="border-t border-gray-100 pt-2 text-xs leading-relaxed text-gray-500 line-clamp-5">
            {entity.description}
          </p>
        )}
      </div>
    )
  } else if (kind === 'project' && entity) {
    body = (
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex flex-wrap gap-1">
          <Pill active>Projects</Pill>
          {entity.status && <Pill>{entity.status}</Pill>}
        </div>
        {(entity.startDate || entity.endDate) && (
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-500">Timeline:</span>{' '}
            {formatRange(entity.startDate || entity.endDate, entity.endDate || entity.startDate, true)}
          </p>
        )}
        {entity.description && String(entity.description).trim() && (
          <p className="border-t border-gray-100 pt-2 text-xs leading-relaxed text-gray-500 line-clamp-4">
            {entity.description}
          </p>
        )}
      </div>
    )
  }

  const content = (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-[10050] w-[280px] rounded-xl border border-gray-200 bg-white p-4 shadow-xl ring-1 ring-black/[0.06]"
      style={{ left, top }}
    >
      <div className="border-b border-gray-100 pb-2">
        <h3 className="text-sm font-bold leading-snug text-gray-900">{title || 'Event'}</h3>
        {timeLine && (
          <p className="mt-1.5 flex items-center gap-2 text-xs text-gray-600">
            <Clock className="h-3.5 w-3.5 shrink-0 text-orange-500" aria-hidden />
            {timeLine}
          </p>
        )}
      </div>
      <div className="pt-3">{body}</div>
    </div>
  )

  return createPortal(content, document.body)
}

/**
 * FullCalendar wrapper — CRM meetings + PM/CRM tasks + project timelines.
 * Client-only (parent should dynamic-import with `ssr: false`).
 */
export default function UnifiedWorkspaceCalendar({
  events = [],
  onDatesSet,
  onEventClick,
  onMeetingTimeChange,
  height = 'auto',
}) {
  const calendarRef = useRef(null)
  const [hover, setHover] = useState(null)
  const showTimer = useRef(null)

  const clearShowTimer = useCallback(() => {
    if (showTimer.current) {
      clearTimeout(showTimer.current)
      showTimer.current = null
    }
  }, [])

  const handleEventMouseEnter = useCallback(
    (info) => {
      clearShowTimer()
      const el = info.el
      const rect = el.getBoundingClientRect()
      const ev = info.event
      const kind = ev.extendedProps?.kind
      const entity = ev.extendedProps?.entity
      showTimer.current = setTimeout(() => {
        setHover({
          rect,
          kind,
          title: ev.title,
          start: ev.start,
          end: ev.end,
          allDay: Boolean(ev.allDay),
          entity,
          recurrenceSummary: ev.extendedProps?.recurrenceSummary || null,
        })
      }, 120)
    },
    [clearShowTimer]
  )

  const handleEventMouseLeave = useCallback(() => {
    clearShowTimer()
    setHover(null)
  }, [clearShowTimer])

  useEffect(() => () => clearShowTimer(), [clearShowTimer])

  const handleEventChange = useCallback(
    async (info) => {
      const kind = info.event.extendedProps?.kind
      if (kind !== 'meeting' || !onMeetingTimeChange) {
        info.revert()
        return
      }
      const meeting = info.event.extendedProps?.entity
      if (!meeting?.id) {
        info.revert()
        return
      }
      const newStart = info.event.start?.toISOString()
      const newEnd = info.event.end?.toISOString() ?? null
      try {
        await onMeetingTimeChange(meeting, { startTime: newStart, endTime: newEnd })
      } catch {
        info.revert()
      }
    },
    [onMeetingTimeChange]
  )

  return (
    <div className="wf-unified-calendar relative rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm ring-1 ring-gray-900/[0.03]">
      <style>{`
        .wf-unified-calendar .fc {
          --fc-border-color: #e5e7eb;
          --fc-page-bg-color: #ffffff;
          --fc-neutral-bg-color: #f9fafb;
        }
        .wf-unified-calendar .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .wf-unified-calendar .fc-toolbar-chunk {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }
        .wf-unified-calendar .fc-button-group {
          display: inline-flex !important;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem !important;
        }
        .wf-unified-calendar .fc-button-group > .fc-button {
          margin-left: 0 !important;
          margin-right: 0 !important;
          float: none !important;
        }
        .wf-unified-calendar .fc-button {
          background: white !important;
          border: 1px solid #e5e7eb !important;
          color: #374151 !important;
          font-weight: 600 !important;
          border-radius: 0.75rem !important;
          padding: 0.4rem 0.85rem !important;
          font-size: 0.8125rem !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06) !important;
          transition: background 0.15s, border-color 0.15s, color 0.15s, box-shadow 0.15s !important;
        }
        .wf-unified-calendar .fc-button:hover {
          background: #fff7ed !important;
          border-color: #fdba74 !important;
          color: #c2410c !important;
          box-shadow: 0 2px 6px rgba(234, 88, 12, 0.12) !important;
        }
        .wf-unified-calendar .fc-button-active,
        .wf-unified-calendar .fc-button-primary:not(:disabled).fc-button-active {
          background: #ea580c !important;
          border-color: #ea580c !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.35) !important;
        }
        .wf-unified-calendar .fc-button:disabled {
          opacity: 0.5 !important;
        }
        .wf-unified-calendar .fc-h-event,
        .wf-unified-calendar .fc-daygrid-block-event {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .wf-unified-calendar .fc-daygrid-event {
          margin-top: 3px !important;
          margin-bottom: 3px !important;
        }
        .wf-unified-calendar .fc-daygrid-event .fc-event-main {
          padding: 0 !important;
        }
        .wf-unified-calendar .fc-timegrid-event {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .wf-unified-calendar .fc-timegrid-event .fc-event-main {
          padding: 2px !important;
        }
        .wf-unified-calendar .fc-event:hover .wf-cal-pastel-card,
        .wf-unified-calendar .fc-event:hover .wf-cal-task-minimal,
        .wf-unified-calendar .fc-event:hover .wf-cal-project-minimal {
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
          transform: translateY(-1px);
        }
        .wf-unified-calendar .fc-day-today {
          background: #fff7ed !important;
        }
        .wf-unified-calendar .fc-day-today .fc-daygrid-day-number {
          font-weight: 800;
          color: #c2410c;
        }
        .wf-unified-calendar .fc-col-header-cell {
          font-weight: 700 !important;
          font-size: 0.6875rem !important;
          color: #6b7280 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
          padding: 0.65rem 0 !important;
        }
        .wf-unified-calendar .fc-timegrid-slot {
          height: 3rem !important;
        }
        .wf-unified-calendar .fc-scrollgrid {
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .wf-unified-calendar .fc-event-dragging {
          opacity: 0.85 !important;
        }
        .wf-unified-calendar .fc-more-link {
          font-weight: 600 !important;
          color: #ea580c !important;
          border-radius: 0.375rem !important;
        }
      `}</style>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        editable={Boolean(onMeetingTimeChange)}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        datesSet={(arg) => onDatesSet?.(arg)}
        eventContent={(arg) => renderEventCard(arg)}
        eventMouseEnter={handleEventMouseEnter}
        eventMouseLeave={handleEventMouseLeave}
        eventClick={(info) => {
          const kind = info.event.extendedProps?.kind
          const entity = info.event.extendedProps?.entity
          if (kind && entity && onEventClick) {
            onEventClick({ kind, entity })
          }
        }}
        height={height}
        /* Week/day: parallel events use columns instead of stacking on top of each other */
        slotEventOverlap={false}
        eventTimeFormat={{
          hour: 'numeric',
          minute: '2-digit',
          meridiem: 'short',
        }}
        nowIndicator
        dayMaxEvents={4}
        moreLinkText={(n) => `+${n} more`}
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
        }}
        eventDragStart={() => {
          document.body.style.cursor = 'grabbing'
        }}
        eventDragStop={() => {
          document.body.style.cursor = ''
        }}
      />
      <HoverDetailPopover hover={hover} />
    </div>
  )
}
