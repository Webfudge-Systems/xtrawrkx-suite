'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const VALID_COMMUNITY_ENUMS = new Set(['XEN', 'XEVFIN', 'XEVTG', 'XDD']);

/**
 * Append a community code to client-account.selectedCommunities (JSON).
 * CRM "Selected Communities" and onboarding flows read this array.
 */
function mergeSelectedCommunities(existing, communityEnum) {
  const code = String(communityEnum || '').trim().toUpperCase();
  if (!VALID_COMMUNITY_ENUMS.has(code)) {
    return Array.isArray(existing) ? existing : [];
  }

  const base = Array.isArray(existing)
    ? existing.map((x) => String(x).trim()).filter(Boolean)
    : [];

  const upper = new Set(base.map((x) => x.toUpperCase()));
  if (upper.has(code)) {
    return base;
  }

  return [...base, code];
}

async function registerCommunityOnClientAccount(strapi, accountId, communityEnum) {
  if (!accountId || !communityEnum) return;

  const account = await strapi.db
    .query('api::client-account.client-account')
    .findOne({
      where: { id: accountId },
      select: ['id', 'selectedCommunities'],
    });

  if (!account) return;

  const nextSelected = mergeSelectedCommunities(
    account.selectedCommunities,
    communityEnum
  );

  await strapi.db.query('api::client-account.client-account').update({
    where: { id: accountId },
    data: { selectedCommunities: nextSelected },
  });
}

module.exports = createCoreController(
  'api::community-membership.community-membership',
  ({ strapi }) => ({
    /**
     * GET /api/community-memberships/list-for-client?clientAccountId=…&status=ACTIVE
     * Uses db layer so CRM / website avoid Strapi 5 REST relation filters (400).
     */
    async listForClient(ctx) {
      const raw =
        ctx.query.clientAccountId ?? ctx.query.accountId ?? ctx.query.id;
      if (!raw) {
        return ctx.badRequest('clientAccountId is required');
      }

      const idStr = String(raw).trim();
      const isNumeric = /^\d+$/.test(idStr);
      const account = await strapi.db
        .query('api::client-account.client-account')
        .findOne({
          where: isNumeric ? { id: Number(idStr) } : { documentId: idStr },
          select: ['id'],
        });

      if (!account) {
        return ctx.send({
          data: [],
          meta: { pagination: { total: 0, pageSize: 0 } },
        });
      }

      const where = { clientAccount: account.id };
      const statusQ = ctx.query.status;
      if (statusQ && String(statusQ).trim()) {
        where.status = String(statusQ).trim();
      }

      const pageSize = Math.min(
        Math.max(Number(ctx.query.pageSize) || 100, 1),
        200
      );

      const rows = await strapi.db
        .query('api::community-membership.community-membership')
        .findMany({
          where,
          limit: pageSize,
          orderBy: { createdAt: 'desc' },
        });

      const data = rows.map((row) => ({
        id: row.id,
        documentId: row.documentId,
        attributes: {
          community: row.community,
          status: row.status,
          joinedAt: row.joinedAt,
          membershipType: row.membershipType,
          membershipData: row.membershipData,
        },
      }));

      return ctx.send({
        data,
        meta: { pagination: { total: data.length, pageSize: data.length } },
      });
    },

    /**
     * POST /api/community-memberships/ensure
     * Creates an ACTIVE membership if one doesn't already exist for this
     * client+community pair. Accepts clientAccountId as numeric id or documentId.
     */
    async ensure(ctx) {
      const {
        clientAccountId,
        communityEnum,
        membershipData,
      } = ctx.request.body;

      if (!communityEnum) {
        return ctx.badRequest('communityEnum is required');
      }

      // Resolve clientAccount to a numeric db id
      let accountId = null;
      if (clientAccountId) {
        const idStr = String(clientAccountId).trim();
        const isNumeric = /^\d+$/.test(idStr);
        const account = await strapi.db
          .query('api::client-account.client-account')
          .findOne({
            where: isNumeric ? { id: Number(idStr) } : { documentId: idStr },
            select: ['id'],
          });
        if (account) accountId = account.id;
      }

      // Check for existing ACTIVE membership
      const existing = await strapi.db
        .query('api::community-membership.community-membership')
        .findOne({
          where: {
            community: communityEnum,
            status: 'ACTIVE',
            ...(accountId ? { clientAccount: accountId } : {}),
          },
        });

      if (existing) {
        await registerCommunityOnClientAccount(strapi, accountId, communityEnum);
        return ctx.send({ data: existing, alreadyMember: true });
      }

      const entry = await strapi.db
        .query('api::community-membership.community-membership')
        .create({
          data: {
            community: communityEnum,
            membershipType: 'FREE',
            status: 'ACTIVE',
            joinedAt: new Date(),
            membershipData: membershipData || null,
            ...(accountId ? { clientAccount: accountId } : {}),
          },
        });

      await registerCommunityOnClientAccount(strapi, accountId, communityEnum);

      return ctx.send({ data: entry, alreadyMember: false });
    },
  })
);
