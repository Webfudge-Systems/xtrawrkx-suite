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
    WHERE table_schema='public'
      AND (
        table_name LIKE '%_bak%'
        OR table_name LIKE '%_backup%'
        OR table_name LIKE '%_old%'
        OR table_name LIKE '%_copy%'
        OR table_name LIKE '%assign%'
      )
    ORDER BY 1
  `);
  console.log('candidate tables:');
  for (const { table_name } of tables.rows) {
    const cols = await c.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name=$1`,
      [table_name]
    );
    const names = cols.rows.map((r) => r.column_name);
    if (names.includes('user_id') && names.includes('lead_company_id')) {
      const stat = await c.query(
        `SELECT COUNT(*)::int AS total, COUNT(user_id)::int AS non_null FROM ${table_name}`
      );
      console.log(table_name, stat.rows[0]);
    }
  }

  await c.end();
}

main().catch(console.error);
