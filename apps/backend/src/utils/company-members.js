'use strict';

const CONTACT_UID = 'api::contact.contact';
const PORTAL_ACCESS_UID = 'api::client-portal-access.client-portal-access';
const CLIENT_ACCOUNT_UID = 'api::client-account.client-account';

const BASE_PORTAL_ROLES = [
  'ADMIN',
  'MANAGER',
  'DEVELOPER',
  'DEVOPS_ENGINEER',
  'UX_DESIGNER',
];

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function mapAccessLevel(accessLevel) {
  switch (accessLevel) {
    case 'upload':
      return 'FULL_ACCESS';
    case 'comment':
      return 'STANDARD_ACCESS';
    case 'view':
    default:
      return 'READ_ONLY';
  }
}

function portalAccessLevelToEnum(level) {
  switch (String(level || '').toUpperCase()) {
    case 'FULL_ACCESS':
      return 'upload';
    case 'STANDARD_ACCESS':
      return 'comment';
    case 'PROJECT_VIEW':
    case 'INVOICE_VIEW':
    case 'READ_ONLY':
    case 'BILLING_ONLY':
    case 'NO_ACCESS':
    default:
      return 'view';
  }
}

function enumToPortalAccessLevel(accessLevel, permissions) {
  if (
    permissions &&
    typeof permissions === 'object' &&
    typeof permissions.portalAccessLevel === 'string'
  ) {
    return permissions.portalAccessLevel;
  }
  return mapAccessLevel(accessLevel);
}

function resolvePortalAccessLevel(portalAccess, contact) {
  const level = enumToPortalAccessLevel(
    portalAccess?.accessLevel,
    portalAccess?.permissions
  );
  if (contact?.isPrimaryContact && level === 'READ_ONLY') {
    return 'FULL_ACCESS';
  }
  return level;
}

function portalAccessTierLabel(level) {
  switch (String(level || '').toUpperCase()) {
    case 'FULL_ACCESS':
      return 'Admin';
    case 'STANDARD_ACCESS':
      return 'Manager';
    case 'READ_ONLY':
    default:
      return 'Member';
  }
}

function formatContactRoleLabel(role, isPrimaryContact) {
  if (isPrimaryContact) return 'Primary Contact';
  const key = String(role || 'MEMBER').toUpperCase().replaceAll(' ', '_');
  const labels = {
    ADMIN: 'Primary Contact',
    MANAGER: 'Admin / Manager',
    DEVELOPER: 'Developer',
    DEVOPS_ENGINEER: 'DevOps Engineer',
    UX_DESIGNER: 'UX Designer',
    PRIMARY_CONTACT: 'Primary Contact',
    MEMBER: 'Member',
  };
  return labels[key] || key.replaceAll('_', ' ');
}

async function findPortalAccessForContact(strapi, contactId) {
  return strapi.db.query(PORTAL_ACCESS_UID).findMany({
    where: { contact: contactId },
    limit: 5,
    orderBy: { updatedAt: 'desc' },
  });
}

async function loadClientAccount(strapi, clientAccountId) {
  if (!clientAccountId) return null;
  return strapi.entityService.findOne(CLIENT_ACCOUNT_UID, clientAccountId, {
    populate: ['organization'],
  });
}

function orgIdFromAccount(account) {
  if (!account?.organization) return null;
  if (typeof account.organization === 'object') {
    return account.organization.id ?? account.organization.documentId ?? null;
  }
  return account.organization;
}

function canManageMembers(session) {
  const contact = session?.contact;
  if (!contact) return false;

  const access = contact.portalAccess;
  const level = contact.portalAccessLevel;
  const role = String(contact.role || access?.roleName || '').toUpperCase();

  return (
    Boolean(contact.isPrimaryContact) ||
    level === 'FULL_ACCESS' ||
    role === 'ADMIN' ||
    role === 'PRIMARY_CONTACT' ||
    role === 'MANAGER'
  );
}

function serializeMember(contact, portalAccess) {
  if (!contact) return null;

  const contactRole =
    contact.contactRole ||
    portalAccess?.roleName ||
    (contact.isPrimaryContact ? 'PRIMARY_CONTACT' : 'MEMBER');

  const portalAccessLevel = resolvePortalAccessLevel(portalAccess, contact);

  const firstName = contact.firstName || '';
  const lastName = contact.lastName || '';
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  const location =
    [contact.city, contact.state, contact.country].filter(Boolean).join(', ') || null;

  let status = 'INVITED';
  const contactStatus = String(contact.status || '').toUpperCase();
  if (contactStatus === 'SUSPENDED' || portalAccess?.isActive === false) {
    status = 'SUSPENDED';
  } else if (contactStatus === 'INACTIVE') {
    status = 'INACTIVE';
  } else if (portalAccess) {
    status = 'ACTIVE';
  }

  return {
    id: contact.id,
    documentId: contact.documentId,
    name: name || 'Member',
    firstName,
    lastName,
    email: contact.email || '',
    phone: contact.phone || null,
    contactRole,
    role: contactRole,
    roleLabel: formatContactRoleLabel(contactRole, contact.isPrimaryContact),
    portalAccessLevel,
    portalAccessLabel: portalAccessTierLabel(portalAccessLevel),
    status,
    createdAt: contact.createdAt || null,
    lastActivity: portalAccess?.lastLogin || null,
    location,
    isPrimaryContact: Boolean(contact.isPrimaryContact),
    portalAccess: portalAccess
      ? {
          id: portalAccess.id,
          accessLevel: portalAccess.accessLevel,
          roleName: portalAccess.roleName,
          isActive: portalAccess.isActive,
          portalAccessLevel,
        }
      : null,
  };
}

async function assertContactBelongsToAccount(strapi, contactId, clientAccountId) {
  const contact = await strapi.entityService.findOne(CONTACT_UID, contactId, {
    populate: ['clientAccount'],
  });
  if (!contact) return null;

  const linkedId =
    contact.clientAccount?.id ??
    contact.clientAccount?.documentId ??
    contact.clientAccount;
  if (String(linkedId) !== String(clientAccountId)) {
    return null;
  }
  return contact;
}

async function listCompanyMembers(strapi, clientAccountId) {
  const contacts = await strapi.entityService.findMany(CONTACT_UID, {
    filters: { clientAccount: clientAccountId },
    limit: 100,
    sort: [{ isPrimaryContact: 'desc' }, { firstName: 'asc' }],
  });

  const members = [];
  const roleSet = new Set(BASE_PORTAL_ROLES);

  for (const contact of contacts) {
    const accesses = await findPortalAccessForContact(strapi, contact.id);
    const access = accesses.find((row) => row.isActive !== false) || accesses[0] || null;
    const member = serializeMember(contact, access);
    if (member) {
      members.push(member);
      if (access?.roleName) {
        roleSet.add(access.roleName);
      }
    }
  }

  return {
    data: members,
    roles: [...roleSet].sort().map((name) => ({ name })),
  };
}

async function getCompanyMember(strapi, clientAccountId, memberId) {
  const contact = await assertContactBelongsToAccount(strapi, memberId, clientAccountId);
  if (!contact) return null;

  const accesses = await findPortalAccessForContact(strapi, contact.id);
  const access = accesses.find((row) => row.isActive !== false) || accesses[0] || null;
  return serializeMember(contact, access);
}

async function addCompanyMember(strapi, clientAccountId, payload = {}) {
  const account = await loadClientAccount(strapi, clientAccountId);
  if (!account) {
    return { ok: false, status: 404, message: 'Client account not found' };
  }

  const orgId = orgIdFromAccount(account);
  if (!orgId) {
    return { ok: false, status: 400, message: 'Client account organization not found' };
  }

  const email = normalizeEmail(payload.email);
  const password = normalizeString(payload.password);
  const role = normalizeString(payload.role) || 'DEVELOPER';
  const portalAccessLevel = normalizeString(payload.portalAccessLevel) || 'READ_ONLY';
  const name = normalizeString(payload.name);
  const parts = name.split(/\s+/).filter(Boolean);
  const firstName = normalizeString(payload.firstName) || parts[0] || 'Member';
  const lastName =
    normalizeString(payload.lastName) || (parts.length > 1 ? parts.slice(1).join(' ') : '-');

  if (!email) {
    return { ok: false, status: 400, message: 'Email is required' };
  }
  if (!password || password.length < 6) {
    return { ok: false, status: 400, message: 'Password must be at least 6 characters' };
  }

  const duplicate = await strapi.entityService.findMany(CONTACT_UID, {
    filters: { clientAccount: clientAccountId, email },
    limit: 1,
  });
  if (duplicate.length > 0) {
    return { ok: false, status: 409, message: 'A member with this email already exists' };
  }

  const contact = await strapi.entityService.create(CONTACT_UID, {
    data: {
      firstName,
      lastName,
      email,
      phone: payload.phone || null,
      companyName: account.companyName || null,
      contactRole: role,
      isPrimaryContact: false,
      source: 'CLIENT_PORTAL',
      isCustomer: true,
      status: 'ACTIVE',
      clientAccount: clientAccountId,
      organization: orgId,
      portalAccess: true,
    },
  });

  const access = await strapi.entityService.create(PORTAL_ACCESS_UID, {
    data: {
      contact: contact.id,
      clientAccount: clientAccountId,
      password,
      isActive: true,
      accessLevel: portalAccessLevelToEnum(portalAccessLevel),
      roleName: role,
      loginId: normalizeString(payload.loginId) || null,
      permissions: {
        portalAccessLevel,
        ...(Array.isArray(payload.permissions) ? { grants: payload.permissions } : {}),
      },
      isCustomRole: Boolean(payload.isCustomRole),
    },
  });

  return {
    ok: true,
    member: serializeMember(contact, access),
  };
}

async function updateCompanyMember(strapi, clientAccountId, memberId, payload = {}) {
  const contact = await assertContactBelongsToAccount(strapi, memberId, clientAccountId);
  if (!contact) {
    return { ok: false, status: 404, message: 'Member not found' };
  }

  const contactData = {};
  if (payload.name) {
    const parts = normalizeString(payload.name).split(/\s+/).filter(Boolean);
    contactData.firstName = parts[0] || contact.firstName;
    contactData.lastName = parts.length > 1 ? parts.slice(1).join(' ') : contact.lastName;
  }
  if (payload.firstName) contactData.firstName = normalizeString(payload.firstName);
  if (payload.lastName) contactData.lastName = normalizeString(payload.lastName);
  if (payload.email) contactData.email = normalizeEmail(payload.email);
  if (payload.phone !== undefined) contactData.phone = payload.phone || null;
  if (payload.role) contactData.contactRole = normalizeString(payload.role);

  const status = normalizeString(payload.status).toUpperCase();
  if (status === 'INACTIVE') {
    contactData.status = 'INACTIVE';
  } else if (status === 'SUSPENDED') {
    contactData.status = 'SUSPENDED';
  } else if (status === 'ACTIVE') {
    contactData.status = 'ACTIVE';
  }

  let updatedContact = contact;
  if (Object.keys(contactData).length > 0) {
    updatedContact = await strapi.entityService.update(CONTACT_UID, contact.id, {
      data: contactData,
    });
  }

  const accesses = await findPortalAccessForContact(strapi, contact.id);
  let access = accesses[0] || null;

  const accessData = {};
  if (payload.role) accessData.roleName = normalizeString(payload.role);
  if (payload.portalAccessLevel) {
    accessData.accessLevel = portalAccessLevelToEnum(payload.portalAccessLevel);
    accessData.permissions = {
      ...(access?.permissions && typeof access.permissions === 'object' ? access.permissions : {}),
      portalAccessLevel: payload.portalAccessLevel,
    };
  }
  if (payload.password) {
    accessData.password = payload.password;
    accessData.isActive = true;
  }
  if (status === 'INACTIVE' || status === 'SUSPENDED') {
    accessData.isActive = false;
  } else if (status === 'ACTIVE') {
    accessData.isActive = true;
  }

  if (Object.keys(accessData).length > 0) {
    if (access) {
      access = await strapi.entityService.update(PORTAL_ACCESS_UID, access.id, {
        data: accessData,
      });
    } else if (payload.password) {
      access = await strapi.entityService.create(PORTAL_ACCESS_UID, {
        data: {
          contact: contact.id,
          clientAccount: clientAccountId,
          password: payload.password,
          isActive: true,
          accessLevel: portalAccessLevelToEnum(payload.portalAccessLevel || 'READ_ONLY'),
          roleName: normalizeString(payload.role) || 'DEVELOPER',
          permissions: {
            portalAccessLevel: payload.portalAccessLevel || 'READ_ONLY',
          },
        },
      });
    }
  }

  return {
    ok: true,
    member: serializeMember(updatedContact, access),
  };
}

async function deleteCompanyMember(strapi, clientAccountId, memberId) {
  const contact = await assertContactBelongsToAccount(strapi, memberId, clientAccountId);
  if (!contact) {
    return { ok: false, status: 404, message: 'Member not found' };
  }

  if (contact.isPrimaryContact) {
    return { ok: false, status: 400, message: 'Primary contact cannot be removed' };
  }

  const accesses = await findPortalAccessForContact(strapi, contact.id);
  for (const access of accesses) {
    await strapi.entityService.update(PORTAL_ACCESS_UID, access.id, {
      data: { isActive: false },
    });
  }

  await strapi.entityService.update(CONTACT_UID, contact.id, {
    data: { status: 'INACTIVE', portalAccess: false },
  });

  return { ok: true };
}

async function setCompanyMemberSuspended(strapi, clientAccountId, memberId, suspend = true) {
  const contact = await assertContactBelongsToAccount(strapi, memberId, clientAccountId);
  if (!contact) {
    return { ok: false, status: 404, message: 'Member not found' };
  }

  if (contact.isPrimaryContact && suspend) {
    return { ok: false, status: 400, message: 'Primary contact cannot be suspended' };
  }

  const updatedContact = await strapi.entityService.update(CONTACT_UID, contact.id, {
    data: {
      status: suspend ? 'SUSPENDED' : 'ACTIVE',
      portalAccess: !suspend,
    },
  });

  const accesses = await findPortalAccessForContact(strapi, contact.id);
  let access = accesses[0] || null;
  for (const row of accesses) {
    access = await strapi.entityService.update(PORTAL_ACCESS_UID, row.id, {
      data: { isActive: !suspend },
    });
  }

  return {
    ok: true,
    member: serializeMember(updatedContact, access),
  };
}

function registerCompanyRole(roleName) {
  const name = normalizeString(roleName).toUpperCase().replaceAll(' ', '_');
  if (!name) {
    return { ok: false, status: 400, message: 'Role name is required' };
  }
  return { ok: true, role: { name } };
}

module.exports = {
  BASE_PORTAL_ROLES,
  canManageMembers,
  listCompanyMembers,
  getCompanyMember,
  addCompanyMember,
  updateCompanyMember,
  deleteCompanyMember,
  setCompanyMemberSuspended,
  registerCompanyRole,
};
