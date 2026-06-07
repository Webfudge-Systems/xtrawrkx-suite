'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const orgs = await c.query('SELECT id, name, slug FROM organizations ORDER BY id');
  console.log('\n=== organizations ===');
  console.table(orgs.rows);

  const lcByOrg = await c.query(`
    SELECT l.organization_id AS org_id, COUNT(*)::int AS lead_count
    FROM lead_companies_organization_lnk l
    GROUP BY l.organization_id
    ORDER BY lead_count DESC
  `);
  console.log('\n=== leads by org (link table) ===');
  console.table(lcByOrg.rows);

  const orphan = await c.query(`
    SELECT COUNT(*)::int AS orphan_leads FROM lead_companies lc
    WHERE NOT EXISTS (
      SELECT 1 FROM lead_companies_organization_lnk l WHERE l.lead_company_id = lc.id
    )
  `);
  console.log('\norphan leads (no org link):', orphan.rows[0].orphan_leads);
  console.log('total lead_companies:', (await c.query('SELECT COUNT(*)::int AS n FROM lead_companies')).rows[0].n);

  const users = await c.query(`
    SELECT id, email, username FROM up_users
    WHERE email ILIKE '%crm%' OR email ILIKE '%admin%'
    ORDER BY id LIMIT 30
  `);
  console.log('\n=== admin/crm users ===');
  console.table(users.rows);

  const cols = await c.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'organization_users' ORDER BY ordinal_position
  `);
  console.log('\norganization_users columns:', cols.rows.map((x) => x.column_name).join(', '));

  const mem = await c.query('SELECT * FROM organization_users ORDER BY id LIMIT 20');
  console.log('\n=== organization_users (sample) ===');
  console.table(mem.rows);

  const user42 = await c.query(`
    SELECT ou.*, o.name AS org_name, u.email
    FROM organization_users ou
    LEFT JOIN organizations o ON o.id = ou.organization_id
    LEFT JOIN up_users u ON u.id = (
      SELECT user_id FROM organization_users_user_lnk WHERE organization_user_id = ou.id LIMIT 1
    )
    WHERE EXISTS (SELECT 1 FROM organization_users_user_lnk l WHERE l.organization_user_id = ou.id AND l.user_id = 42)
  `).catch(async () => {
    return c.query(`
      SELECT l.user_id, l.organization_user_id, ou.organization_id, o.name AS org_name
      FROM organization_users_user_lnk l
      JOIN organization_users ou ON ou.id = l.organization_user_id
      LEFT JOIN organizations o ON o.id = ou.organization_id
      WHERE l.user_id = 42
    `);
  });
  console.log('\n=== admin@xmc.com (user 42) memberships ===');
  console.table(user42.rows);

  await c.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
