'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  for (const t of ['deals_assigned_to_lnk', 'proposals_assigned_to_lnk', 'meetings_assigned_to_lnk']) {
    const r = await c.query(`
      SELECT COUNT(*)::int AS total,
             COUNT(user_id)::int AS with_user,
             COUNT(*) FILTER (WHERE user_id IS NOT NULL)::int AS non_null
      FROM ${t}
    `).catch(() => null);
    if (r) console.log(t, r.rows[0]);
  }

  const act = await c.query(`
    SELECT COUNT(*)::int AS total FROM crm_activities
  `);
  console.log('\ncrm_activities total:', act.rows[0].total);

  const actMeta = await c.query(`
    SELECT id, action, subject_type, subject_id, summary, meta, created_at
    FROM crm_activities
    WHERE meta IS NOT NULL AND meta::text NOT ILIKE '%null%'
    ORDER BY created_at DESC
    LIMIT 15
  `);
  console.log('\ncrm_activities with meta sample:');
  for (const row of actMeta.rows) {
    console.log(row.id, row.subject_type, row.action, JSON.stringify(row.meta)?.slice(0, 200));
  }

  // Strapi admin audit - components?
  const notes = await c.query(`
    SELECT id, company_name, LEFT(notes, 120) AS notes_preview
    FROM lead_companies
    WHERE notes IS NOT NULL AND TRIM(notes) <> ''
    LIMIT 5
  `);
  console.log('\nleads with notes:', notes.rows.length);
  console.table(notes.rows);

  // Check if inv_* tables exist (strapi v4)
  const inv = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE '%inv_%'
    LIMIT 20
  `);
  console.log('\ninv tables:', inv.rows.map((r) => r.table_name).join(', ') || 'none');

  await c.end();
}

main().catch(console.error);
