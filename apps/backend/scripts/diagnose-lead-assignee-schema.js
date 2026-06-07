'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  for (const t of ['lead_companies_assigned_to_lnk', 'contacts_assigned_to_lnk']) {
    const cols = await c.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
      [t]
    );
    console.log(`\n${t} columns:`, cols.rows.map((r) => r.column_name).join(', '));
    const sample = await c.query(`SELECT * FROM ${t} LIMIT 5`);
    console.table(sample.rows);
  }

  // crm_activities for assignment?
  const actCols = await c.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='crm_activities' ORDER BY ordinal_position
  `);
  console.log('\ncrm_activities columns:', actCols.rows.map((r) => r.column_name).join(', '));

  const actSample = await c.query(`
    SELECT id, action, subject_type, summary, actor_user_id, created_at
    FROM crm_activities
    WHERE subject_type ILIKE '%lead%' OR summary ILIKE '%assign%'
    ORDER BY created_at DESC LIMIT 10
  `).catch((e) => console.log('crm_activities err', e.message));

  if (actSample?.rows) console.table(actSample.rows);

  // Check admin tables / strapi relations with inv_* 
  const allLnk = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE '%assigned%'
    ORDER BY table_name
  `);
  console.log('\nall assigned link tables:', allLnk.rows.map((r) => r.table_name).join('\n  '));

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
