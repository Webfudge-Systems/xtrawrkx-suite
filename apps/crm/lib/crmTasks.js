/**
 * CRM-scoped tasks — inverse of PM `getPMTasksByAssignee` filter in apps/pm/lib/api/taskService.js.
 * A task is CRM-scoped when linked to lead, client, contact, or deal (not PM project-only work).
 */

export const CRM_TASK_RELATION_FIELDS = ['leadCompany', 'clientAccount', 'contact', 'deal'];

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

/** @param {object|null|undefined} task */
export function isCrmTask(task) {
  if (!task) return false;
  const t = task.attributes ? { ...task.attributes, id: task.id ?? task.documentId } : task;
  return CRM_TASK_RELATION_FIELDS.some((field) => relationIsSet(t[field]));
}

/** @param {object[]|null|undefined} tasks */
export function filterCrmTasks(tasks) {
  return (tasks || []).filter(isCrmTask);
}

/** @param {{ overdue?: object, today?: object, upcoming?: object }|null|undefined} summary */
export function filterCrmMyWorkSummary(summary) {
  if (!summary || typeof summary !== 'object') {
    return {
      overdue: { count: 0, items: [] },
      today: { count: 0, items: [] },
      upcoming: { count: 0, items: [] },
    };
  }

  const filterBucket = (bucket) => {
    const items = filterCrmTasks(bucket?.items ?? []);
    return { count: items.length, items };
  };

  return {
    overdue: filterBucket(summary.overdue),
    today: filterBucket(summary.today),
    upcoming: filterBucket(summary.upcoming),
  };
}
