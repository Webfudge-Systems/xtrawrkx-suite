/**
 * Unified activity + multi-location chat for CRM client account detail.
 */
import {
  fetchActivityTimeline,
  fetchTaskComments,
  fetchDealComments,
  addTaskComment,
  addDealComment,
} from './crmActivityService';
import strapiClient from '../strapiClient';
import {
  fetchClientAccountUnifiedChat,
  sendClientAccountUnifiedChat,
} from './clientChatService';

function annotateRow(row, source) {
  if (!row || !source) return row;
  const meta = row.meta && typeof row.meta === 'object' ? row.meta : {};
  return {
    ...row,
    meta: {
      ...meta,
      aggregateSource: {
        type: source.type,
        id: source.id,
        label: source.label,
        section: source.section,
      },
    },
  };
}

function annotateRows(rows, source) {
  return (Array.isArray(rows) ? rows : []).map((row) => annotateRow(row, source));
}

/**
 * @returns {Array<{ key, label, section, entityType, entityId }>}
 */
export function buildClientChatChannels({
  clientAccountId,
  accountName,
  tasks = [],
  projects = [],
  deals = [],
}) {
  const channels = [
    {
      key: 'all',
      label: 'All messages',
      section: 'All',
      entityType: 'client_account',
      entityId: clientAccountId,
    },
    {
      key: 'account',
      label: accountName || 'Account',
      section: 'Account',
      entityType: 'client_account',
      entityId: clientAccountId,
    },
  ];

  for (const task of tasks) {
    if (task?.id == null) continue;
    channels.push({
      key: `task-${task.id}`,
      label: task.name || `Task ${task.id}`,
      section: 'Tasks',
      entityType: 'task',
      entityId: task.id,
    });
  }

  for (const project of projects) {
    if (project?.id == null) continue;
    channels.push({
      key: `project-${project.id}`,
      label: project.name || `Project ${project.id}`,
      section: 'Projects',
      entityType: 'project',
      entityId: project.id,
    });
  }

  for (const deal of deals) {
    if (deal?.id == null) continue;
    channels.push({
      key: `deal-${deal.id}`,
      label: deal.name || `Deal ${deal.id}`,
      section: 'Deals',
      entityType: 'deal',
      entityId: deal.id,
    });
  }

  return channels;
}

async function fetchChannelComments(channel, limit = 80) {
  if (!channel) return { data: [], total: 0 };

  if (channel.key === 'all') {
    return fetchAllClientChatsMerged(channel, limit);
  }

  if (channel.entityType === 'client_account') {
    const res = await fetchClientAccountUnifiedChat({
      clientAccountId: channel.entityId,
      limit,
    });
    return {
      data: annotateRows(res.data, channel),
      total: res.total,
    };
  }

  if (channel.entityType === 'task') {
    const res = await fetchTaskComments({ taskId: channel.entityId, limit });
    return {
      data: annotateRows(res.data, channel),
      total: res.total,
    };
  }

  if (channel.entityType === 'deal') {
    const res = await fetchDealComments({ dealId: channel.entityId, limit });
    return {
      data: annotateRows(res.data, channel),
      total: res.total,
    };
  }

  if (channel.entityType === 'project') {
    const res = await fetchActivityTimeline({
      projectId: channel.entityId,
      limit,
      type: 'comment',
    });
    return {
      data: annotateRows(res.data, channel),
      total: res.total,
    };
  }

  return { data: [], total: 0 };
}

async function fetchAllClientChatsMerged(rootChannel, limit = 120) {
  const channels = buildClientChatChannels({
    clientAccountId: rootChannel.entityId,
    accountName: rootChannel.label,
    tasks: rootChannel._tasks || [],
    projects: rootChannel._projects || [],
    deals: rootChannel._deals || [],
  }).filter((c) => c.key !== 'all');

  const parts = await Promise.all(
    channels.map(async (ch) => {
      try {
        const res = await fetchChannelComments(ch, 60);
        return res.data || [];
      } catch {
        return [];
      }
    }),
  );

  const merged = parts
    .flat()
    .sort((a, b) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return ta - tb;
    });

  const sliced = merged.length > limit ? merged.slice(-limit) : merged;
  return { data: sliced, total: merged.length };
}

export async function fetchClientChatForChannel(channel, context = {}, limit = 80) {
  if (channel?.key === 'all') {
    return fetchAllClientChatsMerged(
      {
        ...channel,
        _tasks: context.tasks || [],
        _projects: context.projects || [],
        _deals: context.deals || [],
      },
      limit,
    );
  }
  return fetchChannelComments(channel, limit);
}

export async function sendClientChatForChannel(channel, comment) {
  const text = String(comment || '').trim();
  if (!text) throw new Error('Message is required');
  if (!channel || channel.key === 'all') {
    throw new Error('Select a specific location to send a message');
  }

  if (channel.entityType === 'client_account') {
    return sendClientAccountUnifiedChat({
      clientAccountId: channel.entityId,
      comment: text,
    });
  }

  if (channel.entityType === 'task') {
    const res = await addTaskComment({ taskId: channel.entityId, comment: text });
    return { data: annotateRow(res?.data ?? res, channel) };
  }

  if (channel.entityType === 'deal') {
    const res = await addDealComment({ dealId: channel.entityId, comment: text });
    return { data: annotateRow(res?.data ?? res, channel) };
  }

  if (channel.entityType === 'project') {
    const res = await strapiClient.post('/crm-activities/comments', {
      projectId: channel.entityId,
      comment: text,
    });
    return { data: annotateRow(res?.data ?? res, channel) };
  }

  throw new Error('Unsupported chat location');
}

export async function fetchChannelActivityTimeline(channel, limit = 60) {
  if (!channel || channel.key === 'all') return { data: [], total: 0 };

  const params = { limit };
  if (channel.entityType === 'client_account') params.clientAccountId = channel.entityId;
  else if (channel.entityType === 'task') params.taskId = channel.entityId;
  else if (channel.entityType === 'project') params.projectId = channel.entityId;
  else if (channel.entityType === 'deal') params.dealId = channel.entityId;
  else return { data: [], total: 0 };

  const res = await fetchActivityTimeline(params);
  return {
    data: annotateRows(res.data, channel),
    total: res.total,
  };
}

/**
 * Single merged timeline across account, lead, deals, projects, tasks, contacts.
 */
export async function fetchUnifiedClientAccountTimeline({
  clientAccountId,
  accountName,
  leadCompanyId,
  deals = [],
  projects = [],
  tasks = [],
  contacts = [],
  limit = 200,
} = {}) {
  const loads = [];

  if (clientAccountId != null && String(clientAccountId).trim() !== '') {
    loads.push({
      source: {
        type: 'client_account',
        id: clientAccountId,
        label: accountName || 'Account',
        section: 'Account',
      },
      promise: fetchActivityTimeline({ clientAccountId, limit: 80 }),
    });
  }

  if (leadCompanyId) {
    loads.push({
      source: { type: 'lead_company', id: leadCompanyId, label: 'Lead company', section: 'Lead' },
      promise: fetchActivityTimeline({ leadCompanyId, limit: 80 }),
    });
  }

  for (const deal of deals) {
    if (deal?.id == null) continue;
    loads.push({
      source: {
        type: 'deal',
        id: deal.id,
        label: deal.name || `Deal ${deal.id}`,
        section: 'Deals',
      },
      promise: fetchActivityTimeline({ dealId: deal.id, limit: 40 }),
    });
  }

  for (const project of projects) {
    if (project?.id == null) continue;
    loads.push({
      source: {
        type: 'project',
        id: project.id,
        label: project.name || `Project ${project.id}`,
        section: 'Projects',
      },
      promise: fetchActivityTimeline({ projectId: project.id, limit: 40 }),
    });
  }

  for (const task of tasks) {
    if (task?.id == null) continue;
    loads.push({
      source: {
        type: 'task',
        id: task.id,
        label: task.name || `Task ${task.id}`,
        section: 'Tasks',
      },
      promise: fetchActivityTimeline({ taskId: task.id, limit: 40 }),
    });
  }

  for (const contact of contacts) {
    if (contact?.id == null) continue;
    const contactLabel =
      [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
      contact.email ||
      `Contact ${contact.id}`;
    loads.push({
      source: {
        type: 'contact',
        id: contact.id,
        label: contactLabel,
        section: 'Contacts',
      },
      promise: fetchActivityTimeline({ contactId: contact.id, limit: 30 }),
    });
  }

  const results = await Promise.all(loads.map(async (item) => {
    try {
      const res = await item.promise;
      return annotateRows(res.data, item.source);
    } catch {
      return [];
    }
  }));

  const byKey = new Map();
  for (const rows of results) {
    for (const row of rows) {
      const key =
        row?.id != null
          ? `${row.meta?.aggregateSource?.type || 'row'}-${row.id}`
          : `${row?.createdAt || ''}-${row?.summary || ''}`;
      if (!byKey.has(key)) byKey.set(key, row);
    }
  }

  const merged = Array.from(byKey.values()).sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const sliced = merged.length > limit ? merged.slice(0, limit) : merged;
  return { data: sliced, total: merged.length };
}
