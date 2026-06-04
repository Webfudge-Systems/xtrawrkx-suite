/**
 * PM-wide CRM activity via /crm-activities/feed scoped to project + task subjects.
 */
import strapiClient from '../strapiClient';

const PM_SUBJECT_TYPES = 'project,task';

function normalizeFeedResponse(res) {
  const data = Array.isArray(res?.data) ? res.data : [];
  const meta = res?.meta && typeof res.meta === 'object' ? res.meta : {};
  const total = typeof meta.total === 'number' ? meta.total : data.length;
  const startOut = typeof meta.start === 'number' ? meta.start : 0;
  const limitOut = typeof meta.limit === 'number' ? meta.limit : data.length;
  return { data, total, start: startOut, limit: limitOut };
}

/** All PM audit activity (tasks + projects): creates, updates, comments, etc. */
export async function fetchPmActivityFeed({ limit = 25, start = 0 } = {}) {
  const lim = Math.min(Math.max(1, parseInt(String(limit), 10) || 25), 100);
  const off = Math.max(0, parseInt(String(start), 10) || 0);
  const res = await strapiClient.get('/crm-activities/feed', {
    limit: lim,
    start: off,
    subjectTypes: PM_SUBJECT_TYPES,
  });
  return normalizeFeedResponse(res);
}

/** Comment-only feed for PM threads tab (project + task CRM chats). */
export async function fetchPmThreadsCommentsFeed({ limit = 100, start = 0 } = {}) {
  const lim = Math.min(Math.max(1, parseInt(String(limit), 10) || 100), 100);
  const off = Math.max(0, parseInt(String(start), 10) || 0);
  const res = await strapiClient.get('/crm-activities/feed', {
    limit: lim,
    start: off,
    type: 'comment',
    subjectTypes: PM_SUBJECT_TYPES,
  });
  return normalizeFeedResponse(res);
}
