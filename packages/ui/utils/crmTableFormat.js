/**
 * Shared date / owner helpers for CRM list tables (contacts, leads, client accounts).
 */

import {
  formatCalendarRelativeTime,
  formatCalendarTableDate,
  isCalendarDateValue,
  parseDisplayDate,
} from '@webfudge/utils';

/**
 * @param {string | null | undefined} dateString
 * @param {{ dateMode?: 'auto' | 'calendar' | 'datetime' }} [options]
 * @returns {string}
 */
export function formatTableDate(dateString, options = {}) {
  if (!dateString) return 'N/A';
  const { dateMode = 'auto' } = options;
  const useCalendar =
    dateMode === 'calendar' || (dateMode === 'auto' && isCalendarDateValue(dateString));
  if (useCalendar) {
    return formatCalendarTableDate(dateString);
  }
  const date = parseDisplayDate(dateString);
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDatetimeRelativeTime(dateString) {
  const date = parseDisplayDate(dateString);
  if (!date) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const isFuture = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const diffSec = Math.floor(absMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (isFuture) {
    if (diffDay === 0) {
      if (diffHour === 0) {
        if (diffMin === 0) return 'due today';
        return `in ${diffMin} minute${diffMin !== 1 ? 's' : ''}`;
      }
      return `in ${diffHour} hour${diffHour !== 1 ? 's' : ''}`;
    }
    if (diffDay < 7) return `in ${diffDay} day${diffDay !== 1 ? 's' : ''}`;
    if (diffDay < 30) {
      const w = Math.floor(diffDay / 7);
      return `in ${w} week${w !== 1 ? 's' : ''}`;
    }
    if (diffDay < 365) {
      const m = Math.floor(diffDay / 30);
      return `in ${m} month${m !== 1 ? 's' : ''}`;
    }
    const y = Math.floor(diffDay / 365);
    return `in ${y} year${y !== 1 ? 's' : ''}`;
  }

  if (diffDay === 0) {
    if (diffHour === 0) {
      if (diffMin === 0) return 'just now';
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    }
    return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  }
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) {
    const w = Math.floor(diffDay / 7);
    return `${w} week${w !== 1 ? 's' : ''} ago`;
  }
  if (diffDay < 365) {
    const m = Math.floor(diffDay / 30);
    return `${m} month${m !== 1 ? 's' : ''} ago`;
  }
  const y = Math.floor(diffDay / 365);
  return `${y} year${y !== 1 ? 's' : ''} ago`;
}

/**
 * @param {string | null | undefined} dateString
 * @param {{ dateMode?: 'auto' | 'calendar' | 'datetime' }} [options]
 * @returns {string}
 */
export function formatRelativeTime(dateString, options = {}) {
  if (!dateString) return '';
  const { dateMode = 'auto' } = options;
  const useCalendar =
    dateMode === 'calendar' || (dateMode === 'auto' && isCalendarDateValue(dateString));
  if (useCalendar) {
    return formatCalendarRelativeTime(dateString);
  }
  return formatDatetimeRelativeTime(dateString);
}

/**
 * @param {object | null | undefined} user - Strapi user / assignedTo
 * @returns {{ label: string, avatarFallback: string }}
 */
export function ownerDisplayFromUser(user) {
  if (!user || typeof user !== 'object') {
    return { label: 'Unassigned', avatarFallback: '?' };
  }
  const fn = user.firstName || user.firstname;
  const ln = user.lastName || user.lastname;
  const full = [fn, ln].filter(Boolean).join(' ').trim();
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    const fb =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : full.slice(0, 2).toUpperCase();
    return { label: full, avatarFallback: fb };
  }
  if (user.username) {
    const u = String(user.username);
    return { label: u, avatarFallback: u.slice(0, 2).toUpperCase() };
  }
  if (user.email) {
    const e = String(user.email);
    return { label: e, avatarFallback: e[0].toUpperCase() };
  }
  return { label: 'Unknown', avatarFallback: '?' };
}

export {
  formatCalendarRelativeTime,
  formatCalendarTableDate,
  isCalendarDateValue,
  parseDisplayDate,
};
