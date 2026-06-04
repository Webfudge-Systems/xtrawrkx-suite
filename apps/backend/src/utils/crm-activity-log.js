'use strict';

const ACTIVITY_UID = 'api::crm-activity.crm-activity';

const FIELD_LABELS = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  companyName: 'Company name',
  companyWebsite: 'Company website',
  status: 'Status',
  source: 'Source',
  preferredContactMethod: 'Preferred contact method',
  birthDate: 'Birth date',
  timezone: 'Timezone',
  jobTitle: 'Job title',
  department: 'Department',
  contactRole: 'Contact role',
  isPrimaryContact: 'Primary contact',
  address: 'Address',
  city: 'City',
  state: 'State',
  country: 'Country',
  zipCode: 'ZIP / postal code',
  linkedIn: 'LinkedIn',
  twitter: 'Twitter',
  notes: 'Notes',
  assignedTo: 'Assignee',
  leadCompany: 'Lead company',
  industry: 'Industry',
  type: 'Type',
  website: 'Website',
  employees: 'Employees',
  founded: 'Founded',
  description: 'Description',
  segment: 'Segment',
  score: 'Lead score',
  healthScore: 'Health score',
  dealValue: 'Deal value',
  name: 'Name',
  value: 'Value',
  stage: 'Stage',
  priority: 'Priority',
  probability: 'Probability',
  visibility: 'Visibility',
  dealGroup: 'Deal group',
  expectedCloseDate: 'Expected close date',
  clientAccount: 'Client account',
  contact: 'Primary contact',
  projectManager: 'Project manager',
  teamMembers: 'Team members',
  startDate: 'Start date',
  endDate: 'Due date',
  slug: 'Slug',
  assignee: 'Assignee',
  assigner: 'Assigner',
  collaborators: 'Assignees',
  scheduledDate: 'Due date',
  recurrenceFrequency: 'Repeat',
  recurrenceInterval: 'Repeat every',
  recurrenceWeekdays: 'Repeat on days',
  recurrenceMonthDay: 'Day of month',
  recurrenceCustomUnit: 'Custom interval',
  recurrenceEndsAt: 'Repeat until',
  recurrenceGroupId: 'Recurrence series',
  projects: 'Projects',
};

function contactLabel(entity) {
  if (!entity) return 'Contact';
  const fn = (entity.firstName || '').trim();
  const ln = (entity.lastName || '').trim();
  if (fn && ln) return `${fn} ${ln}`;
  if (entity.email) return String(entity.email);
  return 'Contact';
}

function leadCompanyLabel(entity) {
  if (!entity) return 'Lead company';
  return (entity.companyName || entity.name || 'Lead company').trim() || 'Lead company';
}

function dealLabel(entity) {
  if (!entity) return 'Deal';
  const n = (entity.name || '').trim();
  return n || 'Deal';
}

function projectLabel(entity) {
  if (!entity) return 'Project';
  const n = (entity.name || entity.title || '').trim();
  return n || 'Project';
}

function taskLabel(entity) {
  if (!entity) return 'Task';
  const n = (entity.name || entity.title || '').trim();
  return n || 'Task';
}

function labelForField(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function leadCompanyFk(subjectType, entity) {
  if (subjectType === 'lead_company') return entity?.id ?? null;
  if (subjectType === 'contact' || subjectType === 'deal' || subjectType === 'meeting') {
    const lc = entity?.leadCompany;
    if (lc == null) return null;
    if (typeof lc === 'object') return lc.id ?? null;
    return lc;
  }
  return null;
}

function buildSummary(action, subjectType, entity, changedKeys, fieldChangeCount) {
  const n =
    typeof fieldChangeCount === 'number' && fieldChangeCount >= 0
      ? fieldChangeCount
      : changedKeys?.length ?? 0;
  if (subjectType === 'contact') {
    const name = contactLabel(entity);
    if (action === 'create') return `Contact "${name}" was created`;
    if (action === 'delete') return `Contact "${name}" was deleted`;
    if (n > 0) {
      return `Contact "${name}" was updated (${n} field${n !== 1 ? 's' : ''})`;
    }
    return `Contact "${name}" was updated`;
  }
  if (subjectType === 'lead_company') {
    const name = leadCompanyLabel(entity);
    if (action === 'create') return `Lead company "${name}" was created`;
    if (action === 'delete') return `Lead company "${name}" was deleted`;
    if (n > 0) {
      return `Lead company "${name}" was updated (${n} field${n !== 1 ? 's' : ''})`;
    }
    return `Lead company "${name}" was updated`;
  }
  if (subjectType === 'deal') {
    const name = dealLabel(entity);
    if (action === 'create') return `Deal "${name}" was created`;
    if (action === 'delete') return `Deal "${name}" was deleted`;
    if (n > 0) {
      return `Deal "${name}" was updated (${n} field${n !== 1 ? 's' : ''})`;
    }
    return `Deal "${name}" was updated`;
  }
  if (subjectType === 'meeting') {
    const title = (entity?.title || 'Meeting').trim() || 'Meeting';
    if (action === 'create') return `Meeting "${title}" was created`;
    if (action === 'delete') return `Meeting "${title}" was deleted`;
    if (n > 0) return `Meeting "${title}" was updated (${n} field${n !== 1 ? 's' : ''})`;
    return `Meeting "${title}" was updated`;
  }
  if (subjectType === 'client_account') {
    const name = (entity?.companyName || entity?.name || 'Account').trim() || 'Account';
    if (action === 'create') return `Account "${name}" was created`;
    if (action === 'delete') return `Account "${name}" was deleted`;
    if (n > 0) return `Account "${name}" was updated (${n} field${n !== 1 ? 's' : ''})`;
    return `Account "${name}" was updated`;
  }
  if (subjectType === 'project') {
    const name = projectLabel(entity);
    if (action === 'create') return `Project "${name}" was created`;
    if (action === 'delete') return `Project "${name}" was deleted`;
    if (n > 0) return `Project "${name}" was updated (${n} field${n !== 1 ? 's' : ''})`;
    return `Project "${name}" was updated`;
  }
  if (subjectType === 'task') {
    const name = taskLabel(entity);
    if (action === 'create') return `Task "${name}" was created`;
    if (action === 'delete') return `Task "${name}" was deleted`;
    if (n > 0) return `Task "${name}" was updated (${n} field${n !== 1 ? 's' : ''})`;
    return `Task "${name}" was updated`;
  }
  if (action === 'create') return `Record was created`;
  if (action === 'delete') return `Record was deleted`;
  return `Record was updated`;
}

const IGNORE_UPDATE_KEYS = new Set([
  'id',
  'documentId',
  'organization',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
  'locale',
  'localizations',
]);

/**
 * Strapi 5 responses sometimes omit top-level numeric `id`; prefer entities from findOne(uid, pk).
 */
function resolveNumericEntityId(entity) {
  if (!entity || typeof entity !== 'object') return null;
  const raw = entity.id;
  if (raw != null && typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  if (raw != null && raw !== '') {
    const n = parseInt(String(raw), 10);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

/**
 * Persist a CRM timeline row. Failures are swallowed so mutations still succeed.
 */
async function logCrmActivity(strapi, params) {
  const {
    organizationId,
    actorUserId,
    action,
    subjectType,
    entity,
    changedKeys: changedKeysParam,
    previousEntity,
    patch,
    subjectId: subjectIdOverride,
  } = params;
  if (!organizationId || !subjectType || !entity) return;

  let subjectId =
    subjectIdOverride != null ? Number(subjectIdOverride) : resolveNumericEntityId(entity);
  if (subjectId == null || Number.isNaN(subjectId)) return;

  let fieldChanges = [];
  if (action === 'update' && previousEntity && patch && typeof patch === 'object') {
    fieldChanges = buildFieldChanges(previousEntity, patch);
  }
  const changedKeys =
    fieldChanges.length > 0
      ? fieldChanges.map((c) => c.key)
      : changedKeysParam?.length
        ? changedKeysParam
        : collectChangedKeys(patch || {});

  const lcId = leadCompanyFk(subjectType, entity);
  const summary = buildSummary(
    action,
    subjectType,
    entity,
    changedKeys,
    fieldChanges.length || changedKeys?.length || 0
  );

  const row = {
    organization: organizationId,
    actor: actorUserId ?? null,
    action,
    subjectType,
    subjectId,
    leadCompany: lcId,
    summary,
  };
  if (action === 'update' && (fieldChanges.length > 0 || changedKeys?.length)) {
    row.meta = {
      changedFields: changedKeys,
      ...(fieldChanges.length > 0 ? { changes: fieldChanges } : {}),
    };
  }

  try {
    await strapi.entityService.create(ACTIVITY_UID, { data: row });
  } catch (err) {
    strapi.log.warn(
      'crm-activity-log: failed to write activity (%s %s:%s): %s',
      action,
      subjectType,
      subjectId,
      err?.message || err
    );
  }
}

function collectChangedKeys(data) {
  if (!data || typeof data !== 'object') return [];
  return Object.keys(data).filter((k) => !IGNORE_UPDATE_KEYS.has(k));
}

const MAX_DETAIL_LEN = 400;

function truncateDetail(s) {
  if (s.length <= MAX_DETAIL_LEN) return s;
  return `${s.slice(0, MAX_DETAIL_LEN)}…`;
}

function relationCompareId(val) {
  if (val == null || val === '') return '';
  if (typeof val === 'object') {
    const id = val.id ?? val.documentId;
    return id != null ? String(id) : '';
  }
  return String(val).trim();
}

function formatDetailValue(key, val) {
  if (val == null || val === '') return '(empty)';
  if (
    key === 'assignedTo' ||
    key === 'assignee' ||
    key === 'assigner' ||
    key === 'leadCompany' ||
    key === 'clientAccount' ||
    key === 'contact' ||
    key === 'projectManager'
  ) {
    if (typeof val === 'object' && val !== null) {
      const bit =
        val.email ||
        val.username ||
        val.companyName ||
        val.name ||
        (val.firstName || val.lastName
          ? `${val.firstName || ''} ${val.lastName || ''}`.trim()
          : null);
      if (bit) return truncateDetail(String(bit));
      if (val.id != null) return `ID ${val.id}`;
      return truncateDetail(JSON.stringify(val));
    }
    return val === '' ? '(empty)' : `ID ${val}`;
  }
  if ((key === 'teamMembers' || key === 'collaborators') && Array.isArray(val)) {
    const bits = val
      .map((u) => {
        if (!u || typeof u !== 'object') return u != null ? String(u) : '';
        return (
          u.email ||
          u.username ||
          [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
          (u.id != null ? `User ${u.id}` : '')
        );
      })
      .filter(Boolean);
    return bits.length ? truncateDetail(bits.join(', ')) : '(empty)';
  }
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return truncateDetail(JSON.stringify(val));
  const s = String(val).trim();
  return s === '' ? '(empty)' : truncateDetail(s);
}

function valuesDiffer(key, beforeVal, afterVal) {
  if (
    key === 'assignedTo' ||
    key === 'assignee' ||
    key === 'assigner' ||
    key === 'leadCompany' ||
    key === 'clientAccount' ||
    key === 'contact' ||
    key === 'projectManager'
  ) {
    return relationCompareId(beforeVal) !== relationCompareId(afterVal);
  }
  if (key === 'teamMembers' || key === 'collaborators') {
    const norm = (v) => {
      if (v == null) return '';
      if (Array.isArray(v))
        return [
          ...new Set(
            v.map((x) => (typeof x === 'object' && x !== null ? x.id ?? '' : x)).filter(Boolean)
          ),
        ]
          .map(String)
          .sort()
          .join(',');
      return String(v);
    };
    return norm(beforeVal) !== norm(afterVal);
  }
  if (beforeVal == null && afterVal == null) return false;
  if (typeof beforeVal === 'number' && typeof afterVal === 'number') {
    return beforeVal !== afterVal;
  }
  if (typeof beforeVal === 'boolean' && typeof afterVal === 'boolean') {
    return beforeVal !== afterVal;
  }
  const sb = beforeVal == null || beforeVal === '' ? '' : String(beforeVal).trim();
  const sa = afterVal == null || afterVal === '' ? '' : String(afterVal).trim();
  return sb !== sa;
}

/**
 * @param {object} previous - entity before update (flat attributes)
 * @param {object} patch - request data keys
 * @returns {{ key: string, label: string, before: string, after: string }[]}
 */
function buildFieldChanges(previous, patch) {
  if (!previous || !patch || typeof patch !== 'object') return [];
  const keys = collectChangedKeys(patch);
  const out = [];
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    const afterRaw = patch[key];
    const beforeRaw = previous[key];
    if (!valuesDiffer(key, beforeRaw, afterRaw)) continue;
    out.push({
      key,
      label: labelForField(key),
      before: formatDetailValue(key, beforeRaw),
      after: formatDetailValue(key, afterRaw),
    });
  }
  return out;
}

/**
 * Persist Accounts / org-admin timeline rows (users, invites, roles).
 * Uses the same crm-activity store as CRM/PM so the org-wide feed includes them.
 */
async function logAccountsActivity(strapi, params) {
  const { organizationId, actorUserId, action, subjectType, subjectId, summary, meta } = params;
  if (!organizationId || !subjectType || subjectId == null) return;

  const sid = Number(subjectId);
  if (Number.isNaN(sid)) return;

  const row = {
    organization: organizationId,
    actor: actorUserId ?? null,
    action,
    subjectType,
    subjectId: sid,
    leadCompany: null,
    summary: summary || `${action} ${subjectType}`,
  };
  if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
    row.meta = meta;
  }

  try {
    await strapi.entityService.create(ACTIVITY_UID, { data: row });
  } catch (err) {
    strapi.log.warn(
      'accounts-activity-log: failed to write activity (%s %s:%s): %s',
      action,
      subjectType,
      sid,
      err?.message || err
    );
  }
}

async function actorDisplayName(strapi, actorUserId) {
  if (!actorUserId) return 'System';
  try {
    const actor = await strapi.entityService.findOne('plugin::users-permissions.user', actorUserId, {
      fields: ['username', 'email'],
    });
    return actor?.username || actor?.email || `User ${actorUserId}`;
  } catch (_) {
    return `User ${actorUserId}`;
  }
}

module.exports = {
  ACTIVITY_UID,
  logCrmActivity,
  logAccountsActivity,
  actorDisplayName,
  collectChangedKeys,
  buildFieldChanges,
  contactLabel,
  leadCompanyLabel,
  dealLabel,
};
