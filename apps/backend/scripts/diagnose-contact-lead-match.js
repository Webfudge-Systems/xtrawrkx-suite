'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  // Orphan contacts: same email domain as a lead company email?
  const matchable = await c.query(`
    SELECT COUNT(DISTINCT c.id)::int AS n
    FROM contacts c
    JOIN contacts_organization_lnk co ON co.contact_id = c.id AND co.organization_id = 1
    LEFT JOIN contacts_lead_company_lnk cl ON cl.contact_id = c.id
    JOIN lead_companies lc ON lc.email IS NOT NULL AND TRIM(lc.email) <> ''
    JOIN lead_companies_organization_lnk lo ON lo.lead_company_id = lc.id AND lo.organization_id = 1
    WHERE cl.contact_id IS NULL
      AND c.email IS NOT NULL
      AND LOWER(SPLIT_PART(c.email, '@', 2)) = LOWER(SPLIT_PART(lc.email, '@', 2))
  `);
  console.log('orphan contacts matchable by email domain to lead:', matchable.rows[0].n);

  // Primary contacts on leads without contact link back?
  const leadsWithEmail = await c.query(`
    SELECT COUNT(*)::int AS n FROM lead_companies lc
    JOIN lead_companies_organization_lnk lo ON lo.lead_company_id = lc.id AND lo.organization_id = 1
    WHERE lc.email IS NOT NULL AND TRIM(lc.email) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM contacts c
        JOIN contacts_lead_company_lnk cl ON cl.contact_id = c.id AND cl.lead_company_id = lc.id
        WHERE LOWER(c.email) = LOWER(lc.email)
      )
  `);
  console.log('leads with email but no linked contact with same email:', leadsWithEmail.rows[0].n);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
