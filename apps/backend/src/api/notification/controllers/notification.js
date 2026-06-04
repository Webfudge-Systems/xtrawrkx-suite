'use strict';

/**
 * notification controller
 * - Scoped to the requesting user + their active organization.
 * - Client cannot spoof userId; the server always uses ctx.state.user.id.
 */

const { createCoreController } = require('@strapi/strapi').factories;
const UID = 'api::notification.notification';

module.exports = createCoreController(UID, ({ strapi }) => ({
  // GET /notifications - list notifications for current user in current org
  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');

    const query = ctx.query || {};
    const page = parseInt(query['pagination[page]'] || query.page || '1', 10);
    const pageSize = Math.min(
      parseInt(query['pagination[pageSize]'] || query.pageSize || '25', 10),
      100
    );

    const filters = {
      user: ctx.state.user.id,
      ...(ctx.state.orgId && { organization: ctx.state.orgId }),
    };

    const sort = query.sort || 'createdAt:desc';
    const [sortField, sortOrder] = sort.split(':');

    const results = await strapi.entityService.findMany(UID, {
      filters,
      start: (page - 1) * pageSize,
      limit: pageSize,
      sort: sortField
        ? { [sortField]: (sortOrder || 'desc').toUpperCase() }
        : { createdAt: 'DESC' },
    });

    let total = results.length;
    try {
      total = await strapi.db.query(UID).count({ where: filters });
    } catch (_) {}
    const pageCount = Math.ceil(Math.max(total, 1) / pageSize);
    return { data: results, meta: { pagination: { page, pageSize, pageCount, total } } };
  },

  // PUT /notifications/:id - mark notification as read (user can only update their own)
  async update(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne(UID, id, { populate: ['user'] });
    if (!existing) return ctx.notFound();
    if (existing.user?.id !== ctx.state.user.id) return ctx.forbidden('Access denied');

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    // Only allow marking as read
    const data = {
      isRead: payload.isRead ?? true,
      readAt: payload.isRead === false ? null : (payload.readAt || new Date().toISOString()),
    };

    const entry = await strapi.entityService.update(UID, id, { data });
    return { data: entry };
  },

  // DELETE /notifications/:id - user can delete their own notifications
  async delete(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    const { id } = ctx.params;

    const existing = await strapi.entityService.findOne(UID, id, { populate: ['user'] });
    if (!existing) return ctx.notFound();
    if (existing.user?.id !== ctx.state.user.id) return ctx.forbidden('Access denied');

    const entry = await strapi.entityService.delete(UID, id);
    return { data: entry };
  },

  // POST /notifications - internal/service only (auto-sets user + org from ctx)
  async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const body = ctx.request?.body || {};
    const payload = body.data || body;
    const data = typeof payload === 'object' ? { ...payload } : {};

    // Always override to current user + org (server-side safety)
    data.user = ctx.state.user.id;
    data.organization = ctx.state.orgId;
    data.isRead = false;

    const entry = await strapi.entityService.create(UID, { data });
    return { data: entry };
  },
}));
