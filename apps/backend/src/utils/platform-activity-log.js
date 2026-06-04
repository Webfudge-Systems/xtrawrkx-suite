'use strict';

const ACTIVITY_UID = 'api::platform-activity.platform-activity';

const FIELD_LABELS = {
  name: 'Name',
  companyEmail: 'Company email',
  companyPhone: 'Company phone',
  website: 'Website',
  industry: 'Industry',
  size: 'Size',
  status: 'Status',
  slug: 'Workspace slug',
  billingCycle: 'Billing cycle',
  role: 'Role',
  email: 'Email',
};

const IGNORE_UPDATE_KEYS = new Set([
  'id',
  'documentId',
  'organization',
  'owner',
  'createdAt',
  'updatedAt',
  'publishedAt',
  'createdBy',
  'updatedBy',
  'locale',
  'localizations',
  'onboardingCompleted',
  'trialEndsAt',
  'activeModules',
  'securitySettings',
]);

function labelForField(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  return String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
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

function formatDetailValue(key, val) {
  if (val == null || val === '') return '(empty)';
  if (key === 'role' && typeof val === 'object' && val !== null) {
    return truncateDetail(String(val.name || val.code || val.id || '(empty)'));
  }
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return truncateDetail(JSON.stringify(val));
  const s = String(val).trim();
  return s === '' ? '(empty)' : truncateDetail(s);
}

function valuesDiffer(beforeVal, afterVal) {
  if (beforeVal == null && afterVal == null) return false;
  const sb = beforeVal == null || beforeVal === '' ? '' : String(beforeVal).trim();
  const sa = afterVal == null || afterVal === '' ? '' : String(afterVal).trim();
  return sb !== sa;
}

function buildFieldChanges(previous, patch) {
  if (!previous || !patch || typeof patch !== 'object') return [];
  const keys = collectChangedKeys(patch);
  const out = [];
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    const afterRaw = patch[key];
    const beforeRaw = previous[key];
    if (!valuesDiffer(beforeRaw, afterRaw)) continue;
    out.push({
      key,
      label: labelForField(key),
      before: formatDetailValue(key, beforeRaw),
      after: formatDetailValue(key, afterRaw),
    });
  }
  return out;
}

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

function buildSummary(action, subjectType, entity, fieldChangeCount) {
  const n = typeof fieldChangeCount === 'number' && fieldChangeCount >= 0 ? fieldChangeCount : 0;

  if (subjectType === 'organization') {
    const name = (entity?.name || 'Organization').trim() || 'Organization';
    if (action === 'create') return `Organization "${name}" was created`;
    if (action === 'delete') return `Organization "${name}" was deleted`;
    if (n > 0) {
      return `Organization "${name}" was updated (${n} field${n !== 1 ? 's' : ''})`;
    }
    return `Organization "${name}" was updated`;
  }

  if (subjectType === 'subscription') {
    const appName =
      entity?.app?.name || entity?.app?.slug || entity?.appName || 'App';
    if (action === 'create') return `Subscription added for ${appName}`;
    if (action === 'delete') return `Subscription removed for ${appName}`;
    if (n > 0) return `Subscription for ${appName} was updated (${n} field${n !== 1 ? 's' : ''})`;
    return `Subscription for ${appName} was updated`;
  }

  if (subjectType === 'organization_member') {
    const email = entity?.email || entity?.user?.email || 'Member';
    if (action === 'create') return `Member ${email} was added`;
    if (action === 'delete') return `Member ${email} was removed`;
    if (n > 0) return `Member ${email} was updated (${n} field${n !== 1 ? 's' : ''})`;
    return `Member ${email} was updated`;
  }

  if (action === 'create') return 'Record was created';
  if (action === 'delete') return 'Record was deleted';
  return 'Record was updated';
}

/**
 * Persist a platform timeline row. Failures are swallowed so mutations still succeed.
 */
async function logPlatformActivity(strapi, params) {
  const {
    organizationId,
    actorUserId,
    action,
    subjectType,
    entity,
    previousEntity,
    patch,
    subjectId: subjectIdOverride,
    summary: summaryOverride,
    meta: metaOverride,
  } = params;

  if (!organizationId || !subjectType || !entity) return;

  let subjectId =
    subjectIdOverride != null ? Number(subjectIdOverride) : resolveNumericEntityId(entity);
  if (subjectId == null || Number.isNaN(subjectId)) return;

  let fieldChanges = [];
  if (action === 'update' && previousEntity && patch && typeof patch === 'object') {
    fieldChanges = buildFieldChanges(previousEntity, patch);
  }

  const summary = summaryOverride || buildSummary(action, subjectType, entity, fieldChanges.length);

  const row = {
    organization: organizationId,
    actor: actorUserId ?? null,
    action,
    subjectType,
    subjectId,
    summary,
  };

  if (metaOverride) {
    row.meta = metaOverride;
  } else if (action === 'update' && fieldChanges.length > 0) {
    row.meta = {
      changedFields: fieldChanges.map((c) => c.key),
      changes: fieldChanges,
    };
  } else if (action === 'create' && patch && typeof patch === 'object') {
    const initialChanges = collectChangedKeys(patch)
      .filter((key) => patch[key] != null && patch[key] !== '')
      .map((key) => ({
        key,
        label: labelForField(key),
        before: '(empty)',
        after: formatDetailValue(key, patch[key]),
      }));
    if (initialChanges.length > 0) {
      row.meta = { changes: initialChanges };
    }
  }

  try {
    await strapi.entityService.create(ACTIVITY_UID, { data: row });
  } catch (err) {
    strapi.log.warn(
      'platform-activity-log: failed to write activity (%s %s:%s): %s',
      action,
      subjectType,
      subjectId,
      err?.message || err
    );
  }
}

function buildLegacyActivityItems(org) {
  if (!org) return [];

  const items = [];

  if (org.createdAt) {
    items.push({
      id: `legacy-created-${org.id}`,
      action: 'create',
      subjectType: 'organization',
      subjectId: org.id,
      createdAt: org.createdAt,
      summary: `Organization "${org.name || 'Untitled'}" was created`,
      meta: {
        changes: org.status
          ? [
              {
                key: 'status',
                label: labelForField('status'),
                before: '(empty)',
                after: formatDetailValue('status', org.status),
              },
            ]
          : [],
      },
    });
  }

  if (
    org.updatedAt &&
    org.createdAt &&
    new Date(org.updatedAt).getTime() > new Date(org.createdAt).getTime() + 60_000
  ) {
    items.push({
      id: `legacy-updated-${org.id}`,
      action: 'update',
      subjectType: 'organization',
      subjectId: org.id,
      createdAt: org.updatedAt,
      summary: `Organization "${org.name || 'Untitled'}" was updated`,
    });
  }

  const subs = Array.isArray(org.subscriptions) ? org.subscriptions : [];
  subs.forEach((sub) => {
    const appName = sub.app?.name || sub.app?.slug || 'App';
    const at = sub.createdAt || sub.updatedAt;
    if (!at) return;
    items.push({
      id: `legacy-sub-${sub.id}`,
      action: 'create',
      subjectType: 'subscription',
      subjectId: sub.id,
      createdAt: at,
      summary: `Subscription added for ${appName}`,
      meta: {
        changes: [
          {
            key: 'status',
            label: labelForField('status'),
            before: '(empty)',
            after: formatDetailValue('status', sub.status || 'trial'),
          },
          {
            key: 'billingCycle',
            label: labelForField('billingCycle'),
            before: '(empty)',
            after: formatDetailValue('billingCycle', sub.billingCycle || '—'),
          },
        ],
      },
    });
  });

  return items;
}

function activityDedupeKey(row) {
  return `${row.action || ''}:${row.subjectType || ''}:${row.subjectId ?? ''}`;
}

function mergeActivityItems(apiRows, legacyRows) {
  const seen = new Set((apiRows || []).map(activityDedupeKey));
  const merged = [...(apiRows || [])];
  for (const row of legacyRows || []) {
    const key = activityDedupeKey(row);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(row);
    }
  }
  return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  ACTIVITY_UID,
  logPlatformActivity,
  buildFieldChanges,
  buildSummary,
  labelForField,
  buildLegacyActivityItems,
  mergeActivityItems,
};

