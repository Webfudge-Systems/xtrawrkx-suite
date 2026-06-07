'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'myJwtSecret123456789012345678901234567890';
const JWT_EXPIRES_IN = '7d';

const CLIENT_ACCOUNT_UID = 'api::client-account.client-account';
const CONTACT_UID = 'api::contact.contact';
const PORTAL_ACCESS_UID = 'api::client-portal-access.client-portal-access';

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
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

function inferOnboardingCompleted(account) {
  if (!account || typeof account !== 'object') return false;
  const od =
    account.onboardingData && typeof account.onboardingData === 'object'
      ? account.onboardingData
      : {};
  const company =
    (typeof od.signupCompany === 'string' && od.signupCompany.trim()) ||
    (typeof account.companyName === 'string' && account.companyName.trim()) ||
    '';
  return Boolean(company && account.industry && account.email && account.phone);
}

function serializeClientAccount(account, assignedUser) {
  if (!account) return null;

  const onboardingCompleted = inferOnboardingCompleted(account);
  const dedicatedPoc = assignedUser ? serializeDedicatedPocUser(assignedUser) : null;

  return {
    id: account.id,
    documentId: account.documentId,
    companyName: account.companyName || '',
    industry: account.industry || '',
    type: account.type || 'CUSTOMER',
    website: account.website || '',
    phone: account.phone || '',
    email: account.email || '',
    address: account.address || '',
    city: account.city || '',
    state: account.state || '',
    country: account.country || '',
    zipCode: account.zipCode || '',
    status: account.status || 'ACTIVE',
    accountType: account.accountType || 'STANDARD',
    onboardingData: account.onboardingData || null,
    onboardingCompleted,
    pocAssigned: Boolean(dedicatedPoc),
    dedicatedPoc,
    pocAssignmentStatus: dedicatedPoc ? 'ASSIGNED' : 'UNASSIGNED',
  };
}

function serializeContact(contact, portalAccess) {
  if (!contact) return null;

  const role =
    contact.contactRole ||
    (contact.isPrimaryContact ? 'PRIMARY_CONTACT' : portalAccess?.roleName || 'MEMBER');

  return {
    id: contact.id,
    documentId: contact.documentId,
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    email: contact.email || '',
    phone: contact.phone || '',
    jobTitle: contact.jobTitle || '',
    role,
    portalAccessLevel: mapAccessLevel(portalAccess?.accessLevel),
    permissions: portalAccess?.permissions || null,
    isPrimaryContact: Boolean(contact.isPrimaryContact),
    portalAccess: portalAccess
      ? {
          id: portalAccess.id,
          accessLevel: portalAccess.accessLevel,
          roleName: portalAccess.roleName,
          isActive: portalAccess.isActive,
        }
      : null,
  };
}

function serializeDedicatedPocUser(user) {
  if (!user) return null;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return {
    id: user.id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fullName: fullName || user.username || user.email || 'Dedicated POC',
    email: user.email || '',
    phone: user.phone || '',
    designation: user.jobTitle || 'Dedicated POC',
    isActive: user.blocked !== true,
  };
}

async function validatePortalPassword(strapi, plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  return strapi.plugins['users-permissions'].services.user.validatePassword(
    plainPassword,
    hashedPassword
  );
}

async function findContactsByEmail(strapi, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return [];

  const rows = await strapi.entityService.findMany(CONTACT_UID, {
    filters: { email: normalized },
    limit: 20,
    sort: { isPrimaryContact: 'desc' },
  });

  if (rows.length > 0) return rows;

  return strapi.entityService.findMany(CONTACT_UID, {
    filters: { email: { $containsi: normalized } },
    limit: 20,
    sort: { isPrimaryContact: 'desc' },
  });
}

async function findPortalAccessForContact(strapi, contactId) {
  return strapi.db.query(PORTAL_ACCESS_UID).findMany({
    where: { contact: contactId, isActive: true },
    populate: ['clientAccount'],
    limit: 5,
  });
}

async function resolveClientAccountId(strapi, access, contact) {
  let id =
    access?.clientAccount?.id ??
    access?.clientAccount ??
    contact?.clientAccount?.id ??
    contact?.clientAccount;
  if (id) return id;

  if (access?.id) {
    const fullAccess = await strapi.entityService.findOne(PORTAL_ACCESS_UID, access.id, {
      populate: ['clientAccount', 'contact'],
    });
    id =
      fullAccess?.clientAccount?.id ??
      fullAccess?.clientAccount ??
      fullAccess?.contact?.clientAccount?.id ??
      fullAccess?.contact?.clientAccount;
    if (id) return id;
    if (fullAccess?.contact) contact = fullAccess.contact;
  }

  const contactId = contact?.id ?? contact;
  if (contactId) {
    const fullContact = await strapi.entityService.findOne(CONTACT_UID, contactId, {
      populate: ['clientAccount'],
    });
    id = fullContact?.clientAccount?.id ?? fullContact?.clientAccount;
    if (id) return id;
  }

  return null;
}

async function findPortalAccessByEmail(strapi, email) {
  const contacts = await findContactsByEmail(strapi, email);
  for (const contact of contacts) {
    const accesses = await findPortalAccessForContact(strapi, contact.id);
    if (accesses.length > 0) {
      return { contact, access: accesses[0] };
    }
  }

  const normalized = normalizeEmail(email);
  const accounts = await strapi.entityService.findMany(CLIENT_ACCOUNT_UID, {
    filters: { email: normalized },
    limit: 5,
    sort: { updatedAt: 'desc' },
  });

  for (const account of accounts) {
    const primaryContacts = await strapi.entityService.findMany(CONTACT_UID, {
      filters: { clientAccount: account.id, isPrimaryContact: true },
      limit: 1,
    });
    const accountContacts =
      primaryContacts.length > 0
        ? primaryContacts
        : await strapi.entityService.findMany(CONTACT_UID, {
            filters: { clientAccount: account.id },
            limit: 5,
            sort: { createdAt: 'asc' },
          });

    for (const contact of accountContacts) {
      const accesses = await findPortalAccessForContact(strapi, contact.id);
      if (accesses.length > 0) {
        return { contact, access: accesses[0] };
      }
    }
  }

  return null;
}

async function loadClientAccount(strapi, clientAccountId) {
  if (!clientAccountId) return null;
  return strapi.entityService.findOne(CLIENT_ACCOUNT_UID, clientAccountId, {
    populate: {
      assignedTo: {
        fields: ['id', 'email', 'username', 'firstName', 'lastName', 'blocked'],
      },
    },
  });
}

async function loadAccountContacts(strapi, clientAccountId) {
  if (!clientAccountId) return [];

  const contacts = await strapi.entityService.findMany(CONTACT_UID, {
    filters: { clientAccount: clientAccountId },
    limit: 100,
    sort: [{ isPrimaryContact: 'desc' }, { firstName: 'asc' }],
  });

  const enriched = [];
  for (const contact of contacts) {
    const accesses = await findPortalAccessForContact(strapi, contact.id);
    enriched.push(serializeContact(contact, accesses[0] || null));
  }
  return enriched;
}

function signClientToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyClientToken(token) {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (!decoded || decoded.type !== 'client' || !decoded.portalAccessId) {
    throw new Error('Invalid client token');
  }
  return decoded;
}

async function authenticateClientCredentials(strapi, email, password) {
  const match = await findPortalAccessByEmail(strapi, email);
  if (!match) {
    return { ok: false, status: 401, message: 'Invalid email or password' };
  }

  const valid = await validatePortalPassword(strapi, password, match.access.password);
  if (!valid) {
    return { ok: false, status: 401, message: 'Invalid email or password' };
  }

  let contact = await strapi.entityService.findOne(CONTACT_UID, match.contact.id, {
    populate: ['clientAccount'],
  });
  if (!contact) {
    contact = match.contact;
  }

  const clientAccountId = await resolveClientAccountId(strapi, match.access, contact);

  const account = await loadClientAccount(strapi, clientAccountId);
  if (!account) {
    return { ok: false, status: 403, message: 'Client account not found' };
  }

  if (String(account.status || '').toUpperCase() === 'INACTIVE') {
    return { ok: false, status: 403, message: 'This client account is inactive' };
  }

  await strapi.db.query(PORTAL_ACCESS_UID).update({
    where: { id: match.access.id },
    data: { lastLogin: new Date() },
  });

  const contacts = await loadAccountContacts(strapi, account.id);
  const token = signClientToken({
    type: 'client',
    portalAccessId: match.access.id,
    contactId: contact.id,
    clientAccountId: account.id,
    id: contact.id,
  });

  return {
    ok: true,
    jwt: token,
    token,
    account: serializeClientAccount(account, account.assignedTo),
    contacts,
    contact: serializeContact(contact, match.access),
  };
}

async function resolveClientSession(strapi, portalAccessId) {
  const access = await strapi.entityService.findOne(PORTAL_ACCESS_UID, portalAccessId, {
    populate: ['contact', 'clientAccount'],
  });

  if (!access || access.isActive === false) return null;

  const contactId = access.contact?.id ?? access.contact;
  let contact = contactId
    ? await strapi.entityService.findOne(CONTACT_UID, contactId, {
        populate: ['clientAccount'],
      })
    : null;

  const clientAccountId = await resolveClientAccountId(strapi, access, contact);
  const account = await loadClientAccount(strapi, clientAccountId);

  if (!contact || !account) return null;

  const contacts = await loadAccountContacts(strapi, account.id);

  return {
    type: 'client',
    account: serializeClientAccount(account, account.assignedTo),
    contacts,
    contact: serializeContact(contact, access),
    profile: serializeContact(contact, access),
  };
}

async function emailHasPortalAccess(strapi, email) {
  const match = await findPortalAccessByEmail(strapi, email);
  return Boolean(match);
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function mapPortalSignupBody(body) {
  const name = normalizeString(body?.name);
  const parts = name.split(/\s+/).filter(Boolean);
  const firstName = normalizeString(body?.firstName) || parts[0] || 'Member';
  const lastName =
    normalizeString(body?.lastName) || (parts.length > 1 ? parts.slice(1).join(' ') : '-');

  return {
    email: body?.email,
    firstName,
    lastName,
    phone: body?.phone,
    companyName: body?.companyName,
    company: body?.companyName,
    industry: body?.industry,
    website: body?.website,
    companyType: body?.companyType,
    companySubType: body?.subType,
    addressLine1: body?.address,
    city: body?.city,
    state: body?.state,
    country: body?.country,
    postalCode: body?.zipCode,
    linkedin: body?.linkedIn,
    xProfile: body?.twitter,
    companyDescription: body?.description,
    initialClientPassword: body?.password,
    employees: body?.employees,
    founded: body?.founded,
  };
}

module.exports = {
  normalizeEmail,
  authenticateClientCredentials,
  resolveClientSession,
  verifyClientToken,
  emailHasPortalAccess,
  serializeClientAccount,
  serializeDedicatedPocUser,
  loadClientAccount,
  mapPortalSignupBody,
  findPortalAccessByEmail,
  resolveClientAccountId,
  JWT_SECRET,
};
