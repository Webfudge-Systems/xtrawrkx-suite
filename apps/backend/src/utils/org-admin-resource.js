'use strict';

const { orgIdFromRelation, readListQuery, safeCount, resolveEntityPkForRouteParam } = require('./content-api-helpers');
const { requireAppSettingsManage } = require('./rbac');

function createOrgAdminController(strapi, uid, { requiredNameField = 'name', populate = [] } = {}) {
  return {
    async find(ctx) {
      if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');

      const { page, pageSize, sort } = readListQuery(ctx);
      const filters = { organization: ctx.state.orgId };

      const results = await strapi.entityService.findMany(uid, {
        filters,
        start: (page - 1) * pageSize,
        limit: pageSize,
        sort,
        populate,
      });

      const total = await safeCount(strapi, uid, filters, results.length);
      const pageCount = Math.ceil(Math.max(total, 1) / pageSize);
      return { data: results, meta: { pagination: { page, pageSize, pageCount, total } } };
    },

    async findOne(ctx) {
      if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');

      const pk = await resolveEntityPkForRouteParam(strapi, uid, ctx.params.id);
      if (pk == null) return ctx.notFound();

      const entry = await strapi.entityService.findOne(uid, pk, { populate });
      if (!entry) return ctx.notFound();
      if (orgIdFromRelation(entry.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }
      return { data: entry };
    },

    async create(ctx) {
      if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const denied = requireAppSettingsManage(ctx);
      if (denied) return denied;

      const body = ctx.request?.body || {};
      const payload = body.data || body;
      const data = typeof payload === 'object' ? { ...payload } : {};
      const name = typeof data[requiredNameField] === 'string' ? data[requiredNameField].trim() : '';
      if (!name) return ctx.badRequest(`${requiredNameField} is required`);

      data[requiredNameField] = name;
      data.organization = ctx.state.orgId;

      const entry = await strapi.entityService.create(uid, { data, populate });
      return { data: entry };
    },

    async update(ctx) {
      if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const denied = requireAppSettingsManage(ctx);
      if (denied) return denied;

      const pk = await resolveEntityPkForRouteParam(strapi, uid, ctx.params.id);
      if (pk == null) return ctx.notFound();

      const existing = await strapi.entityService.findOne(uid, pk, { populate: ['organization'] });
      if (!existing) return ctx.notFound();
      if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      const body = ctx.request?.body || {};
      const payload = body.data || body;
      const data = typeof payload === 'object' ? { ...payload } : {};
      delete data.organization;

      if (data[requiredNameField] != null) {
        const nextName = String(data[requiredNameField]).trim();
        if (!nextName) return ctx.badRequest(`${requiredNameField} is required`);
        data[requiredNameField] = nextName;
      }

      const entry = await strapi.entityService.update(uid, pk, { data, populate });
      return { data: entry };
    },

    async delete(ctx) {
      if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const denied = requireAppSettingsManage(ctx);
      if (denied) return denied;

      const pk = await resolveEntityPkForRouteParam(strapi, uid, ctx.params.id);
      if (pk == null) return ctx.notFound();

      const existing = await strapi.entityService.findOne(uid, pk, { populate: ['organization'] });
      if (!existing) return ctx.notFound();
      if (orgIdFromRelation(existing.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      const entry = await strapi.entityService.delete(uid, pk);
      return { data: entry };
    },
  };
}

module.exports = { createOrgAdminController };
