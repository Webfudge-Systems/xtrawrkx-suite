'use strict';

/** Relations that scope a task to CRM (see apps/pm/lib/api/taskService.js CRM_RELATION_FIELDS). */
const CRM_TASK_RELATION_FIELDS = ['leadCompany', 'clientAccount', 'contact', 'deal'];

function relationIsSet(rel) {
  if (rel == null || rel === '') return false;
  const relData = rel.data !== undefined ? rel.data : rel;
  if (relData == null) return false;
  if (Array.isArray(relData)) return relData.length > 0;
  if (typeof relData === 'object') {
    return relData.id != null || relData.documentId != null;
  }
  return true;
}

function isCrmTaskEntity(entity) {
  if (!entity) return false;
  return CRM_TASK_RELATION_FIELDS.some((field) => relationIsSet(entity[field]));
}

/** Strapi filters: task has at least one CRM relation. */
function crmTaskScopeFilter() {
  return {
    $or: CRM_TASK_RELATION_FIELDS.map((field) => ({
      [field]: { id: { $notNull: true } },
    })),
  };
}

function readTaskListScope(ctx) {
  return ctx?.query?.scope === 'crm' ? 'crm' : null;
}

function mergeScopeFilter(filters, scopeFilter) {
  if (!scopeFilter) return filters;
  const keys = Object.keys(filters || {});
  if (!keys.length) return { ...scopeFilter };
  return { $and: [filters, scopeFilter] };
}

module.exports = {
  CRM_TASK_RELATION_FIELDS,
  isCrmTaskEntity,
  crmTaskScopeFilter,
  readTaskListScope,
  mergeScopeFilter,
};
