'use strict';

/**
 * task controller
 * - Requires ctx.state.user + ctx.state.orgId (global jwt-auth).
 * - CRUD is scoped to ctx.state.organization (tenant isolation).
 * - GET /tasks/my-work — sidebar summary (assignee or collaborator).
 */

const { createCoreController } = require('@strapi/strapi').factories;
const {
  orgIdFromRelation,
  readListQuery,
  createPopulateSanitizer,
  safeCount,
  resolveEntityPkForRouteParam,
} = require('../../../utils/content-api-helpers');
const { logCrmActivity, collectChangedKeys, actorDisplayName } = require('../../../utils/crm-activity-log');
const {
  emitUpdateNotifications,
  emitTaskCreatedNotification,
  taskStakeholderIds,
} = require('../../../utils/notification-emitter');
const {
  requireModuleAccess,
  isPmOrgMemberRole,
  isPmOrgAdminRole,
  isPmOrgManagerRole,
  buildProjectListFiltersForUser,
  relationId,
  userCanAccessProjectRow,
  userCanViewProjectRow,
} = require('../../../utils/rbac');
const {
  computeNextOccurrence,
  ensureRecurrenceGroupId,
  randomUUID,
} = require('../../../utils/task-recurrence');

const { relId } = require('../../../utils/books-crud');
const {
  isCrmTaskEntity,
  crmTaskScopeFilter,
  readTaskListScope,
  mergeScopeFilter,
} = require('../../../utils/task-scope');

const UID = 'api::task.task';

const PROJECT_UID = 'api::project.project';

async function recomputeProjectFinancials(projectId) {
  if (!projectId) return;
  try {
    const { recomputeFinancials } = require('../../project/controllers/project');
    await recomputeFinancials(projectId);
  } catch (err) {
    console.warn('[task] recomputeProjectFinancials failed:', err.message);
  }
}

/**
 * entityService create/update expect integer primary keys for relations (same as project PM).
 * Strip unknown refs; only keep projects that belong to the active organization.
 */
function collectNumericIds(refs) {
  const out = [];
  if (!Array.isArray(refs)) return out;
  for (const ref of refs) {
    const asNum =
      typeof ref === 'number' && Number.isFinite(ref)
        ? ref
        : typeof ref === 'string' && /^\d+$/.test(ref.trim())
          ? parseInt(ref.trim(), 10)
          : NaN;
    if (!Number.isNaN(asNum) && asNum > 0) out.push(asNum);
  }
  return out;
}

async function normalizeProjectsInput(strapi, orgId, projectsInput) {
  if (projectsInput == null) return projectsInput;
  let rel = projectsInput;
  if (Array.isArray(rel)) rel = { set: rel };
  if (typeof rel !== 'object') return projectsInput;

  const out = { ...rel };
  for (const key of ['set', 'connect']) {
    if (!Array.isArray(out[key])) continue;
    const resolved = await resolveProjectIdsFromProjectsInput(strapi, { set: out[key] });
    const allowed = [];
    for (const pid of resolved) {
      const rows = await strapi.entityService.findMany(PROJECT_UID, {
        filters: { id: pid, organization: orgId },
        limit: 1,
        fields: ['id'],
      });
      if (rows.length) allowed.push(pid);
    }
    out[key] = allowed;
  }
  return out;
}

const USER_UID = 'plugin::users-permissions.user';

/** Resolve a users-permissions user ref to integer PK for entityService (manyToOne). */
async function normalizeUserRelationPk(strapi, userVal) {
  if (userVal == null || userVal === '') return userVal;
  const n =
    typeof userVal === 'number' && Number.isFinite(userVal)
      ? userVal
      : typeof userVal === 'string' && /^\d+$/.test(String(userVal).trim())
        ? parseInt(String(userVal).trim(), 10)
        : NaN;
  if (!Number.isNaN(n) && n > 0) {
    const row = await strapi.db.query(USER_UID).findOne({ where: { id: n } });
    if (row?.id != null) return row.id;
    return userVal;
  }
  if (typeof userVal === 'string' && userVal.trim() !== '') {
    const row = await strapi.db.query(USER_UID).findOne({
      where: { documentId: userVal.trim() },
    });
    if (row?.id != null) return row.id;
  }
  return userVal;
}

async function normalizeAssignerInput(strapi, assignerVal) {
  return normalizeUserRelationPk(strapi, assignerVal);
}

async function normalizeAssigneeInput(strapi, assigneeVal) {
  return normalizeUserRelationPk(strapi, assigneeVal);
}

/** Normalize many-to-many collaborators payload to `{ set: [pk, …] }` with valid user ids. */
async function normalizeCollaboratorsInput(strapi, raw) {
  if (raw == null) return raw;
  let ids = [];
  if (Array.isArray(raw)) {
    ids = collectNumericIds(raw);
  } else if (typeof raw === 'object') {
    if (Array.isArray(raw.set)) ids = collectNumericIds(raw.set);
    else if (Array.isArray(raw.connect)) ids = collectNumericIds(raw.connect);
  }
  const verified = [];
  for (const uid of ids) {
    const row = await strapi.db.query(USER_UID).findOne({ where: { id: uid } });
    if (row?.id != null) verified.push(uid);
  }
  return { set: [...new Set(verified)] };
}

/**
 * Validate `parent` for create/update: same organization, exists, no self-parent, no cycles.
 * @param {number|null|undefined} selfPk - task id being updated, or null on create
 * @returns {{ ok: true, parent: number|null|undefined }|{ ok: false, message: string }}
 */
async function resolveParentTaskOrError(strapi, orgId, parentVal, selfPk) {
  if (parentVal === undefined) return { ok: true, parent: undefined };
  if (parentVal === null || parentVal === '') return { ok: true, parent: null };
  const raw =
    typeof parentVal === 'object' && parentVal !== null
      ? parentVal.id ?? parentVal.documentId
      : parentVal;
  if (raw == null || raw === '') return { ok: true, parent: null };

  const parentPk = await resolveEntityPkForRouteParam(strapi, UID, String(raw));
  if (parentPk == null) return { ok: false, message: 'Parent task not found' };

  const parentRow = await strapi.entityService.findOne(UID, parentPk, {
    populate: ['organization'],
    fields: ['id'],
  });
  if (!parentRow) return { ok: false, message: 'Parent task not found' };
  if (orgIdFromRelation(parentRow.organization) !== orgId) {
    return { ok: false, message: 'Parent task is not in this organization' };
  }
  if (selfPk != null && parentPk === selfPk) {
    return { ok: false, message: 'A task cannot be its own parent' };
  }

  let walk = parentPk;
  const seen = new Set();
  while (walk != null) {
    if (selfPk != null && walk === selfPk) {
      return { ok: false, message: 'Cannot set parent: would create a cycle' };
    }
    if (seen.has(walk)) break;
    seen.add(walk);
    const row = await strapi.entityService.findOne(UID, walk, { fields: ['id'], populate: ['parent'] });
    const pr = row?.parent;
    const nextId =
      pr == null || pr === ''
        ? null
        : typeof pr === 'object'
          ? pr.id ?? null
          : typeof pr === 'number'
            ? pr
            : null;
    walk = nextId;
  }

  return { ok: true, parent: parentPk };
}

function projectIdsFromEntity(entity) {
  const raw = entity.projects?.data !== undefined ? entity.projects.data : entity.projects;
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
  return list.map((p) => p?.id ?? p?.attributes?.id).filter((x) => x != null);
}

function collaboratorIdsFromEntity(entity) {
  const raw = entity.collaborators?.data !== undefined ? entity.collaborators.data : entity.collaborators;
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
  return list.map((c) => c?.id ?? c?.attributes?.id).filter((x) => x != null);
}

function pendingCollaboratorIdsFromEntity(entity) {
  const raw =
    entity.pendingCollaborators?.data !== undefined
      ? entity.pendingCollaborators.data
      : entity.pendingCollaborators;
  const list = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
  return list.map((c) => c?.id ?? c?.attributes?.id).filter((x) => x != null);
}

function projectIdsFromProjectsInput(projectsInput) {
  if (!projectsInput) return [];
  if (Array.isArray(projectsInput)) return collectNumericIds(projectsInput);
  if (typeof projectsInput === 'object') {
    return collectNumericIds(projectsInput.set || projectsInput.connect || []);
  }
  return [];
}

/** Collect raw project refs (numeric ids or documentId strings) from a projects relation payload. */
function projectRefsFromProjectsInput(projectsInput) {
  if (!projectsInput) return [];
  if (Array.isArray(projectsInput)) return projectsInput.filter((r) => r != null && r !== '');
  if (typeof projectsInput === 'object') {
    const raw = projectsInput.set || projectsInput.connect || [];
    return Array.isArray(raw) ? raw.filter((r) => r != null && r !== '') : [];
  }
  return [];
}

async function resolveProjectIdsFromProjectsInput(strapi, projectsInput) {
  const refs = projectRefsFromProjectsInput(projectsInput);
  const out = [];
  const seen = new Set();
  for (const ref of refs) {
    const raw =
      typeof ref === 'object' && ref !== null ? ref.id ?? ref.documentId ?? ref : ref;
    if (raw == null || raw === '') continue;
    const pk = await resolveEntityPkForRouteParam(strapi, PROJECT_UID, String(raw));
    if (pk == null || seen.has(pk)) continue;
    seen.add(pk);
    out.push(pk);
  }
  return out;
}

function userIsTaskAssigneeOrCollaborator(task, userId) {
  if (!task || userId == null) return false;
  const aid = relationId(task.assignee);
  if (aid != null && Number(aid) === Number(userId)) return true;
  return collaboratorIdsFromEntity(task).some((id) => Number(id) === Number(userId));
}

function userIsTaskReporter(task, userId) {
  if (!task || userId == null) return false;
  const reporterId = assignerPkFromEntity(task);
  return reporterId != null && Number(reporterId) === Number(userId);
}

function userMayApproveTaskAssignments(ctx) {
  return isPmOrgAdminRole(ctx) || isPmOrgManagerRole(ctx);
}

async function loadProjectForAccessCheck(strapi, orgId, projectPk) {
  const proj = await strapi.entityService.findOne(PROJECT_UID, projectPk, {
    populate: ['teamMembers', 'projectManager', 'organization'],
  });
  if (!proj || orgIdFromRelation(proj.organization) !== orgId) return null;
  return proj;
}

/**
 * Org members may create tasks when on the project team, or when creating a subtask on a parent
 * they are assigned to. Admins/managers bypass this check in create().
 * Mutates `data.projects` when inheriting from a parent task.
 */
async function memberMayCreateTask(strapi, orgId, userId, data) {
  let pids = await resolveProjectIdsFromProjectsInput(strapi, data.projects);

  for (const pid of pids) {
    const proj = await loadProjectForAccessCheck(strapi, orgId, pid);
    if (proj && userCanAccessProjectRow(proj, userId)) return true;
  }

  const parentVal = data.parent;
  if (parentVal == null || parentVal === '') return false;

  const parentPk = await resolveEntityPkForRouteParam(
    strapi,
    UID,
    String(typeof parentVal === 'object' ? parentVal.id ?? parentVal.documentId : parentVal)
  );
  if (parentPk == null) return false;

  const parent = await strapi.entityService.findOne(UID, parentPk, {
    populate: ['assignee', 'collaborators', 'organization', 'projects'],
  });
  if (!parent || orgIdFromRelation(parent.organization) !== orgId) return false;
  if (!userIsTaskAssigneeOrCollaborator(parent, userId)) return false;

  const parentPids = projectIdsFromEntity(parent);
  if (parentPids.length && !pids.length) {
    data.projects = { set: parentPids };
    pids = parentPids;
  }

  for (const pid of pids) {
    const proj = await loadProjectForAccessCheck(strapi, orgId, pid);
    if (proj && userCanAccessProjectRow(proj, userId)) return true;
  }

  return pids.length > 0 || userIsTaskAssigneeOrCollaborator(parent, userId);
}

/** Assignees must belong to the project team (any org role). */
async function assertAssigneesOnProjectTeams(strapi, orgId, projectPks, assigneeIds) {
  const ids = [...new Set((assigneeIds || []).map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0))];
  if (!ids.length || !projectPks.length) return null;

  const allowed = new Set();
  for (const pid of projectPks) {
    const proj = await loadProjectForAccessCheck(strapi, orgId, pid);
    if (!proj) continue;
    const pmId = relationId(proj.projectManager);
    if (pmId != null) allowed.add(Number(pmId));
    const raw = proj.teamMembers;
    const list = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
    for (const u of list) {
      const uid = relationId(u);
      if (uid != null) allowed.add(Number(uid));
    }
  }

  const invalid = ids.filter((id) => !allowed.has(id));
  if (invalid.length) {
    return 'Assignees must be members of the project team';
  }
  return null;
}

/** Subtasks (`parent` set) may have at most one assignee. */
async function clampSubtaskToSingleAssignee(strapi, data) {
  let singleId = null;
  if (data.collaborators != null) {
    const norm = await normalizeCollaboratorsInput(strapi, data.collaborators);
    singleId = (norm.set || [])[0] ?? null;
  }
  if (singleId == null && data.assignee != null && data.assignee !== '') {
    singleId = await normalizeAssigneeInput(strapi, data.assignee);
  }
  if (singleId != null) {
    data.assignee = singleId;
    data.collaborators = { set: [singleId] };
  } else if (
    data.collaborators != null ||
    Object.prototype.hasOwnProperty.call(data, 'assignee')
  ) {
    data.assignee = null;
    data.collaborators = { set: [] };
  }
}

/** Member-created tasks: requested assignees stay pending until admin/manager approves. */
async function stashPendingAssignmentForMember(strapi, data, userId) {
  const pending = new Set();
  if (data.collaborators != null) {
    const norm = await normalizeCollaboratorsInput(strapi, data.collaborators);
    for (const id of norm.set || []) pending.add(id);
    delete data.collaborators;
  }
  if (data.assignee != null && data.assignee !== '') {
    const aid = await normalizeAssigneeInput(strapi, data.assignee);
    if (aid != null) pending.add(aid);
    delete data.assignee;
  }
  const ids = [...pending];
  if (ids.length > 0) {
    data.pendingCollaborators = { set: ids };
    data.assignmentApprovalStatus = 'pending';
    data.assignmentRequestedBy = userId;
  } else {
    data.assignmentApprovalStatus = 'not_required';
  }
}

function assignerPkFromEntity(entity) {
  const raw = entity.assigner;
  if (raw == null || raw === '') return null;
  if (typeof raw === 'object') return raw.id ?? raw.attributes?.id ?? null;
  return typeof raw === 'number' ? raw : null;
}

async function spawnNextRecurrenceTask(strapi, orgId, actorUserId, entity) {
  const next = computeNextOccurrence(entity);
  if (!next?.scheduledDate) return null;

  const groupId = entity.recurrenceGroupId || randomUUID();

  const projectIds = projectIdsFromEntity(entity);
  const collaboratorIds = collaboratorIdsFromEntity(entity);
  const assigneeRaw =
    entity.assignee && typeof entity.assignee === 'object' ? entity.assignee.id : entity.assignee;

  const leadCompanyId =
    entity.leadCompany && typeof entity.leadCompany === 'object'
      ? entity.leadCompany.id
      : entity.leadCompany;
  const clientAccountId =
    entity.clientAccount && typeof entity.clientAccount === 'object'
      ? entity.clientAccount.id
      : entity.clientAccount;
  const dealId = entity.deal && typeof entity.deal === 'object' ? entity.deal.id : entity.deal;

  const createData = {
    name: entity.name,
    description: entity.description ?? null,
    status: 'SCHEDULED',
    priority: entity.priority || 'medium',
    tags: Array.isArray(entity.tags) ? entity.tags : [],
    organization: orgId,
    startDate: next.startDate,
    scheduledDate: next.scheduledDate,
    recurrenceFrequency: entity.recurrenceFrequency,
    recurrenceInterval: entity.recurrenceInterval ?? 1,
    recurrenceWeekdays: Array.isArray(entity.recurrenceWeekdays) ? entity.recurrenceWeekdays : [],
    recurrenceMonthDay: entity.recurrenceMonthDay ?? null,
    recurrenceCustomUnit: entity.recurrenceCustomUnit || 'day',
    recurrenceEndsAt: entity.recurrenceEndsAt ?? null,
    recurrenceGroupId: groupId,
  };

  if (assigneeRaw != null && assigneeRaw !== '') {
    createData.assignee = await normalizeAssigneeInput(strapi, assigneeRaw);
  }
  if (projectIds.length) {
    createData.projects = await normalizeProjectsInput(strapi, orgId, { set: projectIds });
  }
  if (collaboratorIds.length) {
    createData.collaborators = { set: collaboratorIds };
  }
  if (leadCompanyId != null && leadCompanyId !== '') createData.leadCompany = leadCompanyId;
  if (clientAccountId != null && clientAccountId !== '') createData.clientAccount = clientAccountId;
  if (dealId != null && dealId !== '') createData.deal = dealId;

  const assignerPk = assignerPkFromEntity(entity);
  if (assignerPk != null) {
    createData.assigner = await normalizeAssignerInput(strapi, assignerPk);
  }

  const created = await strapi.entityService.create(UID, { data: createData });

  if (!entity.recurrenceGroupId) {
    await strapi.entityService.update(UID, entity.id, { data: { recurrenceGroupId: groupId } });
  }

  try {
    const forLog = await strapi.entityService.findOne(UID, created.id, {
      populate: ['assignee', 'projects'],
    });
    await logCrmActivity(strapi, {
      organizationId: orgId,
      actorUserId,
      action: 'create',
      subjectType: 'task',
      entity: forLog,
      changedKeys: null,
    });
  } catch (_) {
    /* best-effort */
  }

  return created;
}

const ALLOWED_POPULATE = new Set([
  'assignee',
  'assigner',
  'collaborators',
  'projects',
  'parent',
  'subtasks',
  'leadCompany',
  'clientAccount',
  'deal',
  'organization',
]);

const sanitizePopulate = createPopulateSanitizer(ALLOWED_POPULATE, [
  'assignee',
  'assigner',
  'projects',
  'collaborators',
  'organization',
  'leadCompany',
  'clientAccount',
  'deal',
]);

function buildTaskPopulateConfig(rawPopulate) {
  const sanitized = sanitizePopulate(rawPopulate);
  const keys = Array.isArray(sanitized) ? sanitized : [];
  const populate = {};
  for (const key of keys) {
    if (key === 'subtasks') {
      populate.subtasks = {
        fields: ['id', 'name', 'status', 'priority', 'startDate', 'scheduledDate', 'description'],
        populate: ['assignee', 'assigner', 'collaborators'],
      };
      continue;
    }
    if (key === 'parent') {
      populate.parent = { fields: ['id', 'name'] };
      continue;
    }
    if (key === 'projects') {
      populate.projects = {
        fields: ['id', 'name', 'slug', 'documentId'],
        populate: { projectManager: true },
      };
      continue;
    }
    populate[key] = true;
  }
  return populate;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Project ids the current user may see tasks for (respects private flag + org role). */
async function projectIdsVisibleToUser(strapi, ctx, orgId, userId) {
  const filters = buildProjectListFiltersForUser(ctx, orgId, userId);
  const rows = await strapi.entityService.findMany(PROJECT_UID, {
    filters,
    fields: ['id'],
    limit: 500,
  });
  return rows.map((r) => r.id).filter((id) => id != null);
}

async function userMayViewTask(strapi, ctx, orgId, userId, entry) {
  if (!entry?.id || userId == null) return false;
  const row = await strapi.entityService.findOne(UID, entry.id, {
    populate: {
      assignee: true,
      assigner: true,
      collaborators: true,
      pendingCollaborators: true,
      assignmentRequestedBy: true,
      projects: { populate: ['teamMembers', 'projectManager'], fields: ['id', 'isPrivate'] },
      organization: true,
    },
  });
  if (!row || orgIdFromRelation(row.organization) !== orgId) return false;
  const requesterId = relationId(row.assignmentRequestedBy);
  if (requesterId != null && Number(requesterId) === Number(userId)) return true;
  if (userIsTaskReporter(row, userId)) return true;
  const aid = relationId(row.assignee);
  if (aid != null && Number(aid) === Number(userId)) return true;
  const cols = collaboratorIdsFromEntity(row);
  if (cols.some((id) => Number(id) === Number(userId))) return true;
  const pending = pendingCollaboratorIdsFromEntity(row);
  if (pending.some((id) => Number(id) === Number(userId))) return true;
  const raw = row.projects;
  const plist = Array.isArray(raw) ? raw : raw ? [raw] : [];
  for (const p of plist) {
    if (userCanViewProjectRow(ctx, p, userId)) return true;
  }
  return false;
}

const MEMBER_TASK_UPDATE_FIELDS = new Set(['status']);

function requireTasksRead(ctx, { crmOnly = false } = {}) {
  if (crmOnly) {
    return requireModuleAccess(ctx, 'crm', 'tasks', 'read');
  }
  const pmDenied = requireModuleAccess(ctx, 'pm', 'tasks', 'read');
  if (!pmDenied) return null;
  return requireModuleAccess(ctx, 'crm', 'tasks', 'read');
}

function requireMyWorkRead(ctx, { crmOnly = false } = {}) {
  if (crmOnly) {
    return requireModuleAccess(ctx, 'crm', 'tasks', 'read');
  }
  const pmDenied = requireModuleAccess(ctx, 'pm', 'my_tasks', 'read');
  if (!pmDenied) return null;
  return requireModuleAccess(ctx, 'crm', 'tasks', 'read');
}

module.exports = createCoreController(UID, ({ strapi }) => ({
  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const crmScope = readTaskListScope(ctx) === 'crm';
    const denied = requireTasksRead(ctx, { crmOnly: crmScope });
    if (denied) return denied;

    const { query, page, pageSize, sort } = readListQuery(ctx, {
      maxPageSize: 500,
      defaultPageSize: 25,
      defaultSort: 'scheduledDate:desc',
    });

    let filters = { organization: ctx.state.orgId };
    const extra = query.filters;
    const extraFilters = {};
    if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
      if (extra.deal) extraFilters.deal = extra.deal;
      if (extra.status) extraFilters.status = extra.status;
      if (extra.priority) extraFilters.priority = extra.priority;
      if (extra.assignee) extraFilters.assignee = extra.assignee;
      if (extra.clientAccount) extraFilters.clientAccount = extra.clientAccount;
      if (extra.leadCompany) extraFilters.leadCompany = extra.leadCompany;
      if (extra.projects) extraFilters.projects = extra.projects;
    }

    if (crmScope) {
      filters = mergeScopeFilter(filters, crmTaskScopeFilter());
    }

    if (!isPmOrgAdminRole(ctx) && ctx.state.user?.id && !crmScope) {
      const uid = ctx.state.user.id;
      const pids = await projectIdsVisibleToUser(strapi, ctx, ctx.state.orgId, uid);
      const visOr = [{ assigner: uid }, { assignee: uid }, { collaborators: { id: uid } }];
      if (pids.length) visOr.push({ projects: { id: { $in: pids } } });
      const hasExtra = Object.keys(extraFilters).length > 0;
      if (hasExtra) {
        filters.$and = [{ $or: visOr }, extraFilters];
      } else {
        filters.$or = visOr;
      }
    } else {
      Object.assign(filters, extraFilters);
    }

    const results = await strapi.entityService.findMany(UID, {
      filters,
      start: (page - 1) * pageSize,
      limit: pageSize,
      sort,
      populate: buildTaskPopulateConfig(query.populate),
    });

    const total = await safeCount(strapi, UID, filters, results.length);
    const pageCount = Math.ceil(Math.max(total, 1) / pageSize);
    ctx.set('Cache-Control', 'no-store');
    return { data: results, meta: { pagination: { page, pageSize, pageCount, total } } };
  },

  async findOne(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'tasks', 'read');
    if (denied) return denied;

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const populate = buildTaskPopulateConfig(ctx.query?.populate);
    populate.organization = true;
    const entry = await strapi.entityService.findOne(UID, pk, {
      populate,
    });
    if (!entry) return ctx.notFound();
    if (orgIdFromRelation(entry.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    if (!isPmOrgAdminRole(ctx) && ctx.state.user?.id) {
      const ok = await userMayViewTask(strapi, ctx, ctx.state.orgId, ctx.state.user.id, entry);
      if (!ok) return ctx.forbidden('Access denied');
    }
    ctx.set('Cache-Control', 'no-store');
    return { data: entry };
  },

  async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'tasks', 'write');
    if (denied) return denied;

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};

    const isMember = isPmOrgMemberRole(ctx);
    if (isMember) {
      const ok = await memberMayCreateTask(strapi, ctx.state.orgId, ctx.state.user.id, data);
      if (!ok) {
        return ctx.forbidden(
          'You can only create tasks on projects you belong to, or subtasks on tasks assigned to you'
        );
      }
    }

    data.organization = ctx.state.orgId;
    if ((data.assigner == null || data.assigner === '') && ctx.state.user?.id) {
      data.assigner = ctx.state.user.id;
    }
    // Legacy / PM flows: creator was previously stored only on `assignee`; mirror that as assigner when still unset.
    if ((data.assigner == null || data.assigner === '') && data.assignee != null && data.assignee !== '') {
      data.assigner =
        typeof data.assignee === 'object' ? data.assignee.id ?? data.assignee.documentId : data.assignee;
    }
    if (data.assigner != null && data.assigner !== '') {
      data.assigner = await normalizeAssignerInput(strapi, data.assigner);
    }
    if (data.assignee != null && data.assignee !== '') {
      data.assignee = await normalizeAssigneeInput(strapi, data.assignee);
    }

    if (data.projects) {
      data.projects = await normalizeProjectsInput(strapi, ctx.state.orgId, data.projects);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'parent')) {
      const pr = await resolveParentTaskOrError(strapi, ctx.state.orgId, data.parent, null);
      if (!pr.ok) return ctx.badRequest(pr.message);
      data.parent = pr.parent;
    }

    const isSubtask = data.parent != null && data.parent !== '';
    if (isSubtask) {
      await clampSubtaskToSingleAssignee(strapi, data);
    } else if (data.collaborators != null) {
      data.collaborators = await normalizeCollaboratorsInput(strapi, data.collaborators);
    }

    if (isMember) {
      const projectPks = await resolveProjectIdsFromProjectsInput(strapi, data.projects);
      const assigneeIds = [];
      if (data.collaborators != null) {
        const norm = await normalizeCollaboratorsInput(strapi, data.collaborators);
        assigneeIds.push(...(norm.set || []));
      }
      if (data.assignee != null && data.assignee !== '') {
        const aid = await normalizeAssigneeInput(strapi, data.assignee);
        if (aid != null) assigneeIds.push(aid);
      }
      const assigneeErr = await assertAssigneesOnProjectTeams(
        strapi,
        ctx.state.orgId,
        projectPks,
        assigneeIds
      );
      if (assigneeErr) return ctx.badRequest(assigneeErr);

      await stashPendingAssignmentForMember(strapi, data, ctx.state.user.id);
    } else if (!isSubtask) {
      data.assignmentApprovalStatus = data.assignmentApprovalStatus || 'not_required';
      if (data.collaborators != null) {
        data.collaborators = await normalizeCollaboratorsInput(strapi, data.collaborators);
      }
    } else {
      data.assignmentApprovalStatus = data.assignmentApprovalStatus || 'not_required';
    }

    const newGroupId = ensureRecurrenceGroupId(data);
    if (newGroupId) data.recurrenceGroupId = newGroupId;

    delete data.id;
    delete data.documentId;

    const entry = await strapi.entityService.create(UID, { data });
    try {
      const lookupKey = entry?.id ?? entry?.documentId;
      const forLog =
        lookupKey != null
          ? await strapi.entityService.findOne(UID, lookupKey, {
              populate: ['assignee', 'projects'],
            })
          : entry;
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'create',
        subjectType: 'task',
        entity: forLog,
        changedKeys: null,
      });
      const actorName = await actorDisplayName(strapi, ctx.state.user?.id);
      const forNotify =
        lookupKey != null
          ? await strapi.entityService.findOne(UID, lookupKey, {
              populate: ['assignee', 'collaborators'],
            })
          : forLog;
      await emitTaskCreatedNotification(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        task: forNotify,
        taskId: lookupKey,
      });
    } catch (_) {
      /* best-effort */
    }
    const timeProjId = data.timeProject != null ? relId(data.timeProject) || data.timeProject : null;
    if (timeProjId) await recomputeProjectFinancials(timeProjId);
    return { data: entry };
  },

  async update(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'tasks', 'write');
    if (denied) return denied;

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const existing = await strapi.entityService.findOne(UID, pk, {
      populate: ['organization', 'assignee', 'assigner', 'collaborators', 'projects', 'timeProject', 'parent'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};
    delete data.organization;

    if (!isPmOrgAdminRole(ctx) && ctx.state.user?.id) {
      const ok = await userMayViewTask(strapi, ctx, ctx.state.orgId, ctx.state.user.id, existing);
      if (!ok) return ctx.forbidden('Access denied');
    }
    if (isPmOrgMemberRole(ctx) && ctx.state.user?.id) {
      const uid = ctx.state.user.id;
      const canFullEdit =
        userIsTaskAssigneeOrCollaborator(existing, uid) || userIsTaskReporter(existing, uid);
      if (!canFullEdit) {
        const allowed = {};
        for (const k of MEMBER_TASK_UPDATE_FIELDS) {
          if (Object.prototype.hasOwnProperty.call(data, k)) allowed[k] = data[k];
        }
        Object.keys(data).forEach((k) => delete data[k]);
        Object.assign(data, allowed);
        if (Object.keys(allowed).length === 0) {
          return ctx.badRequest('Members may only update task status');
        }
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, 'assigner')) {
      if (data.assigner == null || data.assigner === '') data.assigner = null;
      else data.assigner = await normalizeAssignerInput(strapi, data.assigner);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'assignee')) {
      if (data.assignee == null || data.assignee === '') data.assignee = null;
      else data.assignee = await normalizeAssigneeInput(strapi, data.assignee);
    }
    if (Object.prototype.hasOwnProperty.call(data, 'parent')) {
      const pr = await resolveParentTaskOrError(strapi, ctx.state.orgId, data.parent, pk);
      if (!pr.ok) return ctx.badRequest(pr.message);
      data.parent = pr.parent;
    }

    const existingParentId = relationId(existing.parent);
    const effectiveParent = Object.prototype.hasOwnProperty.call(data, 'parent')
      ? data.parent
      : existingParentId;
    const isSubtask = effectiveParent != null && effectiveParent !== '';

    if (isSubtask && (data.collaborators != null || Object.prototype.hasOwnProperty.call(data, 'assignee'))) {
      await clampSubtaskToSingleAssignee(strapi, data);
    } else if (data.collaborators != null) {
      data.collaborators = await normalizeCollaboratorsInput(strapi, data.collaborators);
    }
    if (data.projects) {
      data.projects = await normalizeProjectsInput(strapi, ctx.state.orgId, data.projects);
    }

    const mergedRec = { ...existing, ...data };
    const newGroupId = ensureRecurrenceGroupId(mergedRec);
    if (newGroupId) data.recurrenceGroupId = newGroupId;

    const prevStatus = existing.status;
    const mergedStatus = data.status !== undefined ? data.status : existing.status;
    const becameCompleted = prevStatus !== 'COMPLETED' && mergedStatus === 'COMPLETED';
    const recurrenceFreq =
      data.recurrenceFrequency !== undefined ? data.recurrenceFrequency : existing.recurrenceFrequency;

    await strapi.entityService.update(UID, pk, { data });
    const changedKeys = collectChangedKeys(data);

    if (becameCompleted && recurrenceFreq && recurrenceFreq !== 'none') {
      try {
        const full = await strapi.entityService.findOne(UID, pk, {
          populate: [
            'assignee',
            'assigner',
            'projects',
            'collaborators',
            'leadCompany',
            'clientAccount',
            'deal',
            'organization',
          ],
        });
        if (full) await spawnNextRecurrenceTask(strapi, ctx.state.orgId, ctx.state.user?.id, full);
      } catch (e) {
        strapi.log.error('task recurrence spawn failed', e);
      }
    }

    const forLog = await strapi.entityService.findOne(UID, pk, {
      populate: ['assignee', 'projects'],
    });

    try {
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'update',
        subjectType: 'task',
        entity: forLog,
        subjectId: pk,
        changedKeys,
        previousEntity: existing,
        patch: data,
      });
      const actorName = await actorDisplayName(strapi, ctx.state.user?.id);
      await emitUpdateNotifications(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'task',
        subjectId: pk,
        entityName: (forLog?.name || 'Task').trim() || 'Task',
        changedKeys,
        stakeholderIds: taskStakeholderIds(existing),
        previousEntity: existing,
        patch: data,
      });
    } catch (_) {
      /* best-effort */
    }
    const forTime = await strapi.entityService.findOne(UID, pk, { populate: ['timeProject'] });
    const projId =
      (data.timeProject != null ? relId(data.timeProject) || data.timeProject : null) ||
      relId(forTime?.timeProject) ||
      relId(existing.timeProject);
    if (projId) await recomputeProjectFinancials(projId);
    return { data: forLog };
  },

  async approveAssignment(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'tasks', 'write');
    if (denied) return denied;
    if (!userMayApproveTaskAssignments(ctx)) {
      return ctx.forbidden('Only admins or managers can approve task assignments');
    }

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const existing = await strapi.entityService.findOne(UID, pk, {
      populate: ['organization', 'pendingCollaborators', 'collaborators'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    if (existing.assignmentApprovalStatus !== 'pending') {
      return ctx.badRequest('Task has no pending assignment to approve');
    }

    const pendingIds = pendingCollaboratorIdsFromEntity(existing);
    await strapi.entityService.update(UID, pk, {
      data: {
        collaborators: { set: pendingIds },
        pendingCollaborators: { set: [] },
        assignmentApprovalStatus: 'approved',
        ...(pendingIds.length ? { assignee: pendingIds[0] } : { assignee: null }),
      },
    });

    const forLog = await strapi.entityService.findOne(UID, pk, {
      populate: ['assignee', 'collaborators', 'pendingCollaborators', 'projects'],
    });
    try {
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'update',
        subjectType: 'task',
        entity: forLog,
        subjectId: pk,
        changedKeys: ['assignmentApprovalStatus', 'collaborators'],
        previousEntity: existing,
        patch: { assignmentApprovalStatus: 'approved' },
      });
      const actorName = await actorDisplayName(strapi, ctx.state.user?.id);
      await emitUpdateNotifications(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'task',
        subjectId: pk,
        entityName: (forLog?.name || 'Task').trim() || 'Task',
        changedKeys: ['assignee', 'collaborators', 'assignmentApprovalStatus'],
        stakeholderIds: taskStakeholderIds(forLog),
        previousEntity: existing,
        patch: { assignee: forLog?.assignee, collaborators: forLog?.collaborators },
      });
    } catch (_) {
      /* best-effort */
    }
    return { data: forLog };
  },

  async rejectAssignment(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'tasks', 'write');
    if (denied) return denied;
    if (!userMayApproveTaskAssignments(ctx)) {
      return ctx.forbidden('Only admins or managers can reject task assignments');
    }

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const existing = await strapi.entityService.findOne(UID, pk, {
      populate: ['organization', 'pendingCollaborators'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    if (existing.assignmentApprovalStatus !== 'pending') {
      return ctx.badRequest('Task has no pending assignment to reject');
    }

    await strapi.entityService.update(UID, pk, {
      data: {
        pendingCollaborators: { set: [] },
        assignmentApprovalStatus: 'rejected',
      },
    });

    const forLog = await strapi.entityService.findOne(UID, pk, {
      populate: ['assignee', 'collaborators', 'pendingCollaborators', 'projects'],
    });
    try {
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'update',
        subjectType: 'task',
        entity: forLog,
        subjectId: pk,
        changedKeys: ['assignmentApprovalStatus', 'pendingCollaborators'],
        previousEntity: existing,
        patch: { assignmentApprovalStatus: 'rejected' },
      });
    } catch (_) {
      /* best-effort */
    }
    return { data: forLog };
  },

  async delete(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const denied = requireModuleAccess(ctx, 'pm', 'tasks', 'write');
    if (denied) return denied;

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const existing = await strapi.entityService.findOne(UID, pk, {
      populate: ['organization', 'assignee', 'assigner', 'projects', 'timeProject'],
    });
    if (!existing) return ctx.notFound();
    if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    if (!isPmOrgAdminRole(ctx) && ctx.state.user?.id) {
      const ok = await userMayViewTask(strapi, ctx, ctx.state.orgId, ctx.state.user.id, existing);
      if (!ok) return ctx.forbidden('Access denied');
    }
    if (isPmOrgMemberRole(ctx) && ctx.state.user?.id) {
      if (!userIsTaskReporter(existing, ctx.state.user.id)) {
        return ctx.forbidden('Members may only delete tasks they created');
      }
    }

    const timeProjBeforeDelete = relId(existing.timeProject);

    try {
      await logCrmActivity(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        action: 'delete',
        subjectType: 'task',
        entity: existing,
        subjectId: pk,
        changedKeys: null,
      });
    } catch (_) {
      /* best-effort */
    }

    const entry = await strapi.entityService.delete(UID, pk);
    if (timeProjBeforeDelete) await recomputeProjectFinancials(timeProjBeforeDelete);
    return { data: entry };
  },

  async timerStart(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const task = await strapi.entityService.findOne(UID, pk, { populate: ['organization'] });
    if (!task) return ctx.notFound();
    if (orgIdFromRelation(task.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    if (task.timerRunning) return ctx.badRequest('Timer is already running');

    const entry = await strapi.entityService.update(UID, pk, {
      data: { timerRunning: true, timerStartedAt: new Date().toISOString() },
    });
    return { data: entry };
  },

  async timerStop(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const pk = await resolveEntityPkForRouteParam(strapi, UID, ctx.params.id);
    if (pk == null) return ctx.notFound();

    const task = await strapi.entityService.findOne(UID, pk, {
      populate: ['organization', 'timeProject'],
    });
    if (!task) return ctx.notFound();
    if (orgIdFromRelation(task.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }
    if (!task.timerRunning) return ctx.badRequest('Timer is not running');

    const now = new Date();
    const started = new Date(task.timerStartedAt);
    const hoursElapsed = (now - started) / 3600000;
    const newHours = Math.round(((parseFloat(task.hoursLogged) || 0) + hoursElapsed) * 100) / 100;

    const entry = await strapi.entityService.update(UID, pk, {
      data: { hoursLogged: newHours, timerRunning: false, timerStartedAt: null },
    });

    const projId = relId(entry.timeProject) || relId(task.timeProject);
    if (projId) await recomputeProjectFinancials(projId);

    return { data: entry };
  },

  /** GET /tasks/my-work — ?scope=crm excludes PM project-only tasks (CRM app). */
  async myWork(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');
    const crmScope = readTaskListScope(ctx) === 'crm';
    const denied = requireMyWorkRead(ctx, { crmOnly: crmScope });
    if (denied) return denied;

    const userId = ctx.state.user.id;
    const orgId = ctx.state.orgId;

    const terminal = ['COMPLETED', 'CANCELLED'];

    const projectTasksPromise =
      !crmScope && !isPmOrgAdminRole(ctx) && userId
        ? projectIdsVisibleToUser(strapi, ctx, orgId, userId).then((pids) =>
            pids.length
              ? strapi.entityService.findMany(UID, {
                  filters: {
                    organization: orgId,
                    projects: { id: { $in: pids } },
                  },
                  limit: 200,
                  sort: { scheduledDate: 'ASC' },
                  populate: ['leadCompany', 'assignee', 'clientAccount', 'deal'],
                })
              : []
          )
        : Promise.resolve([]);

    const crmRelationPopulate = ['leadCompany', 'assignee', 'clientAccount', 'deal'];

    const [asAssignee, asCollaborator, fromProjects] = await Promise.all([
      strapi.entityService.findMany(UID, {
        filters: {
          organization: orgId,
          assignee: userId,
        },
        limit: 200,
        sort: { scheduledDate: 'ASC' },
        populate: crmRelationPopulate,
      }),
      strapi.entityService.findMany(UID, {
        filters: {
          organization: orgId,
          collaborators: { id: userId },
        },
        limit: 200,
        sort: { scheduledDate: 'ASC' },
        populate: crmRelationPopulate,
      }),
      projectTasksPromise,
    ]);

    const byId = new Map();
    for (const t of asAssignee) {
      if (t?.id != null) byId.set(t.id, t);
    }
    for (const t of asCollaborator) {
      if (t?.id != null) byId.set(t.id, t);
    }
    for (const t of fromProjects || []) {
      if (t?.id != null) byId.set(t.id, t);
    }

    let tasks = [...byId.values()].filter((t) => t && !terminal.includes(t.status));
    if (crmScope) {
      tasks = tasks.filter(isCrmTaskEntity);
    }

    const now = new Date();
    const sod = startOfDay(now);
    const eod = endOfDay(now);
    const horizonEnd = endOfDay(addDays(now, 14));

    const overdue = [];
    const today = [];
    const upcoming = [];

    for (const t of tasks) {
      const sd = t.scheduledDate ? new Date(t.scheduledDate) : null;
      if (!sd || Number.isNaN(sd.getTime())) {
        upcoming.push(t);
        continue;
      }
      if (sd < sod) {
        overdue.push(t);
      } else if (sd >= sod && sd <= eod) {
        today.push(t);
      } else if (sd > eod && sd <= horizonEnd) {
        upcoming.push(t);
      }
    }

    const slice = (arr, n) =>
      arr.slice(0, n).map((task) => ({
        id: task.id,
        name: task.name,
        status: task.status,
        scheduledDate: task.scheduledDate,
        leadCompany: task.leadCompany
          ? typeof task.leadCompany === 'object'
            ? {
                id: task.leadCompany.id,
                companyName: task.leadCompany.companyName || task.leadCompany.name,
              }
            : { id: task.leadCompany }
          : null,
      }));

    ctx.set('Cache-Control', 'no-store');
    return {
      data: {
        overdue: { count: overdue.length, items: slice(overdue, 5) },
        today: { count: today.length, items: slice(today, 5) },
        upcoming: { count: upcoming.length, items: slice(upcoming, 5) },
      },
    };
  },
}));
