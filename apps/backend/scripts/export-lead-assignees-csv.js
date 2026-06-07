'use strict';

/**
 * Export lead assignee mappings from Postgres (current or legacy backup schema).
 *
 *   BACKUP_DATABASE_URL="postgresql://..." node scripts/export-lead-assignees-csv.js > lead-assignees.csv
 *
 * Legacy backup (Jun 2026): lead_companies_assigned_to_lnk.xtrawrkx_user_id → xtrawrkx_users
 * Current schema: lead_companies_assigned_to_lnk.user_id → up_users
 *
 * Output CSV columns:
 *   lead_company_id, owner_user_id, owner_email, owner_first_name, owner_last_name, company_name
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const url = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL;
const OUT_PATH = process.env.OUT_PATH;

if (!url) {
  console.error('Set BACKUP_DATABASE_URL or DATABASE_URL');
  process.exit(1);
}

async function tableExists(c, name) {
  const r = await c.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [name]
  );
  return r.rowCount > 0;
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

function buildQuery(mode) {
  if (mode === 'legacy') {
    return `
      SELECT l.lead_company_id,
             l.xtrawrkx_user_id AS owner_user_id,
             u.email AS owner_email,
             u.first_name AS owner_first_name,
             u.last_name AS owner_last_name,
             lc.company_name
      FROM lead_companies_assigned_to_lnk l
      JOIN lead_companies lc ON lc.id = l.lead_company_id
      LEFT JOIN xtrawrkx_users u ON u.id = l.xtrawrkx_user_id
      WHERE l.xtrawrkx_user_id IS NOT NULL
      ORDER BY l.lead_company_id
    `;
  }
  return `
    SELECT l.lead_company_id,
           l.user_id AS owner_user_id,
           u.email AS owner_email,
           u.first_name AS owner_first_name,
           u.last_name AS owner_last_name,
           lc.company_name
    FROM lead_companies_assigned_to_lnk l
    JOIN lead_companies lc ON lc.id = l.lead_company_id
    LEFT JOIN up_users u ON u.id = l.user_id
    WHERE l.user_id IS NOT NULL
    ORDER BY l.lead_company_id
  `;
}

async function main() {
  const c = new Client({
    connectionString: url,
    ssl:
      url.includes('sslmode=require') || url.includes('rlwy.net')
        ? { rejectUnauthorized: false }
        : undefined,
  });
  await c.connect();

  const hasLegacyCol = await columnExists(c, 'lead_companies_assigned_to_lnk', 'xtrawrkx_user_id');
  const hasUpUsers = await tableExists(c, 'up_users');
  const mode = hasLegacyCol ? 'legacy' : 'current';

  console.error(`Export mode: ${mode}${hasLegacyCol ? ' (xtrawrkx_user_id)' : ' (user_id)'}`);

  const { rows } = await c.query(buildQuery(mode));

  const header =
    'lead_company_id,owner_user_id,owner_email,owner_first_name,owner_last_name,company_name';
  const lines = [header];
  for (const r of rows) {
    lines.push(
      [
        r.lead_company_id,
        r.owner_user_id,
        csvEscape(r.owner_email),
        csvEscape(r.owner_first_name),
        csvEscape(r.owner_last_name),
        csvEscape(r.company_name),
      ].join(',')
    );
  }

  const body = lines.join('\n') + '\n';

  if (OUT_PATH) {
    const out = path.resolve(OUT_PATH);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, body, 'utf8');
    console.error(`Wrote ${rows.length} row(s) → ${out}`);
  } else {
    process.stdout.write(body);
    console.error(`\nExported ${rows.length} row(s) to stdout`);
  }

  await c.end();
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
