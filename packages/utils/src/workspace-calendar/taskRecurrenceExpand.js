/**
 * Mirrors backend `apps/backend/src/utils/task-recurrence.js` so the calendar
 * can expand recurring tasks into occurrences inside the visible range without an API round-trip per date.
 */

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** First calendar date strictly after `anchor` whose weekday is in `weekdays` (0=Sun … 6=Sat). */
function firstWeekdayAfter(anchor, weekdays) {
  const sorted = [...new Set(weekdays)]
    .map(Number)
    .filter((w) => w >= 0 && w <= 6)
    .sort((a, b) => a - b);
  if (sorted.length === 0) return null;

  const start = new Date(anchor);
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < 400; i++) {
    const cand = addDays(start, i);
    if (sorted.includes(cand.getDay())) return cand;
  }
  return addDays(anchor, 7);
}

function addMonthsKeepDay(anchor, monthsToAdd, preferredDay) {
  const a = new Date(anchor);
  const y = a.getFullYear();
  const m = a.getMonth() + monthsToAdd;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const day = Math.min(Math.max(1, preferredDay), lastDay);
  const out = new Date(a);
  out.setFullYear(y, m, day);
  return out;
}

function endsBeforeNext(nextDue, recurrenceEndsAt) {
  if (!recurrenceEndsAt) return false;
  const end = new Date(recurrenceEndsAt);
  if (Number.isNaN(end.getTime())) return false;
  return nextDue.getTime() > end.getTime();
}

/**
 * Same contract as backend `computeNextOccurrence`.
 * @param {object} task — flat fields (startDate, scheduledDate, recurrence*)
 */
export function computeNextOccurrence(task) {
  const freq = task.recurrenceFrequency;
  if (!freq || freq === 'none') return null;

  const start = task.startDate ? new Date(task.startDate) : null;
  const due = task.scheduledDate ? new Date(task.scheduledDate) : null;
  const interval = Math.max(1, parseInt(String(task.recurrenceInterval), 10) || 1);

  if (due && Number.isNaN(due.getTime())) return null;
  if (start && Number.isNaN(start.getTime())) return null;

  const anchorDue = due || start;
  const anchorStart = start || due;
  if (!anchorDue || Number.isNaN(anchorDue.getTime())) return null;

  const spanMs =
    start && due && !Number.isNaN(start.getTime()) && !Number.isNaN(due.getTime())
      ? due.getTime() - start.getTime()
      : 0;

  let nextDue;
  let nextStart;

  switch (freq) {
    case 'daily': {
      nextDue = addDays(anchorDue, interval);
      nextStart = anchorStart ? addDays(anchorStart, interval) : spanMs ? new Date(nextDue.getTime() - spanMs) : null;
      break;
    }
    case 'weekly': {
      const weekdays = Array.isArray(task.recurrenceWeekdays) ? task.recurrenceWeekdays : [];
      if (weekdays.length === 0) {
        nextDue = addDays(anchorDue, 7 * interval);
        nextStart = anchorStart ? addDays(anchorStart, 7 * interval) : spanMs ? new Date(nextDue.getTime() - spanMs) : null;
      } else {
        let nd = firstWeekdayAfter(anchorDue, weekdays);
        if (interval > 1) nd = addDays(nd, 7 * (interval - 1));
        nextDue = nd;
        nextStart = spanMs ? new Date(nextDue.getTime() - spanMs) : null;
      }
      break;
    }
    case 'monthly': {
      const mdRaw = task.recurrenceMonthDay;
      const preferred =
        typeof mdRaw === 'number' && mdRaw >= 1 && mdRaw <= 31
          ? mdRaw
          : (anchorStart || anchorDue).getDate();
      nextDue = addMonthsKeepDay(anchorDue, interval, preferred);
      nextStart = anchorStart
        ? addMonthsKeepDay(anchorStart, interval, preferred)
        : spanMs
          ? new Date(nextDue.getTime() - spanMs)
          : null;
      break;
    }
    case 'custom': {
      const unit = task.recurrenceCustomUnit || 'day';
      if (unit === 'day') {
        nextDue = addDays(anchorDue, interval);
        nextStart = anchorStart ? addDays(anchorStart, interval) : spanMs ? new Date(nextDue.getTime() - spanMs) : null;
      } else if (unit === 'week') {
        nextDue = addDays(anchorDue, 7 * interval);
        nextStart = anchorStart ? addDays(anchorStart, 7 * interval) : spanMs ? new Date(nextDue.getTime() - spanMs) : null;
      } else {
        const preferred = (anchorStart || anchorDue).getDate();
        nextDue = addMonthsKeepDay(anchorDue, interval, preferred);
        nextStart = anchorStart
          ? addMonthsKeepDay(anchorStart, interval, preferred)
          : spanMs
            ? new Date(nextDue.getTime() - spanMs)
            : null;
      }
      break;
    }
    default:
      return null;
  }

  if (!nextDue || Number.isNaN(nextDue.getTime())) return null;
  if (endsBeforeNext(nextDue, task.recurrenceEndsAt)) return null;

  return {
    startDate: nextStart && !Number.isNaN(nextStart.getTime()) ? nextStart.toISOString() : null,
    scheduledDate: nextDue.toISOString(),
  };
}

/**
 * Fast-forward recurring virtual task until due >= rangeStart (or no next).
 */
function fastForwardToRange(virtual, rangeStartMs, maxSteps = 5000) {
  let v = { ...virtual };
  let steps = 0;
  while (steps++ < maxSteps) {
    const due = new Date(v.scheduledDate || v.dueDate || v.startDate);
    if (Number.isNaN(due.getTime())) return null;
    if (due.getTime() >= rangeStartMs) return v;
    const next = computeNextOccurrence(v);
    if (!next?.scheduledDate) return null;
    v = {
      ...v,
      startDate: next.startDate,
      scheduledDate: next.scheduledDate,
      dueDate: next.scheduledDate,
    };
  }
  return null;
}

/**
 * All occurrences of one task that fall inside [rangeStart, rangeEnd] (inclusive by date boundary).
 * Non-recurring: at most one, positioned by scheduledDate || dueDate || startDate (due preferred for time-of-day).
 * @returns {{ scheduledIso: string, startIso: string|null, task: object }[]}
 */
export function expandTaskOccurrencesInRange(task, rangeStart, rangeEnd) {
  const rs = rangeStart.getTime();
  const re = rangeEnd.getTime();
  const freq = task.recurrenceFrequency || 'none';

  const scheduledRaw = task.scheduledDate || task.dueDate;
  const startRaw = task.startDate;
  const anchorWhen = scheduledRaw || startRaw;

  if (!freq || freq === 'none') {
    const when = anchorWhen;
    if (!when) return [];
    const due = new Date(when);
    if (Number.isNaN(due.getTime())) return [];
    if (due.getTime() < rs || due.getTime() > re) return [];
    return [
      {
        scheduledIso: due.toISOString(),
        startIso: startRaw ? new Date(startRaw).toISOString() : null,
        task,
      },
    ];
  }

  if (!anchorWhen) return [];

  let virtual = {
    ...task,
    scheduledDate: scheduledRaw || startRaw,
    dueDate: scheduledRaw || startRaw,
    startDate: startRaw || undefined,
  };

  virtual = fastForwardToRange(virtual, rs) || virtual;

  const out = [];
  let iter = 0;
  while (iter++ < 2000) {
    const due = new Date(virtual.scheduledDate || virtual.dueDate || virtual.startDate);
    if (Number.isNaN(due.getTime())) break;
    if (due.getTime() > re) break;
    if (due.getTime() >= rs) {
      const s = virtual.startDate ? new Date(virtual.startDate) : null;
      out.push({
        scheduledIso: due.toISOString(),
        startIso: s && !Number.isNaN(s.getTime()) ? s.toISOString() : null,
        task,
      });
    }
    const next = computeNextOccurrence(virtual);
    if (!next?.scheduledDate) break;
    virtual = {
      ...virtual,
      startDate: next.startDate,
      scheduledDate: next.scheduledDate,
      dueDate: next.scheduledDate,
    };
  }

  return out;
}

/** Merge tasks: range-based list wins on duplicate id; recurring-only tasks are added. */
export function mergeTaskListsForCalendar(rangeTasks, recurringTasks) {
  const map = new Map();
  for (const t of rangeTasks) {
    if (t?.id != null) map.set(t.id, t);
  }
  for (const t of recurringTasks) {
    if (t?.id != null && !map.has(t.id)) map.set(t.id, t);
  }
  return [...map.values()];
}

/** Short human-readable repeat rule for calendar popovers (aligned with PM `formatTaskRecurrenceSummary`). */
export function formatRecurrenceSummaryLine(t) {
  if (!t || !t.recurrenceFrequency || t.recurrenceFrequency === 'none') return '';
  const n = Math.max(1, Number(t.recurrenceInterval) || 1);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  switch (t.recurrenceFrequency) {
    case 'daily':
      return n === 1 ? 'Repeats every day' : `Repeats every ${n} days`;
    case 'weekly': {
      const wd = Array.isArray(t.recurrenceWeekdays) ? t.recurrenceWeekdays : [];
      if (wd.length > 0) {
        const names = [...wd]
          .map(Number)
          .sort((a, b) => a - b)
          .map((d) => dayLabels[d] ?? d)
          .join(', ');
        return n === 1 ? `Repeats weekly (${names})` : `Repeats every ${n} weeks (${names})`;
      }
      return n === 1 ? 'Repeats weekly' : `Repeats every ${n} weeks`;
    }
    case 'monthly':
      return n === 1 ? 'Repeats monthly' : `Repeats every ${n} months`;
    case 'custom': {
      const u = t.recurrenceCustomUnit || 'day';
      const label = u === 'day' ? 'day' : u === 'week' ? 'week' : 'month';
      return `Repeats every ${n} ${label}${n > 1 ? 's' : ''}`;
    }
    default:
      return '';
  }
}
