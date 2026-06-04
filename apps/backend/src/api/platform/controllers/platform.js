'use strict';

const { requirePlatformAdmin } = require('../../../utils/platform-admin');

module.exports = {
  async listOrganizations(ctx) {
    const denied = requirePlatformAdmin(ctx);
    if (denied) return denied;

    const page = Math.max(1, parseInt(ctx.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(ctx.query.pageSize, 10) || 25));
    const search = ctx.query.search || ctx.query.q || '';

    try {
      const result = await strapi.service('api::platform.platform').listOrganizations({
        page,
        pageSize,
        search,
      });
      return ctx.send({ success: true, ...result });
    } catch (error) {
      console.error('Platform list organizations error:', error);
      return ctx.badRequest(error.message || 'Failed to list organizations');
    }
  },

  async createOrganization(ctx) {
    const denied = requirePlatformAdmin(ctx);
    if (denied) return denied;

    try {
      const organization = await strapi.service('api::platform.platform').createOrganization(
        ctx.request.body || {},
        ctx.state.user?.id
      );
      return ctx.send({ success: true, data: organization });
    } catch (error) {
      console.error('Platform create organization error:', error);
      return ctx.badRequest(error.message || 'Failed to create organization');
    }
  },

  async getOrganization(ctx) {
    const denied = requirePlatformAdmin(ctx);
    if (denied) return denied;

    try {
      const organization = await strapi.service('api::platform.platform').getOrganization(ctx.params.id);
      if (!organization) return ctx.notFound('Organization not found');
      return ctx.send({ success: true, data: organization });
    } catch (error) {
      console.error('Platform get organization error:', error);
      return ctx.badRequest(error.message || 'Failed to load organization');
    }
  },

  async updateOrganization(ctx) {
    const denied = requirePlatformAdmin(ctx);
    if (denied) return denied;

    try {
      const organization = await strapi.service('api::platform.platform').updateOrganization(
        ctx.params.id,
        ctx.request.body || {},
        ctx.state.user?.id
      );
      return ctx.send({ success: true, data: organization });
    } catch (error) {
      console.error('Platform update organization error:', error);
      return ctx.badRequest(error.message || 'Failed to update organization');
    }
  },

  async deleteOrganization(ctx) {
    const denied = requirePlatformAdmin(ctx);
    if (denied) return denied;

    try {
      const result = await strapi.service('api::platform.platform').deleteOrganization(ctx.params.id);
      return ctx.send({ success: true, data: result });
    } catch (error) {
      console.error('Platform delete organization error:', error);
      return ctx.badRequest(error.message || 'Failed to delete organization');
    }
  },

  async getOrganizationActivities(ctx) {
    const denied = requirePlatformAdmin(ctx);
    if (denied) return denied;

    try {
      const limit = parseInt(ctx.query.limit, 10) || 50;
      const activities = await strapi.service('api::platform.platform').listOrganizationActivities(
        ctx.params.id,
        { limit }
      );
      if (activities == null) return ctx.notFound('Organization not found');
      return ctx.send({ success: true, data: activities });
    } catch (error) {
      console.error('Platform get organization activities error:', error);
      return ctx.badRequest(error.message || 'Failed to load organization activities');
    }
  },

  async stats(ctx) {
    const denied = requirePlatformAdmin(ctx);
    if (denied) return denied;

    try {
      const total = await strapi.db.query('api::organization.organization').count({});
      const active = await strapi.db.query('api::organization.organization').count({
        where: { status: 'active' },
      });
      const trial = await strapi.db.query('api::organization.organization').count({
        where: { status: 'trial' },
      });
      const suspended = await strapi.db.query('api::organization.organization').count({
        where: { status: 'suspended' },
      });
      return ctx.send({
        success: true,
        data: { total, active, trial, suspended },
      });
    } catch (error) {
      return ctx.badRequest(error.message || 'Failed to load stats');
    }
  },
};
