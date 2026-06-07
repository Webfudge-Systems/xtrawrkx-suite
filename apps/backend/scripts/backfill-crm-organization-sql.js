'use strict';

/**
 * Fast Postgres backfill: link orphan CRM/PM rows to TARGET_ORG_ID via Strapi link tables.
 * Use when entityService row-by-row updates would take too long (4000+ leads).
 *
 *   TARGET_ORG_ID=1 node scripts/backfill-crm-organization-sql.js --dry-run
 *   TARGET_ORG_ID=1 node scripts/backfill-crm-organization-sql.js
 */

const { Client } = require('pg');

const DRY_RUN =
  String(process.env.DRY_RUN || '').toLowerCase() === 'true' ||
  process.argv.includes('--dry-run');

const TARGET_ORG_ID = parseInt(String(process.env.TARGET_ORG_ID || '1'), 10);

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

/** entity table → organization link table (Strapi 5 naming). */
const TABLE_LINKS = [
  { entity: 'lead_companies', link: 'lead_companies_organization_lnk', fk: 'lead_company_id' },
  { entity: 'contacts', link: 'contacts_organization_lnk', fk: 'contact_id' },
  { entity: 'deals', link: 'deals_organization_lnk', fk: 'deal_id' },
  { entity: 'client_accounts', link: 'client_accounts_organization_lnk', fk: 'client_account_id' },
  { entity: 'tasks', link: 'tasks_organization_lnk', fk: 'task_id' },
  { entity: 'meetings', link: 'meetings_organization_lnk', fk: 'meeting_id' },
  { entity: 'proposals', link: 'proposals_organization_lnk', fk: 'proposal_id' },
  { entity: 'invoices', link: 'invoices_organization_lnk', fk: 'invoice_id' },
  { entity: 'projects', link: 'projects_organization_lnk', fk: 'project_id' },
  { entity: 'crm_activities', link: 'crm_activities_organization_lnk', fk: 'crm_activity_id' },
];

async function tableExists(c, name) {
  const r = await c.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return r.rowCount > 0;
}

async function countOrphans(c, entity, link, fk) {
  const r = await c.query(
    `SELECT COUNT(*)::int AS n FROM ${entity} e
     WHERE NOT EXISTS (SELECT 1 FROM ${link} l WHERE l.${fk} = e.id)`
  );
  return r.rows[0].n;
}

async function backfillLink(c, entity, link, fk) {
  if (!(await tableExists(c, entity)) || !(await tableExists(c, link))) {
    return { entity, skipped: true, orphans: 0, inserted: 0 };
  }

  const orphans = await countOrphans(c, entity, link, fk);
  if (!orphans) return { entity, orphans: 0, inserted: 0 };

  if (DRY_RUN) {
    console.log(`[dry-run] ${entity}: would link ${orphans} row(s) → org ${TARGET_ORG_ID}`);
    return { entity, orphans, inserted: orphans };
  }

  const r = await c.query(
    `INSERT INTO ${link} (${fk}, organization_id)
     SELECT e.id, $1 FROM ${entity} e
     WHERE NOT EXISTS (SELECT 1 FROM ${link} l WHERE l.${fk} = e.id)`,
    [TARGET_ORG_ID]
  );
  console.log(`${entity}: linked ${r.rowCount} row(s) → org ${TARGET_ORG_ID}`);
  return { entity, orphans, inserted: r.rowCount };
}

async function main() {
  if (!TARGET_ORG_ID || Number.isNaN(TARGET_ORG_ID)) {
    throw new Error('Set TARGET_ORG_ID (e.g. 1 for Xtrawrkx Pvt. Ltd.)');
  }

  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const org = await c.query('SELECT id, name FROM organizations WHERE id = $1', [TARGET_ORG_ID]);
  if (!org.rows.length) throw new Error(`Organization ${TARGET_ORG_ID} not found`);
  console.log(DRY_RUN ? 'DRY RUN\n' : 'Live run\n');
  console.log(`Target org: ${TARGET_ORG_ID} (${org.rows[0].name})\n`);

  const summary = [];
  for (const { entity, link, fk } of TABLE_LINKS) {
    summary.push(await backfillLink(c, entity, link, fk));
  }

  console.log('\nDone.');
  console.log(JSON.stringify(summary, null, 2));
  await c.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
