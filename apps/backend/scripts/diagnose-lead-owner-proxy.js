'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // tasks linked to leads with assignee
  const taskAssign = await c.query(`
    SELECT ta.user_id, u.email, COUNT(DISTINCT tl.lead_company_id)::int AS leads
    FROM tasks_lead_company_lnk tl
    JOIN tasks_assignee_lnk ta ON ta.task_id = tl.task_id
    LEFT JOIN up_users u ON u.id = ta.user_id
    WHERE ta.user_id IS NOT NULL
    GROUP BY ta.user_id, u.email
    ORDER BY leads DESC
    LIMIT 20
  `).catch((e) => ({ err: e.message, rows: [] }));
  console.log('lead owners via task assignee:', taskAssign.err || '');
  console.table(taskAssign.rows || []);

  // meetings linked to leads?
  const meetTables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE 'meetings%lead%'
  `);
  console.log('meeting-lead tables:', meetTables.rows.map((r) => r.table_name).join(', ') || 'none');

  // deals with assignee linked to leads
  const dealAssign = await c.query(`
    SELECT da.user_id, u.email, COUNT(DISTINCT dl.lead_company_id)::int AS leads
    FROM deals_lead_company_lnk dl
    JOIN deals_assigned_to_lnk da ON da.deal_id = dl.deal_id
    LEFT JOIN up_users u ON u.id = da.user_id
    WHERE da.user_id IS NOT NULL
    GROUP BY da.user_id, u.email
  `).catch((e) => ({ err: e.message, rows: [] }));
  console.log('\ndeal assignee for leads:', dealAssign.err || '');
  console.table(dealAssign.rows || []);

  // notifications
  const cols = await c.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name='notifications' ORDER BY ordinal_position
  `);
  console.log('\nnotifications columns:', cols.rows.map((r) => r.column_name).join(', '));

  const notifCount = await c.query('SELECT COUNT(*)::int AS n FROM notifications');
  console.log('notifications total:', notifCount.rows[0].n);

  await c.end();
}

main().catch(console.error);
