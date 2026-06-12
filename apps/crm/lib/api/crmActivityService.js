/**
 * CRM activity timeline (Strapi /api/crm-activities/timeline).
 */
import strapiClient from '../strapiClient';

/** CRM entity subject types (excludes PM project/task and org admin rows). */
export const CRM_SUBJECT_TYPES = 'contact,lead_company,deal,meeting,client_account';

function commentPayload(fields) {
  const { attachments, ...rest } = fields;
  if (Array.isArray(attachments) && attachments.length) {
    return { ...rest, attachments };
  }
  return rest;
}

/**
 * Organization-wide activity (GET /crm-activities/feed).
 * @param {{ limit?: number, start?: number, type?: string, subjectTypes?: string }} opts
 * @returns {Promise<{ data: object[], total: number, start: number, limit: number }>}
 */
export async function fetchGlobalActivityFeed({ limit = 20, start = 0, type, subjectTypes } = {}) {
  const params = { limit, start };
  if (type) params.type = type;
  if (subjectTypes) params.subjectTypes = subjectTypes;
  const res = await strapiClient.get('/crm-activities/feed', params);
  const data = Array.isArray(res?.data) ? res.data : [];
  const meta = res?.meta && typeof res.meta === 'object' ? res.meta : {};
  const total = typeof meta.total === 'number' ? meta.total : data.length;
  const startOut = typeof meta.start === 'number' ? meta.start : start;
  const limitOut = typeof meta.limit === 'number' ? meta.limit : limit;
  return { data, total, start: startOut, limit: limitOut };
}

/**
 * CRM-scoped org feed (contacts, leads, deals, meetings, client accounts).
 * @param {{ limit?: number, start?: number, type?: string }} opts
 * @returns {Promise<{ data: object[], total: number, start: number, limit: number }>}
 */
export async function fetchCrmActivityFeed(opts = {}) {
  return fetchGlobalActivityFeed({ ...opts, subjectTypes: CRM_SUBJECT_TYPES });
}

/**
 * Fetch all comment-type activities org-wide for the Threads page.
 * Uses the feed endpoint with type=comment, fetching up to `limit` items.
 * @param {{ limit?: number, start?: number }} opts
 * @returns {Promise<{ data: object[], total: number, start: number, limit: number }>}
 */
export async function fetchGlobalCommentsFeed({ limit = 100, start = 0 } = {}) {
  return fetchGlobalActivityFeed({ limit, start, type: 'comment' });
}

/**
 * @param {{ contactId?: string|number, leadCompanyId?: string|number, dealId?: string|number, clientAccountId?: string|number, projectId?: string|number, limit?: number }} opts
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function fetchActivityTimeline({
  contactId,
  leadCompanyId,
  dealId,
  clientAccountId,
  projectId,
  limit = 80,
} = {}) {
  const params = { limit };
  if (contactId != null && String(contactId).trim() !== '') {
    params.contactId = contactId;
  }
  if (leadCompanyId != null && String(leadCompanyId).trim() !== '') {
    params.leadCompanyId = leadCompanyId;
  }
  if (dealId != null && String(dealId).trim() !== '') {
    params.dealId = dealId;
  }
  if (clientAccountId != null && String(clientAccountId).trim() !== '') {
    params.clientAccountId = clientAccountId;
  }
  if (projectId != null && String(projectId).trim() !== '') {
    params.projectId = projectId;
  }
  const res = await strapiClient.get('/crm-activities/timeline', params);
  const data = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.meta?.total === 'number' ? res.meta.total : data.length;
  return { data, total };
}

// ── Meeting ───────────────────────────────────────────────────────────────────

/**
 * Fetch the activity timeline for a specific meeting.
 * @param {{ meetingId: string|number, limit?: number }} opts
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function fetchMeetingTimeline({ meetingId, limit = 80 } = {}) {
  if (meetingId == null || String(meetingId).trim() === '') {
    return { data: [], total: 0 };
  }
  const res = await strapiClient.get('/crm-activities/timeline', { meetingId, limit });
  const data = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.meta?.total === 'number' ? res.meta.total : data.length;
  return { data, total };
}

// ── Lead Company ─────────────────────────────────────────────────────────────

/**
 * @param {{ leadCompanyId: string|number, limit?: number }} opts
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function fetchLeadCompanyComments({ leadCompanyId, limit = 30, commentKind } = {}) {
  if (leadCompanyId == null || String(leadCompanyId).trim() === '') {
    return { data: [], total: 0 };
  }
  const params = {
    leadCompanyId,
    limit,
    type: 'comment',
  };
  if (commentKind) params.commentKind = commentKind;
  const res = await strapiClient.get('/crm-activities/timeline', params);
  const data = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.meta?.total === 'number' ? res.meta.total : data.length;
  return { data, total };
}

/**
 * @param {{ leadCompanyId: string|number, comment: string, commentKind?: 'general' | 'next_connect' }} opts
 * @returns {Promise<{ data: object }>}
 */
export async function addLeadCompanyComment({ leadCompanyId, comment, commentKind = 'general', attachments } = {}) {
  return strapiClient.post('/crm-activities/comments', commentPayload({
    leadCompanyId,
    comment,
    commentKind,
    attachments,
  }));
}

export async function fetchLeadCompanyNextConnectReasons({ leadCompanyId, limit = 20 } = {}) {
  return fetchLeadCompanyComments({ leadCompanyId, limit, commentKind: 'next_connect' });
}

export async function addLeadCompanyNextConnectReason({ leadCompanyId, comment } = {}) {
  return addLeadCompanyComment({ leadCompanyId, comment, commentKind: 'next_connect' });
}

/**
 * @param {{ leadCompanyIds: (string|number)[], commentKind?: 'general' | 'next_connect' | 'all' }} opts
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchLeadCompanyCommentCounts({ leadCompanyIds, commentKind } = {}) {
  const ids = Array.isArray(leadCompanyIds)
    ? leadCompanyIds.map((v) => String(v).trim()).filter(Boolean)
    : [];
  if (!ids.length) return {};
  const params = { leadCompanyIds: ids.join(',') };
  if (commentKind) params.commentKind = commentKind;
  const res = await strapiClient.get('/crm-activities/comment-counts', params);
  return res?.data && typeof res.data === 'object' ? res.data : {};
}

// ── Deal ─────────────────────────────────────────────────────────────────────

/**
 * @param {{ dealId: string|number, limit?: number }} opts
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function fetchDealComments({ dealId, limit = 30 } = {}) {
  if (dealId == null || String(dealId).trim() === '') {
    return { data: [], total: 0 };
  }
  const res = await strapiClient.get('/crm-activities/timeline', {
    dealId,
    limit,
    type: 'comment',
  });
  const data = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.meta?.total === 'number' ? res.meta.total : data.length;
  return { data, total };
}

/**
 * @param {{ dealId: string|number, comment: string }} opts
 * @returns {Promise<{ data: object }>}
 */
export async function addDealComment({ dealId, comment, attachments } = {}) {
  return strapiClient.post('/crm-activities/comments', commentPayload({ dealId, comment, attachments }));
}

/**
 * @param {{ dealIds: (string|number)[] }} opts
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchDealCommentCounts({ dealIds } = {}) {
  const ids = Array.isArray(dealIds) ? dealIds.map((v) => String(v).trim()).filter(Boolean) : [];
  if (!ids.length) return {};
  const res = await strapiClient.get('/crm-activities/comment-counts', {
    dealIds: ids.join(','),
  });
  return res?.data && typeof res.data === 'object' ? res.data : {};
}

// ── Contact ──────────────────────────────────────────────────────────────────

/**
 * @param {{ contactId: string|number, limit?: number }} opts
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function fetchContactComments({ contactId, limit = 60 } = {}) {
  if (contactId == null || String(contactId).trim() === '') {
    return { data: [], total: 0 };
  }
  const res = await strapiClient.get('/crm-activities/timeline', {
    contactId,
    limit,
    type: 'comment',
  });
  const data = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.meta?.total === 'number' ? res.meta.total : data.length;
  return { data, total };
}

/**
 * @param {{ contactId: string|number, comment: string }} opts
 * @returns {Promise<{ data: object }>}
 */
export async function addContactComment({ contactId, comment, attachments } = {}) {
  return strapiClient.post('/crm-activities/comments', commentPayload({ contactId, comment, attachments }));
}

/**
 * @param {{ contactIds: (string|number)[] }} opts
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchContactCommentCounts({ contactIds } = {}) {
  const ids = Array.isArray(contactIds) ? contactIds.map((v) => String(v).trim()).filter(Boolean) : [];
  if (!ids.length) return {};
  const res = await strapiClient.get('/crm-activities/comment-counts', {
    contactIds: ids.join(','),
  });
  return res?.data && typeof res.data === 'object' ? res.data : {};
}

// ── Client Account ────────────────────────────────────────────────────────────

/**
 * @param {{ clientAccountId: string|number, limit?: number }} opts
 * @returns {Promise<{ data: object[], total: number }>}
 */
export async function fetchClientAccountComments({ clientAccountId, limit = 60 } = {}) {
  if (clientAccountId == null || String(clientAccountId).trim() === '') {
    return { data: [], total: 0 };
  }
  const res = await strapiClient.get('/crm-activities/timeline', {
    clientAccountId,
    limit,
    type: 'comment',
  });
  const data = Array.isArray(res?.data) ? res.data : [];
  const total = typeof res?.meta?.total === 'number' ? res.meta.total : data.length;
  return { data, total };
}

/**
 * @param {{ clientAccountId: string|number, comment: string }} opts
 * @returns {Promise<{ data: object }>}
 */
export async function addClientAccountComment({ clientAccountId, comment, attachments } = {}) {
  return strapiClient.post('/crm-activities/comments', commentPayload({ clientAccountId, comment, attachments }));
}

/**
 * @param {{ clientAccountIds: (string|number)[] }} opts
 * @returns {Promise<Record<string, number>>}
 */
export async function fetchClientAccountCommentCounts({ clientAccountIds } = {}) {
  const ids = Array.isArray(clientAccountIds)
    ? clientAccountIds.map((v) => String(v).trim()).filter(Boolean)
    : [];
  if (!ids.length) return {};
  const res = await strapiClient.get('/crm-activities/comment-counts', {
    clientAccountIds: ids.join(','),
  });
  return res?.data && typeof res.data === 'object' ? res.data : {};
}

// ── Task (PM) ─────────────────────────────────────────────────────────────────

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
export async function addTaskComment({ taskId, comment, attachments } = {}) {
  return strapiClient.post('/crm-activities/comments', commentPayload({ taskId, comment, attachments }));
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
  CRM_SUBJECT_TYPES,
  fetchGlobalActivityFeed,
  fetchCrmActivityFeed,
  fetchGlobalCommentsFeed,
  fetchActivityTimeline,
  fetchMeetingTimeline,
  fetchLeadCompanyComments,
  addLeadCompanyComment,
  fetchLeadCompanyNextConnectReasons,
  addLeadCompanyNextConnectReason,
  fetchLeadCompanyCommentCounts,
  fetchDealComments,
  addDealComment,
  fetchDealCommentCounts,
  fetchContactComments,
  addContactComment,
  fetchContactCommentCounts,
  fetchClientAccountComments,
  addClientAccountComment,
  fetchClientAccountCommentCounts,
  fetchTaskComments,
  addTaskComment,
  fetchTaskCommentCounts,
};
