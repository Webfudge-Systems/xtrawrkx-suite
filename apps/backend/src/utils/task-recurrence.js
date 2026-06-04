'use strict';

const { randomUUID } = require('crypto');

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
 * @param {object} task — entity fields (startDate, scheduledDate, recurrence*)
 * @returns {{ startDate: string|null, scheduledDate: string|null }|null}
 */
function computeNextOccurrence(task) {
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
 * @returns {string|null} new recurrence group id if one should be persisted on first recurring save
 */
function ensureRecurrenceGroupId(task) {
  const freq = task.recurrenceFrequency;
  if (!freq || freq === 'none') return null;
  if (task.recurrenceGroupId && String(task.recurrenceGroupId).trim() !== '') return null;
  return randomUUID();
}

module.exports = {
  computeNextOccurrence,
  ensureRecurrenceGroupId,
  randomUUID,
};
