'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const noLink = await c.query(`
    SELECT COUNT(*)::int AS n FROM lead_companies lc
    WHERE NOT EXISTS (
      SELECT 1 FROM lead_companies_assigned_to_lnk l WHERE l.lead_company_id = lc.id
    )
  `);
  console.log('leads without assign link row:', noLink.rows[0].n);

  const r = await c.query(`
    SELECT DATE(lc.created_at) AS day, COUNT(*)::int AS leads,
           COUNT(l.user_id)::int AS with_assignee
    FROM lead_companies lc
    LEFT JOIN lead_companies_assigned_to_lnk l ON l.lead_company_id = lc.id
    GROUP BY 1 ORDER BY 1 DESC LIMIT 15
  `);
  console.log('\nleads by day:');
  console.table(r.rows);

  const u = await c.query('SELECT id, email, first_name, last_name FROM up_users ORDER BY id');
  console.log('\nusers:', u.rows.length);
  console.table(u.rows);

  // strapi core store might have schema history
  const store = await c.query(`
    SELECT key, LEFT(value::text, 200) AS val
    FROM strapi_core_store_settings
    WHERE key ILIKE '%schema%' OR key ILIKE '%content%'
    LIMIT 10
  `).catch(() => ({ rows: [] }));
  console.log('\nstrapi store keys sample:', store.rows.length);

  await c.end();
}

main().catch(console.error);
