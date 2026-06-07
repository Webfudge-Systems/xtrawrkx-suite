'use strict';

/**
 * Import legacy snapshot CSVs into current Postgres (same entity ids).
 *
 *   IN_DIR=exports/legacy-2026-06-04 DATABASE_URL="..." node scripts/import-legacy-snapshot.js --dry-run
 *   IN_DIR=exports/legacy-2026-06-04 DATABASE_URL="..." node scripts/import-legacy-snapshot.js
 *
 * Options:
 *   --only=leads,contacts,links,deals,projects,tasks,clients
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DRY_RUN =
  String(process.env.DRY_RUN || '').toLowerCase() === 'true' ||
  process.argv.includes('--dry-run');

const IN_DIR = path.resolve(process.env.IN_DIR || 'exports/legacy-snapshot');
const url = process.env.DATABASE_URL;

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice(7).split(',').map((s) => s.trim()) : null;

function shouldRun(section) {
  return !ONLY || ONLY.includes(section);
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
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function readCsv(file) {
  const p = path.join(IN_DIR, file);
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const parts = parseCsvLine(line);
    const row = {};
    header.forEach((k, i) => {
      row[k] = parts[i] ?? '';
    });
    return row;
  });
}

function nullIfEmpty(v) {
  if (v == null || v === '') return null;
  return v;
}

async function upsertLink(c, table, cols, values, conflictCols) {
  const colList = cols.join(', ');
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const conflict = conflictCols.join(', ');
  const updates = cols
    .filter((col) => !conflictCols.includes(col))
    .map((col) => `${col} = EXCLUDED.${col}`)
    .join(', ');
  const sql = `
    INSERT INTO ${table} (${colList}) VALUES (${placeholders})
    ON CONFLICT (${conflict}) DO UPDATE SET ${updates}
  `;
  if (DRY_RUN) return;
  await c.query(sql, values);
}

async function main() {
  if (!url) throw new Error('Set DATABASE_URL');
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  if (shouldRun('leads')) {
    const rows = readCsv('lead-companies-scalars.csv');
    let n = 0;
    for (const r of rows) {
      const id = parseInt(r.id, 10);
      if (Number.isNaN(id)) continue;
      if (!DRY_RUN) {
        await c.query(
          `UPDATE lead_companies SET
             deal_value = COALESCE(NULLIF($2, '')::numeric, deal_value),
             status = COALESCE(NULLIF($3, ''), status),
             source = COALESCE(NULLIF($4, ''), source),
             segment = COALESCE(NULLIF($5, ''), segment),
             score = COALESCE(NULLIF($6, '')::int, score),
             health_score = COALESCE(NULLIF($7, '')::int, health_score),
             industry = COALESCE(NULLIF($8, ''), industry),
             type = COALESCE(NULLIF($9, ''), type),
             sub_type = COALESCE(NULLIF($10, ''), sub_type),
             notes = COALESCE(NULLIF($11, ''), notes),
             email = COALESCE(NULLIF($12, ''), email),
             phone = COALESCE(NULLIF($13, ''), phone),
             website = COALESCE(NULLIF($14, ''), website),
             linked_in = COALESCE(NULLIF($15, ''), linked_in),
             next_connect_date = COALESCE(NULLIF($16, '')::date, next_connect_date),
             updated_at = NOW()
           WHERE id = $1`,
          [
            id,
            r.deal_value,
            r.status,
            r.source,
            r.segment,
            r.score,
            r.health_score,
            r.industry,
            r.type,
            r.sub_type,
            r.notes,
            r.email,
            r.phone,
            r.website,
            r.linked_in,
            r.next_connect_date || r.next_follow_up_date,
          ]
        );
      }
      n += 1;
    }
    console.log(`${DRY_RUN ? '[dry-run] ' : ''}lead scalars: ${n} row(s)`);
  }

  if (shouldRun('contacts')) {
    const rows = readCsv('contacts-scalars.csv');
    let n = 0;
    for (const r of rows) {
      const id = parseInt(r.id, 10);
      if (Number.isNaN(id)) continue;
      if (!DRY_RUN) {
        await c.query(
          `UPDATE contacts SET
             first_name = COALESCE(NULLIF($2, ''), first_name),
             last_name = COALESCE(NULLIF($3, ''), last_name),
             email = COALESCE(NULLIF($4, ''), email),
             phone = COALESCE(NULLIF($5, ''), phone),
             company_name = COALESCE(NULLIF($6, ''), company_name),
             job_title = COALESCE(NULLIF($7, ''), job_title),
             department = COALESCE(NULLIF($8, ''), department),
             contact_role = COALESCE(NULLIF($9, ''), contact_role),
             is_primary_contact = CASE WHEN $10 IN ('true','1','t') THEN true WHEN $10 IN ('false','0','f') THEN false ELSE is_primary_contact END,
             status = COALESCE(NULLIF($11, ''), status),
             source = COALESCE(NULLIF($12, ''), source),
             linked_in = COALESCE(NULLIF($13, ''), linked_in),
             notes = COALESCE(NULLIF($14, ''), notes),
             updated_at = NOW()
           WHERE id = $1`,
          [
            id,
            r.first_name,
            r.last_name,
            r.email,
            r.phone,
            r.company_name,
            r.job_title,
            r.department,
            r.contact_role,
            r.is_primary_contact,
            r.status,
            r.source,
            r.linked_in,
            r.notes,
          ]
        );
      }
      n += 1;
    }
    console.log(`${DRY_RUN ? '[dry-run] ' : ''}contact scalars: ${n} row(s)`);
  }

  if (shouldRun('links')) {
    const rows = readCsv('contacts-lead-links.csv');
    let ins = 0;
    for (const r of rows) {
      const contactId = parseInt(r.contact_id, 10);
      const leadId = parseInt(r.lead_company_id, 10);
      if (Number.isNaN(contactId) || Number.isNaN(leadId)) continue;
      const ex = await c.query(
        `SELECT 1 FROM contacts_lead_company_lnk WHERE contact_id=$1`,
        [contactId]
      );
      if (!ex.rowCount) {
        if (!DRY_RUN) {
          await c.query(
            `INSERT INTO contacts_lead_company_lnk (contact_id, lead_company_id) VALUES ($1,$2)`,
            [contactId, leadId]
          );
        }
        ins += 1;
      } else if (!DRY_RUN) {
        await c.query(
          `UPDATE contacts_lead_company_lnk SET lead_company_id=$1 WHERE contact_id=$2`,
          [leadId, contactId]
        );
        ins += 1;
      }
    }
    console.log(`${DRY_RUN ? '[dry-run] ' : ''}contact-lead links: ${ins} upserted`);
  }

  if (shouldRun('deals')) {
    const rows = readCsv('deals-scalars.csv');
    for (const r of rows) {
      const id = parseInt(r.id, 10);
      if (Number.isNaN(id) || DRY_RUN) continue;
      await c.query(
        `UPDATE deals SET name=COALESCE(NULLIF($2,''),name), value=COALESCE(NULLIF($3,'')::numeric,value),
         stage=COALESCE(NULLIF($4,''),stage), status=COALESCE(NULLIF($5,''),status),
         priority=COALESCE(NULLIF($6,''),priority), probability=COALESCE(NULLIF($7,'')::int,probability),
         expected_close_date=COALESCE(NULLIF($8,'')::date,expected_close_date), notes=COALESCE(NULLIF($9,''),notes),
         updated_at=NOW() WHERE id=$1`,
        [id, r.name, r.value, r.stage, r.status, r.priority, r.probability, r.expected_close_date, r.notes]
      );
    }
    console.log(`deals scalars: ${rows.length} row(s)`);
  }

  if (shouldRun('projects')) {
    const rows = readCsv('projects-managers.csv');
    for (const r of rows) {
      const projectId = parseInt(r.project_id, 10);
      const userId = parseInt(r.user_id, 10);
      if (Number.isNaN(projectId) || Number.isNaN(userId)) continue;
      const ex = await c.query(
        `SELECT 1 FROM projects_project_manager_lnk WHERE project_id=$1`,
        [projectId]
      );
      if (!ex.rowCount && !DRY_RUN) {
        await c.query(
          `INSERT INTO projects_project_manager_lnk (project_id, user_id) VALUES ($1,$2)`,
          [projectId, userId]
        );
      } else if (!DRY_RUN) {
        await c.query(
          `UPDATE projects_project_manager_lnk SET user_id=$1 WHERE project_id=$2`,
          [userId, projectId]
        );
      }
    }
    console.log(`project managers: ${rows.length} row(s)`);
  }

  if (shouldRun('tasks')) {
    for (const [file, table] of [
      ['tasks-assignees.csv', 'tasks_assignee_lnk'],
      ['tasks-assigners.csv', 'tasks_assigner_lnk'],
    ]) {
      const rows = readCsv(file);
      for (const r of rows) {
        const taskId = parseInt(r.task_id, 10);
        const userId = parseInt(r.user_id, 10);
        if (Number.isNaN(taskId) || Number.isNaN(userId)) continue;
        const ex = await c.query(`SELECT 1 FROM ${table} WHERE task_id=$1`, [taskId]);
        if (!ex.rowCount && !DRY_RUN) {
          await c.query(`INSERT INTO ${table} (task_id, user_id) VALUES ($1,$2)`, [taskId, userId]);
        } else if (!DRY_RUN) {
          await c.query(`UPDATE ${table} SET user_id=$1 WHERE task_id=$2`, [userId, taskId]);
        }
      }
      console.log(`${table}: ${rows.length} row(s)`);
    }
  }

  if (shouldRun('clients')) {
    const rows = readCsv('client-accounts-managers.csv');
    for (const r of rows) {
      const accountId = parseInt(r.client_account_id, 10);
      const userId = parseInt(r.user_id, 10);
      if (Number.isNaN(accountId) || Number.isNaN(userId)) continue;
      const ex = await c.query(
        `SELECT 1 FROM client_accounts_assigned_to_lnk WHERE client_account_id=$1`,
        [accountId]
      );
      if (!ex.rowCount && !DRY_RUN) {
        await c.query(
          `INSERT INTO client_accounts_assigned_to_lnk (client_account_id, user_id) VALUES ($1,$2)`,
          [accountId, userId]
        );
      } else if (!DRY_RUN) {
        await c.query(
          `UPDATE client_accounts_assigned_to_lnk SET user_id=$1 WHERE client_account_id=$2`,
          [userId, accountId]
        );
      }
    }
    console.log(`client account managers: ${rows.length} row(s)`);
  }

  await c.end();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
