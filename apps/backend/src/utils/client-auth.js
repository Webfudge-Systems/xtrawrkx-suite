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
  return Boolean(company && account.email && account.phone);
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

async function findAnyPortalAccessForContact(strapi, contactId) {
  return strapi.db.query(PORTAL_ACCESS_UID).findMany({
    where: { contact: contactId },
    populate: ['clientAccount'],
    limit: 5,
    orderBy: { updatedAt: 'desc' },
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

async function completeClientLogin(strapi, match, password) {
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

async function autoProvisionPortalFromFirebase(strapi, email, password) {
  try {
    const { resolveWebsiteSignupOrgId } = require('./website-signup');
    const orgId = await resolveWebsiteSignupOrgId(strapi);
    if (!orgId) {
      console.error('autoProvision: no xtrawrkx org found');
      return { ok: false, reason: 'no_org' };
    }

    const emailPrefix = email.split('@')[0];
    const nameParts = emailPrefix
      .replace(/[._\-+]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .split(' ')
      .filter(Boolean);
    const firstName = nameParts[0] || emailPrefix;
    const lastName = nameParts.slice(1).join(' ') || '-';

    const existingContacts = await findContactsByEmail(strapi, email);
    let contact = existingContacts[0] || null;
    let clientAccountId = null;

    if (contact) {
      clientAccountId = await resolveClientAccountId(strapi, null, contact);
    }

    if (!contact) {
      const companyName = `${[firstName, lastName].filter((p) => p && p !== '-').join(' ')} (Website)`;
      try {
        const account = await strapi.entityService.create(CLIENT_ACCOUNT_UID, {
          data: {
            email,
            companyName,
            type: 'CUSTOMER',
            status: 'ACTIVE',
            accountType: 'STANDARD',
            organization: orgId,
          },
        });
        clientAccountId = account.id;

        contact = await strapi.entityService.create(CONTACT_UID, {
          data: {
            firstName,
            lastName,
            email,
            contactRole: 'PRIMARY_CONTACT',
            isPrimaryContact: true,
            source: 'WEBSITE',
            isCustomer: true,
            status: 'ACTIVE',
            clientAccount: clientAccountId,
            organization: orgId,
            portalAccess: true,
          },
        });
      } catch (createErr) {
        console.error('autoProvision: contact/account create failed:', createErr.message);
        return { ok: false, reason: 'create_failed', error: createErr.message };
      }
    }

    if (!clientAccountId) {
      return { ok: false, reason: 'no_client_account' };
    }

    const existingAccess = await findAnyPortalAccessForContact(strapi, contact.id);
    if (existingAccess.length > 0) {
      await strapi.entityService.update(PORTAL_ACCESS_UID, existingAccess[0].id, {
        data: { password, isActive: true },
      });
      return { ok: true, contact, accessId: existingAccess[0].id };
    }

    const access = await strapi.entityService.create(PORTAL_ACCESS_UID, {
      data: {
        contact: contact.id,
        clientAccount: clientAccountId,
        password,
        isActive: true,
        accessLevel: 'view',
        roleName: 'DEVELOPER',
        loginId: null,
      },
    });
    return { ok: true, contact, accessId: access.id };
  } catch (err) {
    console.error('autoProvision: unexpected error:', err.message);
    return { ok: false, reason: 'unexpected', error: err.message };
  }
}

async function authenticateClientCredentials(strapi, email, password) {
  const { verifyFirebasePassword } = require('./firebase-auth-bridge');
  const normalized = normalizeEmail(email);

  const tryStrapiLogin = async () => {
    const match = await findPortalAccessByEmail(strapi, normalized);
    if (!match) return null;
    const valid = await validatePortalPassword(strapi, password, match.access.password);
    if (!valid) return null;
    return completeClientLogin(strapi, match, password);
  };

  // 1. Try Strapi login directly (password already synced)
  const direct = await tryStrapiLogin();
  if (direct?.ok) return direct;

  // 2. Verify against Firebase (same credentials as landing site)
  const firebaseValid = await verifyFirebasePassword(normalized, password);
  if (firebaseValid) {
    // 2a. Sync password to existing Strapi portal access
    const sync = await syncPortalPasswordByEmail(strapi, normalized, password);
    if (sync.ok && !sync.skipped) {
      const afterSync = await tryStrapiLogin();
      if (afterSync?.ok) return afterSync;
    }

    // 2b. No contact/portal row at all — auto-provision from Firebase identity
    const provision = await autoProvisionPortalFromFirebase(strapi, normalized, password);
    if (provision.ok) {
      const afterProvision = await tryStrapiLogin();
      if (afterProvision?.ok) return afterProvision;
    } else {
      console.error('autoProvision failed:', provision.reason, provision.error || '');
    }

    // Firebase verified but portal setup failed — return a clear error
    return {
      ok: false,
      status: 500,
      message: 'Firebase login verified but client portal setup failed. Please try again.',
    };
  }

  return { ok: false, status: 401, message: 'Invalid email or password' };
}

function buildSettingsProfile(contact, access, account) {
  const base = serializeContact(contact, access);
  const od =
    account?.onboardingData && typeof account.onboardingData === 'object'
      ? account.onboardingData
      : {};
  const prefs =
    od.preferences && typeof od.preferences === 'object' ? od.preferences : {};
  const notifications =
    prefs.notifications && typeof prefs.notifications === 'object'
      ? prefs.notifications
      : {};

  return {
    ...base,
    bio: od.bio || '',
    timezone: prefs.timezone || 'America/Los_Angeles',
    notifications: {
      email: notifications.email !== false,
      projectUpdates: notifications.projectUpdates !== false,
      messages: notifications.messages !== false,
    },
    appearance: prefs.appearance || { theme: 'light' },
    language: prefs.language || 'en',
    avatarUrl: od.avatarUrl || null,
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
    profile: buildSettingsProfile(contact, access, account),
    portalAccessId: access.id,
  };
}

async function emailHasPortalAccess(strapi, email) {
  const match = await findPortalAccessByEmail(strapi, email);
  return Boolean(match);
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function syncPortalPasswordByEmail(strapi, email, password) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { ok: false, status: 400, error: 'Email is required.' };
  }
  if (!password || String(password).length < 6) {
    return { ok: false, status: 400, error: 'Password must be at least 6 characters.' };
  }

  const match = await findPortalAccessByEmail(strapi, normalized);
  if (match?.access?.id) {
    await strapi.entityService.update(PORTAL_ACCESS_UID, match.access.id, {
      data: { password, isActive: true },
    });
    return {
      ok: true,
      updated: true,
      contactId: match.contact?.id ?? null,
      clientAccountId: await resolveClientAccountId(strapi, match.access, match.contact),
    };
  }

  const contacts = await findContactsByEmail(strapi, normalized);
  for (const contact of contacts) {
    const clientAccountId = await resolveClientAccountId(strapi, null, contact);
    if (!clientAccountId) continue;

    const existingAccess = await findAnyPortalAccessForContact(strapi, contact.id);
    if (existingAccess.length > 0) {
      await strapi.entityService.update(PORTAL_ACCESS_UID, existingAccess[0].id, {
        data: { password, isActive: true },
      });
      return {
        ok: true,
        updated: true,
        contactId: contact.id,
        clientAccountId,
      };
    }

    await strapi.entityService.create(PORTAL_ACCESS_UID, {
      data: {
        contact: contact.id,
        clientAccount: clientAccountId,
        password,
        isActive: true,
        accessLevel: 'view',
        roleName: 'DEVELOPER',
        loginId: null,
      },
    });
    return { ok: true, created: true, contactId: contact.id, clientAccountId };
  }

  return { ok: true, skipped: true, reason: 'no_portal_account' };
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
    companySubType: body?.companySubType || body?.subType,
    jobTitle: body?.jobTitle,
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
  buildSettingsProfile,
  loadClientAccount,
  mapPortalSignupBody,
  findPortalAccessByEmail,
  resolveClientAccountId,
  syncPortalPasswordByEmail,
  validatePortalPassword,
  JWT_SECRET,
  CLIENT_ACCOUNT_UID,
  PORTAL_ACCESS_UID,
};
