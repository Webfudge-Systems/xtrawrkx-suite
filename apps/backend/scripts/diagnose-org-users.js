'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const upUsers = await c.query('SELECT COUNT(*)::int AS n FROM up_users');
  console.log('up_users total:', upUsers.rows[0].n);

  const sampleUsers = await c.query(`
    SELECT id, email, username, first_name, last_name, created_at
    FROM up_users ORDER BY id LIMIT 10
  `);
  console.log('\nFirst 10 up_users:');
  console.table(sampleUsers.rows);

  const memCount = await c.query('SELECT COUNT(*)::int AS n FROM organization_users');
  console.log('\norganization_users total:', memCount.rows[0].n);

  const memByOrg = await c.query(`
    SELECT ol.organization_id, o.name, COUNT(*)::int AS memberships
    FROM organization_users ou
    JOIN organization_users_organization_lnk ol ON ol.organization_user_id = ou.id
    LEFT JOIN organizations o ON o.id = ol.organization_id
    GROUP BY ol.organization_id, o.name
    ORDER BY memberships DESC
  `);
  console.log('\nMemberships by org:');
  console.table(memByOrg.rows);

  const usersInOrg1 = await c.query(`
    SELECT u.id, u.email, u.username, ou.is_active, ou.joined_at
    FROM organization_users ou
    JOIN organization_users_user_lnk ul ON ul.organization_user_id = ou.id
    JOIN up_users u ON u.id = ul.user_id
    JOIN organization_users_organization_lnk ol ON ol.organization_user_id = ou.id AND ol.organization_id = 1
    ORDER BY u.email
    LIMIT 50
  `);
  console.log('\nUsers in org 1 (first 50):');
  console.table(usersInOrg1.rows);

  const usersNoMembership = await c.query(`
    SELECT COUNT(*)::int AS n FROM up_users u
    WHERE NOT EXISTS (
      SELECT 1 FROM organization_users_user_lnk ul WHERE ul.user_id = u.id
    )
  `);
  console.log('\nup_users with NO organization membership:', usersNoMembership.rows[0].n);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
