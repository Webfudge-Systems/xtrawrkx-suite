'use strict';

/**
 * Factory that creates standard org-scoped CRUD controller methods.
 * Every Books content type uses this as its base and can override specific methods.
 */
const { createCoreController } = require('@strapi/strapi').factories;

function relId(rel) {
  if (rel == null) return null;
  return typeof rel === 'object' ? rel.id ?? null : rel;
}

function makeBooksCrudController(uid, { defaultPopulate = [], extraFilters = () => ({}) } = {}) {
  return createCoreController(uid, ({ strapi }) => ({
    async find(ctx) {
      if (!ctx.state.user) return ctx.unauthorized();
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');

      const q = ctx.query || {};
      const page = parseInt(q.page || '1', 10);
      const limit = Math.min(parseInt(q.limit || '20', 10), 200);
      const filters = { organization: ctx.state.orgId, ...extraFilters(q) };
      if (q.search) filters.$or = [{ name: { $containsi: q.search } }, { description: { $containsi: q.search } }];
      if (q.status) filters.status = q.status;

      const [results, total] = await Promise.all([
        strapi.entityService.findMany(uid, {
          filters,
          start: (page - 1) * limit,
          limit,
          sort: q.sort || { createdAt: 'desc' },
          populate: defaultPopulate,
        }),
        strapi.db.query(uid).count({ where: filters }),
      ]);

      return { data: results, meta: { pagination: { page, limit, total, pageCount: Math.ceil(total / limit) } } };
    },

    async findOne(ctx) {
      if (!ctx.state.user) return ctx.unauthorized();
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const entry = await strapi.entityService.findOne(uid, ctx.params.id, { populate: defaultPopulate });
      if (!entry) return ctx.notFound();
      if (relId(entry.organization) !== ctx.state.orgId) return ctx.forbidden();
      return { data: entry };
    },

    async create(ctx) {
      if (!ctx.state.user) return ctx.unauthorized();
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const body = ctx.request?.body || {};
      const data = { ...(body.data || body), organization: ctx.state.orgId, createdByUser: ctx.state.user.id };
      delete data.id;
      const entry = await strapi.entityService.create(uid, { data, populate: defaultPopulate });
      return { data: entry };
    },

    async update(ctx) {
      if (!ctx.state.user) return ctx.unauthorized();
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const existing = await strapi.entityService.findOne(uid, ctx.params.id, { populate: ['organization'] });
      if (!existing) return ctx.notFound();
      if (relId(existing.organization) !== ctx.state.orgId) return ctx.forbidden();
      const body = ctx.request?.body || {};
      const data = { ...(body.data || body) };
      delete data.organization;
      const entry = await strapi.entityService.update(uid, ctx.params.id, { data, populate: defaultPopulate });
      return { data: entry };
    },

    async delete(ctx) {
      if (!ctx.state.user) return ctx.unauthorized();
      if (!ctx.state.orgId) return ctx.forbidden('No active organization');
      const existing = await strapi.entityService.findOne(uid, ctx.params.id, { populate: ['organization'] });
      if (!existing) return ctx.notFound();
      if (relId(existing.organization) !== ctx.state.orgId) return ctx.forbidden();
      const entry = await strapi.entityService.delete(uid, ctx.params.id);
      return { data: entry };
    },
  }));
}

function makeCoreRoutes(pluralPath, handlerBase, extras = []) {
  return {
    type: 'content-api',
    routes: [
      { method: 'GET',    path: `/${pluralPath}`,     handler: `${handlerBase}.find`,    config: { auth: false } },
      { method: 'GET',    path: `/${pluralPath}/:id`, handler: `${handlerBase}.findOne`, config: { auth: false } },
      { method: 'POST',   path: `/${pluralPath}`,     handler: `${handlerBase}.create`,  config: { auth: false } },
      { method: 'PUT',    path: `/${pluralPath}/:id`, handler: `${handlerBase}.update`,  config: { auth: false } },
      { method: 'DELETE', path: `/${pluralPath}/:id`, handler: `${handlerBase}.delete`,  config: { auth: false } },
      ...extras,
    ],
  };
}

module.exports = { makeBooksCrudController, makeCoreRoutes, relId };
