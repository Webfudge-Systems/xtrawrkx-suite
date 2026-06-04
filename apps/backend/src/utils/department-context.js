'use strict';

const DEPARTMENT_UID = 'api::department.department';
const ORG_USER_UID = 'api::organization-user.organization-user';

function normalizeIdList(raw) {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  const ids = [];
  for (const item of list) {
    const id =
      typeof item === 'object' && item != null
        ? item.id ?? item.documentId
        : Number.parseInt(String(item), 10);
    if (id && !Number.isNaN(id) && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function departmentIdsFromMembership(membership) {
  const raw = membership?.departments;
  const list = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  return list
    .map((d) => (typeof d === 'object' && d != null ? d.id : Number(d)))
    .filter((id) => id && !Number.isNaN(id));
}

function primaryDepartmentIdFromMembership(membership) {
  const primary = membership?.primaryDepartment;
  if (typeof primary === 'object' && primary?.id) return primary.id;
  if (primary != null && primary !== '') return Number(primary);
  const fromList = departmentIdsFromMembership(membership);
  return fromList[0] ?? null;
}

/**
 * Validate department ids belong to the given organization.
 * @returns {Promise<number[]>} normalized ids
 */
async function validateDepartmentsInOrg(strapi, orgId, departmentIds) {
  const ids = normalizeIdList(departmentIds);
  if (!ids.length) return [];

  const rows = await strapi.entityService.findMany(DEPARTMENT_UID, {
    filters: { id: { $in: ids }, organization: orgId },
    fields: ['id'],
    limit: ids.length,
  });
  const found = new Set((rows || []).map((r) => r.id));
  const missing = ids.filter((id) => !found.has(id));
  if (missing.length) {
    throw new Error('One or more departments are invalid for this organization');
  }
  return ids;
}

/**
 * Persist departments + optional primary on organization-user membership.
 */
async function applyMembershipDepartments(strapi, membershipId, orgId, { departmentIds, primaryDepartmentId } = {}) {
  const ids = await validateDepartmentsInOrg(strapi, orgId, departmentIds);
  let primary = primaryDepartmentId != null ? Number(primaryDepartmentId) : null;
  if (primary && !ids.includes(primary)) {
    throw new Error('Primary department must be included in assigned departments');
  }
  if (!primary && ids.length) primary = ids[0];

  const data = {
    departments: { set: ids },
    primaryDepartment: primary || null,
  };

  return strapi.entityService.update(ORG_USER_UID, membershipId, {
    data,
    populate: {
      departments: { fields: ['id', 'name', 'isActive'] },
      primaryDepartment: { fields: ['id', 'name'] },
    },
  });
}

function leadUserIdFromDepartment(department) {
  const lead = department?.lead;
  if (typeof lead === 'object' && lead?.id != null) return lead.id;
  if (lead != null && lead !== '') return Number.parseInt(String(lead), 10);
  return null;
}

function orgIdFromDepartment(department) {
  const org = department?.organization;
  if (typeof org === 'object' && org?.id != null) return org.id;
  if (org != null && org !== '') return Number.parseInt(String(org), 10);
  return null;
}

/**
 * When a user is assigned as department lead, ensure their org membership includes that department.
 */
async function syncDepartmentLeadToMembership(strapi, department) {
  const departmentId = department?.id;
  const orgId = orgIdFromDepartment(department);
  const leadUserId = leadUserIdFromDepartment(department);
  if (!departmentId || !orgId || !leadUserId) return { updated: false };

  const memberships = await strapi.entityService.findMany(ORG_USER_UID, {
    filters: { user: leadUserId, organization: orgId, isActive: true },
    limit: 1,
    populate: {
      departments: { fields: ['id', 'name', 'isActive'] },
      primaryDepartment: { fields: ['id', 'name'] },
    },
  });
  if (!memberships.length) return { updated: false };

  const membership = memberships[0];
  const existingIds = departmentIdsFromMembership(membership);
  if (existingIds.includes(departmentId)) return { updated: false };

  const nextIds = [...existingIds, departmentId];
  const primary =
    primaryDepartmentIdFromMembership(membership) || departmentId;

  await applyMembershipDepartments(strapi, membership.id, orgId, {
    departmentIds: nextIds,
    primaryDepartmentId: primary,
  });
  return { updated: true };
}

function departmentsPayload(membership) {
  const raw = membership?.departments;
  const list = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  const departments = [];
  for (const d of list) {
    if (d && typeof d === 'object' && d.id != null) {
      departments.push({
        id: d.id,
        name: d.name || '',
        isActive: d.isActive !== false,
      });
      continue;
    }
    const id = Number.parseInt(String(d), 10);
    if (Number.isFinite(id) && id > 0) {
      departments.push({ id, name: '', isActive: true });
    }
  }
  const primaryDepartmentId = primaryDepartmentIdFromMembership(membership);
  return { departments, primaryDepartmentId };
}

/**
 * When X-Department-Id is active, scope list filters to that department.
 */
function mergeDepartmentScopeFilter(filters, departmentId) {
  if (!departmentId) return filters;
  return { ...filters, department: departmentId };
}

/**
 * Resolve whether the user may use this department in the active org.
 */
async function resolveDepartmentContext(strapi, ctx) {
  const departmentHeader = ctx.request?.headers?.['x-department-id'];
  if (!departmentHeader) return;

  const departmentId = Number.parseInt(String(departmentHeader), 10);
  if (!departmentId || Number.isNaN(departmentId)) return;

  const orgId = ctx.state.orgId;
  if (!orgId) return;

  const dept = await strapi.entityService.findOne(DEPARTMENT_UID, departmentId, {
    fields: ['id', 'name', 'isActive'],
    populate: ['organization'],
  });
  if (!dept) return;

  const deptOrgId =
    typeof dept.organization === 'object' ? dept.organization?.id : dept.organization;
  if (Number(deptOrgId) !== Number(orgId)) return;

  if (ctx.state.platformAdminContext) {
    ctx.state.departmentId = departmentId;
    ctx.state.department = dept;
    return;
  }

  const membership = ctx.state.orgMembership;
  if (!membership) return;

  const assigned = departmentIdsFromMembership(membership);
  if (assigned.length === 0) {
    ctx.state.departmentId = departmentId;
    ctx.state.department = dept;
    return;
  }

  if (assigned.includes(departmentId)) {
    ctx.state.departmentId = departmentId;
    ctx.state.department = dept;
  }
}

module.exports = {
  DEPARTMENT_UID,
  applyMembershipDepartments,
  departmentIdsFromMembership,
  departmentsPayload,
  leadUserIdFromDepartment,
  mergeDepartmentScopeFilter,
  normalizeIdList,
  orgIdFromDepartment,
  primaryDepartmentIdFromMembership,
  resolveDepartmentContext,
  syncDepartmentLeadToMembership,
  validateDepartmentsInOrg,
};
