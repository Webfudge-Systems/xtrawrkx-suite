import {
  formatCalendarRelativeTime,
  formatCalendarTableDate,
  isCalendarDateValue,
  isTaskDueOverdue,
  parseDisplayDate,
} from '@webfudge/utils';

// Status mappings
const STATUS_MAP = {
  SCHEDULED: 'To Do',
  IN_PROGRESS: 'In Progress',
  INTERNAL_REVIEW: 'Internal Review',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Done',
  CANCELLED: 'Cancelled',
  OVERDUE: 'Overdue',
};

const STATUS_REVERSE_MAP = {
  'To Do': 'SCHEDULED',
  'In Progress': 'IN_PROGRESS',
  'Internal Review': 'INTERNAL_REVIEW',
  'On Hold': 'ON_HOLD',
  'Done': 'COMPLETED',
  'Cancelled': 'CANCELLED',
};

const PROJECT_STATUS_MAP = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const PRIORITY_MAP = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

const PRIORITY_REVERSE_MAP = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH',
};

export function transformStatus(strapiStatus) {
  return STATUS_MAP[strapiStatus] || strapiStatus || 'To Do';
}

export function transformStatusToStrapi(frontendStatus) {
  return STATUS_REVERSE_MAP[frontendStatus] || frontendStatus || 'SCHEDULED';
}

export function transformProjectStatus(strapiStatus) {
  return PROJECT_STATUS_MAP[strapiStatus] || strapiStatus || 'Planning';
}

export function transformProjectStatusToStrapi(frontendStatus) {
  const reverse = Object.entries(PROJECT_STATUS_MAP).find(([, v]) => v === frontendStatus);
  return reverse ? reverse[0] : frontendStatus || 'PLANNING';
}

export function transformPriority(strapiPriority) {
  return PRIORITY_MAP[strapiPriority] || (strapiPriority ? strapiPriority.toLowerCase() : 'medium');
}

export function transformPriorityToStrapi(frontendPriority) {
  return PRIORITY_REVERSE_MAP[frontendPriority] || frontendPriority?.toUpperCase() || 'MEDIUM';
}

export function formatDate(dateString, format = 'short') {
  if (!dateString) return null;
  if (isCalendarDateValue(dateString)) {
    if (format === 'relative') return formatCalendarRelativeTime(dateString);
    if (format === 'long') {
      const date = parseDisplayDate(dateString);
      if (!date) return null;
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return formatCalendarTableDate(dateString);
  }
  const date = parseDisplayDate(dateString);
  if (!date) return null;

  if (format === 'relative') return formatRelativeDate(dateString);
  if (format === 'long') {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatRelativeDate(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

  return formatDate(date, 'short');
}

const USER_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-orange-500', 'bg-pink-500', 'bg-yellow-500', 'bg-indigo-500',
  'bg-teal-500', 'bg-cyan-500',
];

export function getUserColor(userId) {
  if (!userId) return USER_COLORS[0];
  const id = typeof userId === 'string' ? parseInt(userId, 10) || userId.charCodeAt(0) : userId;
  return USER_COLORS[id % USER_COLORS.length];
}

export function transformUser(strapiUser) {
  if (!strapiUser) return null;
  const u = strapiUser.attributes || strapiUser;
  const id = strapiUser.id || u.id;
  const firstName = u.firstName || u.name?.split(' ')[0] || '';
  const lastName = u.lastName || u.name?.split(' ')[1] || '';
  const name = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (u.username || u.email || 'Unknown');
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || name.charAt(0).toUpperCase() || 'U';

  return {
    id,
    name,
    firstName,
    lastName,
    email: u.email || '',
    avatar: u.avatar?.url || u.profilePicture?.url || null,
    initials,
    color: getUserColor(id),
    role: u.primaryRole?.name || u.role?.name || 'User',
    isActive: u.isActive !== false,
  };
}

export function transformProject(strapiProject) {
  if (!strapiProject) return null;
  const p = strapiProject.attributes || strapiProject;
  const id = strapiProject.id ?? p.id ?? strapiProject.documentId ?? p.documentId;

  const pm = p.projectManager?.data || p.projectManager;
  const teamMembers = (p.teamMembers?.data || p.teamMembers || []).map(transformUser).filter(Boolean);
  const tasks = p.tasks?.data || p.tasks || [];
  const clientAccount = p.clientAccount?.data || p.clientAccount;
  const clientAttrs = clientAccount?.attributes || clientAccount || {};
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => {
    const tData = t.attributes || t;
    return tData.status === 'COMPLETED';
  }).length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    id,
    documentId: strapiProject.documentId ?? p.documentId ?? id,
    name: p.name || p.title || 'Untitled Project',
    slug: p.slug || String(id),
    description: p.description || '',
    status: transformProjectStatus(p.status),
    strapiStatus: p.status || 'PLANNING',
    startDate: p.startDate || p.start_date || null,
    endDate: p.endDate || p.end_date || p.dueDate || null,
    budget: p.budget || null,
    progress,
    totalTasks,
    completedTasks,
    projectManager: pm ? transformUser(pm) : null,
    teamMembers,
    team: teamMembers,
    clientAccountId: clientAccount?.id || clientAttrs.id || null,
    clientName: clientAttrs.companyName || clientAttrs.name || clientAttrs.title || '',
    icon: p.icon || (p.name ? p.name.charAt(0).toUpperCase() : 'P'),
    isPrivate: p.isPrivate ?? false,
    createdAt: p.createdAt || null,
    updatedAt: p.updatedAt || null,
  };
}

export function formatTaskRecurrenceSummary(t) {
  if (!t || !t.recurrenceFrequency || t.recurrenceFrequency === 'none') return '';
  const n = Math.max(1, Number(t.recurrenceInterval) || 1);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  switch (t.recurrenceFrequency) {
    case 'daily':
      return n === 1 ? 'Every day' : `Every ${n} days`;
    case 'weekly': {
      const wd = Array.isArray(t.recurrenceWeekdays) ? t.recurrenceWeekdays : [];
      if (wd.length > 0) {
        const names = [...wd]
          .map(Number)
          .sort((a, b) => a - b)
          .map((d) => dayLabels[d] ?? d)
          .join(', ');
        return n === 1 ? `Weekly (${names})` : `Every ${n} weeks (${names})`;
      }
      return n === 1 ? 'Every week' : `Every ${n} weeks`;
    }
    case 'monthly':
      return n === 1 ? 'Every month' : `Every ${n} months`;
    case 'custom': {
      const u = t.recurrenceCustomUnit || 'day';
      const label = u === 'day' ? 'day' : u === 'week' ? 'week' : 'month';
      return `Every ${n} ${label}${n > 1 ? 's' : ''}`;
    }
    default:
      return '';
  }
}

export function transformTask(strapiTask) {
  if (!strapiTask) return null;
  const t = strapiTask.attributes || strapiTask;
  const id = strapiTask.id || t.id;

  const assigneeRaw = t.assignee?.data !== undefined ? t.assignee.data : t.assignee;
  const assignee =
    assigneeRaw == null
      ? null
      : typeof assigneeRaw === 'object'
        ? assigneeRaw
        : { id: assigneeRaw };
  const assigneeFlat = assignee && typeof assignee === 'object' ? assignee.attributes || assignee : null;

  const assignerRaw = t.assigner?.data !== undefined ? t.assigner.data : t.assigner;
  const assigner =
    assignerRaw == null
      ? null
      : typeof assignerRaw === 'object'
        ? assignerRaw
        : { id: assignerRaw };
  const assignerFlat = assigner && typeof assigner === 'object' ? assigner.attributes || assigner : null;

  const rawProjects = t.projects?.data !== undefined ? t.projects.data : t.projects;
  const projectList = Array.isArray(rawProjects)
    ? rawProjects
    : rawProjects && typeof rawProjects === 'object'
      ? [rawProjects]
      : [];
  const projects = projectList.map((proj) => {
    const pData = proj.attributes || proj;
    const pmRaw = pData.projectManager?.data ?? pData.projectManager;
    const projectManager =
      pmRaw != null && pmRaw !== ''
        ? transformUser(typeof pmRaw === 'object' ? pmRaw : { id: pmRaw })
        : null;
    return {
      id: proj.id || pData.id,
      name: pData.name || pData.title || 'Unknown',
      slug: pData.slug || String(proj.id || pData.id),
      projectManager,
    };
  });
  const primaryProject = projects[0] || null;
  const projectManager = primaryProject?.projectManager || null;
  const collaborators = (t.collaborators?.data || t.collaborators || []).map(transformUser).filter(Boolean);
  const pendingCollaborators = (t.pendingCollaborators?.data || t.pendingCollaborators || [])
    .map(transformUser)
    .filter(Boolean);
  const assignmentApprovalStatus = t.assignmentApprovalStatus || 'not_required';
  const primaryAssigneeUser = assignee && typeof assignee === 'object' ? transformUser(assignee) : null;
  let assignees = [...collaborators];
  if (
    primaryAssigneeUser?.id != null &&
    !assignees.some((u) => Number(u.id) === Number(primaryAssigneeUser.id))
  ) {
    assignees = [primaryAssigneeUser, ...assignees];
  }
  const assignmentPending = assignmentApprovalStatus === 'pending' && pendingCollaborators.length > 0;
  if (assignmentPending) {
    assignees = [...pendingCollaborators];
  }
  const subtasks = (t.subtasks?.data || t.subtasks || [])
    .map((st) => {
      const row = transformSubtask(st);
      if (!row) return null;
      const pm = row.projectManager || projectManager;
      return {
        ...row,
        parentId: row.parentId ?? id,
        projectManager: pm,
        projectManagerId: pm?.id ?? row.projectManagerId ?? null,
        projectManagerName: pm?.name || row.projectManagerName || '',
      };
    })
    .filter(Boolean);

  const parentRaw = t.parent?.data !== undefined ? t.parent.data : t.parent;
  let parentId = null;
  let parentTask = null;
  if (parentRaw != null && parentRaw !== '') {
    if (typeof parentRaw === 'object') {
      const pFlat = parentRaw.attributes || parentRaw;
      parentId = parentRaw.id ?? pFlat.id ?? null;
      if (parentId != null) {
        parentTask = {
          id: parentId,
          name: pFlat.name || pFlat.title || 'Parent task',
        };
      }
    } else if (typeof parentRaw === 'number') {
      parentId = parentRaw;
      parentTask = { id: parentId, name: 'Parent task' };
    }
  }

  const persistedAssignerId =
    assignerFlat?.id ?? assigner?.id ?? (assigner?.attributes || assigner)?.id ?? null;
  const persistedAssignerUser =
    assigner && typeof assigner === 'object' ? transformUser(assigner) : null;

  // Legacy rows: creator lived on `assignee` only — show the same person as assigner until the field is persisted.
  let effectiveAssignerId = persistedAssignerId;
  let effectiveAssignerUser = persistedAssignerUser;
  if ((effectiveAssignerId == null || effectiveAssignerId === '') && primaryAssigneeUser?.id != null) {
    effectiveAssignerId = primaryAssigneeUser.id;
    effectiveAssignerUser = primaryAssigneeUser;
  }

  const isOverdue = isTaskDueOverdue(t.scheduledDate, t.status);

  return {
    id,
    name: t.title || t.name || 'Untitled Task',
    description: t.description || '',
    status: isOverdue && t.status !== 'COMPLETED' ? (transformStatus(t.status) === 'To Do' || transformStatus(t.status) === 'In Progress' ? transformStatus(t.status) : transformStatus(t.status)) : transformStatus(t.status),
    strapiStatus: t.status || 'SCHEDULED',
    priority: transformPriority(t.priority),
    strapiPriority: t.priority || 'MEDIUM',
    startDate: t.startDate || null,
    formattedStartDate: formatDate(t.startDate, 'short'),
    dueDate: t.scheduledDate || t.dueDate || null,
    formattedDueDate: formatDate(t.scheduledDate || t.dueDate, 'short'),
    assignee: primaryAssigneeUser,
    assigneeId:
      assigneeFlat?.id ??
      assignee?.id ??
      (assignee?.attributes || assignee)?.id ??
      null,
    assigneeName: primaryAssigneeUser?.name || '',
    assigner: effectiveAssignerUser,
    assignerId: effectiveAssignerId,
    assignerName: effectiveAssignerUser?.name || '',
    assignees,
    assigneeUserIds: assignees.map((u) => u.id).filter((id) => id != null),
    collaborators,
    pendingCollaborators,
    assignmentApprovalStatus,
    assignmentPending,
    projects,
    projectId: primaryProject?.id || null,
    project: primaryProject?.name || null,
    projectSlug: primaryProject?.slug || null,
    projectManager,
    projectManagerId: projectManager?.id ?? null,
    projectManagerName: projectManager?.name || '',
    subtasks,
    subtaskCount: subtasks.length,
    parentId,
    parentTask,
    tags: t.tags || [],
    isOverdue,
    createdAt: t.createdAt || null,
    updatedAt: t.updatedAt || null,
    recurrenceFrequency: t.recurrenceFrequency || 'none',
    recurrenceInterval: typeof t.recurrenceInterval === 'number' ? t.recurrenceInterval : 1,
    recurrenceWeekdays: Array.isArray(t.recurrenceWeekdays) ? t.recurrenceWeekdays : [],
    recurrenceMonthDay:
      typeof t.recurrenceMonthDay === 'number' && t.recurrenceMonthDay >= 1 && t.recurrenceMonthDay <= 31
        ? t.recurrenceMonthDay
        : null,
    recurrenceCustomUnit: t.recurrenceCustomUnit || 'day',
    recurrenceEndsAt: t.recurrenceEndsAt || null,
    recurrenceGroupId: t.recurrenceGroupId || null,
    recurrenceSummary: formatTaskRecurrenceSummary({
      recurrenceFrequency: t.recurrenceFrequency,
      recurrenceInterval: t.recurrenceInterval,
      recurrenceWeekdays: t.recurrenceWeekdays,
      recurrenceCustomUnit: t.recurrenceCustomUnit,
    }),
  };
}

export function transformSubtask(strapiSubtask) {
  if (!strapiSubtask) return null;
  const s = strapiSubtask.attributes || strapiSubtask;
  const id = strapiSubtask.id || s.id;
  const assigneeRaw = s.assignee?.data !== undefined ? s.assignee.data : s.assignee;
  const assignee =
    assigneeRaw == null ? null : typeof assigneeRaw === 'object' ? assigneeRaw : { id: assigneeRaw };
  const assigneeFlat = assignee && typeof assignee === 'object' ? assignee.attributes || assignee : null;

  const assignerRaw = s.assigner?.data !== undefined ? s.assigner.data : s.assigner;
  const assigner =
    assignerRaw == null ? null : typeof assignerRaw === 'object' ? assignerRaw : { id: assignerRaw };
  const assignerFlat = assigner && typeof assigner === 'object' ? assigner.attributes || assigner : null;

  const collaborators = (s.collaborators?.data || s.collaborators || []).map(transformUser).filter(Boolean);
  const primaryAssigneeUser = assignee && typeof assignee === 'object' ? transformUser(assignee) : null;
  const singleAssignee = primaryAssigneeUser || collaborators[0] || null;
  const assignees = singleAssignee ? [singleAssignee] : [];

  const parentRaw = s.parent?.data !== undefined ? s.parent.data : s.parent;
  let parentId = null;
  if (parentRaw != null && parentRaw !== '') {
    if (typeof parentRaw === 'object') {
      const pFlat = parentRaw.attributes || parentRaw;
      parentId = parentRaw.id ?? pFlat.id ?? null;
    } else if (typeof parentRaw === 'number') {
      parentId = parentRaw;
    }
  }

  const persistedAssignerId =
    assignerFlat?.id ?? assigner?.id ?? (assigner?.attributes || assigner)?.id ?? null;
  const persistedAssignerUser = assigner && typeof assigner === 'object' ? transformUser(assigner) : null;

  let effectiveAssignerId = persistedAssignerId;
  let effectiveAssignerUser = persistedAssignerUser;
  if ((effectiveAssignerId == null || effectiveAssignerId === '') && primaryAssigneeUser?.id != null) {
    effectiveAssignerId = primaryAssigneeUser.id;
    effectiveAssignerUser = primaryAssigneeUser;
  }

  return {
    id,
    name: s.title || s.name || 'Untitled Subtask',
    description: s.description || '',
    status: transformStatus(s.status),
    strapiStatus: s.status || 'SCHEDULED',
    priority: transformPriority(s.priority),
    startDate: s.startDate || null,
    dueDate: s.scheduledDate || s.dueDate || null,
    assignee: primaryAssigneeUser,
    assigneeId:
      assigneeFlat?.id ??
      assignee?.id ??
      (assignee?.attributes || assignee)?.id ??
      null,
    assigneeName: primaryAssigneeUser?.name || '',
    assigner: effectiveAssignerUser,
    assignerId: effectiveAssignerId,
    assignerName: effectiveAssignerUser?.name || '',
    assignees,
    assigneeUserIds: singleAssignee?.id != null ? [singleAssignee.id] : [],
    collaborators: singleAssignee ? [singleAssignee] : [],
    parentId,
  };
}

export function transformComment(strapiComment) {
  if (!strapiComment) return null;
  const c = strapiComment.attributes || strapiComment;
  const id = strapiComment.id || c.id;
  const author = c.author?.data || c.author || c.user?.data || c.user;
  return {
    id,
    content: c.content || c.text || '',
    author: author ? transformUser(author) : null,
    createdAt: c.createdAt || null,
    formattedDate: formatRelativeDate(c.createdAt),
  };
}

export const PROJECT_BG_COLORS = {
  default: 'bg-orange-500',
  planning: 'bg-blue-500',
  active: 'bg-green-500',
  'on hold': 'bg-yellow-500',
  completed: 'bg-gray-400',
  cancelled: 'bg-red-400',
};

export function getStatusColor(status) {
  const s = status?.toLowerCase();
  const colors = {
    'to do': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    'in progress': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    'internal review': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
    'done': { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    'cancelled': { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
    'overdue': { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  };
  return colors[s] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
}

export function getPriorityColor(priority) {
  const p = priority?.toLowerCase();
  const colors = {
    high: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    low: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  };
  return colors[p] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
}

export function getProjectStatusColor(status) {
  const s = status?.toLowerCase();
  const colors = {
    'planning': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'active': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    'in progress': { bg: 'bg-orange-100', text: 'text-orange-700' },
    'on hold': { bg: 'bg-orange-100', text: 'text-orange-700' },
    'completed': { bg: 'bg-gray-100', text: 'text-gray-700' },
    'cancelled': { bg: 'bg-red-100', text: 'text-red-700' },
  };
  return colors[s] || { bg: 'bg-gray-100', text: 'text-gray-600' };
}
