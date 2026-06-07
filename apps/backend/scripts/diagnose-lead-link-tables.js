'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const t = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE 'lead_companies%'
    ORDER BY 1
  `);
  console.log('lead_companies tables:');
  console.log(t.rows.map((r) => r.table_name).join('\n'));

  // notifications about leads?
  const notifTables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE '%notif%'
  `);
  console.log('\nnotification tables:', notifTables.rows.map((r) => r.table_name).join(', '));

  const notifSample = await c.query(`
    SELECT id, type, message, meta, created_at
    FROM notifications
    WHERE meta::text ILIKE '%lead%' OR message ILIKE '%lead%'
    ORDER BY created_at DESC LIMIT 5
  `).catch((e) => ({ err: e.message, rows: [] }));
  if (notifSample.err) console.log('notifications err', notifSample.err);
  else console.log('notification samples', notifSample.rows.length);

  // Check FK on lead_companies_assigned_to_lnk
  const fk = await c.query(`
    SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = 'lead_companies_assigned_to_lnk'::regclass
  `);
  console.log('\nFK constraints on assign link:');
  console.table(fk.rows);

  await c.end();
}

main().catch(console.error);
