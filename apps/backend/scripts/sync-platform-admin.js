'use strict';

/**
 * Diagnose or sync the Orbit platform admin user (plugin::users-permissions.user).
 *
 * Usage:
 *   node scripts/sync-platform-admin.js
 *   node scripts/sync-platform-admin.js --reset-password
 *
 * Reads PLATFORM_ADMIN_* from apps/backend/.env (or process env).
 * Safe to run against production Postgres — idempotent unless --reset-password is passed.
 */

const { createStrapi } = require('@strapi/strapi');
const { seedPlatformAdmin } = require('../database/seeds/platform-admin');

async function main() {
  const resetPassword = process.argv.includes('--reset-password');
  const email = (process.env.PLATFORM_ADMIN_EMAIL || 'admin@xtrawrkx.com').trim().toLowerCase();

  if (resetPassword) {
    process.env.PLATFORM_ADMIN_RESET_PASSWORD = 'true';
  }

  const app = await createStrapi().load();
  const strapi = app;

  try {
    const before = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email },
      select: ['id', 'email', 'isPlatformAdmin', 'confirmed', 'blocked'],
    });

    console.log('\n--- Platform admin diagnose ---');
    if (!before) {
      console.log(`User not found: ${email}`);
    } else {
      console.log(`User id          : ${before.id}`);
      console.log(`Email            : ${before.email}`);
      console.log(`isPlatformAdmin  : ${Boolean(before.isPlatformAdmin)}`);
      console.log(`confirmed        : ${Boolean(before.confirmed)}`);
      console.log(`blocked          : ${Boolean(before.blocked)}`);
    }

    console.log('\n--- Sync ---');
    await seedPlatformAdmin(strapi);

    const after = await strapi.query('plugin::users-permissions.user').findOne({
      where: { email },
      select: ['id', 'email', 'isPlatformAdmin', 'confirmed', 'blocked'],
    });

    console.log('\n--- After sync ---');
    console.log(`User id          : ${after?.id ?? '—'}`);
    console.log(`isPlatformAdmin  : ${Boolean(after?.isPlatformAdmin)}`);
    if (resetPassword) {
      console.log('Password re-hashed from PLATFORM_ADMIN_PASSWORD.');
    } else if (before && !resetPassword) {
      console.log('Password unchanged. Pass --reset-password to re-hash from PLATFORM_ADMIN_PASSWORD.');
    }
    console.log('');
  } finally {
    await strapi.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
