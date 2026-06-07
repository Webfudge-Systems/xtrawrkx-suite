'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const linkUserIds = await c.query(`
    SELECT l.user_id, COUNT(*)::int AS leads,
           u.email AS up_user_email
    FROM lead_companies_assigned_to_lnk l
    LEFT JOIN up_users u ON u.id = l.user_id
    GROUP BY l.user_id, u.email
    ORDER BY leads DESC
    LIMIT 40
  `);
  console.log('assigned_to user_id distribution:');
  console.table(linkUserIds.rows);

  const broken = await c.query(`
    SELECT COUNT(*)::int AS n FROM lead_companies_assigned_to_lnk l
    WHERE NOT EXISTS (SELECT 1 FROM up_users u WHERE u.id = l.user_id)
  `);
  console.log('\nlinks pointing to missing up_users:', broken.rows[0].n);

  // created_by_id on leads might indicate owner?
  const byCreator = await c.query(`
    SELECT lc.created_by_id, u.email, COUNT(*)::int AS leads
    FROM lead_companies lc
    LEFT JOIN up_users u ON u.id = lc.created_by_id
    WHERE lc.created_by_id IS NOT NULL
    GROUP BY lc.created_by_id, u.email
    ORDER BY leads DESC
    LIMIT 20
  `);
  console.log('\nlead_companies by created_by_id:');
  console.table(byCreator.rows);

  // contacts assigned_to as proxy for lead owner?
  const contactAssign = await c.query(`
    SELECT ca.user_id, u.email, COUNT(DISTINCT cl.lead_company_id)::int AS leads_via_contact
    FROM contacts_assigned_to_lnk ca
    JOIN contacts_lead_company_lnk cl ON cl.contact_id = ca.contact_id
    LEFT JOIN up_users u ON u.id = ca.user_id
    GROUP BY ca.user_id, u.email
    ORDER BY leads_via_contact DESC
    LIMIT 20
  `);
  console.log('\nlead owners inferred from contact assignedTo:');
  console.table(contactAssign.rows);

  // up_users id list
  const users = await c.query(`SELECT id, email FROM up_users ORDER BY id`);
  console.log('\nvalid up_users ids:', users.rows.map((r) => `${r.id}:${r.email}`).join(', '));

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
