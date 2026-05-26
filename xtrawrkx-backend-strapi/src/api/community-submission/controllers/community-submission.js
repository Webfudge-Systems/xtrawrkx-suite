'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController(
  'api::community-submission.community-submission',
  ({ strapi }) => ({
    /**
     * GET /api/community-submissions/list-for-client?clientAccountId=…
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

      const pageSize = Math.min(
        Math.max(Number(ctx.query.pageSize) || 100, 1),
        200
      );

      const rows = await strapi.db
        .query('api::community-submission.community-submission')
        .findMany({
          where: { clientAccount: account.id },
          limit: pageSize,
          orderBy: { createdAt: 'desc' },
        });

      const data = rows.map((row) => ({
        id: row.id,
        documentId: row.documentId,
        attributes: {
          community: row.community,
          status: row.status,
          submissionData: row.submissionData,
          submissionId: row.submissionId,
          reviewNotes: row.reviewNotes,
          reviewedAt: row.reviewedAt,
        },
      }));

      return ctx.send({
        data,
        meta: { pagination: { total: data.length, pageSize: data.length } },
      });
    },

    /**
     * POST /api/community-submissions/join
     * Accepts clientAccountId (numeric id OR documentId string) and creates the
     * submission using strapi.db.query — bypasses Strapi 5 REST relation-format
     * validation which rejects plain ids / { connect } shapes for manyToOne.
     */
    async join(ctx) {
      const {
        clientAccountId,
        communityEnum,
        requirements,
        submissionId,
      } = ctx.request.body;

      if (!communityEnum) {
        return ctx.badRequest('communityEnum is required');
      }
      if (!requirements || typeof requirements !== 'object') {
        return ctx.badRequest('requirements must be an object');
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

      const sid =
        submissionId ||
        `WEB-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      const entry = await strapi.db
        .query('api::community-submission.community-submission')
        .create({
          data: {
            community: communityEnum,
            submissionData: requirements,
            submissionId: sid,
            status: 'SUBMITTED',
            ...(accountId ? { clientAccount: accountId } : {}),
          },
        });

      return ctx.send({ data: entry });
    },
  })
);
