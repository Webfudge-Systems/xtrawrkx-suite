/**
 * Project-scoped CRM activity (same Strapi endpoints as CRM entity timelines).
 */
import strapiClient from '../strapiClient';

/**
 * @param {{ projectId: string|number, limit?: number }} opts
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function fetchProjectActivityTimeline({ projectId, limit = 80 } = {}) {
  if (projectId == null || String(projectId).trim() === '') {
    return { data: [], total: 0 };
  }
  const res = await strapiClient.get('/crm-activities/timeline', { projectId, limit });
  const data = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.meta?.total === 'number' ? res.meta.total : data.length;
  return { data, total };
}

/**
 * Comment-type activities for the Chats tab.
 * @param {{ projectId: string|number, limit?: number }} opts
 */
export async function fetchProjectComments({ projectId, limit = 80 } = {}) {
  if (projectId == null || String(projectId).trim() === '') {
    return { data: [], total: 0 };
  }
  const res = await strapiClient.get('/crm-activities/timeline', {
    projectId,
    limit,
    type: 'comment',
  });
  const data = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.meta?.total === 'number' ? res.meta.total : data.length;
  return { data, total };
}

/**
 * @param {{ projectId: string|number, comment: string }} opts
 */
export async function addProjectComment({ projectId, comment } = {}) {
  return strapiClient.post('/crm-activities/comments', {
    projectId,
    comment,
  });
}

/**
 * @param {{ projectIds: (string|number)[] }} opts
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchProjectCommentCounts({ projectIds } = {}) {
  const ids = Array.isArray(projectIds) ? projectIds.map((v) => String(v).trim()).filter(Boolean) : [];
  if (!ids.length) return {};
  const res = await strapiClient.get('/crm-activities/comment-counts', {
    projectIds: ids.join(','),
  });
  return res?.data && typeof res.data === 'object' ? res.data : {};
}
