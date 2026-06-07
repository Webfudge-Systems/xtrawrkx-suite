'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const orphans = await c.query(`
    SELECT c.id, c.first_name, c.last_name, c.email
    FROM contacts c
    JOIN contacts_organization_lnk o ON o.contact_id = c.id AND o.organization_id = 1
    WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk l WHERE l.contact_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM contacts_client_account_lnk l WHERE l.contact_id = c.id)
    ORDER BY c.created_at DESC
    LIMIT 12
  `);

  for (const row of orphans.rows) {
    const email = String(row.email || '').replace('@xtrawrkx.placeholder', '');
    const matches = await c.query(
      `
      SELECT lc.id, lc.company_name, lc.email,
        EXISTS (SELECT 1 FROM lead_companies_assigned_to_lnk a WHERE a.lead_company_id = lc.id AND a.user_id IS NOT NULL) AS has_owner
      FROM lead_companies lc
      JOIN lead_companies_organization_lnk lo ON lo.lead_company_id = lc.id AND lo.organization_id = 1
      WHERE LOWER(lc.email) = LOWER($1)
         OR LOWER(lc.company_name) LIKE '%' || LOWER($2) || '%'
      LIMIT 3
    `,
      [row.email, row.last_name || row.first_name]
    );
    console.log(`\nContact ${row.id} ${row.first_name} ${row.last_name} <${row.email}>`);
    console.table(matches.rows);
  }

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
