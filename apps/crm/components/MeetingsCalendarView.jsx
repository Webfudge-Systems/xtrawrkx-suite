'use client'

import { useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Video, MapPin } from 'lucide-react'
import meetingService from '../lib/api/meetingService'

const TYPE_EVENT_COLORS = {
  discovery: '#7c3aed',
  demo: '#2563eb',
  follow_up: '#d97706',
  check_in: '#0d9488',
  review: '#4f46e5',
  internal: '#6b7280',
  other: '#ea580c',
}

const TYPE_LABELS = {
  discovery: 'Discovery',
  demo: 'Demo',
  follow_up: 'Follow-up',
  check_in: 'Check-in',
  review: 'Review',
  internal: 'Internal',
  other: 'Other',
}

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
}

const STATUS_OPACITY = {
  cancelled: 0.5,
  no_show: 0.5,
  completed: 0.82,
  scheduled: 1,
}

function relatedSnippet(meeting) {
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

function MeetingEventCard({ arg }) {
  const meeting = arg.event.extendedProps?.meeting
  const typeKey = meeting?.meetingType || 'other'
  const accent = TYPE_EVENT_COLORS[typeKey] || TYPE_EVENT_COLORS.other
  const typeLabel = TYPE_LABELS[typeKey] || TYPE_LABELS.other
  const status = meeting?.status || 'scheduled'
  const statusLabel = STATUS_LABELS[status] || status
  const opacity = STATUS_OPACITY[status] ?? 1
  const crm = relatedSnippet(meeting)
  const isMonth = arg.view.type === 'dayGridMonth'
  const cancelled = status === 'cancelled'

  return (
    <div
      className="meeting-cal-event-card w-full min-w-0 overflow-hidden rounded-lg border border-gray-200/90 bg-white py-1.5 pl-2 pr-1.5 text-left shadow-sm ring-1 ring-gray-900/[0.04] transition hover:border-orange-200/80 hover:shadow-md hover:ring-orange-100/60"
      style={{
        borderLeftWidth: 3,
        borderLeftStyle: 'solid',
        borderLeftColor: accent,
        opacity,
      }}
    >
      <div className="flex items-center gap-1 text-[10px] font-bold tabular-nums uppercase tracking-wide text-gray-500">
        <span className="text-gray-700">{arg.timeText}</span>
        {meeting?.isVirtual ? (
          <Video className="h-3 w-3 shrink-0 text-sky-500" aria-hidden />
        ) : meeting?.location ? (
          <MapPin className="h-3 w-3 shrink-0 text-gray-400" aria-hidden title={meeting.location} />
        ) : null}
      </div>
      <div
        className={`mt-0.5 truncate text-xs font-semibold leading-snug text-gray-900 ${
          cancelled ? 'line-through decoration-gray-400' : ''
        }`}
      >
        {arg.event.title || 'Untitled'}
      </div>
      <div className={`mt-1 flex flex-wrap items-center gap-1 ${isMonth ? '' : 'sm:gap-1.5'}`}>
        <span
          className="inline-flex max-w-full truncate rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
          style={{
            backgroundColor: `${accent}1a`,
            color: accent,
          }}
        >
          {typeLabel}
        </span>
        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-600 ring-1 ring-gray-200/80">
          {statusLabel}
        </span>
      </div>
      {crm && (
        <p className="mt-1 truncate text-[10px] font-medium text-gray-400" title={crm}>
          {crm}
        </p>
      )}
    </div>
  )
}

/**
 * MeetingsCalendarView — FullCalendar wrapper.
 * Rendered client-side only (dynamic import with ssr:false in parent).
 */
export default function MeetingsCalendarView({
  meetings = [],
  onEventClick,
  onDateClick,
  onMeetingUpdate,
}) {
  const calendarRef = useRef(null)

  const events = meetings.map((m) => ({
    id: String(m.id),
    title: m.title || 'Untitled',
    start: m.startTime,
    end: m.endTime || undefined,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: '#111827',
    extendedProps: { meeting: m },
    editable: m.status === 'scheduled',
    startEditable: m.status === 'scheduled',
    durationEditable: m.status === 'scheduled',
  }))

  const handleEventChange = useCallback(
    async (info) => {
      const { event, revert } = info
      const meeting = event.extendedProps?.meeting
      if (!meeting) return revert()

      const newStart = event.start?.toISOString()
      const newEnd = event.end?.toISOString() ?? null

      try {
        await meetingService.update(meeting.id, {
          startTime: newStart,
          ...(newEnd != null ? { endTime: newEnd } : {}),
        })
        if (onMeetingUpdate) {
          onMeetingUpdate({ ...meeting, startTime: newStart, endTime: newEnd })
        }
      } catch (err) {
        console.error('Failed to save meeting time change', err)
        revert()
      }
    },
    [onMeetingUpdate]
  )

  return (
    <div className="meetings-calendar rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm ring-1 ring-gray-900/[0.03]">
      <style>{`
        .meetings-calendar .fc {
          --fc-border-color: #e5e7eb;
          --fc-page-bg-color: #ffffff;
          --fc-neutral-bg-color: #f9fafb;
        }
        .meetings-calendar .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .meetings-calendar .fc-toolbar-chunk {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }
        .meetings-calendar .fc-button-group {
          display: inline-flex !important;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem !important;
        }
        .meetings-calendar .fc-button-group > .fc-button {
          margin-left: 0 !important;
          margin-right: 0 !important;
          float: none !important;
        }
        .meetings-calendar .fc-button {
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
        .meetings-calendar .fc-button:hover {
          background: #fff7ed !important;
          border-color: #fdba74 !important;
          color: #c2410c !important;
          box-shadow: 0 2px 6px rgba(234, 88, 12, 0.12) !important;
        }
        .meetings-calendar .fc-button-active,
        .meetings-calendar .fc-button-primary:not(:disabled).fc-button-active {
          background: #ea580c !important;
          border-color: #ea580c !important;
          color: white !important;
          box-shadow: 0 2px 8px rgba(234, 88, 12, 0.35) !important;
        }
        .meetings-calendar .fc-button:disabled {
          opacity: 0.5 !important;
        }
        /* Event shell: let custom card show through */
        .meetings-calendar .fc-h-event,
        .meetings-calendar .fc-daygrid-block-event {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .meetings-calendar .fc-daygrid-event {
          margin-top: 3px !important;
          margin-bottom: 3px !important;
        }
        .meetings-calendar .fc-daygrid-event .fc-event-main {
          padding: 0 !important;
        }
        .meetings-calendar .fc-timegrid-event {
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .meetings-calendar .fc-timegrid-event .fc-event-main {
          padding: 2px !important;
        }
        .meetings-calendar .fc-event:hover .meeting-cal-event-card {
          border-color: rgba(251, 146, 60, 0.45);
        }
        .meetings-calendar .fc-day-today {
          background: #fff7ed !important;
        }
        .meetings-calendar .fc-day-today .fc-daygrid-day-number {
          font-weight: 800;
          color: #c2410c;
        }
        .meetings-calendar .fc-col-header-cell {
          font-weight: 700 !important;
          font-size: 0.6875rem !important;
          color: #6b7280 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.08em !important;
          padding: 0.65rem 0 !important;
        }
        .meetings-calendar .fc-timegrid-slot {
          height: 3rem !important;
        }
        .meetings-calendar .fc-scrollgrid {
          border-radius: 0.75rem;
          overflow: hidden;
        }
        .meetings-calendar .fc-event-dragging {
          opacity: 0.85 !important;
        }
        .meetings-calendar .fc-event .fc-event-resizer {
          background: rgba(255, 255, 255, 0.6) !important;
          border-radius: 0 0 6px 6px !important;
        }
        .meetings-calendar .fc-more-link {
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
        editable
        droppable={false}
        eventDrop={handleEventChange}
        eventResize={handleEventChange}
        eventContent={(arg) => <MeetingEventCard arg={arg} />}
        eventClick={(info) => {
          const meeting = info.event.extendedProps?.meeting
          if (meeting && onEventClick) onEventClick(meeting)
        }}
        dateClick={(info) => {
          if (onDateClick) onDateClick(info.dateStr)
        }}
        height="auto"
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
    </div>
  )
}
