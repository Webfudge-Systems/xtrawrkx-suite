'use strict';

const jwt = require('jsonwebtoken');
const { createOrganizationOwnerMembership } = require('../../../utils/organization-role');
const { membershipSummary } = require('../../../utils/rbac');
const { normalizeUserUsername, uniqueUsernameFromEmail } = require('../../../utils/user-username');

// JWT secret - use environment variable or fallback to default
const JWT_SECRET = process.env.JWT_SECRET || 'myJwtSecret123456789012345678901234567890';

const ORG_MEMBERSHIP_UID = 'api::organization-user.organization-user';

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

function userPayload(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    isPlatformAdmin: Boolean(user.isPlatformAdmin),
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
          lastName: user.lastName,
          isPlatformAdmin: Boolean(user.isPlatformAdmin),
        },
        organizations: organizations.map(organizationPayload)
      });
    } catch (error) {
      console.error('Signup error:', error);
      ctx.badRequest(error.message);
    }
  },

  async platformLogin(ctx) {
    const { identifier, password } = ctx.request.body;

    if (!identifier || !password) {
      return ctx.badRequest('Identifier and password are required');
    }

    try {
      let user = await strapi.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [{ email: identifier.toLowerCase() }, { username: identifier }],
        },
      });

      if (!user) return ctx.badRequest('Invalid credentials');

      const validPassword = await strapi.plugins['users-permissions'].services.user.validatePassword(
        password,
        user.password
      );

      if (!validPassword) return ctx.badRequest('Invalid credentials');
      if (user.blocked) return ctx.badRequest('Your account has been blocked');
      if (!user.isPlatformAdmin) return ctx.forbidden('Only platform administrators can sign in here');

      user = await normalizeUserUsername(strapi, user);

      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

      ctx.send({ jwt: token, user: userPayload(user), organizations: [] });
    } catch (error) {
      console.error('Platform login error:', error);
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

      const organizations = user.isPlatformAdmin
        ? []
        : await ensureActiveOrganizationMembership(user);

      ctx.send({
        jwt: token,
        user: userPayload(user),
        organizations: organizations.map(organizationPayload),
      });
    } catch (error) {
      console.error('Login error:', error);
      ctx.badRequest(error.message);
    }
  },

  async me(ctx) {
    try {
      // Get token from Authorization header
      const authHeader = ctx.request.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ctx.unauthorized('Missing or invalid authorization header');
      }

      const token = authHeader.replace('Bearer ', '');

      // Verify JWT token manually
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return ctx.unauthorized('Invalid or expired token');
      }

      // Ensure decoded is an object with id property
      if (typeof decoded === 'string' || !decoded || !decoded.id) {
        return ctx.unauthorized('Invalid token format');
      }

      // Get user from database
      let user = await strapi.query('plugin::users-permissions.user').findOne({
        where: { id: decoded.id }
      });

      if (!user || user.blocked) {
        return ctx.unauthorized('User not found or blocked');
      }
      user = await normalizeUserUsername(strapi, user);

      const organizations = user.isPlatformAdmin
        ? []
        : await ensureActiveOrganizationMembership(user);

      ctx.send({
        user: userPayload(user),
        organizations: organizations.map(organizationPayload),
      });
    } catch (error) {
      console.error('Me error:', error);
      ctx.badRequest(error.message);
    }
  }
};
