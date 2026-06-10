'use strict';

/**
 * Assign all active org members to the XMC department and set passwords.
 *
 * Password pattern: Xtr@<FirstName>#XWK
 * Skips: admin@xmc.com, admin@xtrawrkx.com
 *
 * Usage:
 *   node scripts/bulk-xmc-dept-and-passwords.js --dry-run
 *   node scripts/bulk-xmc-dept-and-passwords.js
 */

const { createStrapi } = require('@strapi/strapi');
const { applyMembershipDepartments } = require('../src/utils/department-context');

const EXCLUDED_EMAILS = new Set(['admin@xmc.com', 'admin@xtrawrkx.com']);
const DEPARTMENT_NAME = 'XMC';

function titleCaseWord(word) {
  const cleaned = String(word || '').trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

function firstNameFromUser(user) {
  const direct = String(user?.firstName || user?.firstname || '').trim();
  if (direct) return titleCaseWord(direct.split(/\s+/)[0]);

  const username = String(user?.username || '').trim();
  if (username) {
    const token = username.split(/[._-]/)[0];
    if (token) return titleCaseWord(token);
  }

  const emailLocal = String(user?.email || '').split('@')[0] || '';
  const emailToken = emailLocal.split(/[._-]/)[0];
  if (emailToken) return titleCaseWord(emailToken);

  return 'User';
}

function passwordForUser(user) {
  return `Xtr@${firstNameFromUser(user)}#XWK`;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const app = await createStrapi().load();
  const strapi = app;

  try {
    const departments = await strapi.entityService.findMany('api::department.department', {
      filters: { name: { $eqi: DEPARTMENT_NAME }, isActive: true },
      populate: { organization: { fields: ['id', 'name'] } },
      limit: 10,
    });

    if (!departments.length) {
      throw new Error(`Department "${DEPARTMENT_NAME}" not found`);
    }
    if (departments.length > 1) {
      console.warn(`Found ${departments.length} departments named ${DEPARTMENT_NAME}; using the first.`);
    }

    const department = departments[0];
    const org = department.organization;
    const orgId = typeof org === 'object' ? org.id : org;
    const orgName = typeof org === 'object' ? org.name : String(orgId);

    console.log(`\nOrganization: ${orgName} (id: ${orgId})`);
    console.log(`Department: ${department.name} (id: ${department.id})`);
    console.log(dryRun ? 'Mode: DRY RUN\n' : 'Mode: APPLY\n');

    const memberships = await strapi.entityService.findMany('api::organization-user.organization-user', {
      filters: { organization: orgId, isActive: true },
      populate: { user: true },
      limit: 500,
    });

    console.log(`Active memberships: ${memberships.length}\n`);

    for (const membership of memberships) {
      const user = membership.user;
      const email = String(user?.email || '').trim().toLowerCase();
      const label = email || `membership #${membership.id}`;

      if (!dryRun) {
        await applyMembershipDepartments(strapi, membership.id, orgId, {
          departmentIds: [department.id],
          primaryDepartmentId: department.id,
        });
      }
      console.log(`[dept] ${label} -> ${DEPARTMENT_NAME}`);

      if (!email || EXCLUDED_EMAILS.has(email)) {
        console.log(`[pwd]  ${label} -> skipped (excluded)\n`);
        continue;
      }

      const password = passwordForUser(user);
      if (!dryRun) {
        await strapi.plugins['users-permissions'].services.user.edit(user.id, { password });
      }
      console.log(`[pwd]  ${label} -> ${password}\n`);
    }

    console.log('Done.');
  } finally {
    await strapi.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
