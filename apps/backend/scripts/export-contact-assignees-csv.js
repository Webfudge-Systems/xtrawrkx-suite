'use strict';

/**
 * Export contact assignee mappings (legacy or current schema).
 *
 *   BACKUP_DATABASE_URL="..." OUT_PATH=exports/contacts-assignees.csv node scripts/export-contact-assignees-csv.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const url = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL;
const OUT_PATH = process.env.OUT_PATH;

if (!url || !OUT_PATH) {
  console.error('Set BACKUP_DATABASE_URL and OUT_PATH');
  process.exit(1);
}

async function columnExists(c, table, column) {
  const r = await c.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
    [table, column]
  );
  return r.rowCount > 0;
}

function csvEscape(value) {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

async function main() {
  const c = new Client({
    connectionString: url,
    ssl: url.includes('rlwy.net') ? { rejectUnauthorized: false } : undefined,
  });
  await c.connect();

  const legacy = await columnExists(c, 'contacts_assigned_to_lnk', 'xtrawrkx_user_id');
  const sql = legacy
    ? `
      SELECT c.id AS contact_id,
             ca.xtrawrkx_user_id AS owner_user_id,
             u.email AS owner_email,
             u.first_name AS owner_first_name,
             u.last_name AS owner_last_name,
             c.first_name AS contact_first_name,
             c.last_name AS contact_last_name,
             c.email AS contact_email,
             lc.id AS lead_company_id,
             lc.company_name
      FROM contacts_assigned_to_lnk ca
      JOIN contacts c ON c.id = ca.contact_id
      LEFT JOIN xtrawrkx_users u ON u.id = ca.xtrawrkx_user_id
      LEFT JOIN contacts_lead_company_lnk cl ON cl.contact_id = c.id
      LEFT JOIN lead_companies lc ON lc.id = cl.lead_company_id
      WHERE ca.xtrawrkx_user_id IS NOT NULL
      ORDER BY c.id
    `
    : `
      SELECT c.id AS contact_id,
             ca.user_id AS owner_user_id,
             u.email AS owner_email,
             u.first_name AS owner_first_name,
             u.last_name AS owner_last_name,
             c.first_name AS contact_first_name,
             c.last_name AS contact_last_name,
             c.email AS contact_email,
             lc.id AS lead_company_id,
             lc.company_name
      FROM contacts_assigned_to_lnk ca
      JOIN contacts c ON c.id = ca.contact_id
      LEFT JOIN up_users u ON u.id = ca.user_id
      LEFT JOIN contacts_lead_company_lnk cl ON cl.contact_id = c.id
      LEFT JOIN lead_companies lc ON lc.id = cl.lead_company_id
      WHERE ca.user_id IS NOT NULL
      ORDER BY c.id
    `;

  const { rows } = await c.query(sql);
  const header =
    'contact_id,owner_user_id,owner_email,owner_first_name,owner_last_name,contact_first_name,contact_last_name,contact_email,lead_company_id,company_name';
  const lines = [header];
  for (const r of rows) {
    lines.push(
      [
        r.contact_id,
        r.owner_user_id,
        csvEscape(r.owner_email),
        csvEscape(r.owner_first_name),
        csvEscape(r.owner_last_name),
        csvEscape(r.contact_first_name),
        csvEscape(r.contact_last_name),
        csvEscape(r.contact_email),
        r.lead_company_id ?? '',
        csvEscape(r.company_name),
      ].join(',')
    );
  }

  const out = path.resolve(OUT_PATH);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${rows.length} contact assignee row(s) → ${out}`);

  await c.end();
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
