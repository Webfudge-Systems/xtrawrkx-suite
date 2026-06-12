/** Sort value getters for CRM entities. */

const LEAD_STATUS_ORDER = {
  new:          1,
  contacted:    2,
  qualified:    3,
  proposal:     4,
  negotiation:  5,
  won:          6,
  lost:         7,
  inactive:     8,
};

const DEAL_STAGE_ORDER = {
  discovery:    1,
  qualification: 2,
  proposal:     3,
  negotiation:  4,
  won:          5,
  lost:         6,
};

const PRIORITY_ORDER = { high: 3, medium: 2, low: 1 };

function dateValue(v) {
  if (v == null || v === '') return null;
  const t = Date.parse(String(v));
  return Number.isFinite(t) ? t : null;
}

function stringValue(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function numValue(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Lead company row sort value. */
export function getLeadCompanySortValue(row, key) {
  switch (key) {
    case 'companyName':
      return stringValue(row.companyName || row.name);
    case 'status':
      return LEAD_STATUS_ORDER[String(row.status || '').toLowerCase()] ?? 99;
    case 'source':
      return stringValue(row.source);
    case 'dealValue':
      return numValue(row.dealValue);
    case 'contactsCount':
      return Array.isArray(row.contacts) ? row.contacts.length : numValue(row.contactsCount) ?? 0;
    case 'assignedTo':
      return stringValue(
        row.assignedTo?.name || row.assignedTo?.email ||
        [row.assignedTo?.firstName, row.assignedTo?.lastName].filter(Boolean).join(' ')
      );
    case 'type':
      return stringValue(row.type);
    case 'industry':
      return stringValue(row.industry);
    case 'score':
      return numValue(row.score);
    case 'healthScore':
      return numValue(row.healthScore);
    case 'city':
      return stringValue(row.city);
    case 'country':
      return stringValue(row.country);
    case 'createdAt':
      return dateValue(row.createdAt);
    case 'updatedAt':
      return dateValue(row.updatedAt);
    default:
      return row[key];
  }
}

/** Contact row sort value. */
export function getContactSortValue(row, key) {
  switch (key) {
    case 'name':
      return stringValue(
        [row.firstName, row.lastName].filter(Boolean).join(' ') ||
        row.name
      );
    case 'email':
      return stringValue(row.email);
    case 'phone':
      return stringValue(row.phone || row.mobile);
    case 'jobTitle':
      return stringValue(row.jobTitle || row.role);
    case 'company':
      return stringValue(
        row.companyName ||
        row.company ||
        row.leadCompany?.companyName ||
        row.leadCompany?.name
      );
    case 'source':
      return stringValue(row.source);
    case 'assignedTo':
      return stringValue(row.assignedTo?.name || row.assignedTo?.email);
    case 'city':
      return stringValue(row.city);
    case 'country':
      return stringValue(row.country);
    case 'createdAt':
      return dateValue(row.createdAt);
    case 'updatedAt':
      return dateValue(row.updatedAt);
    default:
      return row[key];
  }
}

/** Deal row sort value. */
export function getDealSortValue(row, key) {
  switch (key) {
    case 'deal':
      return stringValue(row.name || row.dealName);
    case 'value':
      return numValue(row.value ?? row.dealValue ?? row.amount);
    case 'stage':
      return DEAL_STAGE_ORDER[String(row.stage || '').toLowerCase()] ?? 99;
    case 'priority':
      return PRIORITY_ORDER[String(row.priority || '').toLowerCase()] ?? 0;
    case 'probability':
      return numValue(row.probability);
    case 'company':
      return stringValue(
        row.leadCompany?.companyName ||
        row.leadCompany?.name ||
        row.clientAccount?.companyName ||
        row.company
      );
    case 'owner':
      return stringValue(row.assignedTo?.name || row.assignedTo?.email);
    case 'expectedCloseDate':
      return dateValue(row.expectedCloseDate || row.closeDate);
    case 'createdAt':
      return dateValue(row.createdAt);
    case 'updatedAt':
      return dateValue(row.updatedAt);
    default:
      return row[key];
  }
}

const VALUE_GETTERS = {
  leadCompany: getLeadCompanySortValue,
  contact:     getContactSortValue,
  deal:        getDealSortValue,
};

/**
 * @param {'leadCompany' | 'contact' | 'deal'} entity
 * @param {Record<string, unknown>} row
 * @param {string} key
 */
export function getCrmSortValue(entity, row, key) {
  const fn = VALUE_GETTERS[entity];
  if (!fn) return row?.[key];
  return fn(row, key);
}
