'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  for (const t of [
    'lead_companies_assigned_to_lnk',
    'contacts_assigned_to_lnk',
    'deals_assigned_to_lnk',
    'client_accounts_assigned_to_lnk',
  ]) {
    const r = await c.query(
      `SELECT COUNT(*)::int AS total, COUNT(user_id)::int AS non_null FROM ${t}`
    );
    console.log(t, r.rows[0]);
  }

  const actorTables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE 'crm_activities%'
    ORDER BY 1
  `);
  console.log('\ncrm_activities tables:', actorTables.rows.map((r) => r.table_name).join(', '));

  const actorLnk = await c.query(`
    SELECT COUNT(*)::int AS total, COUNT(user_id)::int AS non_null FROM crm_activities_actor_lnk
  `);
  console.log('crm_activities_actor_lnk', actorLnk.rows[0]);

  const createTotal = await c.query(`
    SELECT COUNT(*)::int AS n FROM crm_activities a
    WHERE a.action='create' AND a.subject_type='api::lead-company.lead-company'
  `);
  console.log('total lead create activities:', createTotal.rows[0].n);

  const createWithActor = await c.query(`
    SELECT COUNT(DISTINCT a.subject_id)::int AS leads_with_actor
    FROM crm_activities a
    JOIN crm_activities_actor_lnk al ON al.crm_activity_id = a.id
    WHERE a.action = 'create'
      AND a.subject_type = 'api::lead-company.lead-company'
      AND al.user_id IS NOT NULL
  `);
  console.log('leads with create-activity actor:', createWithActor.rows[0].leads_with_actor);

  const metaAssign = await c.query(`
    SELECT COUNT(*)::int AS n FROM crm_activities
    WHERE meta IS NOT NULL
      AND (meta::text ILIKE '%assignedTo%' OR meta::text ILIKE '%assignee%')
  `);
  console.log('activities with assign meta:', metaAssign.rows[0].n);

  const metaSample = await c.query(`
    SELECT id, action, subject_type, subject_id, meta
    FROM crm_activities
    WHERE meta IS NOT NULL
      AND (meta::text ILIKE '%assignedTo%' OR meta::text ILIKE '%assignee%')
    LIMIT 5
  `);
  console.log('\nassign meta samples:');
  for (const row of metaSample.rows) {
    console.log(row.id, row.action, row.subject_type, JSON.stringify(row.meta)?.slice(0, 300));
  }

  const orphan = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND (table_name LIKE '%backup%' OR table_name LIKE '%old%' OR table_name LIKE '%xtrawrkx%')
  `);
  console.log('\nbackup/old/xtrawrkx tables:', orphan.rows.map((r) => r.table_name).join(', ') || 'none');

  const cb = await c.query(`
    SELECT COUNT(*)::int AS total, COUNT(created_by_id)::int AS non_null FROM lead_companies
  `);
  console.log('\nlead created_by_id', cb.rows[0]);

  // LinkedIn source leads - who imported?
  const bySource = await c.query(`
    SELECT source, COUNT(*)::int AS n FROM lead_companies GROUP BY source ORDER BY n DESC
  `);
  console.log('\nleads by source:');
  console.table(bySource.rows);

  // Check if any column across DB still has xtrawrkx_user reference
  const userCols = await c.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND (column_name LIKE '%xtrawrkx%' OR column_name LIKE '%owner%' OR column_name = 'assigned_to_id')
    ORDER BY 1, 2
  `);
  console.log('\ncolumns with owner/xtrawrkx/assigned_to_id:');
  console.table(userCols.rows);

  // Distribution of user_id in lead assign link (including null)
  const dist = await c.query(`
    SELECT COALESCE(l.user_id::text, 'NULL') AS user_id, u.email, COUNT(*)::int AS leads
    FROM lead_companies_assigned_to_lnk l
    LEFT JOIN up_users u ON u.id = l.user_id
    GROUP BY l.user_id, u.email
    ORDER BY leads DESC
    LIMIT 15
  `);
  console.log('\nlead assignee distribution:');
  console.table(dist.rows);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
