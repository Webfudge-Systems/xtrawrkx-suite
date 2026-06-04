'use strict';

/**
 * Direct messages — scoped to JWT user + optional org (X-Organization-Id).
 * Client cannot spoof sender; recipient must differ from sender.
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { emitDirectMessageNotification } = require('../../../utils/notification-emitter');
const { actorDisplayName } = require('../../../utils/crm-activity-log');
const UID = 'api::direct-message.direct-message';

/** users-permissions user only has id, username, email (no firstName/lastName on schema). */
const USER_POPULATE = ['sender', 'recipient'];

function relationUserId(rel) {
  if (rel == null) return null;
  if (typeof rel === 'object') {
    const id = rel.id;
    return id != null ? Number(id) : null;
  }
  const n = Number(rel);
  return Number.isNaN(n) ? null : n;
}

module.exports = createCoreController(UID, ({ strapi }) => ({
  /**
   * GET /direct-messages?withUser=<id>
   * Lists messages between current user and withUser (ascending by time).
   */
  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');

    const me = Number(ctx.state.user.id);
    const withUserRaw = ctx.query.withUser ?? ctx.query['filters[withUser][$eq]'];
    const withUserId = parseInt(withUserRaw, 10);

    if (Number.isNaN(withUserId) || withUserId < 1) {
      return ctx.badRequest('Query parameter withUser (numeric user id) is required');
    }

    if (withUserId === me) {
      return ctx.badRequest('Cannot list a conversation with yourself');
    }

    try {
      const andFilters = [
        {
          $or: [{ sender: me }, { recipient: me }],
        },
      ];
      if (ctx.state.orgId) {
        andFilters.push({ organization: ctx.state.orgId });
      }

      const poolLimit = Math.min(
        parseInt(ctx.query['pagination[pageSize]'] || ctx.query.pageSize || '500', 10),
        500
      );

      const pool = await strapi.entityService.findMany(UID, {
        filters: { $and: andFilters },
        sort: { createdAt: 'desc' },
        limit: poolLimit,
        populate: USER_POPULATE,
      });

      const thread = (pool || [])
        .filter((m) => {
          const sid = relationUserId(m.sender);
          const rid = relationUserId(m.recipient);
          return (sid === me && rid === withUserId) || (sid === withUserId && rid === me);
        })
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      return { data: thread };
    } catch (err) {
      strapi.log.error('[direct-message.find]', err?.message || err);
      return ctx.internalServerError('Failed to load messages');
    }
  },

  async findOne(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    const { id } = ctx.params;
    const me = Number(ctx.state.user.id);

    try {
      const msg = await strapi.entityService.findOne(UID, id, {
        populate: USER_POPULATE,
      });
      if (!msg) return ctx.notFound();

      const sid = relationUserId(msg.sender);
      const rid = relationUserId(msg.recipient);
      if (sid !== me && rid !== me) return ctx.forbidden('Access denied');

      return { data: msg };
    } catch (err) {
      strapi.log.error('[direct-message.findOne]', err?.message || err);
      return ctx.internalServerError('Failed to load message');
    }
  },

  async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');

    const body = ctx.request.body || {};
    const payload = body.data || body;
    const content = typeof payload.content === 'string' ? payload.content.trim() : '';
    const recipientRaw = payload.recipient ?? payload.recipientId;
    const recipientId = parseInt(recipientRaw, 10);

    if (!content) return ctx.badRequest('content is required');
    if (Number.isNaN(recipientId) || recipientId < 1) {
      return ctx.badRequest('recipient (user id) is required');
    }

    const me = Number(ctx.state.user.id);
    if (recipientId === me) return ctx.badRequest('Cannot send a message to yourself');

    const recipientUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: recipientId },
    });
    if (!recipientUser) return ctx.badRequest('Recipient not found');

    const data = {
      content,
      sender: me,
      recipient: recipientId,
    };
    if (ctx.state.orgId) {
      data.organization = ctx.state.orgId;
    }

    try {
      const entry = await strapi.entityService.create(UID, {
        data,
        populate: USER_POPULATE,
      });

      if (ctx.state.orgId) {
        const actorName = await actorDisplayName(strapi, me);
        try {
          await emitDirectMessageNotification(strapi, {
            organizationId: ctx.state.orgId,
            actorUserId: me,
            actorName,
            recipientId,
            content,
          });
        } catch (_) {
          /* best-effort */
        }
      }

      return { data: entry };
    } catch (err) {
      strapi.log.error('[direct-message.create]', err?.message || err);
      return ctx.internalServerError('Failed to send message');
    }
  },

  async update(ctx) {
    ctx.status = 405;
    return { error: { message: 'Method not allowed' } };
  },

  async delete(ctx) {
    ctx.status = 405;
    return { error: { message: 'Method not allowed' } };
  },
}));
