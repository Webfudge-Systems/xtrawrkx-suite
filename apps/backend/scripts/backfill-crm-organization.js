'use strict';

/**
 * Backfill organization on legacy CRM/PM rows and ensure users belong to the data org.
 *
 * Production symptom: new CRM records appear, but pre-migration data is missing because
 * list APIs filter by ctx.state.orgId while legacy rows have no organization link, and/or
 * users were auto-provisioned into a new empty org on login.
 *
 * Usage (from apps/backend with Railway DATABASE_URL):
 *   $env:DRY_RUN="true"; node scripts/backfill-crm-organization.js
 *   node scripts/backfill-crm-organization.js
 *   $env:TARGET_ORG_ID="1"; node scripts/backfill-crm-organization.js
 *
 * Optional env:
 *   TARGET_ORG_ID — organization to attach orphan rows + memberships (auto-detect if unset)
 *   DRY_RUN=true  — log actions only
 */

const path = require('path');
const { createStrapi } = require('@strapi/strapi');
const { roleRelationData } = require('../src/utils/organization-role');

const appDir = path.join(__dirname, '..');
const DRY_RUN =
  String(process.env.DRY_RUN || '').toLowerCase() === 'true' ||
  process.argv.includes('--dry-run');

/** Content types that are tenant-scoped in CRM/PM APIs. */
const ORG_SCOPED_UIDS = [
  'api::lead-company.lead-company',
  'api::contact.contact',
  'api::deal.deal',
  'api::client-account.client-account',
  'api::task.task',
  'api::meeting.meeting',
  'api::proposal.proposal',
  'api::invoice.invoice',
  'api::project.project',
  'api::crm-activity.crm-activity',
];

function relationId(rel) {
  if (rel == null || rel === '') return null;
  if (typeof rel === 'number' || typeof rel === 'string') return rel;
  if (typeof rel === 'object') return rel.id ?? rel.documentId ?? null;
  return null;
}

async function detectTargetOrgId(strapi) {
  const env = process.env.TARGET_ORG_ID;
  if (env != null && String(env).trim() !== '') {
    const id = parseInt(String(env).trim(), 10);
    if (!Number.isNaN(id) && id > 0) return id;
    throw new Error(`Invalid TARGET_ORG_ID: ${env}`);
  }

  const orgs = await strapi.entityService.findMany('api::organization.organization', {
    fields: ['id', 'name', 'slug'],
    limit: 100,
    sort: { id: 'ASC' },
  });
  if (!orgs.length) {
    throw new Error('No organizations found — create one before running backfill.');
  }

  let bestOrgId = orgs[0].id;
  let bestScore = -1;

  for (const org of orgs) {
    const orgId = org.id;
    let score = 0;
    for (const uid of ORG_SCOPED_UIDS) {
      try {
        const count = await strapi.db.query(uid).count({
          where: { organization: orgId },
        });
        score += Number(count) || 0;
      } catch (_) {
        /* content type may not exist in this deployment */
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestOrgId = orgId;
    }
  }

  const picked = orgs.find((o) => o.id === bestOrgId);
  console.log(
    `Auto-selected org ${bestOrgId}${picked?.name ? ` (${picked.name})` : ''} — linked record score ${bestScore}`
  );
  return bestOrgId;
}

async function backfillOrphanRows(strapi, targetOrgId) {
  const summary = [];

  for (const uid of ORG_SCOPED_UIDS) {
    let orphans = [];
    try {
      orphans = await strapi.entityService.findMany(uid, {
        filters: { organization: { $null: true } },
        fields: ['id'],
        limit: 10000,
      });
    } catch (err) {
      console.warn(`Skip ${uid}: ${err?.message || err}`);
      continue;
    }

    if (!orphans.length) {
      summary.push({ uid, updated: 0 });
      continue;
    }

    let updated = 0;
    for (const row of orphans) {
      if (row?.id == null) continue;
      if (DRY_RUN) {
        console.log(`[dry-run] ${uid} id=${row.id} → organization ${targetOrgId}`);
      } else {
        await strapi.entityService.update(uid, row.id, {
          data: { organization: targetOrgId },
        });
      }
      updated += 1;
    }
    summary.push({ uid, updated });
    console.log(`${uid}: ${updated} orphan row(s) ${DRY_RUN ? 'would be' : ''} linked to org ${targetOrgId}`);
  }

  return summary;
}

async function ensureUserMemberships(strapi, targetOrgId) {
  const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
    fields: ['id', 'email'],
    limit: 5000,
  });

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    if (user?.id == null) continue;
    const existing = await strapi.entityService.findMany('api::organization-user.organization-user', {
      filters: {
        user: user.id,
        organization: targetOrgId,
        isActive: true,
      },
      limit: 1,
    });
    if (existing.length > 0) {
      skipped += 1;
      continue;
    }

    if (DRY_RUN) {
      console.log(`[dry-run] membership user ${user.id} (${user.email || 'no-email'}) → org ${targetOrgId}`);
    } else {
      await strapi.entityService.create('api::organization-user.organization-user', {
        data: {
          user: user.id,
          organization: targetOrgId,
          role: await roleRelationData(strapi, 'Member'),
          isActive: true,
          joinedAt: new Date(),
        },
      });
      console.log(`Membership created: user ${user.id} (${user.email || 'no-email'}) → org ${targetOrgId}`);
    }
    created += 1;
  }

  console.log(
    `Memberships: ${created} ${DRY_RUN ? 'would be' : ''} created, ${skipped} already active in org ${targetOrgId}`
  );
  return { created, skipped };
}

async function main() {
  let strapi;
  try {
    console.log(DRY_RUN ? 'DRY RUN — no writes\n' : 'Live run — writing to database\n');
    strapi = createStrapi({ appDir, distDir: appDir });
    await strapi.load();

    const targetOrgId = await detectTargetOrgId(strapi);
    const rowSummary = await backfillOrphanRows(strapi, targetOrgId);
    const membershipSummary = await ensureUserMemberships(strapi, targetOrgId);

    console.log('\nDone.');
    console.log(JSON.stringify({ targetOrgId, rowSummary, membershipSummary }, null, 2));
  } finally {
    if (strapi) await strapi.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
