'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function countLink(c, linkTable, orgCol = 'organization_id') {
  if (!(await tableExists(c, linkTable))) return null;
  const r = await c.query(`SELECT COUNT(*)::int AS n FROM ${linkTable}`);
  return r.rows[0].n;
}

async function tableExists(c, name) {
  const r = await c.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return r.rowCount > 0;
}

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  console.log('=== org 1 counts ===');
  for (const [entity, link] of [
    ['lead_companies', 'lead_companies_organization_lnk'],
    ['contacts', 'contacts_organization_lnk'],
  ]) {
    const total = (await c.query(`SELECT COUNT(*)::int AS n FROM ${entity}`)).rows[0].n;
    const inOrg1 = await c.query(
      `SELECT COUNT(*)::int AS n FROM ${link} WHERE organization_id = 1`
    );
    console.log(`${entity}: total=${total}, org1=${inOrg1.rows[0].n}`);
  }

  console.log('\n=== contact → leadCompany links ===');
  const lcLink = await c.query(`
    SELECT COUNT(*)::int AS total FROM contacts
  `);
  const withLead = await c.query(`
    SELECT COUNT(DISTINCT l.contact_id)::int AS n
    FROM contacts_lead_company_lnk l
  `).catch(() => ({ rows: [{ n: 'err' }] }));
  const withClient = await c.query(`
    SELECT COUNT(DISTINCT l.contact_id)::int AS n
    FROM contacts_client_account_lnk l
  `).catch(() => ({ rows: [{ n: 'err' }] }));
  const orphanContactLead = await c.query(`
    SELECT COUNT(*)::int AS n FROM contacts c
    WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk l WHERE l.contact_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM contacts_client_account_lnk l WHERE l.contact_id = c.id)
  `).catch(() => ({ rows: [{ n: 'err' }] }));

  console.log('contacts total:', lcLink.rows[0].total);
  console.log('with leadCompany link:', withLead.rows[0]?.n);
  console.log('with clientAccount link:', withClient.rows[0]?.n);
  console.log('no company link at all:', orphanContactLead.rows[0]?.n);

  console.log('\n=== contact link tables ===');
  const links = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE 'contacts_%_lnk'
    ORDER BY table_name
  `);
  console.log(links.rows.map((r) => r.table_name).join('\n'));

  console.log('\n=== department links (contacts) ===');
  const deptLinks = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE '%department%'
    ORDER BY table_name
  `);
  console.log(deptLinks.rows.map((r) => r.table_name).join('\n'));

  const contactDept = await c.query(`
    SELECT COUNT(DISTINCT contact_id)::int AS n FROM contacts_department_lnk
  `).catch((e) => ({ rows: [{ n: e.message }] }));
  console.log('contacts with department link:', contactDept.rows[0]?.n);

  console.log('\n=== sample contacts without lead company (org 1) ===');
  const sample = await c.query(`
    SELECT c.id, c.first_name, c.last_name, c.email, c.created_at
    FROM contacts c
    JOIN contacts_organization_lnk o ON o.contact_id = c.id AND o.organization_id = 1
    WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk l WHERE l.contact_id = c.id)
    ORDER BY c.created_at DESC
    LIMIT 5
  `);
  console.table(sample.rows);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
