'use strict';

/**
 * Client-portal chat — separate from CRM entity activity and PM direct messages.
 */

const { createCoreController } = require('@strapi/strapi').factories;
const {
  resolveClientPortalSession,
  clientAccountIdFromSession,
} = require('../../../utils/client-portal-request');
const {
  resolveEntityPkForRouteParam,
} = require('../../../utils/content-api-helpers');

const UID = 'api::chat-message.chat-message';
const CLIENT_ACCOUNT_UID = 'api::client-account.client-account';
const CRM_ACTIVITY_UID = 'api::crm-activity.crm-activity';

const { buildCommentMeta } = require('../../../utils/entity-attachments');
const { actorDisplayName } = require('../../../utils/crm-activity-log');

const POPULATE = ['clientAccount', 'authorClientAccount', 'authorContact', 'authorUser', 'organization'];

async function resolveClientAccountPk(strapi, rawId) {
  if (rawId == null || rawId === '') return null;
  const idStr = String(rawId).trim();
  const isNumeric = /^\d+$/.test(idStr);
  const row = await strapi.db.query(CLIENT_ACCOUNT_UID).findOne({
    where: isNumeric ? { id: Number(idStr) } : { documentId: idStr },
    populate: ['organization'],
  });
  return row || null;
}

function serializeRows(rows) {
  return (rows || []).map((row) => ({
    id: row.id,
    documentId: row.documentId,
    attributes: {
      message: row.message,
      channelKey: row.channelKey ?? '',
      fromClient: row.fromClient === true,
      entityType: row.entityType,
      entityId: row.entityId,
      isThreadStarter: row.isThreadStarter === true,
      authorClientAccount: row.authorClientAccount,
      authorContact: row.authorContact,
      authorUser: row.authorUser,
      clientAccount: row.clientAccount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
  }));
}

module.exports = createCoreController(UID, ({ strapi }) => ({
  /**
   * GET /chat-messages/clientAccount/:id?channelKey=&allChannels=true
   */
  async listForClientAccount(ctx) {
    const rawId = ctx.params.id;
    if (!rawId) return ctx.badRequest('Client account id is required');

    const account = await resolveClientAccountPk(strapi, rawId);
    if (!account) {
      return ctx.send({ data: [], meta: { pagination: { total: 0 } } });
    }

    const session = await resolveClientPortalSession(strapi, ctx);
    if (session) {
      const sessionAccountId = clientAccountIdFromSession(session);
      if (sessionAccountId != null && Number(sessionAccountId) !== Number(account.id)) {
        return ctx.forbidden('Access denied');
      }
    }

    const allChannels =
      ctx.query.allChannels === 'true' || ctx.query.allChannels === true;
    const channelKey = ctx.query.channelKey;

    const where = { clientAccount: account.id };
    if (!allChannels && channelKey != null && String(channelKey).trim() !== '') {
      where.channelKey = String(channelKey);
    } else if (!allChannels) {
      where.channelKey = '';
    }

    const rows = await strapi.db.query(UID).findMany({
      where,
      orderBy: { createdAt: 'asc' },
      limit: 500,
      populate: POPULATE,
    });

    return ctx.send({
      data: serializeRows(rows),
      meta: { pagination: { total: rows.length } },
    });
  },

  async create(ctx) {
    const body = ctx.request.body || {};
    const payload = body.data || body;
    const message =
      typeof payload.message === 'string' ? payload.message.trim() : '';
    if (!message) return ctx.badRequest('message is required');

    const entityIdRaw = payload.entityId ?? payload.clientAccountId;
    const channelKey =
      payload.channelKey != null ? String(payload.channelKey) : '';

    const session = await resolveClientPortalSession(strapi, ctx);
    const isInternalUser = Boolean(ctx.state.user);

    let account = null;
    let fromClient = false;
    let authorUser = null;
    let authorContact = null;
    let authorClientAccount = null;

    if (session) {
      const accountId = clientAccountIdFromSession(session);
      account = await resolveClientAccountPk(strapi, accountId || entityIdRaw);
      if (!account) return ctx.badRequest('Client account not found');
      fromClient = true;
      authorClientAccount = account.id;
      authorContact = session.user?.id ?? session.contact?.id ?? null;
    } else if (isInternalUser) {
      account = await resolveClientAccountPk(strapi, entityIdRaw);
      if (!account) return ctx.badRequest('Client account not found');
      fromClient = false;
      authorUser = ctx.state.user.id;
    } else {
      return ctx.unauthorized('Missing or invalid credentials');
    }

    const orgId =
      account.organization?.id ??
      (typeof account.organization === 'number' ? account.organization : null) ??
      ctx.state.orgId ??
      null;

    const entry = await strapi.db.query(UID).create({
      data: {
        message,
        channelKey,
        fromClient,
        entityType: payload.entityType || 'clientAccount',
        entityId: String(entityIdRaw || account.id),
        isThreadStarter: payload.isThreadStarter === true,
        clientAccount: account.id,
        ...(authorClientAccount ? { authorClientAccount } : {}),
        ...(authorContact ? { authorContact } : {}),
        ...(authorUser ? { authorUser } : {}),
        ...(orgId ? { organization: orgId } : {}),
      },
      populate: POPULATE,
    });

    try {
      let actorName = 'Client';
      let clientActor = null;
      if (fromClient && session) {
        const contact = session.contact || {};
        actorName =
          [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
          session.account?.companyName ||
          contact.email?.split('@')[0] ||
          'Client';
        clientActor = {
          id: `client-${account.id}`,
          username: actorName,
          email: contact.email || session.user?.email || null,
        };
      } else if (authorUser) {
        actorName = (await actorDisplayName(strapi, authorUser)) || 'Team member';
      }

      const accountLabel =
        (account.companyName || account.name || 'Client account').trim() || 'Client account';

      await strapi.entityService.create(CRM_ACTIVITY_UID, {
        data: {
          organization: orgId,
          actor: authorUser || null,
          action: 'comment',
          subjectType: 'client_account',
          subjectId: account.id,
          summary: fromClient
            ? `${actorName} sent a message on "${accountLabel}"`
            : `${actorName} replied on "${accountLabel}"`,
          meta: {
            ...buildCommentMeta({ comment: message }),
            chatMessageId: entry.id,
            fromClient,
            ...(clientActor ? { clientActor } : {}),
          },
        },
      });
    } catch (_) {
      /* best-effort timeline row */
    }

    return ctx.send({ data: serializeRows([entry])[0] });
  },

  async find(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const clientAccountRaw =
      ctx.query.clientAccountId ?? ctx.query['filters[clientAccount][id][$eq]'];
    if (!clientAccountRaw) {
      return ctx.badRequest('clientAccountId query parameter is required');
    }

    const account = await resolveClientAccountPk(strapi, clientAccountRaw);
    if (!account) return ctx.send({ data: [] });

    const rows = await strapi.db.query(UID).findMany({
      where: { clientAccount: account.id },
      orderBy: { createdAt: 'asc' },
      limit: 500,
      populate: POPULATE,
    });

    return ctx.send({ data: serializeRows(rows) });
  },

  async findOne(ctx) {
    ctx.status = 405;
    return { error: { message: 'Method not allowed' } };
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
