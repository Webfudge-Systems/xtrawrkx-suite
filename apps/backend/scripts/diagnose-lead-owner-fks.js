'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Any link table referencing xtrawrkx or with non-null user in other entities
  const tables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND (table_name LIKE '%xtrawrkx%' OR table_name LIKE '%assigned%')
    ORDER BY table_name
  `);
  for (const { table_name } of tables.rows) {
    const cols = await c.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name=$1`,
      [table_name]
    );
    const colNames = cols.rows.map((r) => r.column_name);
    if (!colNames.includes('user_id')) continue;
    const stat = await c.query(
      `SELECT COUNT(*)::int AS total, COUNT(user_id)::int AS non_null FROM ${table_name}`
    );
    if (stat.rows[0].non_null > 0) {
      console.log(table_name, stat.rows[0]);
    }
  }

  // platform_activities?
  const pa = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE '%platform%'
  `);
  console.log('\nplatform tables:', pa.rows.map((r) => r.table_name).join(', '));

  // Maybe old FK column on link table pointed to wrong table - check constraints
  const fks = await c.query(`
    SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'lead_companies_assigned_to_lnk'
  `);
  console.log('\nlead_companies_assigned_to_lnk FKs:');
  console.table(fks.rows);

  // Check components / files for backup exports in repo - skip

  // Infer owner from primary contact email domain -> user who imported via linkedin?
  // Better: check if notes or description contain assignee

  // created_at distribution by month - who was active?
  const monthly = await c.query(`
    SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*)::int AS leads
    FROM lead_companies GROUP BY 1 ORDER BY 1
  `);
  console.log('\nleads by month:');
  console.table(monthly.rows);

  await c.end();
}

main().catch(console.error);
