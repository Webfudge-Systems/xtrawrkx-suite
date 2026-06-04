'use strict';

const { uniqueUsernameFromEmail } = require('../../src/utils/user-username');

/**
 * Seed the Xtrawrkx platform super-admin user.
 *
 * Credentials are read from environment variables with sensible defaults:
 *   PLATFORM_ADMIN_EMAIL    (default: admin@xtrawrkx.com)
 *   PLATFORM_ADMIN_PASSWORD (default: XtrawrkxAdmin@2025)
 *
 * Set PLATFORM_ADMIN_RESET_PASSWORD=true to re-hash the password on an existing user.
 * This seed is idempotent — running it multiple times is safe.
 */

async function seedPlatformAdmin(strapi) {
  const email = (process.env.PLATFORM_ADMIN_EMAIL || 'admin@xtrawrkx.com').trim().toLowerCase();
  const password = process.env.PLATFORM_ADMIN_PASSWORD || 'XtrawrkxAdmin@2025';
  const firstName = process.env.PLATFORM_ADMIN_FIRST_NAME || 'Platform';
  const lastName = process.env.PLATFORM_ADMIN_LAST_NAME || 'Admin';
  const resetPassword = process.env.PLATFORM_ADMIN_RESET_PASSWORD === 'true';

  console.log(`\n👤 Seeding platform super-admin: ${email}`);

  const userService = strapi.plugins['users-permissions'].services.user;
  let existing = await strapi.query('plugin::users-permissions.user').findOne({
    where: { email },
  });

  if (existing) {
    const updates = {
      isPlatformAdmin: true,
      confirmed: true,
      blocked: false,
      firstName,
      lastName,
    };

    if (resetPassword) {
      await userService.edit(existing.id, { password, ...updates });
      console.log('   ↺  Synced platform admin (password + isPlatformAdmin flag)');
    } else if (!existing.isPlatformAdmin) {
      await strapi.entityService.update('plugin::users-permissions.user', existing.id, {
        data: updates,
      });
      console.log('   ↺  Updated existing user to isPlatformAdmin=true');
    } else {
      console.log(`   ℹ️  Platform admin already exists (id: ${existing.id})`);
    }

    return existing;
  }

  const user = await userService.add({
    username: await uniqueUsernameFromEmail(strapi, email),
    email,
    password,
    firstName,
    lastName,
    confirmed: true,
    blocked: false,
    provider: 'local',
    isPlatformAdmin: true,
  });

  console.log(`   ✅ Created platform super-admin (id: ${user.id})`);
  console.log(`      Email   : ${email}`);
  if (!process.env.PLATFORM_ADMIN_PASSWORD) {
    console.log('      Password: XtrawrkxAdmin@2025 (set PLATFORM_ADMIN_PASSWORD in production)');
  }

  return user;
}

module.exports = { seedPlatformAdmin };
