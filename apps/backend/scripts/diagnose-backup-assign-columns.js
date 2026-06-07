'use strict';

const { Client } = require('pg');

const url =
  process.env.BACKUP_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({
    connectionString: url,
    ssl: url.includes('rlwy.net') ? { rejectUnauthorized: false } : undefined,
  });
  await c.connect();

  for (const t of [
    'lead_companies_assigned_to_lnk',
    'lead_companies',
    'xtrawrkx_users',
    'contacts_assigned_to_lnk',
  ]) {
    const cols = await c.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
      [t]
    );
    console.log(`\n${t}:`, cols.rows.map((r) => r.column_name).join(', ') || 'MISSING');
  }

  const lnkTables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND (table_name LIKE 'lead_companies%' OR table_name LIKE '%assigned%')
    ORDER BY 1
  `);
  console.log('\nall lead/assigned tables:');
  console.log(lnkTables.rows.map((r) => r.table_name).join('\n'));

  const sample = await c.query(`SELECT * FROM lead_companies_assigned_to_lnk LIMIT 3`).catch((e) => ({
    err: e.message,
  }));
  if (sample.err) console.log('\nassign sample err:', sample.err);
  else console.table(sample.rows);

  // Maybe FK column named differently
  const fkCols = await c.query(`
    SELECT tc.table_name, kcu.column_name, ccu.table_name AS ref_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name LIKE '%lead_companies%assigned%'
  `);
  console.log('\nFKs on assign link:');
  console.table(fkCols.rows);

  await c.end();
}

main().catch(console.error);
