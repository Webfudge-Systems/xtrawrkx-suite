/**
 * Task row comments (same CRM activity pipeline as lead companies: /crm-activities/*).
 */
import strapiClient from '../strapiClient';

/**
 * @param {{ taskId: string|number, limit?: number }} opts
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function fetchTaskComments({ taskId, limit = 30 } = {}) {
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
 * @returns {Promise<{ data: object }>}
 */
export async function addTaskComment({ taskId, comment } = {}) {
  return strapiClient.post('/crm-activities/comments', { taskId, comment });
}

/**
 * @param {{ taskIds: (string|number)[] }} opts
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchTaskCommentCounts({ taskIds } = {}) {
  const ids = Array.isArray(taskIds) ? taskIds.map((v) => String(v).trim()).filter(Boolean) : [];
  if (!ids.length) return {};
  const res = await strapiClient.get('/crm-activities/comment-counts', {
    taskIds: ids.join(','),
  });
  return res?.data && typeof res.data === 'object' ? res.data : {};
}

export default {
  fetchTaskComments,
  addTaskComment,
  fetchTaskCommentCounts,
};
