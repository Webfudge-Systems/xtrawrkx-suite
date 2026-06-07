'use strict';

/**
 * Backfill contact ↔ lead company links and company_name text for CRM table display.
 *
 *   TARGET_ORG_ID=1 node scripts/backfill-contact-lead-links.js --dry-run
 *   TARGET_ORG_ID=1 node scripts/backfill-contact-lead-links.js
 */

const { Client } = require('pg');

const DRY_RUN =
  String(process.env.DRY_RUN || '').toLowerCase() === 'true' ||
  process.argv.includes('--dry-run');

const TARGET_ORG_ID = parseInt(String(process.env.TARGET_ORG_ID || '1'), 10);

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function runStep(c, label, sql, params = []) {
  if (DRY_RUN) {
    const countSql = sql.replace(/^INSERT INTO/i, 'SELECT COUNT(*)::int AS n FROM (SELECT 1 FROM');
    // dry-run counts are best-effort; log label only for mutating steps
    console.log(`[dry-run] ${label}`);
    return 0;
  }
  const r = await c.query(sql, params);
  const n = r.rowCount ?? 0;
  console.log(`${label}: ${n} row(s)`);
  return n;
}

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  console.log(DRY_RUN ? 'DRY RUN\n' : 'Live run\n');
  console.log(`Org ${TARGET_ORG_ID}\n`);

  // Link orphan contacts to lead when emails match exactly (same org)
  await runStep(
    c,
    'Link contacts → lead by matching email',
    `INSERT INTO contacts_lead_company_lnk (contact_id, lead_company_id)
     SELECT DISTINCT c.id, lc.id
     FROM contacts c
     JOIN contacts_organization_lnk co ON co.contact_id = c.id AND co.organization_id = $1
     JOIN lead_companies lc ON LOWER(TRIM(lc.email)) = LOWER(TRIM(c.email))
     JOIN lead_companies_organization_lnk lo ON lo.lead_company_id = lc.id AND lo.organization_id = $1
     LEFT JOIN contacts_lead_company_lnk cl ON cl.contact_id = c.id
     WHERE cl.contact_id IS NULL
       AND c.email IS NOT NULL AND TRIM(c.email) <> ''
       AND lc.email IS NOT NULL AND TRIM(lc.email) <> ''`,
    [TARGET_ORG_ID]
  );

  // Link orphan contacts to lead when company_name matches (LinkedIn extension imports, etc.)
  await runStep(
    c,
    'Link contacts → lead by matching company_name',
    `INSERT INTO contacts_lead_company_lnk (contact_id, lead_company_id)
     SELECT DISTINCT ON (c.id) c.id, lc.id
     FROM contacts c
     JOIN contacts_organization_lnk co ON co.contact_id = c.id AND co.organization_id = $1
     JOIN lead_companies lc ON LOWER(TRIM(lc.company_name)) = LOWER(TRIM(c.company_name))
     JOIN lead_companies_organization_lnk lo ON lo.lead_company_id = lc.id AND lo.organization_id = $1
     LEFT JOIN contacts_lead_company_lnk cl ON cl.contact_id = c.id
     WHERE cl.contact_id IS NULL
       AND c.company_name IS NOT NULL AND TRIM(c.company_name) <> ''
     ORDER BY c.id, lc.id`,
    [TARGET_ORG_ID]
  );

  // Link orphan contacts to client account when emails match (website signups, etc.)
  await runStep(
    c,
    'Link contacts → client account by matching email',
    `INSERT INTO contacts_client_account_lnk (contact_id, client_account_id)
     SELECT DISTINCT c.id, ca.id
     FROM contacts c
     JOIN contacts_organization_lnk co ON co.contact_id = c.id AND co.organization_id = $1
     JOIN client_accounts ca ON LOWER(TRIM(ca.email)) = LOWER(TRIM(c.email))
     JOIN client_accounts_organization_lnk ao ON ao.client_account_id = ca.id AND ao.organization_id = $1
     LEFT JOIN contacts_client_account_lnk cc ON cc.contact_id = c.id
     WHERE cc.contact_id IS NULL
       AND c.email IS NOT NULL AND TRIM(c.email) <> ''
       AND ca.email IS NOT NULL AND TRIM(ca.email) <> ''`,
    [TARGET_ORG_ID]
  );

  // Copy lead company name onto contact.company_name when linked but text empty
  if (DRY_RUN) {
    console.log('[dry-run] Copy lead company_name → contact.company_name where empty');
  } else {
    const r = await c.query(
      `UPDATE contacts c
       SET company_name = lc.company_name, updated_at = NOW()
       FROM contacts_lead_company_lnk cl
       JOIN lead_companies lc ON lc.id = cl.lead_company_id
       WHERE c.id = cl.contact_id
         AND EXISTS (
           SELECT 1 FROM contacts_organization_lnk co
           WHERE co.contact_id = c.id AND co.organization_id = $1
         )
         AND lc.company_name IS NOT NULL AND TRIM(lc.company_name) <> ''
         AND (c.company_name IS NULL OR TRIM(c.company_name) = '')`,
      [TARGET_ORG_ID]
    );
    console.log(`Copy company_name from linked lead: ${r.rowCount} contact(s)`);
  }

  // Copy client account name onto contact.company_name when linked but text empty
  if (DRY_RUN) {
    console.log('[dry-run] Copy client account company_name → contact.company_name where empty');
  } else {
    const r2 = await c.query(
      `UPDATE contacts c
       SET company_name = ca.company_name, updated_at = NOW()
       FROM contacts_client_account_lnk cc
       JOIN client_accounts ca ON ca.id = cc.client_account_id
       WHERE c.id = cc.contact_id
         AND EXISTS (
           SELECT 1 FROM contacts_organization_lnk co
           WHERE co.contact_id = c.id AND co.organization_id = $1
         )
         AND ca.company_name IS NOT NULL AND TRIM(ca.company_name) <> ''
         AND (c.company_name IS NULL OR TRIM(c.company_name) = '')`,
      [TARGET_ORG_ID]
    );
    console.log(`Copy company_name from linked client account: ${r2.rowCount} contact(s)`);
  }

  // Sync contact owner from linked lead company owner when contact assignee is null
  if (DRY_RUN) {
    console.log('[dry-run] Sync contact assignee from linked lead company owner');
  } else {
    const r3 = await c.query(
      `INSERT INTO contacts_assigned_to_lnk (contact_id, user_id)
       SELECT DISTINCT c.id, la.user_id
       FROM contacts c
       JOIN contacts_organization_lnk co ON co.contact_id = c.id AND co.organization_id = $1
       JOIN contacts_lead_company_lnk cl ON cl.contact_id = c.id
       JOIN lead_companies_assigned_to_lnk la ON la.lead_company_id = cl.lead_company_id
       WHERE la.user_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM contacts_assigned_to_lnk ca
           WHERE ca.contact_id = c.id AND ca.user_id IS NOT NULL
         )`,
      [TARGET_ORG_ID]
    );
    const r4 = await c.query(
      `UPDATE contacts_assigned_to_lnk ca
       SET user_id = la.user_id
       FROM contacts c
       JOIN contacts_lead_company_lnk cl ON cl.contact_id = c.id
       JOIN lead_companies_assigned_to_lnk la ON la.lead_company_id = cl.lead_company_id
       WHERE ca.contact_id = c.id
         AND ca.user_id IS NULL
         AND la.user_id IS NOT NULL`
    );
    console.log(`Insert contact assignee from lead owner: ${r3.rowCount} row(s)`);
    console.log(`Update null contact assignee from lead owner: ${r4.rowCount} row(s)`);
  }

  // Sync contact owner from linked client account manager when still unassigned
  if (DRY_RUN) {
    console.log('[dry-run] Sync contact assignee from linked client account manager');
  } else {
    const r5 = await c.query(
      `INSERT INTO contacts_assigned_to_lnk (contact_id, user_id)
       SELECT DISTINCT c.id, aa.user_id
       FROM contacts c
       JOIN contacts_client_account_lnk cc ON cc.contact_id = c.id
       JOIN client_accounts_assigned_to_lnk aa ON aa.client_account_id = cc.client_account_id
       WHERE aa.user_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM contacts_assigned_to_lnk ca
           WHERE ca.contact_id = c.id AND ca.user_id IS NOT NULL
         )`
    );
    const r6 = await c.query(
      `UPDATE contacts_assigned_to_lnk ca
       SET user_id = aa.user_id
       FROM contacts_client_account_lnk cc
       JOIN client_accounts_assigned_to_lnk aa ON aa.client_account_id = cc.client_account_id
       WHERE ca.contact_id = cc.contact_id
         AND ca.user_id IS NULL
         AND aa.user_id IS NOT NULL`
    );
    console.log(`Insert contact assignee from client manager: ${r5.rowCount} row(s)`);
    console.log(`Update null contact assignee from client manager: ${r6.rowCount} row(s)`);
  }

  await c.end();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
