/**
 * Calendar-date parsing and formatting.
 * Date-only values (YYYY-MM-DD or midnight UTC from date pickers) are interpreted
 * in the user's local timezone so table labels and relative text stay correct.
 */

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MIDNIGHT_UTC_RE = /^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z$/i;
const MIDNIGHT_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?$/;

/**
 * @param {string | Date | null | undefined} dateString
 * @returns {boolean}
 */
export function isCalendarDateValue(dateString) {
  if (!dateString) return false;
  const s = String(dateString).trim();
  if (DATE_ONLY_RE.test(s)) return true;
  if (MIDNIGHT_UTC_RE.test(s)) return true;
  if (MIDNIGHT_LOCAL_RE.test(s)) return true;
  return false;
}

/**
 * @param {string | Date | null | undefined} dateString
 * @returns {Date | null}
 */
export function parseDisplayDate(dateString) {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    return Number.isNaN(dateString.getTime()) ? null : dateString;
  }
  const s = String(dateString).trim();
  const parts = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (parts && isCalendarDateValue(s)) {
    const year = Number(parts[1]);
    const month = Number(parts[2]) - 1;
    const day = Number(parts[3]);
    return new Date(year, month, day, 12, 0, 0, 0);
  }
  const date = new Date(s);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * @param {Date} date
 * @returns {Date}
 */
export function startOfLocalDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calendar-day difference: target local day minus reference local day.
 * @param {Date} targetDate
 * @param {Date} [referenceDate]
 * @returns {number}
 */
export function calendarDayDiff(targetDate, referenceDate = new Date()) {
  const target = startOfLocalDay(targetDate);
  const ref = startOfLocalDay(referenceDate);
  return Math.round((target.getTime() - ref.getTime()) / 86400000);
}

/**
 * True when a calendar due/start date is strictly before today (local).
 * @param {string | Date | null | undefined} dateString
 * @param {Date} [referenceDate]
 * @returns {boolean}
 */
export function isCalendarDateBefore(dateString, referenceDate = new Date()) {
  const d = parseDisplayDate(dateString);
  if (!d) return false;
  if (isCalendarDateValue(dateString)) {
    return calendarDayDiff(d, referenceDate) < 0;
  }
  return d.getTime() < referenceDate.getTime();
}

/**
 * @param {string | Date | null | undefined} dateString
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatCalendarTableDate(dateString, options = {}) {
  const date = parseDisplayDate(dateString);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Day-based relative label for calendar dates (start/due), not hour precision.
 * @param {string | Date | null | undefined} dateString
 * @returns {string}
 */
export function formatCalendarRelativeTime(dateString) {
  const date = parseDisplayDate(dateString);
  if (!date) return '';

  const diffDays = calendarDayDiff(date);

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';

  if (diffDays > 0) {
    if (diffDays < 7) return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    if (diffDays < 30) {
      const w = Math.floor(diffDays / 7);
      return `in ${w} week${w !== 1 ? 's' : ''}`;
    }
    if (diffDays < 365) {
      const m = Math.floor(diffDays / 30);
      return `in ${m} month${m !== 1 ? 's' : ''}`;
    }
    const y = Math.floor(diffDays / 365);
    return `in ${y} year${y !== 1 ? 's' : ''}`;
  }

  const abs = Math.abs(diffDays);
  if (abs < 7) return `${abs} day${abs !== 1 ? 's' : ''} ago`;
  if (abs < 30) {
    const w = Math.floor(abs / 7);
    return `${w} week${w !== 1 ? 's' : ''} ago`;
  }
  if (abs < 365) {
    const m = Math.floor(abs / 30);
    return `${m} month${m !== 1 ? 's' : ''} ago`;
  }
  const y = Math.floor(abs / 365);
  return `${y} year${y !== 1 ? 's' : ''} ago`;
}

/**
 * @param {string | Date | null | undefined} dueDate
 * @param {string | null | undefined} [strapiStatus]
 * @returns {boolean}
 */
export function isTaskDueOverdue(dueDate, strapiStatus) {
  if (!dueDate) return false;
  if (strapiStatus === 'COMPLETED' || strapiStatus === 'CANCELLED' || strapiStatus === 'ON_HOLD') return false;
  return isCalendarDateBefore(dueDate);
}
