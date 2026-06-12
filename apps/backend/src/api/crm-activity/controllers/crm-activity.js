'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const UID = 'api::crm-activity.crm-activity';
const CONTACT_UID = 'api::contact.contact';
const LEAD_UID = 'api::lead-company.lead-company';
const DEAL_UID = 'api::deal.deal';
const CLIENT_ACCOUNT_UID = 'api::client-account.client-account';
const MEETING_UID = 'api::meeting.meeting';
const TASK_UID = 'api::task.task';
const PROJECT_UID = 'api::project.project';

const {
  emitCommentNotifications,
  taskStakeholderIds,
  projectStakeholderIds,
  assignedStakeholderIds,
} = require('../../../utils/notification-emitter');
const {
  normalizeAttachmentsPayload,
  enrichAttachments,
  buildCommentMeta,
  syncChatAttachments,
} = require('../../../utils/entity-attachments');

async function notifyAfterComment(strapi, {
  organizationId,
  actorUserId,
  actorName,
  subjectType,
  subjectId,
  entityName,
  comment,
  entity,
}) {
  let stakeholderIds = assignedStakeholderIds(entity);
  if (subjectType === 'task') stakeholderIds = taskStakeholderIds(entity);
  else if (subjectType === 'project') stakeholderIds = projectStakeholderIds(entity);

  try {
    await emitCommentNotifications(strapi, {
      organizationId,
      actorUserId,
      actorName,
      subjectType,
      subjectId,
      entityName,
      comment,
      stakeholderIds,
    });
  } catch (_) {
    /* best-effort */
  }
}

function orgIdFromRelation(rel) {
  if (rel == null) return null;
  if (typeof rel === 'object') return rel.id ?? null;
  return rel;
}

function commentKindFromMeta(meta) {
  if (!meta || typeof meta !== 'object') return 'general';
  return meta.commentKind === 'next_connect' ? 'next_connect' : 'general';
}

function normalizeCommentKind(raw) {
  const value = String(raw || 'general').trim().toLowerCase();
  return value === 'next_connect' ? 'next_connect' : 'general';
}

function filterActivitiesByCommentKind(rows, commentKind) {
  if (!commentKind || commentKind === 'all') return rows;
  if (commentKind === 'next_connect') {
    return rows.filter((row) => commentKindFromMeta(row.meta) === 'next_connect');
  }
  if (commentKind === 'general') {
    return rows.filter((row) => commentKindFromMeta(row.meta) !== 'next_connect');
  }
  return rows;
}

async function countLeadCompanyComments(strapi, orgId, leadCompanyId, commentKind) {
  if (!commentKind || commentKind === 'all') {
    return strapi.db.query(UID).count({
      where: {
        organization: orgId,
        leadCompany: leadCompanyId,
        action: 'comment',
      },
    });
  }

  const rows = await strapi.entityService.findMany(UID, {
    filters: {
      organization: orgId,
      leadCompany: leadCompanyId,
      action: 'comment',
    },
    fields: ['meta'],
    limit: 500,
  });
  return filterActivitiesByCommentKind(rows, commentKind).length;
}

module.exports = createCoreController(UID, ({ strapi }) => ({
  /**
   * GET /crm-activities/timeline?contactId= | ?leadCompanyId= | ?dealId= | ?clientAccountId= | ?projectId=
   * Exactly one scope param.
   */
  async timeline(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const q = ctx.query || {};
    const contactIdRaw = q.contactId ?? q['contactId'];
    const leadIdRaw = q.leadCompanyId ?? q['leadCompanyId'];
    const dealIdRaw = q.dealId ?? q['dealId'];
    const clientAccountIdRaw = q.clientAccountId ?? q['clientAccountId'];
    const meetingIdRaw = q.meetingId ?? q['meetingId'];
    const taskIdRaw = q.taskId ?? q['taskId'];
    const projectIdRaw = q.projectId ?? q['projectId'];

    const hasContact =
      contactIdRaw != null && String(contactIdRaw).trim() !== '' && contactIdRaw !== 'undefined';
    const hasLead =
      leadIdRaw != null && String(leadIdRaw).trim() !== '' && leadIdRaw !== 'undefined';
    const hasDeal =
      dealIdRaw != null && String(dealIdRaw).trim() !== '' && dealIdRaw !== 'undefined';
    const hasClientAccount =
      clientAccountIdRaw != null &&
      String(clientAccountIdRaw).trim() !== '' &&
      clientAccountIdRaw !== 'undefined';
    const hasMeeting =
      meetingIdRaw != null && String(meetingIdRaw).trim() !== '' && meetingIdRaw !== 'undefined';
    const hasTask =
      taskIdRaw != null && String(taskIdRaw).trim() !== '' && taskIdRaw !== 'undefined';
    const hasProject =
      projectIdRaw != null && String(projectIdRaw).trim() !== '' && projectIdRaw !== 'undefined';

    const scopeCount = [
      hasContact,
      hasLead,
      hasDeal,
      hasClientAccount,
      hasMeeting,
      hasTask,
      hasProject,
    ].filter(Boolean).length;
    if (scopeCount !== 1) {
      return ctx.badRequest(
        'Provide exactly one of contactId, leadCompanyId, dealId, clientAccountId, meetingId, taskId, or projectId'
      );
    }

    const limit = Math.min(parseInt(q.limit || q['limit'] || '50', 10), 100);
    const type = String(q.type || q['type'] || '').trim().toLowerCase();
    const commentKind = String(q.commentKind || q['commentKind'] || '').trim().toLowerCase();

    let filters;

    if (hasContact) {
      const cid = parseInt(String(contactIdRaw), 10);
      if (Number.isNaN(cid)) return ctx.badRequest('Invalid contactId');

      const contact = await strapi.entityService.findOne(CONTACT_UID, cid, {
        populate: ['organization'],
      });
      if (!contact) return ctx.notFound();
      if (orgIdFromRelation(contact.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      filters = {
        organization: ctx.state.orgId,
        subjectType: 'contact',
        subjectId: cid,
      };
    } else if (hasLead) {
      const lid = parseInt(String(leadIdRaw), 10);
      if (Number.isNaN(lid)) return ctx.badRequest('Invalid leadCompanyId');

      const lead = await strapi.entityService.findOne(LEAD_UID, lid, {
        populate: ['organization'],
      });
      if (!lead) return ctx.notFound();
      if (orgIdFromRelation(lead.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      filters = {
        organization: ctx.state.orgId,
        leadCompany: lid,
      };
    } else if (hasDeal) {
      const did = parseInt(String(dealIdRaw), 10);
      if (Number.isNaN(did)) return ctx.badRequest('Invalid dealId');

      const deal = await strapi.entityService.findOne(DEAL_UID, did, {
        populate: ['organization'],
      });
      if (!deal) return ctx.notFound();
      if (orgIdFromRelation(deal.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      filters = {
        organization: ctx.state.orgId,
        subjectType: 'deal',
        subjectId: did,
      };
    } else if (hasMeeting) {
      const mid = parseInt(String(meetingIdRaw), 10);
      if (Number.isNaN(mid)) return ctx.badRequest('Invalid meetingId');

      const meeting = await strapi.entityService.findOne(MEETING_UID, mid, {
        populate: ['organization'],
      });
      if (!meeting) return ctx.notFound();
      if (orgIdFromRelation(meeting.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      filters = {
        organization: ctx.state.orgId,
        subjectType: 'meeting',
        subjectId: mid,
      };
    } else if (hasTask) {
      const tid = parseInt(String(taskIdRaw), 10);
      if (Number.isNaN(tid)) return ctx.badRequest('Invalid taskId');

      const task = await strapi.entityService.findOne(TASK_UID, tid, {
        populate: ['organization'],
      });
      if (!task) return ctx.notFound();
      if (orgIdFromRelation(task.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      filters = {
        organization: ctx.state.orgId,
        subjectType: 'task',
        subjectId: tid,
      };
    } else if (hasProject) {
      const pid = parseInt(String(projectIdRaw), 10);
      if (Number.isNaN(pid)) return ctx.badRequest('Invalid projectId');

      const proj = await strapi.entityService.findOne(PROJECT_UID, pid, {
        populate: ['organization'],
      });
      if (!proj) return ctx.notFound();
      if (orgIdFromRelation(proj.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      filters = {
        organization: ctx.state.orgId,
        subjectType: 'project',
        subjectId: pid,
      };
    } else {
      // hasClientAccount
      const caid = parseInt(String(clientAccountIdRaw), 10);
      if (Number.isNaN(caid)) return ctx.badRequest('Invalid clientAccountId');

      const clientAccount = await strapi.entityService.findOne(CLIENT_ACCOUNT_UID, caid, {
        populate: ['organization'],
      });
      if (!clientAccount) return ctx.notFound();
      if (orgIdFromRelation(clientAccount.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      filters = {
        organization: ctx.state.orgId,
        subjectType: 'client_account',
        subjectId: caid,
      };
    }

    if (type === 'comment') {
      filters = { ...filters, action: 'comment' };
    }

    let total = 0;
    try {
      total = await strapi.db.query(UID).count({ where: filters });
    } catch (_) {
      total = 0;
    }

    const results = await strapi.entityService.findMany(UID, {
      filters,
      sort: { createdAt: 'DESC' },
      limit,
      populate: ['actor'],
    });

    const filtered =
      type === 'comment' && commentKind
        ? filterActivitiesByCommentKind(results, commentKind)
        : results;

    return { data: filtered, meta: { total: filtered.length } };
  },

  /**
   * GET /crm-activities/feed?limit=&start=&type=
   * Organization-wide activity (no entity scope). For global CRM sidebar feed.
   * Optional ?type=comment to return only comment activities.
   */
  async feed(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const q = ctx.query || {};
    const limit = Math.min(parseInt(q.limit || q['limit'] || '25', 10), 100);
    const startRaw = q.start ?? q['start'] ?? q.offset ?? q['offset'] ?? '0';
    const start = Math.max(0, parseInt(String(startRaw), 10) || 0);
    const type = String(q.type || q['type'] || '').trim().toLowerCase();
    const subjectTypesRaw = String(q.subjectTypes || q['subjectTypes'] || '').trim();

    const filters = { organization: ctx.state.orgId };
    if (type) {
      filters.action = type;
    }
    if (subjectTypesRaw) {
      const parts = subjectTypesRaw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (parts.length === 1) {
        filters.subjectType = parts[0];
      } else if (parts.length > 1) {
        filters.subjectType = { $in: parts };
      }
    }

    let total = 0;
    try {
      total = await strapi.db.query(UID).count({ where: filters });
    } catch (_) {
      total = 0;
    }

    const results = await strapi.entityService.findMany(UID, {
      filters,
      sort: { createdAt: 'DESC' },
      start,
      limit,
      populate: ['actor'],
    });

    return { data: results, meta: { total, start, limit } };
  },

  /**
   * POST /crm-activities/comments
   * body: { leadCompanyId, comment } OR { dealId, comment } OR { contactId, comment } OR { clientAccountId, comment }
   */
  async addComment(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const body = ctx.request?.body || {};
    const payload = body.data || body;

    const leadCompanyIdRaw = payload?.leadCompanyId;
    const dealIdRaw = payload?.dealId;
    const contactIdRaw = payload?.contactId;
    const clientAccountIdRaw = payload?.clientAccountId;
    const taskIdRaw = payload?.taskId;
    const projectIdRaw = payload?.projectId;
    const commentRaw = payload?.comment;

    const hasLead =
      leadCompanyIdRaw != null &&
      String(leadCompanyIdRaw).trim() !== '' &&
      leadCompanyIdRaw !== 'undefined';
    const hasDeal =
      dealIdRaw != null && String(dealIdRaw).trim() !== '' && dealIdRaw !== 'undefined';
    const hasContact =
      contactIdRaw != null && String(contactIdRaw).trim() !== '' && contactIdRaw !== 'undefined';
    const hasClientAccount =
      clientAccountIdRaw != null &&
      String(clientAccountIdRaw).trim() !== '' &&
      clientAccountIdRaw !== 'undefined';
    const hasTask =
      taskIdRaw != null && String(taskIdRaw).trim() !== '' && taskIdRaw !== 'undefined';
    const hasProject =
      projectIdRaw != null && String(projectIdRaw).trim() !== '' && projectIdRaw !== 'undefined';

    const scopeCount = [hasLead, hasDeal, hasContact, hasClientAccount, hasTask, hasProject].filter(
      Boolean
    ).length;
    if (scopeCount !== 1) {
      return ctx.badRequest(
        'Provide exactly one of leadCompanyId, dealId, contactId, clientAccountId, taskId, or projectId'
      );
    }

    const comment = String(commentRaw || '').trim();
    const rawAttachments = normalizeAttachmentsPayload(payload);
    const attachments = await enrichAttachments(strapi, rawAttachments);
    if (!comment && !attachments.length) {
      return ctx.badRequest('Comment or attachment is required');
    }
    if (comment.length > 5000) return ctx.badRequest('Comment is too long');
    const commentKind = hasLead ? normalizeCommentKind(payload?.commentKind) : 'general';
    const notifyComment =
      comment || (attachments.length ? `[${attachments.length} file(s) attached]` : '');

    const actorName =
      ctx.state.user?.username ||
      ctx.state.user?.email ||
      (ctx.state.user?.id != null ? `User ${ctx.state.user.id}` : 'User');

    // ── Deal ────────────────────────────────────────────────────────────────
    if (hasDeal) {
      const dealId = parseInt(String(dealIdRaw), 10);
      if (Number.isNaN(dealId)) return ctx.badRequest('Invalid dealId');

      const deal = await strapi.entityService.findOne(DEAL_UID, dealId, {
        populate: ['organization', 'leadCompany', 'assignedTo'],
      });
      if (!deal) return ctx.notFound('Deal not found');
      if (orgIdFromRelation(deal.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      const dealName = (deal.name || 'Deal').trim() || 'Deal';
      const lc = deal.leadCompany;
      const lcId =
        lc == null
          ? null
          : typeof lc === 'object'
            ? lc.id ?? null
            : parseInt(String(lc), 10) || null;

      const entry = await strapi.entityService.create(UID, {
        data: {
          organization: ctx.state.orgId,
          actor: ctx.state.user?.id ?? null,
          action: 'comment',
          subjectType: 'deal',
          subjectId: dealId,
          leadCompany: lcId,
          summary: `${actorName} commented on deal "${dealName}"`,
          meta: buildCommentMeta({ comment, attachments }),
        },
        populate: ['actor'],
      });

      if (attachments.length) {
        await syncChatAttachments(strapi, {
          organizationId: ctx.state.orgId,
          userId: ctx.state.user?.id,
          subjectType: 'deal',
          subjectId: dealId,
          attachments,
          crmActivityId: entry.id,
        });
      }

      await notifyAfterComment(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'deal',
        subjectId: dealId,
        entityName: dealName,
        comment: notifyComment,
        entity: deal,
      });

      return { data: entry };
    }

    // ── Contact ─────────────────────────────────────────────────────────────
    if (hasContact) {
      const contactId = parseInt(String(contactIdRaw), 10);
      if (Number.isNaN(contactId)) return ctx.badRequest('Invalid contactId');

      const contact = await strapi.entityService.findOne(CONTACT_UID, contactId, {
        populate: ['organization', 'assignedTo'],
      });
      if (!contact) return ctx.notFound('Contact not found');
      if (orgIdFromRelation(contact.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      const contactName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() ||
        contact.email ||
        'Contact';

      const entry = await strapi.entityService.create(UID, {
        data: {
          organization: ctx.state.orgId,
          actor: ctx.state.user?.id ?? null,
          action: 'comment',
          subjectType: 'contact',
          subjectId: contactId,
          summary: `${actorName} commented on contact "${contactName}"`,
          meta: buildCommentMeta({ comment, attachments }),
        },
        populate: ['actor'],
      });

      if (attachments.length) {
        await syncChatAttachments(strapi, {
          organizationId: ctx.state.orgId,
          userId: ctx.state.user?.id,
          subjectType: 'contact',
          subjectId: contactId,
          attachments,
          crmActivityId: entry.id,
        });
      }

      await notifyAfterComment(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'contact',
        subjectId: contactId,
        entityName: contactName,
        comment: notifyComment,
        entity: contact,
      });

      return { data: entry };
    }

    // ── Client Account ───────────────────────────────────────────────────────
    if (hasClientAccount) {
      const clientAccountId = parseInt(String(clientAccountIdRaw), 10);
      if (Number.isNaN(clientAccountId)) return ctx.badRequest('Invalid clientAccountId');

      const clientAccount = await strapi.entityService.findOne(CLIENT_ACCOUNT_UID, clientAccountId, {
        populate: ['organization', 'assignedTo'],
      });
      if (!clientAccount) return ctx.notFound('Client account not found');
      if (orgIdFromRelation(clientAccount.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      const accountName =
        (clientAccount.companyName || clientAccount.name || 'Client Account').trim() ||
        'Client Account';

      const entry = await strapi.entityService.create(UID, {
        data: {
          organization: ctx.state.orgId,
          actor: ctx.state.user?.id ?? null,
          action: 'comment',
          subjectType: 'client_account',
          subjectId: clientAccountId,
          summary: `${actorName} commented on "${accountName}"`,
          meta: buildCommentMeta({ comment, attachments }),
        },
        populate: ['actor'],
      });

      if (attachments.length) {
        await syncChatAttachments(strapi, {
          organizationId: ctx.state.orgId,
          userId: ctx.state.user?.id,
          subjectType: 'client_account',
          subjectId: clientAccountId,
          attachments,
          crmActivityId: entry.id,
        });
      }

      await notifyAfterComment(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'client_account',
        subjectId: clientAccountId,
        entityName: accountName,
        comment: notifyComment,
        entity: clientAccount,
      });

      return { data: entry };
    }

    // ── Task (PM) ─────────────────────────────────────────────────────────────
    if (hasTask) {
      const taskId = parseInt(String(taskIdRaw), 10);
      if (Number.isNaN(taskId)) return ctx.badRequest('Invalid taskId');

      const task = await strapi.entityService.findOne(TASK_UID, taskId, {
        populate: ['organization', 'assignee', 'assigner', 'collaborators'],
      });
      if (!task) return ctx.notFound('Task not found');
      if (orgIdFromRelation(task.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      const taskName = (task.name || task.title || 'Task').trim() || 'Task';

      const entry = await strapi.entityService.create(UID, {
        data: {
          organization: ctx.state.orgId,
          actor: ctx.state.user?.id ?? null,
          action: 'comment',
          subjectType: 'task',
          subjectId: taskId,
          summary: `${actorName} commented on task "${taskName}"`,
          meta: buildCommentMeta({ comment, attachments }),
        },
        populate: ['actor'],
      });

      if (attachments.length) {
        await syncChatAttachments(strapi, {
          organizationId: ctx.state.orgId,
          userId: ctx.state.user?.id,
          subjectType: 'task',
          subjectId: taskId,
          attachments,
          crmActivityId: entry.id,
        });
      }

      await notifyAfterComment(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'task',
        subjectId: taskId,
        entityName: taskName,
        comment: notifyComment,
        entity: task,
      });

      return { data: entry };
    }

    // ── Project (PM) ────────────────────────────────────────────────────────
    if (hasProject) {
      const projectId = parseInt(String(projectIdRaw), 10);
      if (Number.isNaN(projectId)) return ctx.badRequest('Invalid projectId');

      const proj = await strapi.entityService.findOne(PROJECT_UID, projectId, {
        populate: ['organization', 'projectManager', 'teamMembers'],
      });
      if (!proj) return ctx.notFound('Project not found');
      if (orgIdFromRelation(proj.organization) !== ctx.state.orgId) {
        return ctx.forbidden('Access denied');
      }

      const projectName = (proj.name || proj.title || 'Project').trim() || 'Project';

      const entry = await strapi.entityService.create(UID, {
        data: {
          organization: ctx.state.orgId,
          actor: ctx.state.user?.id ?? null,
          action: 'comment',
          subjectType: 'project',
          subjectId: projectId,
          summary: `${actorName} commented on project "${projectName}"`,
          meta: buildCommentMeta({ comment, attachments }),
        },
        populate: ['actor'],
      });

      if (attachments.length) {
        await syncChatAttachments(strapi, {
          organizationId: ctx.state.orgId,
          userId: ctx.state.user?.id,
          subjectType: 'project',
          subjectId: projectId,
          attachments,
          crmActivityId: entry.id,
        });
      }

      await notifyAfterComment(strapi, {
        organizationId: ctx.state.orgId,
        actorUserId: ctx.state.user?.id,
        actorName,
        subjectType: 'project',
        subjectId: projectId,
        entityName: projectName,
        comment: notifyComment,
        entity: proj,
      });

      return { data: entry };
    }

    // ── Lead Company ─────────────────────────────────────────────────────────
    const leadCompanyId = parseInt(String(leadCompanyIdRaw || ''), 10);
    if (!leadCompanyId || Number.isNaN(leadCompanyId)) {
      return ctx.badRequest('Invalid leadCompanyId');
    }

    const lead = await strapi.entityService.findOne(LEAD_UID, leadCompanyId, {
      populate: ['organization', 'assignedTo'],
    });
    if (!lead) return ctx.notFound('Lead company not found');
    if (orgIdFromRelation(lead.organization) !== ctx.state.orgId) {
      return ctx.forbidden('Access denied');
    }

    const leadName =
      (lead.companyName || lead.name || 'Lead company').trim() || 'Lead company';

    const entry = await strapi.entityService.create(UID, {
      data: {
        organization: ctx.state.orgId,
        actor: ctx.state.user?.id ?? null,
        action: 'comment',
        subjectType: 'lead_company',
        subjectId: leadCompanyId,
        leadCompany: leadCompanyId,
        summary:
          commentKind === 'next_connect'
            ? `${actorName} added a next connect reason on "${leadName}"`
            : `${actorName} commented on "${leadName}"`,
        meta: buildCommentMeta({ comment, commentKind, attachments }),
      },
      populate: ['actor'],
    });

    if (attachments.length) {
      await syncChatAttachments(strapi, {
        organizationId: ctx.state.orgId,
        userId: ctx.state.user?.id,
        subjectType: 'lead_company',
        subjectId: leadCompanyId,
        attachments,
        crmActivityId: entry.id,
      });
    }

    await notifyAfterComment(strapi, {
      organizationId: ctx.state.orgId,
      actorUserId: ctx.state.user?.id,
      actorName,
      subjectType: 'lead_company',
      subjectId: leadCompanyId,
      entityName: leadName,
      comment: notifyComment,
      entity: lead,
    });

    return { data: entry };
  },

  /**
   * GET /crm-activities/comment-counts?leadCompanyIds=1,2,3
   * GET /crm-activities/comment-counts?dealIds=1,2,3
   * GET /crm-activities/comment-counts?contactIds=1,2,3
   * GET /crm-activities/comment-counts?clientAccountIds=1,2,3
   * GET /crm-activities/comment-counts?projectIds=1,2,3
   * Returns: { data: { [id]: number } }
   */
  async commentCounts(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Missing or invalid credentials');
    if (!ctx.state.orgId) return ctx.forbidden('No active organization');

    const q = ctx.query || {};

    // ── Task counts (PM My Tasks) ─────────────────────────────────────────────
    const taskRaw = q.taskIds ?? q['taskIds'];
    if (taskRaw != null && String(taskRaw).trim() !== '') {
      const list = Array.isArray(taskRaw) ? taskRaw : String(taskRaw).split(',');
      const ids = [
        ...new Set(
          list.map((v) => parseInt(String(v).trim(), 10)).filter((n) => n && !Number.isNaN(n))
        ),
      ].slice(0, 200);
      if (!ids.length) return { data: {} };
      const pairs = await Promise.all(
        ids.map(async (taskId) => {
          let count = 0;
          try {
            count = await strapi.db.query(UID).count({
              where: {
                organization: ctx.state.orgId,
                action: 'comment',
                subjectType: 'task',
                subjectId: taskId,
              },
            });
          } catch (_) {
            count = 0;
          }
          return [String(taskId), count];
        })
      );
      return { data: Object.fromEntries(pairs) };
    }

    // ── Project counts (PM projects table) ───────────────────────────────────
    const projectRaw = q.projectIds ?? q['projectIds'];
    if (projectRaw != null && String(projectRaw).trim() !== '') {
      const list = Array.isArray(projectRaw) ? projectRaw : String(projectRaw).split(',');
      const ids = [
        ...new Set(
          list.map((v) => parseInt(String(v).trim(), 10)).filter((n) => n && !Number.isNaN(n))
        ),
      ].slice(0, 200);
      if (!ids.length) return { data: {} };
      const pairs = await Promise.all(
        ids.map(async (projectId) => {
          let count = 0;
          try {
            count = await strapi.db.query(UID).count({
              where: {
                organization: ctx.state.orgId,
                action: 'comment',
                subjectType: 'project',
                subjectId: projectId,
              },
            });
          } catch (_) {
            count = 0;
          }
          return [String(projectId), count];
        })
      );
      return { data: Object.fromEntries(pairs) };
    }

    // ── Deal counts ──────────────────────────────────────────────────────────
    const dealRaw = q.dealIds ?? q['dealIds'];
    if (dealRaw != null && String(dealRaw).trim() !== '') {
      const list = Array.isArray(dealRaw) ? dealRaw : String(dealRaw).split(',');
      const ids = [
        ...new Set(
          list.map((v) => parseInt(String(v).trim(), 10)).filter((n) => n && !Number.isNaN(n))
        ),
      ].slice(0, 200);
      if (!ids.length) return { data: {} };
      const pairs = await Promise.all(
        ids.map(async (dealId) => {
          let count = 0;
          try {
            count = await strapi.db.query(UID).count({
              where: {
                organization: ctx.state.orgId,
                action: 'comment',
                subjectType: 'deal',
                subjectId: dealId,
              },
            });
          } catch (_) {
            count = 0;
          }
          return [String(dealId), count];
        })
      );
      return { data: Object.fromEntries(pairs) };
    }

    // ── Contact counts ────────────────────────────────────────────────────────
    const contactRaw = q.contactIds ?? q['contactIds'];
    if (contactRaw != null && String(contactRaw).trim() !== '') {
      const list = Array.isArray(contactRaw) ? contactRaw : String(contactRaw).split(',');
      const ids = [
        ...new Set(
          list.map((v) => parseInt(String(v).trim(), 10)).filter((n) => n && !Number.isNaN(n))
        ),
      ].slice(0, 200);
      if (!ids.length) return { data: {} };
      const pairs = await Promise.all(
        ids.map(async (contactId) => {
          let count = 0;
          try {
            count = await strapi.db.query(UID).count({
              where: {
                organization: ctx.state.orgId,
                action: 'comment',
                subjectType: 'contact',
                subjectId: contactId,
              },
            });
          } catch (_) {
            count = 0;
          }
          return [String(contactId), count];
        })
      );
      return { data: Object.fromEntries(pairs) };
    }

    // ── Client Account counts ─────────────────────────────────────────────────
    const clientAccountRaw = q.clientAccountIds ?? q['clientAccountIds'];
    if (clientAccountRaw != null && String(clientAccountRaw).trim() !== '') {
      const list = Array.isArray(clientAccountRaw)
        ? clientAccountRaw
        : String(clientAccountRaw).split(',');
      const ids = [
        ...new Set(
          list.map((v) => parseInt(String(v).trim(), 10)).filter((n) => n && !Number.isNaN(n))
        ),
      ].slice(0, 200);
      if (!ids.length) return { data: {} };
      const pairs = await Promise.all(
        ids.map(async (clientAccountId) => {
          let count = 0;
          try {
            count = await strapi.db.query(UID).count({
              where: {
                organization: ctx.state.orgId,
                action: 'comment',
                subjectType: 'client_account',
                subjectId: clientAccountId,
              },
            });
          } catch (_) {
            count = 0;
          }
          return [String(clientAccountId), count];
        })
      );
      return { data: Object.fromEntries(pairs) };
    }

    // ── Lead Company counts (default) ─────────────────────────────────────────
    const raw = q.leadCompanyIds ?? q['leadCompanyIds'] ?? q.ids ?? q['ids'];
    const list = Array.isArray(raw) ? raw : String(raw || '').split(',');
    const ids = [
      ...new Set(
        list.map((v) => parseInt(String(v).trim(), 10)).filter((n) => n && !Number.isNaN(n))
      ),
    ].slice(0, 200);

    if (!ids.length) return { data: {} };

    const commentKind = String(q.commentKind || q['commentKind'] || '').trim().toLowerCase();

    const pairs = await Promise.all(
      ids.map(async (leadCompanyId) => {
        let count = 0;
        try {
          count = await countLeadCompanyComments(
            strapi,
            ctx.state.orgId,
            leadCompanyId,
            commentKind
          );
        } catch (_) {
          count = 0;
        }
        return [String(leadCompanyId), count];
      })
    );

    return { data: Object.fromEntries(pairs) };
  },
}));
