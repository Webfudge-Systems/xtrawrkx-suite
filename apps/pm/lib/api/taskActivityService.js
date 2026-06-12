/**
 * Task-scoped CRM activity (same Strapi endpoints as CRM entity timelines).
 */
import strapiClient from '../strapiClient';

/**
 * @param {{ taskId: string|number, limit?: number }} opts
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function fetchTaskActivityTimeline({ taskId, limit = 80 } = {}) {
  if (taskId == null || String(taskId).trim() === '') {
    return { data: [], total: 0 };
  }
  const res = await strapiClient.get('/crm-activities/timeline', { taskId, limit });
  const data = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.meta?.total === 'number' ? res.meta.total : data.length;
  return { data, total };
}

/** Comment-type activities for the Chats tab. */
export async function fetchTaskComments({ taskId, limit = 80 } = {}) {
  if (taskId == null || String(taskId).trim() === '') {
    return { data: [], total: 0 };
  }
  const res = await strapiClient.get('/crm-activities/timeline', {
    taskId,
    limit,
    type: 'comment',
  });
  const data = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.meta?.total === 'number' ? res.meta.total : data.length;
  return { data, total };
}

/**
 * @param {{ taskId: string|number, comment: string }} opts
 */
export async function addTaskComment({ taskId, comment, attachments } = {}) {
  const body = { taskId, comment };
  if (Array.isArray(attachments) && attachments.length) body.attachments = attachments;
  return strapiClient.post('/crm-activities/comments', body);
}
