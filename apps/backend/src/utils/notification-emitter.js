'use strict';

/**
 * Central in-app notification fan-out for CRM + PM.
 * Recipients are stakeholders on an entity (assignee, collaborators, etc.)
 * plus @mention targets (urgent). The actor never receives their own notification.
 */

const MENTION_TOKEN_RE = /@\[([^\]]+)\]\(user:(\d+)\)/g;

const SUBJECT_PATHS = {
  task: { app: 'pm', path: (id) => `/tasks/${id}` },
  project: { app: 'pm', path: (id) => `/projects/${id}` },
  deal: { app: 'crm', path: (id) => `/sales/deals/${id}` },
  lead_company: { app: 'crm', path: (id) => `/sales/lead-companies/${id}` },
  contact: { app: 'crm', path: (id) => `/sales/contacts/${id}` },
  client_account: { app: 'crm', path: (id) => `/clients/accounts/${id}` },
};

function relationUserId(rel) {
  if (rel == null) return null;
  if (typeof rel === 'object') {
    const id = rel.id;
    return id != null ? Number(id) : null;
  }
  const n = Number(rel);
  return Number.isNaN(n) ? null : n;
}

function relationUserIds(rel) {
  if (rel == null) return [];
  if (Array.isArray(rel)) return rel.map(relationUserId).filter((id) => id != null);
  const one = relationUserId(rel);
  return one != null ? [one] : [];
}

function uniquePositiveIds(ids) {
  const out = [];
  const seen = new Set();
  for (const raw of ids || []) {
    const n = Number(raw);
    if (!n || Number.isNaN(n) || n < 1 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

function excludeActor(ids, actorId) {
  const actor = Number(actorId);
  if (!actor || Number.isNaN(actor)) return ids;
  return ids.filter((id) => id !== actor);
}

function parseMentionUserIds(text) {
  const ids = [];
  const str = String(text || '');
  MENTION_TOKEN_RE.lastIndex = 0;
  let match;
  while ((match = MENTION_TOKEN_RE.exec(str)) !== null) {
    const n = parseInt(match[2], 10);
    if (!Number.isNaN(n) && n > 0) ids.push(n);
  }
  return uniquePositiveIds(ids);
}

function truncateMessage(text, max = 140) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function buildHref(subjectType, subjectId) {
  const cfg = SUBJECT_PATHS[subjectType];
  if (!cfg || subjectId == null) return null;
  return { app: cfg.app, href: cfg.path(subjectId) };
}

function taskStakeholderIds(task) {
  if (!task) return [];
  return uniquePositiveIds([
    relationUserId(task.assignee),
    relationUserId(task.assigner),
    ...relationUserIds(task.collaborators),
    ...relationUserIds(task.pendingCollaborators),
  ]);
}

function projectStakeholderIds(project) {
  if (!project) return [];
  return uniquePositiveIds([
    relationUserId(project.projectManager),
    ...relationUserIds(project.teamMembers),
  ]);
}

function assignedStakeholderIds(entity) {
  return uniquePositiveIds([relationUserId(entity?.assignedTo)]);
}

async function notifyUsers(strapi, { userIds, organizationId, type, title, message, data = {} }) {
  if (!organizationId || !userIds?.length) return;
  try {
    const svc = strapi.service('api::notification.notification');
    if (!svc?.notify) return;
    await svc.notify({
      userIds,
      organizationId,
      type,
      title,
      message,
      data,
    });
  } catch (err) {
    strapi.log.warn('notification-emitter: notify failed: %s', err?.message || err);
  }
}

/**
 * @param {object} opts
 * @param {string} opts.subjectType - task | project | deal | lead_company | contact | client_account
 */
async function emitCommentNotifications(strapi, opts) {
  const {
    organizationId,
    actorUserId,
    actorName,
    subjectType,
    subjectId,
    entityName,
    comment,
    stakeholderIds,
  } = opts;
  if (!organizationId || !subjectId) return;

  const mentionIds = parseMentionUserIds(comment);
  const stakeholders = uniquePositiveIds(stakeholderIds || []);
  const link = buildHref(subjectType, subjectId);
  const entityLabel = entityName || 'record';
  const preview = truncateMessage(comment);

  const commentTypeMap = {
    task: 'task_comment',
    project: 'project_comment',
    deal: 'deal_comment',
    lead_company: 'lead_comment',
    contact: 'contact_comment',
    client_account: 'client_account_comment',
  };
  const commentType = commentTypeMap[subjectType] || 'info';

  if (mentionIds.length) {
    await notifyUsers(strapi, {
      userIds: excludeActor(mentionIds, actorUserId),
      organizationId,
      type: 'mention',
      title: `${actorName} mentioned you`,
      message: `On ${entityLabel}: "${preview}"`,
      data: {
        priority: 'urgent',
        subjectType,
        subjectId,
        actorId: actorUserId,
        ...link,
      },
    });
  }

  const commentRecipients = excludeActor(
    stakeholders.filter((id) => !mentionIds.includes(id)),
    actorUserId
  );
  if (commentRecipients.length) {
    await notifyUsers(strapi, {
      userIds: commentRecipients,
      organizationId,
      type: commentType,
      title: `New comment on ${entityLabel}`,
      message: `${actorName}: "${preview}"`,
      data: {
        subjectType,
        subjectId,
        actorId: actorUserId,
        ...link,
      },
    });
  }
}

/**
 * Notify stakeholders when an entity is updated (excluding pure comment actions).
 */
async function emitUpdateNotifications(strapi, opts) {
  const {
    organizationId,
    actorUserId,
    actorName,
    subjectType,
    subjectId,
    entityName,
    changedKeys = [],
    stakeholderIds,
    previousEntity,
    patch,
  } = opts;
  if (!organizationId || !subjectId) return;
  const keys = Array.isArray(changedKeys) ? changedKeys : [];
  if (!keys.length) return;

  const stakeholders = uniquePositiveIds(stakeholderIds || []);
  const recipients = excludeActor(stakeholders, actorUserId);
  if (!recipients.length) return;

  const link = buildHref(subjectType, subjectId);
  const entityLabel = entityName || 'record';

  const updateTypeMap = {
    task: 'task_updated',
    project: 'project_updated',
    deal: 'deal_updated',
    lead_company: 'lead_updated',
    contact: 'contact_updated',
    client_account: 'client_account_updated',
  };
  const notifType = updateTypeMap[subjectType] || 'info';

  let title = `${entityLabel} was updated`;
  let message = `${actorName} made changes`;

  if (keys.includes('assignee') || keys.includes('assignedTo')) {
    const assignKey = keys.includes('assignee') ? 'assignee' : 'assignedTo';
    const newAssigneeId = relationUserId(patch?.[assignKey]);
    if (newAssigneeId && newAssigneeId !== actorUserId) {
      const assignType =
        subjectType === 'task'
          ? 'task_assigned'
          : subjectType === 'deal'
            ? 'deal_updated'
            : subjectType === 'lead_company'
              ? 'lead_assigned'
              : 'info';
      await notifyUsers(strapi, {
        userIds: [newAssigneeId],
        organizationId,
        type: assignType,
        title: `You were assigned to ${entityLabel}`,
        message: `${actorName} assigned you`,
        data: { subjectType, subjectId, actorId: actorUserId, ...link },
      });
    }
    title = `Assignment updated on ${entityLabel}`;
    message = `${actorName} changed the assignee`;
  } else if (keys.includes('status')) {
    const status = patch?.status ?? '';
    title = `Status changed on ${entityLabel}`;
    message = status ? `${actorName} set status to ${status}` : `${actorName} updated the status`;
  } else if (keys.length <= 3) {
    message = `${actorName} updated ${keys.slice(0, 3).join(', ')}`;
  }

  const assignOnly =
    keys.length === 1 && (keys[0] === 'assignee' || keys[0] === 'assignedTo');
  const notifyOthers = assignOnly
    ? recipients.filter((id) => id !== relationUserId(patch?.assignee ?? patch?.assignedTo))
    : recipients;

  if (notifyOthers.length) {
    await notifyUsers(strapi, {
      userIds: notifyOthers,
      organizationId,
      type: notifType,
      title,
      message,
      data: {
        subjectType,
        subjectId,
        changedKeys: keys,
        actorId: actorUserId,
        ...link,
      },
    });
  }
}

async function emitDirectMessageNotification(strapi, opts) {
  const { organizationId, actorUserId, actorName, recipientId, content } = opts;
  if (!organizationId || !recipientId) return;

  const mentionIds = parseMentionUserIds(content);
  const preview = truncateMessage(content);
  const baseData = {
    subjectType: 'direct_message',
    actorId: actorUserId,
    app: 'pm',
    href: `/message?withUser=${actorUserId}`,
  };

  await notifyUsers(strapi, {
    userIds: [recipientId],
    organizationId,
    type: 'info',
    title: `Message from ${actorName}`,
    message: preview,
    data: baseData,
  });

  const extraMentions = excludeActor(
    mentionIds.filter((id) => id !== recipientId),
    actorUserId
  );
  if (extraMentions.length) {
    await notifyUsers(strapi, {
      userIds: extraMentions,
      organizationId,
      type: 'mention',
      title: `${actorName} mentioned you in a message`,
      message: preview,
      data: { ...baseData, priority: 'urgent' },
    });
  }
}

async function emitTaskCreatedNotification(strapi, opts) {
  const { organizationId, actorUserId, actorName, task, taskId } = opts;
  if (!task) return;
  const assigneeId = relationUserId(task.assignee);
  if (!assigneeId || assigneeId === actorUserId) return;
  const name = (task.name || 'Task').trim() || 'Task';
  const link = buildHref('task', taskId ?? task.id);
  await notifyUsers(strapi, {
    userIds: [assigneeId],
    organizationId,
    type: 'task_assigned',
    title: `New task: ${name}`,
    message: `${actorName} assigned you`,
    data: { subjectType: 'task', subjectId: taskId ?? task.id, actorId: actorUserId, ...link },
  });
}

module.exports = {
  parseMentionUserIds,
  taskStakeholderIds,
  projectStakeholderIds,
  assignedStakeholderIds,
  emitCommentNotifications,
  emitUpdateNotifications,
  emitDirectMessageNotification,
  emitTaskCreatedNotification,
};
