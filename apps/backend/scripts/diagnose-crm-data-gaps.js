'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function countOrphans(c, entity, link, fk, orgLink, orgFk) {
  const hasLink = await c.query(
    `SELECT 1 FROM information_schema.tables WHERE table_name=$1`,
    [link]
  );
  if (!hasLink.rowCount) return { entity, link: 'missing' };

  const noRel = await c.query(
    `SELECT COUNT(*)::int AS n FROM ${entity} e
     WHERE NOT EXISTS (SELECT 1 FROM ${link} l WHERE l.${fk} = e.id)`
  );
  const nulls = await c.query(`SELECT COUNT(*)::int AS total FROM ${entity}`);

  let noOrg = null;
  if (orgLink) {
    const r = await c.query(
      `SELECT COUNT(*)::int AS n FROM ${entity} e
       WHERE NOT EXISTS (SELECT 1 FROM ${orgLink} l WHERE l.${orgFk} = e.id)`
    );
    noOrg = r.rows[0].n;
  }
  return { entity, total: nulls.rows[0].total, noRel: noRel.rows[0].n, noOrg };
}

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  console.log('=== CRM entity counts ===');
  for (const t of [
    'lead_companies',
    'contacts',
    'deals',
    'client_accounts',
    'projects',
    'tasks',
    'meetings',
    'proposals',
    'invoices',
  ]) {
    const r = await c.query(`SELECT COUNT(*)::int AS n FROM ${t}`).catch(() => ({ rows: [{ n: '?' }] }));
    console.log(t, r.rows[0].n);
  }

  console.log('\n=== Lead → contact links ===');
  const lcNoContact = await c.query(`
    SELECT COUNT(*)::int AS n FROM lead_companies lc
    WHERE NOT EXISTS (
      SELECT 1 FROM contacts_lead_company_lnk cl WHERE cl.lead_company_id = lc.id
    )
  `);
  const contactsNoLead = await c.query(`
    SELECT COUNT(*)::int AS n FROM contacts c
    WHERE NOT EXISTS (
      SELECT 1 FROM contacts_lead_company_lnk cl WHERE cl.contact_id = c.id
    )
  `);
  const leadContactLinks = await c.query(`SELECT COUNT(*)::int AS n FROM contacts_lead_company_lnk`);
  console.log('contact-lead links:', leadContactLinks.rows[0].n);
  console.log('leads without linked contact:', lcNoContact.rows[0].n);
  console.log('contacts without lead:', contactsNoLead.rows[0].n);

  console.log('\n=== Lead deal_value ===');
  const dv = await c.query(`
    SELECT COUNT(*) FILTER (WHERE deal_value IS NULL OR deal_value = 0)::int AS zero_or_null,
           COUNT(*) FILTER (WHERE deal_value > 0)::int AS has_value,
           MAX(deal_value) AS max_val
    FROM lead_companies
  `);
  console.log(dv.rows[0]);

  console.log('\n=== Contact company_name / primary ===');
  const cn = await c.query(`
    SELECT COUNT(*) FILTER (WHERE company_name IS NULL OR TRIM(company_name) = '')::int AS empty_name,
           COUNT(*) FILTER (WHERE email IS NULL OR TRIM(email) = '')::int AS no_email
    FROM contacts
  `);
  console.log(cn.rows[0]);

  console.log('\n=== Deals ===');
  const deals = await c.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE value IS NULL OR value = 0)::int AS zero_value
    FROM deals
  `).catch(() => null);
  if (deals) console.log(deals.rows[0]);

  const dealLead = await c.query(`
    SELECT COUNT(*)::int AS n FROM deals_lead_company_lnk
  `).catch(() => ({ rows: [{ n: '?' }] }));
  console.log('deals-lead links:', dealLead.rows[0].n);

  console.log('\n=== Projects / tasks ===');
  for (const [t, lnk, fk] of [
    ['projects', 'projects_organization_lnk', 'project_id'],
    ['tasks', 'tasks_organization_lnk', 'task_id'],
    ['tasks', 'tasks_assignee_lnk', 'task_id'],
    ['tasks', 'tasks_assigner_lnk', 'task_id'],
    ['projects', 'projects_project_manager_lnk', 'project_id'],
  ]) {
    const total = await c.query(`SELECT COUNT(*)::int AS n FROM ${t.split('_')[0] === 'projects' && lnk.includes('manager') ? 'projects' : t}`).catch(() => null);
    const linked = await c.query(`SELECT COUNT(*)::int AS n FROM ${lnk}`).catch(() => ({ rows: [{ n: '?' }] }));
    console.log(`${lnk}: ${linked.rows[0].n} links (${t} total ${total?.rows[0]?.n ?? '?'})`);
  }

  console.log('\n=== Org membership ===');
  const org1 = await c.query(`
    SELECT COUNT(*)::int AS n FROM organization_users ou
    JOIN organization_users_organization_lnk ol ON ol.organization_user_id = ou.id
    WHERE ol.organization_id = 1
  `);
  console.log('org 1 memberships:', org1.rows[0].n);

  console.log('\n=== Messages / comments tables ===');
  const msgTables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema='public'
      AND (table_name LIKE '%comment%' OR table_name LIKE '%message%' OR table_name LIKE '%chat%')
    ORDER BY 1
  `);
  for (const { table_name } of msgTables.rows) {
    const n = await c.query(`SELECT COUNT(*)::int AS n FROM ${table_name}`);
    console.log(table_name, n.rows[0].n);
  }

  await c.end();
}

main().catch(console.error);
