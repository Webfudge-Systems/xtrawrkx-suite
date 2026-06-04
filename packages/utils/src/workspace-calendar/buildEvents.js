/**
 * Build FullCalendar-compatible event objects from CRM + PM domain rows.
 * Used by the unified workspace calendar in CRM and PM apps (same data shape).
 */

import {
  expandTaskOccurrencesInRange,
  formatRecurrenceSummaryLine,
} from './taskRecurrenceExpand';

const TASK_BLOCK_MS = 45 * 60 * 1000;

function addMs(iso, ms) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getTime() + ms).toISOString();
}

/** FullCalendar all-day end is exclusive — bump date by one calendar day. */
function exclusiveEndDateOnly(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().split('T')[0];
}

function toDateOnly(iso) {
  if (!iso) return null;
  return String(iso).split('T')[0];
}

function projectSpan(project) {
  const startRaw = project.startDate || project.start_date;
  const endRaw = project.endDate || project.end_date || project.dueDate;
  if (!startRaw && !endRaw) return null;
  const start = startRaw || endRaw;
  const end = endRaw || startRaw;
  return { start, end };
}

function sortKeyForEvent(ev) {
  try {
    const t = new Date(ev.start).getTime();
    return Number.isNaN(t) ? 0 : t;
  } catch {
    return 0;
  }
}

/**
 * @param {object} params
 * @param {object[]} [params.meetings] — normalized meetings (`startTime`, `endTime`, …)
 * @param {object[]} [params.tasks] — tasks with recurrence + `scheduledDate` / `startDate` / `dueDate`
 * @param {object[]} [params.projects] — projects with `startDate` / `endDate`
 * @param {Date} [params.rangeStart] — visible range start (required to expand recurring tasks)
 * @param {Date} [params.rangeEnd] — visible range end
 * @returns {object[]} FullCalendar event sources, sorted by start time (then kind)
 */
export function buildWorkspaceCalendarEvents({
  meetings = [],
  tasks = [],
  projects = [],
  rangeStart,
  rangeEnd,
}) {
  const out = [];
  const hasRange = rangeStart instanceof Date && rangeEnd instanceof Date && !Number.isNaN(rangeStart.getTime()) && !Number.isNaN(rangeEnd.getTime());

  for (const m of meetings) {
    if (!m?.startTime) continue;
    const editable = m.status === 'scheduled';
    out.push({
      id: `meeting-${m.id}`,
      title: m.title || 'Meeting',
      start: m.startTime,
      end: m.endTime || undefined,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: '#111827',
      extendedProps: { kind: 'meeting', entity: m },
      editable,
      startEditable: editable,
      durationEditable: editable,
    });
  }

  for (const t of tasks) {
    if (hasRange) {
      const occurrences = expandTaskOccurrencesInRange(t, rangeStart, rangeEnd);
      for (const occ of occurrences) {
        const startIso = occ.scheduledIso;
        const endIso = addMs(startIso, TASK_BLOCK_MS);
        const entityForUi = {
          ...occ.task,
          scheduledDate: startIso,
          dueDate: startIso,
          startDate: occ.startIso || occ.task.startDate,
        };
        const recurrenceSummary = formatRecurrenceSummaryLine(occ.task);
        out.push({
          id: `task-${occ.task.id}-${startIso}`,
          title: occ.task.name || occ.task.title || 'Task',
          start: startIso,
          end: endIso || undefined,
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          textColor: '#111827',
          extendedProps: {
            kind: 'task',
            entity: entityForUi,
            occurrenceScheduledAt: startIso,
            occurrenceStartAt: occ.startIso || null,
            recurrenceSummary,
          },
          editable: false,
        });
      }
    } else {
      const startIso = t.scheduledDate || t.dueDate || t.startDate;
      if (!startIso) continue;
      const endIso = addMs(startIso, TASK_BLOCK_MS);
      const recurrenceSummary = formatRecurrenceSummaryLine(t);
      out.push({
        id: `task-${t.id}`,
        title: t.name || t.title || 'Task',
        start: startIso,
        end: endIso || undefined,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: '#111827',
        extendedProps: {
          kind: 'task',
          entity: t,
          recurrenceSummary: recurrenceSummary || undefined,
        },
        editable: false,
      });
    }
  }

  for (const p of projects) {
    const span = projectSpan(p);
    if (!span) continue;
    const startDay = toDateOnly(span.start);
    const endDay = toDateOnly(span.end);
    if (!startDay) continue;
    const exclusiveEnd = exclusiveEndDateOnly(`${endDay}T12:00:00.000Z`) || exclusiveEndDateOnly(span.end);
    out.push({
      id: `project-${p.id}`,
      title: p.name || 'Project',
      start: startDay,
      end: exclusiveEnd || undefined,
      allDay: true,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: '#111827',
      extendedProps: { kind: 'project', entity: p },
      editable: false,
    });
  }

  out.sort((a, b) => {
    const d = sortKeyForEvent(a) - sortKeyForEvent(b);
    if (d !== 0) return d;
    const ka = a.extendedProps?.kind || '';
    const kb = b.extendedProps?.kind || '';
    return ka.localeCompare(kb);
  });

  return out;
}

/**
 * @param {object[]} events — output of buildWorkspaceCalendarEvents
 * @param {'all'|'meeting'|'task'|'project'} filterKey
 */
export function filterWorkspaceCalendarEvents(events, filterKey) {
  if (!filterKey || filterKey === 'all') return events;
  return events.filter((ev) => ev.extendedProps?.kind === filterKey);
}

/**
 * @param {object} project — normalized project
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 */
export function projectOverlapsRange(project, rangeStart, rangeEnd) {
  const span = projectSpan(project);
  if (!span) return false;
  const ps = new Date(span.start).getTime();
  const pe = new Date(span.end).getTime();
  const rs = rangeStart.getTime();
  const re = rangeEnd.getTime();
  return ps <= re && pe >= rs;
}
