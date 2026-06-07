'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const tables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name LIKE '%lead%assign%' OR table_name LIKE '%lead_companies%')
    ORDER BY table_name
  `);
  console.log('relevant tables:\n ', tables.rows.map((r) => r.table_name).join('\n  '));

  const assigned = await c.query(`
    SELECT COUNT(*)::int AS with_assignee FROM lead_companies_assigned_to_lnk
  `).catch(() => ({ rows: [{ with_assignee: 'no table' }] }));
  const total = await c.query(`SELECT COUNT(*)::int AS n FROM lead_companies`);
  const unassigned = await c.query(`
    SELECT COUNT(*)::int AS n FROM lead_companies lc
    WHERE NOT EXISTS (SELECT 1 FROM lead_companies_assigned_to_lnk l WHERE l.lead_company_id = lc.id)
  `);

  console.log('\nlead_companies total:', total.rows[0].n);
  console.log('with assignedTo link:', assigned.rows[0].with_assignee);
  console.log('without assignedTo link:', unassigned.rows[0].n);

  const byUser = await c.query(`
    SELECT u.id, u.email, COUNT(*)::int AS leads
    FROM lead_companies_assigned_to_lnk l
    JOIN up_users u ON u.id = l.user_id
    GROUP BY u.id, u.email
    ORDER BY leads DESC
    LIMIT 20
  `);
  console.log('\nLeads per assignee (current):');
  console.table(byUser.rows);

  // Legacy columns on lead_companies?
  const cols = await c.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'lead_companies' ORDER BY ordinal_position
  `);
  console.log('\nlead_companies columns:', cols.rows.map((r) => r.column_name).join(', '));

  // Check for legacy xtrawrkx tables
  const legacy = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE '%xtrawrkx%'
  `);
  console.log('\nlegacy xtrawrkx tables:', legacy.rows.map((r) => r.table_name).join(', ') || 'none');

  // components or json fields?
  const sample = await c.query(`
    SELECT id, company_name, created_at FROM lead_companies
    WHERE id IN (4247, 4246, 4245, 4248)
  `);
  console.log('\nsample leads:');
  console.table(sample.rows);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
