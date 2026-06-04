'use strict';

const { resolveOrganizationRoleId } = require('../../../utils/organization-role');
const { uniqueUsernameFromEmail } = require('../../../utils/user-username');
const { logPlatformActivity, ACTIVITY_UID, buildLegacyActivityItems, mergeActivityItems } = require('../../../utils/platform-activity-log');

const ORG_UID = 'api::organization.organization';
const ORG_USER_UID = 'api::organization-user.organization-user';

function toSlug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueOrgSlug(strapi, name) {
  const base = toSlug(name) || 'organization';
  let slug = base;
  let suffix = 1;
  while (true) {
    const existing = await strapi.entityService.findMany(ORG_UID, {
      filters: { slug },
      limit: 1,
    });
    if (!existing.length) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

async function findOrCreateOwnerUser(strapi, { email, password, firstName, lastName }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) return null;

  let user = await strapi.query('plugin::users-permissions.user').findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    if (!password || String(password).length < 8) {
      throw new Error('Owner password is required (min 8 characters) when creating a new owner account');
    }
    user = await strapi.plugins['users-permissions'].services.user.add({
      username: await uniqueUsernameFromEmail(strapi, normalizedEmail),
      email: normalizedEmail,
      password,
      firstName: firstName || normalizedEmail.split('@')[0],
      lastName: lastName || '',
      confirmed: true,
      blocked: false,
      provider: 'local',
      isPlatformAdmin: false,
    });
  }

  return user;
}

module.exports = ({ strapi }) => ({
  async listOrganizations({ page = 1, pageSize = 50, search = '' } = {}) {
    const filters = {};
    if (search) {
      filters.$or = [
        { name: { $containsi: search } },
        { companyEmail: { $containsi: search } },
        { slug: { $containsi: search } },
      ];
    }

    const start = (page - 1) * pageSize;
    const rows = await strapi.entityService.findMany(ORG_UID, {
      filters,
      sort: { createdAt: 'desc' },
      start,
      limit: pageSize,
      populate: ['owner'],
    });

    const total = await strapi.db.query(ORG_UID).count({ where: filters });

    const enriched = await Promise.all(
      (rows || []).map(async (org) => {
        const memberCount = await strapi.db.query(ORG_USER_UID).count({
          where: { organization: org.id, isActive: true },
        });
        const subscriptions = await strapi.entityService.findMany('api::subscription.subscription', {
          filters: { organization: org.id },
          populate: ['app'],
          limit: 10,
        });
        return {
          ...org,
          memberCount,
          subscriptions,
        };
      })
    );

    return {
      data: enriched,
      meta: {
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(Math.max(total, 1) / pageSize),
          total,
        },
      },
    };
  },

  /**
   * Provision an internal tenant workspace.
   * Accepts: name, ownerEmail, ownerPassword?, ownerFirstName?, ownerLastName?, status?
   */
  async createOrganization(payload = {}, actorUserId = null) {
    const name = String(payload.name || '').trim();
    if (!name) throw new Error('Organization name is required');

    const ownerEmail = String(payload.ownerEmail || '').trim().toLowerCase();
    if (!ownerEmail) throw new Error('Owner email is required');

    const slug = await uniqueOrgSlug(strapi, name);
    const status = payload.status || 'trial';

    const ownerUser = await findOrCreateOwnerUser(strapi, {
      email: ownerEmail,
      password: payload.ownerPassword,
      firstName: payload.ownerFirstName,
      lastName: payload.ownerLastName,
    });

    const organization = await strapi.entityService.create(ORG_UID, {
      data: {
        name,
        slug,
        companyEmail: ownerEmail,
        owner: ownerUser.id,
        status,
        onboardingCompleted: true,
        trialEndsAt:
          status === 'trial' ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
      },
    });

    const adminRoleId = await resolveOrganizationRoleId(strapi, 'Admin');
    const membership = await strapi.entityService.create(ORG_USER_UID, {
      data: {
        user: ownerUser.id,
        organization: organization.id,
        role: adminRoleId,
        isActive: true,
        joinedAt: new Date(),
      },
      populate: { user: true, role: true },
    });

    await logPlatformActivity(strapi, {
      organizationId: organization.id,
      actorUserId,
      action: 'create',
      subjectType: 'organization',
      entity: organization,
      patch: { name, status, companyEmail: ownerEmail, slug },
    });

    await logPlatformActivity(strapi, {
      organizationId: organization.id,
      actorUserId,
      action: 'create',
      subjectType: 'organization_member',
      entity: {
        id: membership.id,
        email: ownerEmail,
        user: ownerUser,
        role: membership.role,
      },
      patch: { email: ownerEmail, role: 'Admin' },
    });

    return organization;
  },

  async updateOrganization(id, payload = {}, actorUserId = null) {
    const allowed = ['name', 'companyEmail', 'companyPhone', 'website', 'industry', 'size', 'status'];
    const data = {};
    allowed.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        data[key] = payload[key];
      }
    });
    if (Object.keys(data).length === 0) {
      throw new Error('No supported fields to update');
    }

    const previous = await strapi.entityService.findOne(ORG_UID, id);
    if (!previous) throw new Error('Organization not found');

    const updated = await strapi.entityService.update(ORG_UID, id, { data, populate: ['owner'] });

    await logPlatformActivity(strapi, {
      organizationId: id,
      actorUserId,
      action: 'update',
      subjectType: 'organization',
      entity: updated,
      previousEntity: previous,
      patch: data,
    });

    return updated;
  },

  async getOrganization(id) {
    const org = await strapi.entityService.findOne(ORG_UID, id, {
      populate: {
        owner: true,
        subscriptions: { populate: { app: true, selectedModules: true } },
        organizationUsers: { populate: { user: true, role: true } },
      },
    });
    if (!org) return null;
    return org;
  },

  async listOrganizationActivities(id, { limit = 50 } = {}) {
    const org = await strapi.entityService.findOne(ORG_UID, id, {
      populate: {
        subscriptions: { populate: { app: true } },
      },
    });
    if (!org) return null;

    const rows = await strapi.entityService.findMany(ACTIVITY_UID, {
      filters: { organization: id },
      sort: { createdAt: 'desc' },
      limit: Math.min(Math.max(1, limit), 100),
      populate: { actor: { fields: ['username', 'email'] } },
    });

    const apiItems = (rows || []).map((row) => ({
      id: row.id,
      action: row.action,
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      summary: row.summary,
      meta: row.meta,
      createdAt: row.createdAt,
      actor: row.actor,
    }));

    const legacyItems = buildLegacyActivityItems(org);
    return mergeActivityItems(apiItems, legacyItems).slice(0, Math.min(Math.max(1, limit), 100));
  },

  async deleteOrganization(id) {
    const org = await strapi.entityService.findOne(ORG_UID, id);
    if (!org) throw new Error('Organization not found');

    const members = await strapi.entityService.findMany(ORG_USER_UID, {
      filters: { organization: id },
      limit: 500,
    });
    for (const member of members) {
      await strapi.entityService.delete(ORG_USER_UID, member.id);
    }

    const subscriptions = await strapi.entityService.findMany('api::subscription.subscription', {
      filters: { organization: id },
      limit: 50,
    });
    for (const sub of subscriptions) {
      await strapi.entityService.delete('api::subscription.subscription', sub.id);
    }

    await strapi.entityService.delete(ORG_UID, id);
    return { id: org.id };
  },
});
