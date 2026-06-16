'use strict';

const CLIENT_ACCOUNT_UID = 'api::client-account.client-account';
const CONTACT_UID = 'api::contact.contact';
const PROJECT_UID = 'api::project.project';
const PORTAL_ACCESS_UID = 'api::client-portal-access.client-portal-access';
const { normalizeCompanyName } = require('./company-name-similarity');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function uniqueStringList(...items) {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    const s = normalizeString(item);
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function buildOnboardingData(body, existingOnboarding = {}) {
  const existing =
    existingOnboarding && typeof existingOnboarding === 'object' && !Array.isArray(existingOnboarding)
      ? { ...existingOnboarding }
      : {};

  return {
    ...existing,
    profileUid: body?.uid ?? existing.profileUid ?? null,
    firstName: body?.firstName ?? existing.firstName ?? null,
    lastName: body?.lastName ?? existing.lastName ?? null,
    displayName: body?.displayName ?? existing.displayName ?? null,
    signupCompany:
      normalizeString(body?.companyName) ||
      normalizeString(body?.company) ||
      normalizeString(existing.signupCompany) ||
      null,
    phone: normalizeString(body?.phone) || normalizeString(existing.phone) || null,
    companyEmail:
      normalizeString(body?.companyEmail) || normalizeString(existing.companyEmail) || null,
    companyPhone:
      normalizeString(body?.companyPhone) || normalizeString(existing.companyPhone) || null,
    companyType:
      normalizeString(body?.companyType) || normalizeString(existing.companyType) || null,
    companySubType:
      normalizeString(body?.companySubType) || normalizeString(existing.companySubType) || null,
    industry: normalizeString(body?.industry) || normalizeString(existing.industry) || null,
    website: normalizeString(body?.website) || normalizeString(existing.website) || null,
    companyDescription:
      normalizeString(body?.companyDescription) ||
      normalizeString(existing.companyDescription) ||
      null,
    jobTitle: normalizeString(body?.jobTitle) || normalizeString(existing.jobTitle) || null,
    addressLine1:
      normalizeString(body?.addressLine1) || normalizeString(existing.addressLine1) || null,
    addressLine2:
      normalizeString(body?.addressLine2) || normalizeString(existing.addressLine2) || null,
    city: normalizeString(body?.city) || normalizeString(existing.city) || null,
    state: normalizeString(body?.state) || normalizeString(existing.state) || null,
    country: normalizeString(body?.country) || normalizeString(existing.country) || null,
    postalCode:
      normalizeString(body?.postalCode) || normalizeString(existing.postalCode) || null,
    linkedin: normalizeString(body?.linkedin) || normalizeString(existing.linkedin) || null,
    xProfile: normalizeString(body?.xProfile) || normalizeString(existing.xProfile) || null,
    interests: normalizeString(body?.interests) || normalizeString(existing.interests) || null,
    lookingFor:
      normalizeString(body?.lookingFor) || normalizeString(existing.lookingFor) || null,
    bio: normalizeString(body?.bio) || normalizeString(existing.bio) || null,
    updatedFrom: 'website_public_profile_sync',
  };
}

async function resolveWebsiteSignupOrgId(strapi) {
  const env = process.env.WEBSITE_SIGNUP_ORG_ID || process.env.TARGET_ORG_ID;
  if (env != null && String(env).trim() !== '') {
    const id = parseInt(String(env).trim(), 10);
    if (!Number.isNaN(id) && id > 0) {
      const org = await strapi.entityService.findOne('api::organization.organization', id, {
        fields: ['id', 'name'],
      });
      if (org) return org.id;
    }
  }

  const bySlug = await strapi.entityService.findMany('api::organization.organization', {
    filters: {
      $or: [{ slug: 'xtrawrkx' }, { name: { $containsi: 'xtrawrkx' } }],
    },
    limit: 1,
    sort: { id: 'ASC' },
    fields: ['id', 'name'],
  });
  if (bySlug.length > 0) return bySlug[0].id;

  const first = await strapi.entityService.findMany('api::organization.organization', {
    limit: 1,
    sort: { id: 'ASC' },
    fields: ['id'],
  });
  return first[0]?.id ?? null;
}

function verifyLandingSignupSecret(ctx) {
  const expected = process.env.LANDING_SIGNUP_SECRET || process.env.WEBSITE_SIGNUP_SECRET;
  if (!expected) {
    return process.env.NODE_ENV !== 'production';
  }
  const provided =
    ctx.request.headers['x-landing-signup-secret'] ||
    ctx.request.headers['x-website-signup-secret'] ||
    ctx.request.body?.signupSecret ||
    ctx.query?.signupSecret;
  return provided === expected;
}

/**
 * Idempotent profile re-sync only: same company + same signup user already on that account.
 * Do NOT match by email alone — one person may register multiple companies.
 */
async function findClientAccountForSignupRetry(strapi, orgId, body) {
  const companyTrimmed = normalizeString(body?.companyName) || normalizeString(body?.company);
  const userEmail = normalizeString(body?.email).toLowerCase();
  const companyEmail = normalizeString(body?.companyEmail).toLowerCase();
  if (!companyTrimmed || !userEmail) return null;

  const normalizedIncoming = normalizeCompanyName(companyTrimmed);
  if (!normalizedIncoming) return null;

  const candidates = await strapi.entityService.findMany(CLIENT_ACCOUNT_UID, {
    filters: {
      organization: orgId,
      companyName: { $containsi: companyTrimmed },
    },
    limit: 20,
    sort: { updatedAt: 'desc' },
    fields: ['id', 'companyName', 'email', 'status'],
  });

  for (const account of candidates) {
    if (normalizeCompanyName(account.companyName) !== normalizedIncoming) continue;

    const accountEmail = normalizeString(account.email).toLowerCase();
    if (accountEmail === userEmail || (companyEmail && accountEmail === companyEmail)) {
      return account;
    }

    const contacts = await strapi.entityService.findMany(CONTACT_UID, {
      filters: { clientAccount: account.id, email: userEmail },
      limit: 1,
    });
    if (contacts.length > 0) return account;
  }

  return null;
}

async function findPrimaryContact(strapi, orgId, clientAccountId) {
  const rows = await strapi.entityService.findMany(CONTACT_UID, {
    filters: {
      organization: orgId,
      clientAccount: clientAccountId,
      isPrimaryContact: true,
    },
    limit: 1,
  });
  if (rows.length > 0) return rows[0];

  const any = await strapi.entityService.findMany(CONTACT_UID, {
    filters: {
      organization: orgId,
      clientAccount: clientAccountId,
    },
    limit: 1,
    sort: { createdAt: 'asc' },
  });
  return any[0] || null;
}

async function ensureSignupContact(strapi, orgId, clientAccountId, body) {
  const email = normalizeString(body?.email).toLowerCase();
  if (!email || !clientAccountId) {
    return { attempted: false, ok: false, error: 'Missing email or client account id.' };
  }

  const existingForEmail = await strapi.entityService.findMany(CONTACT_UID, {
    filters: { clientAccount: clientAccountId, email },
    limit: 1,
  });
  if (existingForEmail.length > 0) {
    return {
      attempted: true,
      ok: true,
      status: 200,
      error: null,
      contactId: existingForEmail[0].id,
    };
  }

  return ensurePrimaryContact(strapi, orgId, clientAccountId, body);
}

async function ensurePrimaryContact(strapi, orgId, clientAccountId, body) {
  const email = normalizeString(body?.email).toLowerCase();
  if (!email || !clientAccountId) {
    return { attempted: false, ok: false, error: 'Missing email or client account id.' };
  }

  const existing = await findPrimaryContact(strapi, orgId, clientAccountId);
  if (existing) {
    return { attempted: true, ok: true, status: 200, error: null, contactId: existing.id };
  }

  const firstName =
    normalizeString(body?.firstName) || email.split('@')[0] || 'Member';
  const lastName = normalizeString(body?.lastName) || '-';
  const jobTitle = normalizeString(body?.jobTitle);
  const phone = normalizeString(body?.phone) || normalizeString(body?.companyPhone);
  const companyName = normalizeString(body?.companyName) || normalizeString(body?.company);

  try {
    const contact = await strapi.entityService.create(CONTACT_UID, {
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        jobTitle: jobTitle || 'Website signup',
        companyName: companyName || null,
        contactRole: 'PRIMARY_CONTACT',
        isPrimaryContact: true,
        source: 'WEBSITE',
        isCustomer: true,
        status: 'ACTIVE',
        clientAccount: clientAccountId,
        organization: orgId,
      },
    });
    return {
      attempted: true,
      ok: true,
      status: 201,
      error: null,
      contactId: contact.id,
    };
  } catch (err) {
    return {
      attempted: true,
      ok: false,
      status: 500,
      error: err?.message || 'Primary contact creation failed.',
    };
  }
}

async function ensureDefaultProject(strapi, orgId, clientAccountId, body) {
  if (!clientAccountId) {
    return { attempted: false, ok: false, error: 'Missing client account id.' };
  }

  const existing = await strapi.entityService.findMany(PROJECT_UID, {
    filters: {
      organization: orgId,
      clientAccount: clientAccountId,
    },
    limit: 1,
    sort: { createdAt: 'asc' },
  });
  if (existing.length > 0) {
    return { attempted: true, ok: true, skipped: true, status: 200 };
  }

  const company = normalizeString(body?.companyName) || normalizeString(body?.company) || 'Client';
  const firstName = normalizeString(body?.firstName);
  const projectName = `${company} - Onboarding Project`;

  try {
    await strapi.entityService.create(PROJECT_UID, {
      data: {
        name: projectName,
        description: `Auto-created after website registration for ${firstName || company}.`,
        status: 'PLANNING',
        clientAccount: clientAccountId,
        organization: orgId,
      },
    });
    return { attempted: true, ok: true, skipped: false, status: 201 };
  } catch (err) {
    return {
      attempted: true,
      ok: false,
      status: 500,
      error: err?.message || 'Default project creation failed.',
    };
  }
}

async function syncPortalPassword(strapi, clientAccountId, contactId, password) {
  if (!password || String(password).length < 6) {
    return { attempted: false, ok: true, status: null, error: null };
  }
  if (!contactId) {
    return { attempted: true, ok: false, status: 400, error: 'Missing contact for portal password.' };
  }

  const existing = await strapi.entityService.findMany(PORTAL_ACCESS_UID, {
    filters: { contact: contactId },
    limit: 1,
  });

  try {
    if (existing.length > 0) {
      await strapi.entityService.update(PORTAL_ACCESS_UID, existing[0].id, {
        data: { password, isActive: true },
      });
    } else {
      await strapi.entityService.create(PORTAL_ACCESS_UID, {
        data: {
          contact: contactId,
          clientAccount: clientAccountId,
          password,
          isActive: true,
          accessLevel: 'view',
          roleName: 'DEVELOPER',
          loginId: null,
        },
      });
    }
    return { attempted: true, ok: true, status: 200, error: null };
  } catch (err) {
    return {
      attempted: true,
      ok: false,
      status: 500,
      error: err?.message || 'Portal password sync failed.',
    };
  }
}

function buildClientAccountPayload(body, orgId, companyName) {
  const email =
    normalizeString(body?.companyEmail).toLowerCase() ||
    normalizeString(body?.email).toLowerCase();
  const industry =
    normalizeString(body?.industry) || normalizeString(body?.jobTitle) || 'General';

  return {
    email,
    companyName,
    industry,
    type: 'CUSTOMER',
    status: 'ACTIVE',
    accountType: 'STANDARD',
    website: normalizeString(body?.website) || null,
    phone: normalizeString(body?.companyPhone) || normalizeString(body?.phone) || null,
    description: normalizeString(body?.companyDescription) || null,
    address: normalizeString(body?.addressLine1) || null,
    city: normalizeString(body?.city) || null,
    state: normalizeString(body?.state) || null,
    country: normalizeString(body?.country) || null,
    zipCode: normalizeString(body?.postalCode) || null,
    linkedIn: normalizeString(body?.linkedin) || null,
    twitter: normalizeString(body?.xProfile) || null,
    organization: orgId,
  };
}

async function createClientAccountWithUniqueName(strapi, body, orgId, companyTrimmed) {
  const email =
    normalizeString(body?.companyEmail).toLowerCase() ||
    normalizeString(body?.email).toLowerCase();
  const emailLocal = email.split('@')[0] || 'user';
  const uid = normalizeString(body?.uid);
  const candidates = uniqueStringList(
    companyTrimmed,
    `${companyTrimmed} (${emailLocal})`,
    uid ? `${companyTrimmed} #${uid.slice(-8)}` : null
  );

  let lastError = null;
  for (const companyName of candidates) {
    try {
      const entry = await strapi.entityService.create(CLIENT_ACCOUNT_UID, {
        data: buildClientAccountPayload(body, orgId, companyName),
      });
      return { ok: true, entry, companyName };
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || '').toLowerCase();
      const isUniqueConflict =
        msg.includes('unique') || msg.includes('duplicate') || msg.includes('already');
      if (!isUniqueConflict) break;
    }
  }

  return {
    ok: false,
    error: lastError?.message || 'Client account creation failed.',
  };
}

async function syncCompanyName(strapi, existing, body) {
  const incoming = normalizeString(body?.companyName) || normalizeString(body?.company);
  if (!incoming || !existing?.id) {
    return { attempted: false, ok: true, skipped: true, error: null };
  }

  const currentName = normalizeString(existing.companyName);
  if (currentName === incoming) {
    return { attempted: false, ok: true, skipped: true, error: null };
  }

  const email = normalizeString(body?.email).toLowerCase();
  const localPart = email.split('@')[0] || 'user';
  const candidates = uniqueStringList(
    incoming,
    `${incoming} (${localPart})`,
    `${incoming} · ${email}`
  );

  let lastErr = null;
  for (const companyName of candidates) {
    try {
      await strapi.entityService.update(CLIENT_ACCOUNT_UID, existing.id, {
        data: {
          companyName,
        },
      });
      return { attempted: true, ok: true, skipped: false, companyName, error: null };
    } catch (err) {
      lastErr = err?.message || 'Update failed';
      const msg = String(lastErr).toLowerCase();
      const isUniqueConflict =
        msg.includes('unique') || msg.includes('duplicate') || msg.includes('already');
      if (!isUniqueConflict) {
        return { attempted: true, ok: false, skipped: false, error: lastErr };
      }
    }
  }

  return {
    attempted: true,
    ok: false,
    skipped: false,
    error: lastErr || 'Unique companyName constraint could not be satisfied.',
  };
}

/**
 * Idempotent website signup → CRM client account in the Xtrawrkx organization.
 */
async function ensureWebsiteClientAccount(strapi, body) {
  const email = normalizeString(body?.email).toLowerCase();
  if (!email) {
    return {
      attempted: false,
      ok: false,
      status: 400,
      error: 'Email is required for client account setup.',
      data: null,
    };
  }
  if (!EMAIL_RE.test(email)) {
    return {
      attempted: true,
      ok: false,
      status: 400,
      error: 'A valid email is required for client account setup.',
      data: null,
    };
  }

  const companyTrimmed = normalizeString(body?.companyName) || normalizeString(body?.company);
  if (!companyTrimmed) {
    return {
      attempted: false,
      ok: true,
      status: 200,
      error: null,
      data: null,
      skipped: true,
      reason: 'Missing company name on website profile.',
      primaryContactSync: null,
      companyNameSync: null,
      clientPasswordSync: null,
      defaultProjectSync: null,
    };
  }

  const orgId = await resolveWebsiteSignupOrgId(strapi);
  if (!orgId) {
    return {
      attempted: true,
      ok: false,
      status: 500,
      error: 'Website signup organization is not configured.',
      data: null,
    };
  }

  const existing = await findClientAccountForSignupRetry(strapi, orgId, body);
  if (existing) {
    const primaryContactSync = await ensureSignupContact(
      strapi,
      orgId,
      existing.id,
      body
    );
    const defaultProjectSync = await ensureDefaultProject(
      strapi,
      orgId,
      existing.id,
      body
    );
    const clientPasswordSync = await syncPortalPassword(
      strapi,
      existing.id,
      primaryContactSync.contactId,
      body?.initialClientPassword
    );
    const companyNameSync = await syncCompanyName(strapi, existing, body);

    return {
      attempted: true,
      ok: true,
      status: 200,
      error: null,
      primaryContactSync,
      defaultProjectSync,
      clientPasswordSync,
      companyNameSync,
      data: {
        id: existing.id,
        status: existing.status || 'ACTIVE',
        source: 'WEBSITE',
        organizationId: orgId,
        raw: existing,
      },
    };
  }

  if (!existing) {
    const { findSimilarCompanies } = require('./find-similar-companies');
    const similar = await findSimilarCompanies(strapi, {
      name: companyTrimmed,
      limit: 3,
      minScore: 0.98,
    });
    if (similar.hasExactMatch) {
      return {
        attempted: true,
        ok: false,
        status: 409,
        error: 'This company is already registered. Sign in to your existing account instead.',
        data: null,
        primaryContactSync: null,
      };
    }
  }

  const createResult = await createClientAccountWithUniqueName(
    strapi,
    body,
    orgId,
    companyTrimmed
  );
  if (!createResult.ok) {
    return {
      attempted: true,
      ok: false,
      status: 500,
      error: createResult.error || 'Client account setup failed.',
      data: null,
      primaryContactSync: null,
    };
  }

  const created = createResult.entry;
  const primaryContactSync = await ensureSignupContact(strapi, orgId, created.id, body);
  const defaultProjectSync = await ensureDefaultProject(strapi, orgId, created.id, body);
  const includePassword =
    body?.initialClientPassword && String(body.initialClientPassword).length >= 6;
  const clientPasswordSync = includePassword
    ? await syncPortalPassword(
        strapi,
        created.id,
        primaryContactSync.contactId,
        body.initialClientPassword
      )
    : { attempted: false, ok: true, status: null, error: null };

  return {
    attempted: true,
    ok: true,
    status: 201,
    error: null,
    primaryContactSync,
    defaultProjectSync,
    companyNameSync: null,
    clientPasswordSync,
    data: {
      id: created.id,
      status: created.status || 'ACTIVE',
      source: 'WEBSITE',
      organizationId: orgId,
      raw: created,
    },
  };
}

const COMMUNITY_LABELS = {
  XEN: 'XEN',
  XEVFIN: 'XEV.FiN',
  XEVTG: 'XEVTG',
  XDD: 'xD&D',
};

const COMMUNITY_PORTAL_PAGE_ID = {
  XEN: 1,
  XEVFIN: 2,
  XEVTG: 3,
  XDD: 4,
};

/**
 * Landing profile page — resolve client account + active memberships by signup email.
 * Uses DB queries (not authenticated REST) so server-side landing routes work in production.
 */
async function getPublicCommunityStatusByEmail(strapi, email) {
  const emailRaw = normalizeString(email);
  const emailNorm = emailRaw.toLowerCase();
  if (!emailNorm || !EMAIL_RE.test(emailNorm)) {
    return { ok: false, status: 400, error: 'A valid email is required.' };
  }

  let account = await strapi.db.query(CLIENT_ACCOUNT_UID).findOne({
    where: { email: emailNorm },
  });

  if (!account) {
    const contact = await strapi.db.query(CONTACT_UID).findOne({
      where: { email: emailNorm },
    });
    const linkedAccountId = contact?.clientAccount?.id ?? contact?.clientAccount;
    if (linkedAccountId) {
      account = await strapi.db.query(CLIENT_ACCOUNT_UID).findOne({
        where: { id: linkedAccountId },
      });
    }
  }

  if (!account) {
    return {
      ok: true,
      status: 200,
      data: {
        hasClientAccount: false,
        clientAccount: null,
        hasCommunity: false,
        memberships: [],
        communityName: '',
        communitySlug: '',
        membershipId: '',
      },
    };
  }

  const accountDocumentId =
    account.documentId != null && String(account.documentId).trim() !== ''
      ? String(account.documentId).trim()
      : null;
  const clientKey =
    accountDocumentId ||
    (account.id != null && String(account.id).trim() !== ''
      ? String(account.id).trim()
      : '');

  const membershipRows = clientKey
    ? await strapi.db.query('api::community-membership.community-membership').findMany({
        where: {
          clientAccount: account.id,
          status: 'ACTIVE',
        },
        limit: 50,
        orderBy: { joinedAt: 'desc' },
      })
    : [];

  const memberships = membershipRows.map((row) => {
    const code = row.community || '';
    const portalId = COMMUNITY_PORTAL_PAGE_ID[code] ?? null;
    return {
      id: row.id,
      community: code,
      label: COMMUNITY_LABELS[code] || code,
      portalId,
      status: row.status || 'ACTIVE',
      joinedAt: row.joinedAt || null,
    };
  });

  const hasCommunity = memberships.length > 0;
  const primary = memberships[0];
  const communityName = memberships
    .map((m) => m.label || m.community)
    .filter(Boolean)
    .join(', ');

  return {
    ok: true,
    status: 200,
    data: {
      hasClientAccount: true,
      clientAccount: {
        id: account.id,
        documentId: accountDocumentId,
        status: account.status || null,
        source: account.source || null,
        email: account.email || emailRaw || emailNorm,
      },
      hasCommunity,
      memberships,
      communityName,
      communitySlug: primary?.community ? String(primary.community).toLowerCase() : '',
      membershipId: primary?.id != null ? String(primary.id) : '',
    },
  };
}

module.exports = {
  verifyLandingSignupSecret,
  resolveWebsiteSignupOrgId,
  ensureWebsiteClientAccount,
  getPublicCommunityStatusByEmail,
};
