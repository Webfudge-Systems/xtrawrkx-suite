'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const cols = await c.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'lead_companies_organization_lnk' ORDER BY ordinal_position
  `);
  console.log('lead_companies_organization_lnk cols:', cols.rows.map((x) => x.column_name).join(', '));

  const recent = await c.query(`
    SELECT lc.id, lc.company_name, lc.created_at, l.organization_id
    FROM lead_companies lc
    JOIN lead_companies_organization_lnk l ON l.lead_company_id = lc.id
    ORDER BY lc.created_at DESC
    LIMIT 30
  `);
  console.log('\n30 most recent leads:');
  console.table(recent.rows);

  const orgCounts = await c.query(`
    SELECT l.organization_id, COUNT(*)::int AS n,
           MIN(lc.created_at) AS oldest, MAX(lc.created_at) AS newest
    FROM lead_companies lc
    JOIN lead_companies_organization_lnk l ON l.lead_company_id = lc.id
    GROUP BY l.organization_id
  `);
  console.log('\nLeads per org with date range:');
  console.table(orgCounts.rows);

  // contacts missing lead company but have companyName field
  const withCompanyName = await c.query(`
    SELECT COUNT(*)::int AS n FROM contacts
    WHERE company_name IS NOT NULL AND TRIM(company_name) <> ''
  `);
  const missingLeadLink = await c.query(`
    SELECT COUNT(*)::int AS n FROM contacts c
    WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk l WHERE l.contact_id = c.id)
      AND (c.company_name IS NULL OR TRIM(c.company_name) = '')
  `);
  console.log('\ncontacts with company_name text:', withCompanyName.rows[0].n);
  console.log('contacts no lead link AND no company_name:', missingLeadLink.rows[0].n);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
