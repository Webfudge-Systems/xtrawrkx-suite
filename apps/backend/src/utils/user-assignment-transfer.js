'use strict';

const ORG_MEMBERSHIP_UID = 'api::organization-user.organization-user';
const ORG_UID = 'api::organization.organization';
const DEPARTMENT_UID = 'api::department.department';
const TEAM_UID = 'api::team.team';

function relationUserId(rel) {
  if (rel == null || rel === '') return null;
  if (typeof rel === 'number') return rel;
  return rel.id ?? null;
}

async function assertActiveOrgMember(strapi, organizationId, userId, label) {
  const rows = await strapi.entityService.findMany(ORG_MEMBERSHIP_UID, {
    filters: { organization: organizationId, user: userId, isActive: true },
    limit: 1,
  });
  if (!rows.length) {
    throw new Error(`${label} is not an active member of this organization`);
  }
}

async function transferManyToOne(strapi, uid, organizationId, field, fromUserId, toUserId) {
  const rows = await strapi.entityService.findMany(uid, {
    filters: { organization: organizationId, [field]: fromUserId },
    fields: ['id'],
    limit: 10000,
  });

  for (const row of rows) {
    await strapi.entityService.update(uid, row.id, {
      data: { [field]: toUserId },
    });
  }

  return rows.length;
}

async function transferManyToManyUserField(strapi, uid, organizationId, field, fromUserId, toUserId) {
  const rows = await strapi.entityService.findMany(uid, {
    filters: {
      organization: organizationId,
      [field]: { id: fromUserId },
    },
    populate: [field],
    limit: 10000,
  });

  for (const row of rows) {
    const current = Array.isArray(row[field]) ? row[field] : row[field] ? [row[field]] : [];
    const ids = [...new Set(current.map(relationUserId).filter((id) => id != null))];
    const withoutFrom = ids.filter((id) => Number(id) !== Number(fromUserId));
    const nextIds = withoutFrom.some((id) => Number(id) === Number(toUserId))
      ? withoutFrom
      : [...withoutFrom, toUserId];

    await strapi.entityService.update(uid, row.id, {
      data: { [field]: { set: nextIds } },
    });
  }

  return rows.length;
}

async function removeUserFromManyToMany(strapi, uid, organizationId, field, userId) {
  const rows = await strapi.entityService.findMany(uid, {
    filters: {
      organization: organizationId,
      [field]: { id: userId },
    },
    populate: [field],
    limit: 10000,
  });

  for (const row of rows) {
    const current = Array.isArray(row[field]) ? row[field] : row[field] ? [row[field]] : [];
    const ids = [...new Set(current.map(relationUserId).filter((id) => id != null))];
    const nextIds = ids.filter((id) => Number(id) !== Number(userId));

    await strapi.entityService.update(uid, row.id, {
      data: { [field]: { set: nextIds } },
    });
  }

  return rows.length;
}

/**
 * Reassign CRM, PM, org-structure, and books ownership fields from one org member to another.
 * @returns {Promise<Record<string, number>>} counts per entity group
 */
async function transferUserAssignments(strapi, { organizationId, fromUserId, toUserId }) {
  const fromId = Number.parseInt(String(fromUserId), 10);
  const toId = Number.parseInt(String(toUserId), 10);
  if (!Number.isFinite(fromId) || !Number.isFinite(toId)) {
    throw new Error('Invalid user id for assignment transfer');
  }
  if (fromId === toId) {
    throw new Error('Transfer target must be a different user');
  }

  await assertActiveOrgMember(strapi, organizationId, fromId, 'Source user');
  await assertActiveOrgMember(strapi, organizationId, toId, 'Transfer target user');

  const counts = {};

  const crmEntities = [
    ['api::lead-company.lead-company', 'assignedTo', 'leads'],
    ['api::contact.contact', 'assignedTo', 'contacts'],
    ['api::deal.deal', 'assignedTo', 'deals'],
    ['api::client-account.client-account', 'assignedTo', 'clientAccounts'],
    ['api::proposal.proposal', 'assignedTo', 'proposals'],
    ['api::meeting.meeting', 'assignedTo', 'meetingsAssigned'],
    ['api::meeting.meeting', 'organizer', 'meetingsOrganized'],
    ['api::invoice.invoice', 'assignedTo', 'invoices'],
  ];

  for (const [uid, field, key] of crmEntities) {
    counts[key] = await transferManyToOne(strapi, uid, organizationId, field, fromId, toId);
  }

  counts.projectsAsManager = await transferManyToOne(
    strapi,
    'api::project.project',
    organizationId,
    'projectManager',
    fromId,
    toId
  );
  counts.projectTeamMemberships = await transferManyToManyUserField(
    strapi,
    'api::project.project',
    organizationId,
    'teamMembers',
    fromId,
    toId
  );

  const taskFields = [
    ['assignee', 'tasksAsAssignee'],
    ['assigner', 'tasksAsAssigner'],
    ['assignmentRequestedBy', 'tasksAssignmentRequestedBy'],
  ];
  for (const [field, key] of taskFields) {
    counts[key] = await transferManyToOne(
      strapi,
      'api::task.task',
      organizationId,
      field,
      fromId,
      toId
    );
  }
  counts.taskCollaborators = await transferManyToManyUserField(
    strapi,
    'api::task.task',
    organizationId,
    'collaborators',
    fromId,
    toId
  );
  counts.taskPendingCollaborators = await transferManyToManyUserField(
    strapi,
    'api::task.task',
    organizationId,
    'pendingCollaborators',
    fromId,
    toId
  );

  try {
    counts.departmentsAsLead = await transferManyToOne(
      strapi,
      DEPARTMENT_UID,
      organizationId,
      'lead',
      fromId,
      toId
    );
  } catch (_) {
    counts.departmentsAsLead = 0;
  }

  try {
    counts.teamsAsLeader = await transferManyToOne(strapi, TEAM_UID, organizationId, 'leader', fromId, toId);
    counts.teamMemberships = await transferManyToManyUserField(
      strapi,
      TEAM_UID,
      organizationId,
      'members',
      fromId,
      toId
    );
  } catch (_) {
    counts.teamsAsLeader = 0;
    counts.teamMemberships = 0;
  }

  const org = await strapi.entityService.findOne(ORG_UID, organizationId, {
    fields: ['id'],
    populate: { owner: { fields: ['id'] } },
  });
  if (relationUserId(org?.owner) === fromId) {
    await strapi.entityService.update(ORG_UID, organizationId, {
      data: { owner: toId },
    });
    counts.organizationOwner = 1;
  } else {
    counts.organizationOwner = 0;
  }

  return counts;
}

/**
 * Remove a user from org-structure membership lists after they leave the organization.
 */
async function removeUserFromOrgStructure(strapi, { organizationId, userId }) {
  const uid = Number.parseInt(String(userId), 10);
  if (!Number.isFinite(uid)) return {};

  const counts = {};
  try {
    counts.teamMemberships = await removeUserFromManyToMany(
      strapi,
      TEAM_UID,
      organizationId,
      'members',
      uid
    );
  } catch (_) {
    counts.teamMemberships = 0;
  }

  try {
    const leadDepartments = await strapi.entityService.findMany(DEPARTMENT_UID, {
      filters: { organization: organizationId, lead: uid },
      fields: ['id'],
      limit: 1000,
    });
    for (const dept of leadDepartments) {
      await strapi.entityService.update(DEPARTMENT_UID, dept.id, {
        data: { lead: null },
      });
    }
    counts.departmentsClearedLead = leadDepartments.length;
  } catch (_) {
    counts.departmentsClearedLead = 0;
  }

  try {
    const leadTeams = await strapi.entityService.findMany(TEAM_UID, {
      filters: { organization: organizationId, leader: uid },
      fields: ['id'],
      limit: 1000,
    });
    for (const team of leadTeams) {
      await strapi.entityService.update(TEAM_UID, team.id, {
        data: { leader: null },
      });
    }
    counts.teamsClearedLeader = leadTeams.length;
  } catch (_) {
    counts.teamsClearedLeader = 0;
  }

  return counts;
}

module.exports = {
  transferUserAssignments,
  removeUserFromOrgStructure,
  assertActiveOrgMember,
};
