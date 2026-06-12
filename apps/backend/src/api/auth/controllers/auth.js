'use strict';

const jwt = require('jsonwebtoken');
const { createOrganizationOwnerMembership } = require('../../../utils/organization-role');
const { membershipSummary } = require('../../../utils/rbac');
const { normalizeUserUsername, uniqueUsernameFromEmail } = require('../../../utils/user-username');
const {
  authenticateClientCredentials,
  resolveClientSession,
  verifyClientToken,
  emailHasPortalAccess,
  loadClientAccount,
  serializeDedicatedPocUser,
  mapPortalSignupBody,
  JWT_SECRET,
} = require('../../../utils/client-auth');
const {
  verifyLandingSignupSecret,
  ensureWebsiteClientAccount,
} = require('../../../utils/website-signup');
const { handleSimilarCompaniesRequest } = require('../../../utils/similar-companies-handler');

const ORG_MEMBERSHIP_UID = 'api::organization-user.organization-user';

function readBearerToken(ctx) {
  const authHeader = ctx.request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '');
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getFallbackOrgName(user) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fullName) return `${fullName}'s Organization`;
  const emailPrefix = (user.email || '').split('@')[0].trim();
  if (emailPrefix) return `${emailPrefix}'s Organization`;
  return `Organization ${user.id}`;
}

function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function listActiveMemberships(userId, withModules = false) {
  return strapi.entityService.findMany(ORG_MEMBERSHIP_UID, {
    filters: { user: userId, isActive: true },
    sort: { joinedAt: 'ASC' },
    populate: {
      role: true,
      organization: {
        populate: {
          subscriptions: {
            populate: withModules ? { app: true, selectedModules: true } : { app: true },
          },
        },
      },
    },
  });
}

async function ensureActiveOrganizationMembership(user) {
  let memberships = await listActiveMemberships(user.id, true);
  if (memberships.length > 0) return memberships;

  const orgName = getFallbackOrgName(user);
  const baseSlug = toSlug(orgName) || `organization-${user.id}`;
  let slug = `${baseSlug}-${user.id}`;
  let suffix = 1;

  while (true) {
    const existing = await strapi.entityService.findMany('api::organization.organization', {
      filters: { slug },
      limit: 1,
    });
    if (existing.length === 0) break;
    suffix += 1;
    slug = `${baseSlug}-${user.id}-${suffix}`;
  }

  const organization = await strapi.entityService.create('api::organization.organization', {
    data: {
      name: orgName,
      slug,
      owner: user.id,
      status: 'trial',
      onboardingCompleted: false,
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await createOrganizationOwnerMembership(strapi, {
    userId: user.id,
    organizationId: organization.id,
  });

  memberships = await listActiveMemberships(user.id, true);
  return memberships;
}

function organizationPayload(membership) {
  const summary = membershipSummary(membership);
  return {
    ...membership.organization,
    role: summary.role,
    roleCode: summary.roleCode,
    roleId: summary.roleId,
    accessLevel: summary.accessLevel,
    permissions: summary.permissions,
    customPermissions: summary.customPermissions,
    joinedAt: summary.joinedAt,
  };
}

module.exports = {
  async signup(ctx) {
    const { email, password, firstName, lastName } = ctx.request.body;

    if (!email || !password) {
      return ctx.badRequest('Email and password are required');
    }

    try {
      // Check if user exists
      const existingUser = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return ctx.badRequest('Email already exists');
      }

      // Create user
      const normalizedEmail = email.toLowerCase();
      const user = await strapi.plugins['users-permissions'].services.user.add({
        username: await uniqueUsernameFromEmail(strapi, normalizedEmail),
        email: normalizedEmail,
        password,
        firstName,
        lastName,
        confirmed: true,
        blocked: false,
        provider: 'local'
      });

      // Generate JWT manually
      const token = jwt.sign(
        { id: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const organizations = await ensureActiveOrganizationMembership(user);

      ctx.send({
        jwt: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        },
        organizations: organizations.map(organizationPayload)
      });
    } catch (error) {
      console.error('Signup error:', error);
      ctx.badRequest(error.message);
    }
  },

  async login(ctx) {
    const { identifier, password } = ctx.request.body;

    if (!identifier || !password) {
      return ctx.badRequest('Identifier and password are required');
    }

    try {
      // Validate credentials
      let user = await strapi.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [
            { email: identifier.toLowerCase() },
            { username: identifier }
          ]
        }
      });

      if (!user) {
        return ctx.badRequest('Invalid credentials');
      }

      // Validate password
      const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(
        password,
        user.password
      );

      if (!validPassword) {
        return ctx.badRequest('Invalid credentials');
      }

      if (user.blocked) {
        return ctx.badRequest('Your account has been blocked');
      }
      user = await normalizeUserUsername(strapi, user);

      // Generate JWT manually
      const token = jwt.sign(
        { id: user.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const organizations = await ensureActiveOrganizationMembership(user);

      ctx.send({
        jwt: token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        },
        organizations: organizations.map(organizationPayload)
      });
    } catch (error) {
      console.error('Login error:', error);
      ctx.badRequest(error.message);
    }
  },

  async clientLogin(ctx) {
    const { email, password } = ctx.request.body || {};

    if (!email || !password) {
      return ctx.badRequest('Email and password are required');
    }

    try {
      const result = await authenticateClientCredentials(strapi, email, password);
      if (!result.ok) {
        return ctx.send({ error: { message: result.message } }, result.status);
      }

      ctx.send({
        jwt: result.jwt,
        token: result.token,
        account: result.account,
        contacts: result.contacts,
        contact: result.contact,
        type: 'client',
      });
    } catch (error) {
      console.error('Client login error:', error);
      ctx.badRequest(error.message);
    }
  },

  async clientSignup(ctx) {
    const body = ctx.request.body || {};
    const email = normalizeString(body.email);
    const password = normalizeString(body.password);

    if (!email || !password) {
      return ctx.badRequest('Email and password are required');
    }
    if (password.length < 6) {
      return ctx.badRequest('Password must be at least 6 characters');
    }

    try {
      const mapped = mapPortalSignupBody(body);
      const provision = await ensureWebsiteClientAccount(strapi, mapped);
      if (!provision.ok) {
        return ctx.send(
          { error: { message: provision.error || 'Signup failed' } },
          provision.status || 400
        );
      }

      const loginResult = await authenticateClientCredentials(strapi, email, password);
      if (!loginResult.ok) {
        return ctx.send(
          { error: { message: loginResult.message || 'Account created but login failed' } },
          loginResult.status || 401
        );
      }

      ctx.send({
        success: true,
        jwt: loginResult.jwt,
        token: loginResult.token,
        account: loginResult.account,
        contacts: loginResult.contacts,
        contact: loginResult.contact,
        type: 'client',
      });
    } catch (error) {
      console.error('Client signup error:', error);
      ctx.badRequest(error.message);
    }
  },

  async clientVerifyOtp(ctx) {
    const { email, password } = ctx.request.body || {};
    if (!email) {
      return ctx.badRequest('Email is required');
    }

    try {
      const hasAccess = await emailHasPortalAccess(strapi, String(email));
      if (!hasAccess) {
        return ctx.send({ error: { message: 'Account not found' } }, 404);
      }

      if (password) {
        const loginResult = await authenticateClientCredentials(strapi, email, password);
        if (loginResult.ok) {
          return ctx.send({
            success: true,
            jwt: loginResult.jwt,
            token: loginResult.token,
            account: loginResult.account,
            contacts: loginResult.contacts,
            contact: loginResult.contact,
            type: 'client',
          });
        }
      }

      ctx.send({ success: true, message: 'Account verified' });
    } catch (error) {
      console.error('Client verify-otp error:', error);
      ctx.badRequest(error.message);
    }
  },

  async clientCheckEmail(ctx) {
    const email = ctx.query?.email || ctx.request.query?.email;
    if (!email || !String(email).includes('@')) {
      return ctx.badRequest('Valid email is required');
    }

    try {
      const exists = await emailHasPortalAccess(strapi, String(email));
      ctx.send({ exists });
    } catch (error) {
      console.error('Client check-email error:', error);
      ctx.send({ exists: false });
    }
  },

  async clientDedicatedPoc(ctx) {
    const token = readBearerToken(ctx);
    if (!token) {
      return ctx.unauthorized('Missing or invalid authorization header');
    }

    try {
      let decoded;
      try {
        decoded = verifyClientToken(token);
      } catch (err) {
        return ctx.unauthorized('Invalid or expired token');
      }

      const account = await loadClientAccount(strapi, decoded.clientAccountId);
      if (!account) {
        return ctx.notFound('Client account not found');
      }

      const dedicatedPoc = serializeDedicatedPocUser(account.assignedTo);
      const pocAssigned = Boolean(dedicatedPoc);

      ctx.send({
        pocAssigned,
        dedicatedPoc,
        pocAssignmentStatus: pocAssigned ? 'ASSIGNED' : 'UNASSIGNED',
        pocAssignedAt: pocAssigned ? account.updatedAt || null : null,
      });
    } catch (error) {
      console.error('Client dedicated-poc error:', error);
      ctx.badRequest(error.message);
    }
  },

  async websiteSignup(ctx) {
    if (!verifyLandingSignupSecret(ctx)) {
      return ctx.forbidden('Invalid or missing website signup secret.');
    }

    try {
      const result = await ensureWebsiteClientAccount(strapi, ctx.request.body || {});
      if (!result.ok) {
        return ctx.send(
          {
            error: result.error,
            primaryContactSync: result.primaryContactSync || null,
            defaultProjectSync: result.defaultProjectSync || null,
            clientPasswordSync: result.clientPasswordSync || null,
            companyNameSync: result.companyNameSync || null,
          },
          result.status || 400
        );
      }

      ctx.send(
        {
          clientAccount: result.data,
          data: result.data,
          primaryContactSync: result.primaryContactSync || null,
          defaultProjectSync: result.defaultProjectSync || null,
          clientPasswordSync: result.clientPasswordSync || null,
          companyNameSync: result.companyNameSync || null,
        },
        result.status || 200
      );
    } catch (error) {
      console.error('Website signup error:', error);
      ctx.badRequest(error.message);
    }
  },

  async websiteSimilarCompanies(ctx) {
    return handleSimilarCompaniesRequest(strapi, ctx);
  },

  async me(ctx) {
    try {
      const token = readBearerToken(ctx);
      if (!token) {
        return ctx.unauthorized('Missing or invalid authorization header');
      }

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return ctx.unauthorized('Invalid or expired token');
      }

      if (typeof decoded === 'string' || !decoded) {
        return ctx.unauthorized('Invalid token format');
      }

      if (decoded.type === 'client' && decoded.portalAccessId) {
        const session = await resolveClientSession(strapi, decoded.portalAccessId);
        if (!session) {
          return ctx.unauthorized('Client session not found');
        }
        return ctx.send(session);
      }

      if (!decoded.id) {
        return ctx.unauthorized('Invalid token format');
      }

      let user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: decoded.id },
      });

      if (!user || user.blocked) {
        return ctx.unauthorized('User not found or blocked');
      }
      user = await normalizeUserUsername(strapi, user);

      const organizations = await ensureActiveOrganizationMembership(user);

      ctx.send({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        organizations: organizations.map(organizationPayload),
      });
    } catch (error) {
      console.error('Me error:', error);
      ctx.badRequest(error.message);
    }
  },
};
