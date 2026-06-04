const TASK_STATUS_ORDER = {
  SCHEDULED: 1,
  IN_PROGRESS: 2,
  INTERNAL_REVIEW: 3,
  ON_HOLD: 4,
  COMPLETED: 5,
  CANCELLED: 6,
  OVERDUE: 0,
};

const PROJECT_STATUS_ORDER = {
  PLANNING: 1,
  ACTIVE: 2,
  IN_PROGRESS: 3,
  ON_HOLD: 4,
  COMPLETED: 5,
  CANCELLED: 6,
};

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };

function dateValue(value) {
  if (value == null || value === '') return null;
  const t = Date.parse(String(value));
  return Number.isFinite(t) ? t : null;
}

function stringValue(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s || null;
}

function assigneeNames(row) {
  const fromList = (row.assignees || []).map((a) => a?.name || a?.email || '').filter(Boolean);
  if (fromList.length) return fromList.join(', ').toLowerCase();
  return stringValue(row.assigneeName);
}

/** @param {Record<string, unknown>} row */
export function getTaskSortValue(row, key) {
  switch (key) {
    case 'name':
      return stringValue(row.name);
    case 'project':
      return stringValue(row.project);
    case 'status':
      return TASK_STATUS_ORDER[row.strapiStatus] ?? TASK_STATUS_ORDER[String(row.status)] ?? 99;
    case 'priority':
      return PRIORITY_ORDER[String(row.priority || '').toLowerCase()] ?? 0;
    case 'assigner':
      return stringValue(row.assignerName || row.assigner?.name || row.assigner?.email);
    case 'assignees':
      return assigneeNames(row);
    case 'startDate':
      return dateValue(row.startDate);
    case 'dueDate':
      return dateValue(row.dueDate);
    case 'tags': {
      const raw = row.tags;
      const bits = Array.isArray(raw)
        ? raw.map((t) => (typeof t === 'string' ? t : t?.name ?? t?.label ?? '')).filter(Boolean)
        : [];
      return bits.length ? bits.join(', ').toLowerCase() : null;
    }
    case 'description':
      return stringValue(row.description);
    case 'createdAt':
      return dateValue(row.createdAt);
    case 'updatedAt':
      return dateValue(row.updatedAt);
    case 'recurrence':
      return stringValue(row.recurrenceSummary);
    default:
      return row[key];
  }
}

/** @param {Record<string, unknown>} row */
export function getProjectSortValue(row, key) {
  switch (key) {
    case 'name':
      return stringValue(row.name);
    case 'status':
      return PROJECT_STATUS_ORDER[row.strapiStatus ?? row.status] ?? 99;
    case 'progress':
      return Number(row.progress) || 0;
    case 'projectManager':
      return stringValue(
        row.projectManager?.name ||
          row.projectManager?.email ||
          row.projectManagerName
      );
    case 'endDate':
      return dateValue(row.endDate);
    case 'startDate':
      return dateValue(row.startDate);
    case 'tasks': {
      const total = Number(row.totalTasks) || 0;
      const done = Number(row.completedTasks) || 0;
      return total > 0 ? done / total : -1;
    }
    case 'client':
      return stringValue(row.clientName);
    case 'budget': {
      const n = Number(row.budget);
      return Number.isFinite(n) ? n : null;
    }
    case 'description':
      return stringValue(row.description);
    case 'createdAt':
      return dateValue(row.createdAt);
    case 'updatedAt':
      return dateValue(row.updatedAt);
    default:
      return row[key];
  }
}

/** @param {Record<string, unknown>} row */
export function getClientAccountSortValue(row, key) {
  switch (key) {
    case 'company':
    case 'companyName':
      return stringValue(row.companyName || row.name);
    case 'primaryContact': {
      const pc = row.primaryContact || row.contacts?.find((c) => c.isPrimaryContact) || row.contacts?.[0];
      if (!pc) return null;
      return stringValue(
        [pc.firstName, pc.lastName].filter(Boolean).join(' ') || pc.name || pc.email
      );
    }
    case 'healthScore': {
      const n = Number(row.healthScore);
      return Number.isFinite(n) ? n : null;
    }
    case 'dealValue': {
      const n = Number(row.dealValue);
      return Number.isFinite(n) ? n : null;
    }
    case 'contactsCount':
      return Array.isArray(row.contacts) ? row.contacts.length : Number(row.contactsCount) || 0;
    case 'location': {
      const parts = [row.city, row.state, row.country].filter(Boolean);
      return parts.length ? parts.join(', ').toLowerCase() : null;
    }
    case 'industry':
      return stringValue(row.industry);
    case 'assignedTo':
      return stringValue(
        row.assignedTo?.name || row.assignedTo?.email || row.assignedToName
      );
    case 'status':
      return stringValue(row.status);
    case 'createdAt':
      return dateValue(row.createdAt);
    case 'updatedAt':
      return dateValue(row.updatedAt);
    case 'accountType':
      return stringValue(row.accountType);
    case 'billingCycle':
      return stringValue(row.billingCycle);
    case 'website':
      return stringValue(row.website);
    default:
      return row[key];
  }
}

/** @param {Record<string, unknown>} row */
export function getContactSortValue(row, key) {
  switch (key) {
    case 'contact':
    case 'name':
      return stringValue(row.name || [row.firstName, row.lastName].filter(Boolean).join(' '));
    case 'email':
      return stringValue(row.email);
    case 'phone':
      return stringValue(row.phone || row.mobile);
    case 'role':
      return stringValue(row.role || row.jobTitle);
    case 'isPrimary':
      return row.isPrimaryContact ? 1 : 0;
    default:
      return row[key];
  }
}

/** @param {Record<string, unknown>} row */
export function getDealSortValue(row, key) {
  switch (key) {
    case 'deal':
    case 'name':
      return stringValue(row.name || row.dealName);
    case 'stage':
      return stringValue(row.stage || row.dealStage);
    case 'priority':
      return PRIORITY_ORDER[String(row.priority || '').toLowerCase()] ?? 0;
    case 'owner':
      return stringValue(
        row.assignedTo?.name || row.assignedTo?.email || row.ownerName
      );
    case 'value': {
      const n = Number(row.value ?? row.dealValue ?? row.amount);
      return Number.isFinite(n) ? n : null;
    }
    case 'expectedCloseDate':
      return dateValue(row.expectedCloseDate || row.closeDate);
    case 'createdAt':
      return dateValue(row.createdAt);
    default:
      return row[key];
  }
}

/** @param {Record<string, unknown>} row */
export function getInvoiceSortValue(row, key) {
  switch (key) {
    case 'invoice':
    case 'invoiceNumber':
      return stringValue(row.invoiceNumber || row.number);
    case 'status':
      return stringValue(row.status);
    case 'amount': {
      const n = Number(row.amount ?? row.total);
      return Number.isFinite(n) ? n : null;
    }
    case 'invoiceDate':
      return dateValue(row.invoiceDate || row.createdAt);
    case 'dueDate':
      return dateValue(row.dueDate);
    case 'deal':
      return stringValue(
        typeof row.deal === 'object' ? row.deal?.name : row.deal
      );
    case 'createdAt':
      return dateValue(row.createdAt);
    default:
      return row[key];
  }
}

/** @param {Record<string, unknown>} row */
export function getAccountProjectSortValue(row, key) {
  switch (key) {
    case 'project':
      return stringValue(row.name);
    case 'status':
      return PROJECT_STATUS_ORDER[row.strapiStatus ?? row.status] ?? stringValue(row.status);
    case 'manager':
      return stringValue(row.projectManager?.name || row.projectManager?.email);
    case 'budget': {
      const n = Number(row.budget);
      return Number.isFinite(n) ? n : null;
    }
    case 'dates':
      return dateValue(row.endDate || row.startDate);
    case 'tasks': {
      const total = Number(row.totalTasks ?? row.tasks?.length) || 0;
      const done = Number(row.completedTasks) || 0;
      return total > 0 ? done / total : Number(row.tasks?.length) || 0;
    }
    case 'sourceDeal':
      return stringValue(
        typeof row.sourceDeal === 'object' ? row.sourceDeal?.name : row.sourceDeal
      );
    default:
      return row[key];
  }
}

const VALUE_GETTERS = {
  task: getTaskSortValue,
  project: getProjectSortValue,
  clientAccount: getClientAccountSortValue,
  contact: getContactSortValue,
  deal: getDealSortValue,
  invoice: getInvoiceSortValue,
  accountProject: getAccountProjectSortValue,
};

/**
 * @param {keyof typeof VALUE_GETTERS} entity
 * @param {Record<string, unknown>} row
 * @param {string} key
 */
export function getPmSortValue(entity, row, key) {
  const fn = VALUE_GETTERS[entity];
  if (!fn) return row?.[key];
  return fn(row, key);
}
