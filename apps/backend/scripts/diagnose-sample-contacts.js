'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const ids = [5939, 5937, 5936, 5940, 100, 500];
  for (const id of ids) {
    const r = await c.query(
      `SELECT c.id, c.company_name, cl.lead_company_id, lc.company_name AS lc_name,
              ca.client_account_id, acc.company_name AS acc_name, ass.user_id, u.email AS owner_email
       FROM contacts c
       LEFT JOIN contacts_lead_company_lnk cl ON cl.contact_id = c.id
       LEFT JOIN lead_companies lc ON lc.id = cl.lead_company_id
       LEFT JOIN contacts_client_account_lnk ca ON ca.contact_id = c.id
       LEFT JOIN client_accounts acc ON acc.id = ca.client_account_id
       LEFT JOIN contacts_assigned_to_lnk ass ON ass.contact_id = c.id
       LEFT JOIN up_users u ON u.id = ass.user_id
       WHERE c.id = $1`,
      [id]
    );
    console.log('\ncontact', id, r.rows[0] || 'not found');
  }

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
