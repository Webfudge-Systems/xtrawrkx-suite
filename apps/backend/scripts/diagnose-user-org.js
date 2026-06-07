'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const links = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'organization_users%'
    ORDER BY table_name
  `);
  console.log('organization_users link tables:', links.rows.map((r) => r.table_name).join('\n  '));

  const user42 = await c.query(`
    SELECT ou.id AS membership_id, ul.user_id, ol.organization_id, o.name AS org_name, ou.is_active
    FROM organization_users ou
    JOIN organization_users_user_lnk ul ON ul.organization_user_id = ou.id
    LEFT JOIN organization_users_organization_lnk ol ON ol.organization_user_id = ou.id
    LEFT JOIN organizations o ON o.id = ol.organization_id
    WHERE ul.user_id = 42
  `);
  console.log('\nuser 42 (admin@xmc.com) memberships:');
  console.table(user42.rows);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
