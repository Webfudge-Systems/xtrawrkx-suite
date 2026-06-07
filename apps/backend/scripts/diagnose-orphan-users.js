'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const legacy = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name LIKE '%xtrawrkx%' OR table_name LIKE '%organization_user%')
    ORDER BY table_name
  `);
  console.log('tables:', legacy.rows.map((r) => r.table_name).join('\n  '));

  const orphanUsers = await c.query(`
    SELECT u.id, u.email, u.username, u.first_name, u.last_name
    FROM up_users u
    WHERE NOT EXISTS (SELECT 1 FROM organization_users_user_lnk ul WHERE ul.user_id = u.id)
    ORDER BY u.id
  `);
  console.log('\nUsers without any membership (' + orphanUsers.rows.length + '):');
  console.table(orphanUsers.rows);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
