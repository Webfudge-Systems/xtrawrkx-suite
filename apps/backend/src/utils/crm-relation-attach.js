'use strict';

/**
 * Hydrate Strapi relations via `_lnk` join tables when entityService populate fails (Strapi 5).
 * Pattern established for lead-company ↔ contacts; reused across CRM + PM list endpoints.
 */

const USER_UID = 'plugin::users-permissions.user';
const LEAD_UID = 'api::lead-company.lead-company';
const CONTACT_UID = 'api::contact.contact';

function numericIds(rows, key = 'id') {
  return [
    ...new Set(
      (rows || [])
        .map((r) => r?.[key])
        .filter((id) => id != null)
        .map((id) => parseInt(id, 10))
        .filter((n) => !Number.isNaN(n))
    ),
  ];
}

async function loadLinkRows(knex, table, entityCol, entityIds, selectCols) {
  if (!entityIds.length) return [];
  return knex(table).whereIn(entityCol, entityIds).select(selectCols);
}

async function loadEntitiesByIds(strapi, uid, ids, orgId) {
  if (!ids.length) return [];
  const filters = { id: { $in: ids } };
  if (orgId != null) filters.organization = orgId;
  return strapi.entityService.findMany(uid, {
    filters,
    limit: Math.min(ids.length, 5000),
  });
}

async function loadUsersByIds(strapi, userIds) {
  const ids = [...new Set(userIds.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n)))];
  if (!ids.length) return [];
  return strapi.entityService.findMany(USER_UID, {
    filters: { id: { $in: ids } },
    limit: Math.min(ids.length, 500),
  });
}

function mapById(rows) {
  return new Map((rows || []).map((r) => [r.id, r]));
}

function mapUsersById(users) {
  return mapById(users);
}

function normalizeFilterScalar(value) {
  if (value == null) return null;
  if (Array.isArray(value)) return value.length ? normalizeFilterScalar(value[0]) : null;
  if (typeof value === 'object') {
    if (value.$eq != null) return normalizeFilterScalar(value.$eq);
    if (value.id != null) return normalizeFilterScalar(value.id);
    return null;
  }
  return value;
}

/** Extract assignee user id from Strapi relation filters. */
function assignedToUserIdFromFilters(extra) {
  const at = extra?.assignedTo;
  if (at == null) return null;
  if (typeof at === 'number' || typeof at === 'string') return at;
  if (at.$eq != null) return normalizeFilterScalar(at.$eq);
  if (at.id != null) return normalizeFilterScalar(at.id);
  return null;
}

/**
 * Resolve lead company ids assigned to a user via `_lnk` (entityService assignedTo filter is unreliable in Strapi 5).
 * @returns {Promise<number[]>}
 */
async function leadCompanyIdsForAssignedUser(strapi, userId) {
  const uid = parseInt(userId, 10);
  if (Number.isNaN(uid)) return [];
  try {
    const knex = strapi.db.connection;
    const rows = await knex('lead_companies_assigned_to_lnk')
      .where('user_id', uid)
      .select('lead_company_id');
    return rows.map((r) => r.lead_company_id).filter((id) => id != null);
  } catch (err) {
    strapi.log.warn('leadCompanyIdsForAssignedUser: %s', err?.message || String(err));
    return [];
  }
}

/** lead company list — contacts[], assignedTo */
async function attachRelationsToLeadCompanies(strapi, orgId, leadCompanies) {
  if (!leadCompanies?.length) return leadCompanies;

  const leadIds = numericIds(leadCompanies);
  if (!leadIds.length) return leadCompanies;

  const knex = strapi.db.connection;

  try {
    const [contactLinks, assignLinks] = await Promise.all([
      loadLinkRows(knex, 'contacts_lead_company_lnk', 'lead_company_id', leadIds, [
        'contact_id',
        'lead_company_id',
      ]),
      loadLinkRows(knex, 'lead_companies_assigned_to_lnk', 'lead_company_id', leadIds, [
        'lead_company_id',
        'user_id',
      ]),
    ]);

    const contactIds = [...new Set(contactLinks.map((l) => l.contact_id))];
    const userIds = assignLinks.map((l) => l.user_id).filter(Boolean);

    const [contacts, users] = await Promise.all([
      contactIds.length
        ? loadEntitiesByIds(strapi, CONTACT_UID, contactIds, orgId)
        : [],
      loadUsersByIds(strapi, userIds),
    ]);

    const contactById = mapById(contacts);
    const userById = mapUsersById(users);

    const contactsByLead = new Map();
    for (const link of contactLinks) {
      const contact = contactById.get(link.contact_id);
      if (!contact) continue;
      const k = String(link.lead_company_id);
      if (!contactsByLead.has(k)) contactsByLead.set(k, []);
      contactsByLead.get(k).push(contact);
    }
    for (const list of contactsByLead.values()) {
      list.sort((a, b) => Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact));
    }

    const userByLead = new Map(
      assignLinks.map((l) => [String(l.lead_company_id), userById.get(l.user_id) ?? null])
    );

    return leadCompanies.map((row) => {
      const key = String(row.id);
      const linkedContacts = contactsByLead.get(key);
      const linkedOwner = userByLead.get(key);
      return {
        ...row,
        contacts: linkedContacts?.length ? linkedContacts : row.contacts ?? [],
        assignedTo: linkedOwner ?? row.assignedTo ?? null,
      };
    });
  } catch (err) {
    strapi.log.warn('attachRelationsToLeadCompanies: %s', err?.message || String(err));
    return leadCompanies;
  }
}

/** contact list — leadCompany, clientAccount, assignedTo */
async function attachRelationsToContacts(strapi, orgId, contacts) {
  if (!contacts?.length) return contacts;
  const contactIds = numericIds(contacts);
  if (!contactIds.length) return contacts;

  const knex = strapi.db.connection;
  const LEAD_UID = 'api::lead-company.lead-company';
  const CLIENT_UID = 'api::client-account.client-account';

  try {
    const [leadLinks, clientLinks, assignLinks] = await Promise.all([
      loadLinkRows(knex, 'contacts_lead_company_lnk', 'contact_id', contactIds, [
        'contact_id',
        'lead_company_id',
      ]),
      loadLinkRows(knex, 'contacts_client_account_lnk', 'contact_id', contactIds, [
        'contact_id',
        'client_account_id',
      ]),
      loadLinkRows(knex, 'contacts_assigned_to_lnk', 'contact_id', contactIds, [
        'contact_id',
        'user_id',
      ]),
    ]);

    const leadIds = [...new Set(leadLinks.map((l) => l.lead_company_id))];
    const clientIds = [...new Set(clientLinks.map((l) => l.client_account_id))];

    const [leadAssignLinks, clientAssignLinks] = await Promise.all([
      leadIds.length
        ? loadLinkRows(knex, 'lead_companies_assigned_to_lnk', 'lead_company_id', leadIds, [
            'lead_company_id',
            'user_id',
          ])
        : [],
      clientIds.length
        ? loadLinkRows(knex, 'client_accounts_assigned_to_lnk', 'client_account_id', clientIds, [
            'client_account_id',
            'user_id',
          ])
        : [],
    ]);

    const userIds = [
      ...assignLinks.map((l) => l.user_id),
      ...leadAssignLinks.map((l) => l.user_id),
      ...clientAssignLinks.map((l) => l.user_id),
    ].filter(Boolean);

    const [leads, clients, users] = await Promise.all([
      loadEntitiesByIds(strapi, LEAD_UID, leadIds, orgId),
      loadEntitiesByIds(strapi, CLIENT_UID, clientIds, orgId),
      loadUsersByIds(strapi, userIds),
    ]);

    const leadById = mapById(leads);
    const clientById = mapById(clients);
    const userById = mapUsersById(users);

    const leadAssignByLead = new Map(
      leadAssignLinks.map((l) => [l.lead_company_id, userById.get(l.user_id) ?? null])
    );
    const clientAssignByClient = new Map(
      clientAssignLinks.map((l) => [l.client_account_id, userById.get(l.user_id) ?? null])
    );

    const leadByContact = new Map(
      leadLinks.map((l) => [l.contact_id, leadById.get(l.lead_company_id)])
    );
    const clientByContact = new Map(
      clientLinks.map((l) => [l.contact_id, clientById.get(l.client_account_id)])
    );
    const userByContact = new Map(
      assignLinks.map((l) => [l.contact_id, userById.get(l.user_id) ?? null])
    );

    return contacts.map((row) => {
      const lead = leadByContact.get(row.id) ?? row.leadCompany ?? null;
      const client = clientByContact.get(row.id) ?? row.clientAccount ?? null;
      const leadOwner = lead?.id != null ? leadAssignByLead.get(lead.id) ?? null : null;
      const clientOwner = client?.id != null ? clientAssignByClient.get(client.id) ?? null : null;
      const directOwner = userByContact.get(row.id) ?? row.assignedTo ?? null;
      const assignedTo = directOwner || leadOwner || clientOwner || null;

      const leadCompany =
        lead != null ? { ...lead, assignedTo: leadOwner ?? lead.assignedTo ?? null } : null;
      const clientAccount =
        client != null
          ? { ...client, assignedTo: clientOwner ?? client.assignedTo ?? null }
          : null;

      const scalarCompany = String(row.companyName || '').trim();
      const companyName =
        scalarCompany ||
        leadCompany?.companyName ||
        clientAccount?.companyName ||
        row.companyName ||
        null;

      return {
        ...row,
        companyName,
        leadCompany,
        clientAccount,
        assignedTo,
      };
    });
  } catch (err) {
    strapi.log.warn('attachRelationsToContacts: %s', err?.message || String(err));
    return contacts;
  }
}

/** client account list — contacts[], assignedTo */
async function attachRelationsToClientAccounts(strapi, orgId, accounts) {
  if (!accounts?.length) return accounts;
  const accountIds = numericIds(accounts);
  if (!accountIds.length) return accounts;

  const knex = strapi.db.connection;
  const CONTACT_UID = 'api::contact.contact';

  try {
    const [contactLinks, assignLinks] = await Promise.all([
      loadLinkRows(knex, 'contacts_client_account_lnk', 'client_account_id', accountIds, [
        'contact_id',
        'client_account_id',
      ]),
      loadLinkRows(knex, 'client_accounts_assigned_to_lnk', 'client_account_id', accountIds, [
        'client_account_id',
        'user_id',
      ]),
    ]);

    const contactIds = [...new Set(contactLinks.map((l) => l.contact_id))];
    const userIds = assignLinks.map((l) => l.user_id).filter(Boolean);

    const [contacts, users] = await Promise.all([
      loadEntitiesByIds(strapi, CONTACT_UID, contactIds, orgId),
      loadUsersByIds(strapi, userIds),
    ]);

    const contactById = mapById(contacts);
    const userById = mapUsersById(users);

    const contactsByAccount = new Map();
    for (const link of contactLinks) {
      const contact = contactById.get(link.contact_id);
      if (!contact) continue;
      const k = String(link.client_account_id);
      if (!contactsByAccount.has(k)) contactsByAccount.set(k, []);
      contactsByAccount.get(k).push(contact);
    }
    for (const list of contactsByAccount.values()) {
      list.sort((a, b) => Number(!!b.isPrimaryContact) - Number(!!a.isPrimaryContact));
    }

    const userByAccount = new Map(
      assignLinks.map((l) => [String(l.client_account_id), userById.get(l.user_id)])
    );

    return accounts.map((row) => ({
      ...row,
      contacts: contactsByAccount.get(String(row.id)) ?? row.contacts ?? [],
      assignedTo: userByAccount.get(String(row.id)) ?? row.assignedTo ?? null,
    }));
  } catch (err) {
    strapi.log.warn('attachRelationsToClientAccounts: %s', err?.message || String(err));
    return accounts;
  }
}

/** deal list — assignedTo, leadCompany, clientAccount, contact */
async function attachRelationsToDeals(strapi, orgId, deals) {
  if (!deals?.length) return deals;
  const dealIds = numericIds(deals);
  if (!dealIds.length) return deals;

  const knex = strapi.db.connection;
  const LEAD_UID = 'api::lead-company.lead-company';
  const CLIENT_UID = 'api::client-account.client-account';
  const CONTACT_UID = 'api::contact.contact';

  try {
    const [assignLinks, leadLinks, clientLinks, contactLinks] = await Promise.all([
      loadLinkRows(knex, 'deals_assigned_to_lnk', 'deal_id', dealIds, ['deal_id', 'user_id']),
      loadLinkRows(knex, 'deals_lead_company_lnk', 'deal_id', dealIds, [
        'deal_id',
        'lead_company_id',
      ]),
      loadLinkRows(knex, 'deals_client_account_lnk', 'deal_id', dealIds, [
        'deal_id',
        'client_account_id',
      ]).catch(() => []),
      loadLinkRows(knex, 'deals_contact_lnk', 'deal_id', dealIds, ['deal_id', 'contact_id']).catch(
        () => []
      ),
    ]);

    const userIds = assignLinks.map((l) => l.user_id).filter(Boolean);
    const leadIds = [...new Set(leadLinks.map((l) => l.lead_company_id))];
    const clientIds = [...new Set(clientLinks.map((l) => l.client_account_id))];
    const contactIds = [...new Set(contactLinks.map((l) => l.contact_id))];

    const [users, leads, clients, contacts] = await Promise.all([
      loadUsersByIds(strapi, userIds),
      loadEntitiesByIds(strapi, LEAD_UID, leadIds, orgId),
      loadEntitiesByIds(strapi, CLIENT_UID, clientIds, orgId),
      loadEntitiesByIds(strapi, CONTACT_UID, contactIds, orgId),
    ]);

    const userById = mapUsersById(users);
    const leadById = mapById(leads);
    const clientById = mapById(clients);
    const contactById = mapById(contacts);

    const userByDeal = new Map(assignLinks.map((l) => [l.deal_id, userById.get(l.user_id)]));
    const leadByDeal = new Map(leadLinks.map((l) => [l.deal_id, leadById.get(l.lead_company_id)]));
    const clientByDeal = new Map(
      clientLinks.map((l) => [l.deal_id, clientById.get(l.client_account_id)])
    );
    const contactByDeal = new Map(
      contactLinks.map((l) => [l.deal_id, contactById.get(l.contact_id)])
    );

    return deals.map((row) => ({
      ...row,
      assignedTo: userByDeal.get(row.id) ?? row.assignedTo ?? null,
      leadCompany: leadByDeal.get(row.id) ?? row.leadCompany ?? null,
      clientAccount: clientByDeal.get(row.id) ?? row.clientAccount ?? null,
      contact: contactByDeal.get(row.id) ?? row.contact ?? null,
    }));
  } catch (err) {
    strapi.log.warn('attachRelationsToDeals: %s', err?.message || String(err));
    return deals;
  }
}

/** project list — projectManager, teamMembers */
async function attachRelationsToProjects(strapi, orgId, projects) {
  if (!projects?.length) return projects;
  const projectIds = numericIds(projects);
  if (!projectIds.length) return projects;

  const knex = strapi.db.connection;

  try {
    const [pmLinks, teamLinks] = await Promise.all([
      loadLinkRows(knex, 'projects_project_manager_lnk', 'project_id', projectIds, [
        'project_id',
        'user_id',
      ]),
      loadLinkRows(knex, 'projects_team_members_lnk', 'project_id', projectIds, [
        'project_id',
        'user_id',
      ]).catch(() => []),
    ]);

    const userIds = [
      ...new Set(
        [...pmLinks, ...teamLinks].map((l) => l.user_id).filter(Boolean)
      ),
    ];
    const users = await loadUsersByIds(strapi, userIds);
    const userById = mapUsersById(users);

    const pmByProject = new Map(pmLinks.map((l) => [l.project_id, userById.get(l.user_id)]));
    const teamByProject = new Map();
    for (const link of teamLinks) {
      const user = userById.get(link.user_id);
      if (!user) continue;
      if (!teamByProject.has(link.project_id)) teamByProject.set(link.project_id, []);
      teamByProject.get(link.project_id).push(user);
    }

    return projects.map((row) => ({
      ...row,
      projectManager: pmByProject.get(row.id) ?? row.projectManager ?? null,
      teamMembers: teamByProject.get(row.id) ?? (Array.isArray(row.teamMembers) ? row.teamMembers : []),
    }));
  } catch (err) {
    strapi.log.warn('attachRelationsToProjects: %s', err?.message || String(err));
    return projects;
  }
}

/** task list — assignee, assigner, collaborators */
async function attachRelationsToTasks(strapi, orgId, tasks) {
  if (!tasks?.length) return tasks;
  const taskIds = numericIds(tasks);
  if (!taskIds.length) return tasks;

  const knex = strapi.db.connection;

  try {
    const [assigneeLinks, assignerLinks, collabLinks] = await Promise.all([
      loadLinkRows(knex, 'tasks_assignee_lnk', 'task_id', taskIds, ['task_id', 'user_id']),
      loadLinkRows(knex, 'tasks_assigner_lnk', 'task_id', taskIds, ['task_id', 'user_id']),
      loadLinkRows(knex, 'tasks_collaborators_lnk', 'task_id', taskIds, [
        'task_id',
        'user_id',
      ]).catch(() => []),
    ]);

    const userIds = [
      ...new Set(
        [...assigneeLinks, ...assignerLinks, ...collabLinks]
          .map((l) => l.user_id)
          .filter(Boolean)
      ),
    ];
    const users = await loadUsersByIds(strapi, userIds);
    const userById = mapUsersById(users);

    const assigneeByTask = new Map(
      assigneeLinks.map((l) => [l.task_id, userById.get(l.user_id)])
    );
    const assignerByTask = new Map(
      assignerLinks.map((l) => [l.task_id, userById.get(l.user_id)])
    );
    const collabByTask = new Map();
    for (const link of collabLinks) {
      const user = userById.get(link.user_id);
      if (!user) continue;
      if (!collabByTask.has(link.task_id)) collabByTask.set(link.task_id, []);
      collabByTask.get(link.task_id).push(user);
    }

    return tasks.map((row) => ({
      ...row,
      assignee: assigneeByTask.get(row.id) ?? row.assignee ?? null,
      assigner: assignerByTask.get(row.id) ?? row.assigner ?? null,
      collaborators: collabByTask.get(row.id) ?? row.collaborators ?? [],
    }));
  } catch (err) {
    strapi.log.warn('attachRelationsToTasks: %s', err?.message || String(err));
    return tasks;
  }
}

module.exports = {
  assignedToUserIdFromFilters,
  leadCompanyIdsForAssignedUser,
  attachRelationsToLeadCompanies,
  attachRelationsToContacts,
  attachRelationsToClientAccounts,
  attachRelationsToDeals,
  attachRelationsToProjects,
  attachRelationsToTasks,
};
