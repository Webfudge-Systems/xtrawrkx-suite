'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const contactCols = await c.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'contacts' ORDER BY ordinal_position
  `);
  console.log('contacts columns:', contactCols.rows.map((r) => r.column_name).join(', '));

  const legacyTables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (table_name LIKE '%contact%lead%' OR table_name LIKE '%lead%contact%')
    ORDER BY table_name
  `);
  console.log('\nlegacy link tables:', legacyTables.rows.map((r) => r.table_name).join('\n  '));

  // Check if lead_companies_contacts_lnk exists (inverse)
  const inv = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'lead_companies%lnk'
    ORDER BY table_name
  `);
  console.log('\nlead_companies link tables:', inv.rows.map((r) => r.table_name).join('\n  '));

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
