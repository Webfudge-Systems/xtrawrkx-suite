'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const {
  PENDING_SUBMISSION_STATUSES,
  ensureActiveMembership,
} = require('../../community-membership/utils/membership-helpers');

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
          approvedAt: row.approvedAt,
          rejectedAt: row.rejectedAt,
          rejectionReason: row.rejectionReason,
          createdAt: row.createdAt,
        },
      }));

      return ctx.send({
        data,
        meta: { pagination: { total: data.length, pageSize: data.length } },
      });
    },

    /**
     * POST /api/community-submissions/join
     * Creates a submission only — membership is created when POC approves.
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

      if (accountId) {
        const activeMembership = await strapi.db
          .query('api::community-membership.community-membership')
          .findOne({
            where: {
              clientAccount: accountId,
              community: communityEnum,
              status: 'ACTIVE',
            },
          });

        if (activeMembership) {
          return ctx.badRequest('You are already a member of this community');
        }

        const pendingSubmission = await strapi.db
          .query('api::community-submission.community-submission')
          .findOne({
            where: {
              clientAccount: accountId,
              community: communityEnum,
              status: { $in: PENDING_SUBMISSION_STATUSES },
            },
          });

        if (pendingSubmission) {
          return ctx.badRequest(
            'An application for this community is already pending approval'
          );
        }
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

    /**
     * POST /api/community-submissions/approve
     * POC approves a submission and activates community membership.
     */
    async approve(ctx) {
      const {
        submissionId: bodySubmissionId,
        id: bodyId,
        documentId: bodyDocumentId,
        reviewNotes,
        reviewedById,
      } = ctx.request.body;

      const submission = await findSubmission(strapi, {
        submissionId: bodySubmissionId,
        id: bodyId,
        documentId: bodyDocumentId,
      });

      if (!submission) {
        return ctx.notFound('Submission not found');
      }

      if (submission.status === 'APPROVED') {
        return ctx.send({ data: submission, alreadyApproved: true });
      }

      if (submission.status === 'REJECTED') {
        return ctx.badRequest('This submission was rejected and cannot be approved');
      }

      const accountId = submission.clientAccount?.id ?? submission.clientAccount;
      const now = new Date();

      const updated = await strapi.db
        .query('api::community-submission.community-submission')
        .update({
          where: { id: submission.id },
          data: {
            status: 'APPROVED',
            approvedAt: now,
            reviewedAt: now,
            reviewNotes: reviewNotes || submission.reviewNotes || null,
            ...(reviewedById ? { reviewedBy: reviewedById } : {}),
          },
        });

      const { entry: membership } = await ensureActiveMembership(strapi, {
        accountId,
        communityEnum: submission.community,
        membershipData: submission.submissionData,
      });

      return ctx.send({
        data: updated,
        membership,
      });
    },

    /**
     * POST /api/community-submissions/reject
     */
    async reject(ctx) {
      const {
        submissionId: bodySubmissionId,
        id: bodyId,
        documentId: bodyDocumentId,
        rejectionReason,
        reviewNotes,
        reviewedById,
      } = ctx.request.body;

      const submission = await findSubmission(strapi, {
        submissionId: bodySubmissionId,
        id: bodyId,
        documentId: bodyDocumentId,
      });

      if (!submission) {
        return ctx.notFound('Submission not found');
      }

      if (submission.status === 'APPROVED') {
        return ctx.badRequest('Approved submissions cannot be rejected');
      }

      const now = new Date();

      const updated = await strapi.db
        .query('api::community-submission.community-submission')
        .update({
          where: { id: submission.id },
          data: {
            status: 'REJECTED',
            rejectedAt: now,
            reviewedAt: now,
            rejectionReason: rejectionReason || 'Application not approved',
            reviewNotes: reviewNotes || submission.reviewNotes || null,
            ...(reviewedById ? { reviewedBy: reviewedById } : {}),
          },
        });

      return ctx.send({ data: updated });
    },
  })
);

async function findSubmission(strapi, { submissionId, id, documentId }) {
  if (submissionId) {
    return strapi.db
      .query('api::community-submission.community-submission')
      .findOne({
        where: { submissionId: String(submissionId).trim() },
        populate: ['clientAccount'],
      });
  }

  if (id != null && /^\d+$/.test(String(id))) {
    return strapi.db
      .query('api::community-submission.community-submission')
      .findOne({
        where: { id: Number(id) },
        populate: ['clientAccount'],
      });
  }

  if (documentId) {
    return strapi.db
      .query('api::community-submission.community-submission')
      .findOne({
        where: { documentId: String(documentId).trim() },
        populate: ['clientAccount'],
      });
  }

  return null;
}
