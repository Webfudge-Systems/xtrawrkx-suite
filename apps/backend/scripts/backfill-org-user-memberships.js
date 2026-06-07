'use strict';

/**
 * Create organization-user memberships for up_users missing from TARGET_ORG_ID.
 * Fixes Accounts → Users showing only the bootstrap admin after legacy migration.
 *
 *   TARGET_ORG_ID=1 node scripts/backfill-org-user-memberships.js --dry-run
 *   TARGET_ORG_ID=1 node scripts/backfill-org-user-memberships.js
 */

const path = require('path');
const { createStrapi } = require('@strapi/strapi');
const { roleRelationData, assignMembershipRole } = require('../src/utils/organization-role');

const appDir = path.join(__dirname, '..');
const ORG_MEMBERSHIP_UID = 'api::organization-user.organization-user';

const DRY_RUN =
  String(process.env.DRY_RUN || '').toLowerCase() === 'true' ||
  process.argv.includes('--dry-run');

const TARGET_ORG_ID = parseInt(String(process.env.TARGET_ORG_ID || '1'), 10);

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || 'admin@xtrawrkx.com,admin@xmc.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

function roleCodeForUser(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  if (ADMIN_EMAILS.has(email) || user?.isPlatformAdmin) return 'Admin';
  return 'Member';
}

async function hasMembershipInOrg(strapi, userId, orgId) {
  const rows = await strapi.entityService.findMany(ORG_MEMBERSHIP_UID, {
    filters: { user: userId, organization: orgId, isActive: true },
    limit: 1,
  });
  return rows.length > 0;
}

async function main() {
  if (!TARGET_ORG_ID || Number.isNaN(TARGET_ORG_ID)) {
    throw new Error('Set TARGET_ORG_ID (e.g. 1 for Xtrawrkx Pvt. Ltd.)');
  }

  let strapi;
  try {
    console.log(DRY_RUN ? 'DRY RUN\n' : 'Live run\n');
    strapi = createStrapi({ appDir, distDir: appDir });
    await strapi.load();

    const org = await strapi.entityService.findOne('api::organization.organization', TARGET_ORG_ID, {
      fields: ['id', 'name'],
    });
    if (!org) throw new Error(`Organization ${TARGET_ORG_ID} not found`);
    console.log(`Target org: ${TARGET_ORG_ID} (${org.name})\n`);

    const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
      fields: ['id', 'email', 'username', 'firstName', 'lastName', 'isPlatformAdmin', 'blocked'],
      limit: 5000,
      sort: { id: 'ASC' },
    });

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      if (!user?.id || user.blocked) {
        skipped += 1;
        continue;
      }

      if (await hasMembershipInOrg(strapi, user.id, TARGET_ORG_ID)) {
        skipped += 1;
        continue;
      }

      const code = roleCodeForUser(user);
      if (DRY_RUN) {
        console.log(`[dry-run] membership ${user.email} (id ${user.id}) → org ${TARGET_ORG_ID} as ${code}`);
        created += 1;
        continue;
      }

      const membership = await strapi.entityService.create(ORG_MEMBERSHIP_UID, {
        data: {
          user: user.id,
          organization: TARGET_ORG_ID,
          role: await roleRelationData(strapi, code),
          isActive: true,
          joinedAt: new Date(),
        },
      });
      await assignMembershipRole(strapi, membership.id, code);
      console.log(`Created membership: ${user.email} → org ${TARGET_ORG_ID} (${code})`);
      created += 1;
    }

    console.log(`\nDone. ${created} ${DRY_RUN ? 'would be ' : ''}created, ${skipped} skipped (already member or blocked).`);
  } finally {
    if (strapi) await strapi.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
