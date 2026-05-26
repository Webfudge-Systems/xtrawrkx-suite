'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { ensureActiveMembership } = require('../utils/membership-helpers');

module.exports = createCoreController(
  'api::community-membership.community-membership',
  ({ strapi }) => ({
    /**
     * GET /api/community-memberships/list-for-client?clientAccountId=…&status=ACTIVE
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
     * Creates an ACTIVE membership (CRM approval / internal use only).
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

      const { entry, alreadyMember } = await ensureActiveMembership(strapi, {
        accountId,
        communityEnum,
        membershipData,
      });

      return ctx.send({ data: entry, alreadyMember });
    },
  })
);
