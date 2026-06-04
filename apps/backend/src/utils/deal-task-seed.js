'use strict';

const TASK_UID = 'api::task.task';

function resolveId(rel) {
  if (rel == null) return null;
  if (typeof rel === 'object') return rel.id ?? rel.documentId ?? null;
  const n = parseInt(String(rel), 10);
  return Number.isNaN(n) ? null : n;
}

function companyLabel(deal) {
  const lc = deal.leadCompany;
  const ca = deal.clientAccount;
  if (lc && typeof lc === 'object') return lc.companyName || lc.name || 'Lead company';
  if (ca && typeof ca === 'object') return ca.companyName || ca.name || 'Client account';
  return 'this account';
}

function addDays(base, n) {
  const x = new Date(base);
  x.setDate(x.getDate() + n);
  return x;
}

/**
 * Create default CRM tasks when a deal is created (org-scoped, assignee from deal).
 * @param {import('@strapi/strapi').Strapi} strapi
 * @param {object} deal — populated deal with id, name, leadCompany, clientAccount, assignedTo
 * @param {number|string} organizationId
 */
async function seedDealTasks(strapi, deal, organizationId) {
  if (!deal?.id || organizationId == null) return [];

  const assigneeId = resolveId(deal.assignedTo);
  const lcId = resolveId(deal.leadCompany);
  const caId = resolveId(deal.clientAccount);
  const company = companyLabel(deal);
  const dealName = String(deal.name || 'Deal').trim().slice(0, 120);

  /** Two high-priority (urgent + important) plus one follow-up. Schema only has low | medium | high. */
  const templates = [
    {
      name: `[Urgent] First response — ${dealName}`,
      description: `Time-sensitive: acknowledge this opportunity and confirm the immediate next step with ${company}.`,
      daysFromNow: 0,
      priority: 'high',
    },
    {
      name: `[Important] Qualify — ${company} / ${dealName}`,
      description: `Confirm stakeholders, budget fit, and timeline so ${dealName} stays on track with ${company}.`,
      daysFromNow: 1,
      priority: 'high',
    },
    {
      name: `Next touchpoint: ${company}`,
      description: `Schedule or complete a follow-up to advance “${dealName}” (${company}).`,
      daysFromNow: 4,
      priority: 'medium',
    },
  ];

  const now = new Date();
  const created = [];

  for (const t of templates) {
    try {
      const data = {
        name: String(t.name).slice(0, 255),
        description: t.description,
        status: 'SCHEDULED',
        priority: t.priority,
        scheduledDate: addDays(now, t.daysFromNow).toISOString(),
        organization: organizationId,
        deal: deal.id,
      };
      if (assigneeId != null) data.assignee = assigneeId;
      if (lcId != null) data.leadCompany = lcId;
      if (caId != null) data.clientAccount = caId;

      const task = await strapi.entityService.create(TASK_UID, { data });
      created.push(task);
    } catch (err) {
      strapi.log.warn(`[seedDealTasks] skipped task "${t.name}": ${err?.message || err}`);
    }
  }

  return created;
}

module.exports = { seedDealTasks };
