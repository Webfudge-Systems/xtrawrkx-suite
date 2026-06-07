'use strict';

/**
 * Fast bulk restore contacts_lead_company_lnk from exported backup CSV.
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DRY_RUN = process.argv.includes('--dry-run');
const url = process.env.DATABASE_URL;
const CSV_PATH = process.env.ASSIGNMENTS_CSV || 'exports/contact-assignees-from-backup-2026-06-04.csv';

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

async function main() {
  const raw = fs.readFileSync(path.resolve(CSV_PATH), 'utf8').replace(/^\uFEFF/, '');
  const rows = raw.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(rows[0]).map((h) => h.toLowerCase());
  const ci = header.indexOf('contact_id');
  const li = header.indexOf('lead_company_id');
  if (ci < 0 || li < 0) throw new Error('CSV needs contact_id and lead_company_id');

  const pairs = [];
  for (let i = 1; i < rows.length; i += 1) {
    const p = parseCsvLine(rows[i]);
    const contactId = parseInt(p[ci], 10);
    const leadId = parseInt(p[li], 10);
    if (!Number.isNaN(contactId) && !Number.isNaN(leadId)) pairs.push([contactId, leadId]);
  }

  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await c.query('BEGIN');

  await c.query(`
    CREATE TEMP TABLE tmp_contact_lead (contact_id int, lead_company_id int) ON COMMIT DROP
  `);

  const chunk = 500;
  for (let i = 0; i < pairs.length; i += chunk) {
    const slice = pairs.slice(i, i + chunk);
    const vals = slice.map((_, j) => `($${j * 2 + 1}, $${j * 2 + 2})`).join(', ');
    const params = slice.flat();
    await c.query(`INSERT INTO tmp_contact_lead (contact_id, lead_company_id) VALUES ${vals}`, params);
  }

  if (DRY_RUN) {
    const stat = await c.query(`
      SELECT COUNT(*)::int AS would_insert
      FROM tmp_contact_lead t
      JOIN contacts c ON c.id = t.contact_id
      JOIN lead_companies lc ON lc.id = t.lead_company_id
      WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk cl WHERE cl.contact_id = t.contact_id)
    `);
    const upd = await c.query(`
      SELECT COUNT(*)::int AS would_update
      FROM tmp_contact_lead t
      JOIN contacts_lead_company_lnk cl ON cl.contact_id = t.contact_id
      WHERE cl.lead_company_id <> t.lead_company_id
    `);
    console.log(`[dry-run] insert ${stat.rows[0].would_insert}, update ${upd.rows[0].would_update}`);
    await c.query('ROLLBACK');
  } else {
    const ins = await c.query(`
      INSERT INTO contacts_lead_company_lnk (contact_id, lead_company_id)
      SELECT t.contact_id, t.lead_company_id
      FROM tmp_contact_lead t
      JOIN contacts c ON c.id = t.contact_id
      JOIN lead_companies lc ON lc.id = t.lead_company_id
      WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk cl WHERE cl.contact_id = t.contact_id)
    `);
    const upd = await c.query(`
      UPDATE contacts_lead_company_lnk cl
      SET lead_company_id = t.lead_company_id
      FROM tmp_contact_lead t
      WHERE cl.contact_id = t.contact_id AND cl.lead_company_id <> t.lead_company_id
    `);
    const names = await c.query(`
      UPDATE contacts c
      SET company_name = lc.company_name, updated_at = NOW()
      FROM contacts_lead_company_lnk cl
      JOIN lead_companies lc ON lc.id = cl.lead_company_id
      WHERE c.id = cl.contact_id
        AND lc.company_name IS NOT NULL AND TRIM(lc.company_name) <> ''
        AND (c.company_name IS NULL OR TRIM(c.company_name) = '')
    `);
    await c.query('COMMIT');
    console.log(`inserted ${ins.rowCount}, updated ${upd.rowCount}, company_name ${names.rowCount}`);
  }

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
