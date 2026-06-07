'use strict';

const { Client } = require('pg');

const url =
  process.env.BACKUP_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function tableExists(c, name) {
  const r = await c.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [name]
  );
  return r.rowCount > 0;
}

async function main() {
  const c = new Client({
    connectionString: url,
    ssl: url.includes('rlwy.net') ? { rejectUnauthorized: false } : undefined,
  });
  await c.connect();

  console.log('up_users:', await tableExists(c, 'up_users'));
  console.log('xtrawrkx_users:', await tableExists(c, 'xtrawrkx_users'));

  const assign = await c.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(user_id)::int AS with_user
    FROM lead_companies_assigned_to_lnk
  `);
  console.log('lead assign links:', assign.rows[0]);

  if (await tableExists(c, 'xtrawrkx_users')) {
    const sample = await c.query(`
      SELECT l.lead_company_id, l.user_id, u.email, lc.company_name
      FROM lead_companies_assigned_to_lnk l
      JOIN lead_companies lc ON lc.id = l.lead_company_id
      LEFT JOIN xtrawrkx_users u ON u.id = l.user_id
      WHERE l.user_id IS NOT NULL
      LIMIT 5
    `);
    console.log('\nsample (xtrawrkx_users):');
    console.table(sample.rows);
  }

  if (await tableExists(c, 'up_users')) {
    const sample = await c.query(`
      SELECT l.lead_company_id, l.user_id, u.email, lc.company_name
      FROM lead_companies_assigned_to_lnk l
      JOIN lead_companies lc ON lc.id = l.lead_company_id
      LEFT JOIN up_users u ON u.id = l.user_id
      WHERE l.user_id IS NOT NULL
      LIMIT 5
    `);
    console.log('\nsample (up_users):');
    console.table(sample.rows);
  }

  await c.end();
}

main().catch(console.error);
