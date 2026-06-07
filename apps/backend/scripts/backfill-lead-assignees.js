'use strict';

/**
 * Restore lead (and optionally contact) assignees from a backup Postgres or CSV.
 *
 * Production lost user_id values in lead_companies_assigned_to_lnk during the
 * xtrawrkx_users → up_users / Strapi schema migration. Use a Railway Postgres
 * backup (or old export) as the source of truth.
 *
 * From backup DB (same lead ids, non-null user_id in link table):
 *   BACKUP_DATABASE_URL="postgresql://..." node scripts/backfill-lead-assignees.js --dry-run
 *   BACKUP_DATABASE_URL="postgresql://..." node scripts/backfill-lead-assignees.js
 *
 * From CSV (header row required):
 *   lead_company_id,owner_user_id  OR  lead_company_id,owner_email
 *   OR company_name,user_email  OR  company_name,owner_email
 *   ASSIGNMENTS_CSV=./lead-assignees.csv node scripts/backfill-lead-assignees.js
 *
 * Options:
 *   --sync-contacts   copy lead owner onto linked contacts with null assignee
 *   --dry-run         report only
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DRY_RUN =
  String(process.env.DRY_RUN || '').toLowerCase() === 'true' ||
  process.argv.includes('--dry-run');
const SYNC_CONTACTS = process.argv.includes('--sync-contacts');

const TARGET_URL = process.env.DATABASE_URL;
const BACKUP_URL = process.env.BACKUP_DATABASE_URL;
const CSV_PATH = process.env.ASSIGNMENTS_CSV;

function sslFor(url) {
  return url && (url.includes('sslmode=require') || url.includes('rlwy.net'))
    ? { rejectUnauthorized: false }
    : undefined;
}

async function connect(url) {
  const c = new Client({ connectionString: url, ssl: sslFor(url) });
  await c.connect();
  return c;
}

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
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const parts = parseCsvLine(lines[i]);
    const row = {};
    header.forEach((key, idx) => {
      row[key] = parts[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

async function loadMappingsFromBackup(backup) {
  const legacy = await backup.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'lead_companies_assigned_to_lnk' AND column_name = 'xtrawrkx_user_id'
  `);
  const useLegacy = legacy.rowCount > 0;

  const { rows } = await backup.query(
    useLegacy
      ? `SELECT lead_company_id, xtrawrkx_user_id AS user_id
         FROM lead_companies_assigned_to_lnk WHERE xtrawrkx_user_id IS NOT NULL`
      : `SELECT lead_company_id, user_id
         FROM lead_companies_assigned_to_lnk WHERE user_id IS NOT NULL`
  );
  return rows.map((r) => ({
    leadCompanyId: Number(r.lead_company_id),
    userId: Number(r.user_id),
  }));
}

async function resolveUserId(target, emailCache, email) {
  const key = email?.trim().toLowerCase();
  if (!key) return null;
  if (emailCache.has(key)) return emailCache.get(key);
  const user = await target.query(
    `SELECT id FROM up_users WHERE LOWER(TRIM(email)) = $1 LIMIT 1`,
    [key]
  );
  const id = user.rows[0]?.id ?? null;
  emailCache.set(key, id);
  return id;
}

async function loadMappingsFromCsv(target, csvPath) {
  const text = fs.readFileSync(path.resolve(csvPath), 'utf8');
  const rows = parseCsv(text);
  if (!rows.length) throw new Error(`CSV empty: ${csvPath}`);

  const keys = Object.keys(rows[0]);
  const emailCache = new Map();
  const mappings = [];

  for (const row of rows) {
    const leadCompanyId = parseInt(row.lead_company_id, 10);
    const ownerUserId = parseInt(row.owner_user_id ?? row.user_id, 10);
    const ownerEmail = (row.owner_email ?? row.user_email ?? '').trim().toLowerCase();
    const companyName = row.company_name?.trim();

    if (!Number.isNaN(leadCompanyId)) {
      let userId = null;
      if (!Number.isNaN(ownerUserId)) userId = ownerUserId;
      else if (ownerEmail) userId = await resolveUserId(target, emailCache, ownerEmail);
      if (userId) mappings.push({ leadCompanyId, userId });
      continue;
    }

    if (companyName && ownerEmail) {
      const lead = await target.query(
        `SELECT id FROM lead_companies WHERE LOWER(TRIM(company_name)) = LOWER(TRIM($1)) LIMIT 1`,
        [companyName]
      );
      const userId = await resolveUserId(target, emailCache, ownerEmail);
      if (lead.rows[0]?.id && userId) {
        mappings.push({ leadCompanyId: lead.rows[0].id, userId });
      }
    }
  }
  return mappings;
}

async function validUserIds(target) {
  const { rows } = await target.query(`SELECT id FROM up_users`);
  return new Set(rows.map((r) => r.id));
}

async function validLeadIds(target) {
  const { rows } = await target.query(`SELECT id FROM lead_companies`);
  return new Set(rows.map((r) => r.id));
}

async function upsertLeadAssignee(target, leadCompanyId, userId) {
  const existing = await target.query(
    `SELECT id, user_id FROM lead_companies_assigned_to_lnk WHERE lead_company_id = $1 LIMIT 1`,
    [leadCompanyId]
  );

  if (existing.rows[0]) {
    if (existing.rows[0].user_id === userId) return 'unchanged';
    if (DRY_RUN) return 'would_update';
    await target.query(
      `UPDATE lead_companies_assigned_to_lnk SET user_id = $1 WHERE lead_company_id = $2`,
      [userId, leadCompanyId]
    );
    return 'updated';
  }

  if (DRY_RUN) return 'would_insert';
  await target.query(
    `INSERT INTO lead_companies_assigned_to_lnk (lead_company_id, user_id) VALUES ($1, $2)`,
    [leadCompanyId, userId]
  );
  return 'inserted';
}

async function syncContactsFromLeads(target) {
  const sql = `
    UPDATE contacts_assigned_to_lnk ca
    SET user_id = la.user_id
    FROM contacts_lead_company_lnk cl
    JOIN lead_companies_assigned_to_lnk la ON la.lead_company_id = cl.lead_company_id
    WHERE ca.contact_id = cl.contact_id
      AND la.user_id IS NOT NULL
      AND (ca.user_id IS NULL OR ca.user_id <> la.user_id)
  `;

  if (DRY_RUN) {
    const { rows } = await target.query(`
      SELECT COUNT(*)::int AS n
      FROM contacts_assigned_to_lnk ca
      JOIN contacts_lead_company_lnk cl ON cl.contact_id = ca.contact_id
      JOIN lead_companies_assigned_to_lnk la ON la.lead_company_id = cl.lead_company_id
      WHERE la.user_id IS NOT NULL
        AND (ca.user_id IS NULL OR ca.user_id <> la.user_id)
    `);
    console.log(`[dry-run] would sync ${rows[0].n} contact assignee(s) from lead owners`);
    return rows[0].n;
  }

  const r = await target.query(sql);
  console.log(`Synced ${r.rowCount} contact assignee(s) from lead owners`);
  return r.rowCount;
}

async function main() {
  if (!TARGET_URL) {
    throw new Error('Set DATABASE_URL (target / production Postgres)');
  }
  if (!BACKUP_URL && !CSV_PATH) {
    throw new Error('Set BACKUP_DATABASE_URL or ASSIGNMENTS_CSV');
  }

  const target = await connect(TARGET_URL);
  let backup;
  let mappings;

  try {
    if (BACKUP_URL) {
      backup = await connect(BACKUP_URL);
      mappings = await loadMappingsFromBackup(backup);
      console.log(`Loaded ${mappings.length} assignee row(s) from backup DB`);
    } else {
      mappings = await loadMappingsFromCsv(target, CSV_PATH);
      console.log(`Loaded ${mappings.length} assignee row(s) from CSV`);
    }

    if (!mappings.length) {
      console.log('No mappings to apply. Check backup still has user_id in lead_companies_assigned_to_lnk.');
      return;
    }

    const users = await validUserIds(target);
    const leads = await validLeadIds(target);

    const stats = { updated: 0, inserted: 0, unchanged: 0, skipped: 0 };

    for (const { leadCompanyId, userId } of mappings) {
      if (!leads.has(leadCompanyId)) {
        stats.skipped += 1;
        continue;
      }
      if (!users.has(userId)) {
        stats.skipped += 1;
        continue;
      }

      const result = await upsertLeadAssignee(target, leadCompanyId, userId);
      if (result === 'updated' || result === 'would_update') stats.updated += 1;
      else if (result === 'inserted' || result === 'would_insert') stats.inserted += 1;
      else stats.unchanged += 1;
    }

    console.log(
      DRY_RUN ? '[dry-run] ' : '',
      `Leads: ${stats.updated} updated, ${stats.inserted} inserted, ${stats.unchanged} unchanged, ${stats.skipped} skipped`
    );

    if (SYNC_CONTACTS) {
      await syncContactsFromLeads(target);
    } else {
      console.log('Tip: pass --sync-contacts to copy lead owners onto linked contacts');
    }
  } finally {
    await target.end().catch(() => {});
    if (backup) await backup.end().catch(() => {});
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
