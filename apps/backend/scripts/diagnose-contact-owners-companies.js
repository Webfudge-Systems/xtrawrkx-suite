'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const assigned = await c.query(
    'SELECT COUNT(DISTINCT contact_id)::int AS n FROM contacts_assigned_to_lnk'
  );
  const withCompanyText = await c.query(`
    SELECT COUNT(*)::int AS n FROM contacts c
    JOIN contacts_organization_lnk o ON o.contact_id = c.id AND o.organization_id = 1
    WHERE c.company_name IS NOT NULL AND TRIM(c.company_name) <> ''
  `);
  const orphanSample = await c.query(`
    SELECT c.id, c.first_name, c.last_name, c.email, c.company_name,
      EXISTS (SELECT 1 FROM contacts_assigned_to_lnk a WHERE a.contact_id = c.id) AS has_owner
    FROM contacts c
    JOIN contacts_organization_lnk o ON o.contact_id = c.id AND o.organization_id = 1
    WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk l WHERE l.contact_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM contacts_client_account_lnk l WHERE l.contact_id = c.id)
    ORDER BY c.created_at DESC
    LIMIT 10
  `);

  console.log('contacts with assignedTo link:', assigned.rows[0].n);
  console.log('org1 contacts with company_name text:', withCompanyText.rows[0].n);
  console.table(orphanSample.rows);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
