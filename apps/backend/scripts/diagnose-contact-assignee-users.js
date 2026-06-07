'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const sample = await c.query(`
    SELECT ca.contact_id, ca.user_id, u.id AS up_user_id, u.email, u.username
    FROM contacts_assigned_to_lnk ca
    LEFT JOIN up_users u ON u.id = ca.user_id
    WHERE ca.contact_id IN (5937, 5938, 5939, 5940, 5941)
    ORDER BY ca.contact_id
  `);

  const orphanOwners = await c.query(`
    SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE u.id IS NULL)::int AS missing_user
    FROM contacts_assigned_to_lnk ca
    LEFT JOIN up_users u ON u.id = ca.user_id
  `);

  console.log('assignee user existence:');
  console.table(orphanOwners.rows);
  console.log('\nsample assignees:');
  console.table(sample.rows);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
