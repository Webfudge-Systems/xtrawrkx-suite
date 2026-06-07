'use strict';

/**
 * Fast bulk import of legacy snapshot CSVs into current Postgres.
 *
 *   IN_DIR=exports/legacy-2026-06-04 DATABASE_URL="..." node scripts/import-legacy-snapshot-bulk.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DRY_RUN = process.argv.includes('--dry-run');
const IN_DIR = path.resolve(process.env.IN_DIR || 'exports/legacy-2026-06-04');
const url = process.env.DATABASE_URL;

function parseCsvContent(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(cur.trim());
      cur = '';
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cur.trim());
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.length || row.length) {
    row.push(cur.trim());
    if (row.some((cell) => cell !== '')) rows.push(row);
  }
  return rows;
}

function readCsv(file) {
  const p = path.join(IN_DIR, file);
  if (!fs.existsSync(p)) return { header: [], rows: [] };
  const parsed = parseCsvContent(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
  if (!parsed.length) return { header: [], rows: [] };
  const header = parsed[0].map((h) => h.toLowerCase());
  const rows = parsed.slice(1).map((parts) => {
    const row = {};
    header.forEach((k, i) => {
      row[k] = parts[i] ?? '';
    });
    return row;
  });
  return { header, rows };
}

async function loadCsvToTemp(c, table, cols, rows, mappers) {
  await c.query(`
    CREATE TEMP TABLE ${table} (${cols.map((col) => `${col} text`).join(', ')}) ON COMMIT DROP
  `);
  const chunk = 400;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const values = [];
    const params = [];
    slice.forEach((row, ri) => {
      const mapped = mappers(row);
      cols.forEach((col, ci) => {
        params.push(mapped[col] ?? '');
        values.push(`($${ri * cols.length + ci + 1})`);
      });
    });
    if (!params.length) continue;
    const tupleSize = cols.length;
    const tuples = [];
    for (let j = 0; j < slice.length; j += 1) {
      const start = j * tupleSize + 1;
      tuples.push(`(${cols.map((_, ci) => `$${start + ci}`).join(', ')})`);
    }
    await c.query(`INSERT INTO ${table} (${cols.join(', ')}) VALUES ${tuples.join(', ')}`, params);
  }
}

async function assertCurrentDb(c) {
  const r = await c.query(`
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='up_users') AS ok
  `);
  if (!r.rows[0].ok) {
    throw new Error('Database is still on legacy backup — revert Postgres to current volume before import.');
  }
}

async function columnExists(c, table, col) {
  const r = await c.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
    [table, col]
  );
  return r.rowCount > 0;
}

async function main() {
  if (!url) throw new Error('Set DATABASE_URL');
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  await assertCurrentDb(c);
  await c.query('BEGIN');

  // --- contact ↔ lead links ---
  const { rows: linkRows } = readCsv('contacts-lead-links.csv');
  if (linkRows.length) {
    await loadCsvToTemp(c, 'tmp_cl', ['contact_id', 'lead_company_id'], linkRows, (r) => ({
      contact_id: r.contact_id,
      lead_company_id: r.lead_company_id,
    }));
    if (DRY_RUN) {
      const ins = await c.query(`
        SELECT COUNT(*)::int AS n FROM tmp_cl t
        JOIN contacts c ON c.id::text = t.contact_id
        JOIN lead_companies lc ON lc.id::text = t.lead_company_id
        WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk cl WHERE cl.contact_id = c.id)
      `);
      console.log(`[dry-run] contact-lead links to insert: ${ins.rows[0].n}`);
    } else {
      const ins = await c.query(`
        INSERT INTO contacts_lead_company_lnk (contact_id, lead_company_id)
        SELECT t.contact_id::int, t.lead_company_id::int
        FROM tmp_cl t
        JOIN contacts c ON c.id = t.contact_id::int
        JOIN lead_companies lc ON lc.id = t.lead_company_id::int
        WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk cl WHERE cl.contact_id = c.id)
      `);
      const upd = await c.query(`
        UPDATE contacts_lead_company_lnk cl
        SET lead_company_id = t.lead_company_id::int
        FROM tmp_cl t
        WHERE cl.contact_id = t.contact_id::int AND cl.lead_company_id <> t.lead_company_id::int
      `);
      console.log(`contact-lead links: ${ins.rowCount} inserted, ${upd.rowCount} updated`);
    }
  }

  // --- contact scalars ---
  const { rows: contactRows } = readCsv('contacts-scalars.csv');
  if (contactRows.length) {
    await loadCsvToTemp(c, 'tmp_ct', [
      'id', 'first_name', 'last_name', 'email', 'phone', 'company_name',
      'job_title', 'department', 'contact_role', 'is_primary', 'status', 'source', 'linked_in', 'notes',
    ], contactRows, (r) => ({
      id: r.id,
      first_name: r.first_name,
      last_name: r.last_name,
      email: r.email,
      phone: r.phone,
      company_name: r.company_name,
      job_title: r.job_title,
      department: r.department,
      contact_role: r.contact_role,
      is_primary: r.is_primary_contact,
      status: r.status,
      source: r.source,
      linked_in: r.linked_in,
      notes: r.notes,
    }));
    if (DRY_RUN) {
      console.log(`[dry-run] contact scalar updates: ${contactRows.length}`);
    } else {
      const r = await c.query(`
        UPDATE contacts c SET
          first_name = COALESCE(NULLIF(t.first_name, ''), c.first_name),
          last_name = COALESCE(NULLIF(t.last_name, ''), c.last_name),
          phone = COALESCE(NULLIF(t.phone, ''), c.phone),
          company_name = COALESCE(NULLIF(t.company_name, ''), c.company_name),
          job_title = COALESCE(NULLIF(t.job_title, ''), c.job_title),
          department = COALESCE(NULLIF(t.department, ''), c.department),
          contact_role = COALESCE(NULLIF(t.contact_role, ''), c.contact_role),
          is_primary_contact = CASE
            WHEN t.is_primary IN ('true','1') THEN true
            WHEN t.is_primary IN ('false','0') THEN false
            ELSE c.is_primary_contact END,
          status = COALESCE(NULLIF(t.status, ''), c.status),
          source = COALESCE(NULLIF(t.source, ''), c.source),
          linked_in = COALESCE(NULLIF(t.linked_in, ''), c.linked_in),
          notes = COALESCE(NULLIF(t.notes, ''), c.notes),
          updated_at = NOW()
        FROM tmp_ct t
        WHERE c.id = t.id::int
      `);
      console.log(`contact scalars updated: ${r.rowCount}`);
    }
  }

  // --- lead scalars ---
  const { rows: leadRows } = readCsv('lead-companies-scalars.csv');
  if (leadRows.length) {
    await loadCsvToTemp(c, 'tmp_lc', [
      'id', 'deal_value', 'status', 'source', 'segment', 'score', 'health_score',
      'industry', 'type', 'sub_type', 'notes', 'email', 'phone', 'website', 'linked_in', 'next_connect',
    ], leadRows, (r) => ({
      id: r.id,
      deal_value: r.deal_value,
      status: r.status,
      source: r.source,
      segment: r.segment,
      score: r.score,
      health_score: r.health_score,
      industry: r.industry,
      type: r.type,
      sub_type: r.sub_type || '',
      notes: r.notes,
      email: r.email,
      phone: r.phone,
      website: r.website,
      linked_in: r.linked_in || r.linked_in,
      next_connect: r.next_connect_date || r.next_follow_up_date || '',
    }));
    if (DRY_RUN) {
      console.log(`[dry-run] lead scalar updates: ${leadRows.length}`);
    } else {
      const hasSubType = await columnExists(c, 'lead_companies', 'sub_type');
      const subTypeSet = hasSubType
        ? 'sub_type = COALESCE(NULLIF(t.sub_type, \'\'), lc.sub_type),'
        : '';
      const r = await c.query(`
        UPDATE lead_companies lc SET
          deal_value = COALESCE(NULLIF(t.deal_value, '')::numeric, lc.deal_value),
          status = COALESCE(NULLIF(t.status, ''), lc.status),
          source = COALESCE(NULLIF(t.source, ''), lc.source),
          segment = COALESCE(NULLIF(t.segment, ''), lc.segment),
          score = CASE WHEN t.score ~ '^-?[0-9]+$' THEN t.score::int ELSE lc.score END,
          health_score = CASE WHEN t.health_score ~ '^-?[0-9]+$' THEN t.health_score::int ELSE lc.health_score END,
          industry = COALESCE(NULLIF(t.industry, ''), lc.industry),
          type = COALESCE(NULLIF(t.type, ''), lc.type),
          ${subTypeSet}
          notes = COALESCE(NULLIF(t.notes, ''), lc.notes),
          email = COALESCE(NULLIF(t.email, ''), lc.email),
          phone = COALESCE(NULLIF(t.phone, ''), lc.phone),
          website = COALESCE(NULLIF(t.website, ''), lc.website),
          linked_in = COALESCE(NULLIF(t.linked_in, ''), lc.linked_in),
          next_connect_date = COALESCE(NULLIF(t.next_connect, '')::date, lc.next_connect_date),
          updated_at = NOW()
        FROM tmp_lc t
        WHERE lc.id = t.id::int
      `);
      console.log(`lead scalars updated: ${r.rowCount}`);
    }
  }

  // --- project managers ---
  const { rows: pmRows } = readCsv('projects-managers.csv');
  for (const r of pmRows) {
    const projectId = parseInt(r.project_id, 10);
    const userId = parseInt(r.user_id, 10);
    if (Number.isNaN(projectId) || Number.isNaN(userId)) continue;
    if (DRY_RUN) continue;
    const ex = await c.query(`SELECT 1 FROM projects_project_manager_lnk WHERE project_id=$1`, [projectId]);
    if (!ex.rowCount) {
      await c.query(`INSERT INTO projects_project_manager_lnk (project_id, user_id) VALUES ($1,$2)`, [
        projectId,
        userId,
      ]);
    } else {
      await c.query(`UPDATE projects_project_manager_lnk SET user_id=$1 WHERE project_id=$2`, [userId, projectId]);
    }
  }
  if (pmRows.length) console.log(`${DRY_RUN ? '[dry-run] ' : ''}project managers: ${pmRows.length} row(s)`);

  // --- task assignees ---
  const { rows: taRows } = readCsv('tasks-assignees.csv');
  for (const r of taRows) {
    const taskId = parseInt(r.task_id, 10);
    const userId = parseInt(r.user_id, 10);
    if (Number.isNaN(taskId) || Number.isNaN(userId)) continue;
    if (DRY_RUN) continue;
    const ex = await c.query(`SELECT 1 FROM tasks_assignee_lnk WHERE task_id=$1`, [taskId]);
    if (!ex.rowCount) {
      await c.query(`INSERT INTO tasks_assignee_lnk (task_id, user_id) VALUES ($1,$2)`, [taskId, userId]);
    } else {
      await c.query(`UPDATE tasks_assignee_lnk SET user_id=$1 WHERE task_id=$2`, [userId, taskId]);
    }
  }
  if (taRows.length) console.log(`${DRY_RUN ? '[dry-run] ' : ''}task assignees: ${taRows.length} row(s)`);

  // --- deals ---
  const { rows: dealRows } = readCsv('deals-scalars.csv');
  if (dealRows.length && !DRY_RUN) {
    const hasNotes = await columnExists(c, 'deals', 'notes');
    const notesCol = hasNotes ? 'notes' : 'description';
    for (const r of dealRows) {
      const id = parseInt(r.id, 10);
      if (Number.isNaN(id)) continue;
      await c.query(
        `UPDATE deals SET name=COALESCE(NULLIF($2,''),name), value=COALESCE(NULLIF($3,'')::numeric,value),
         stage=COALESCE(NULLIF(LOWER($4),''),stage), priority=COALESCE(NULLIF(LOWER($5),''),priority),
         probability=CASE WHEN $6 ~ '^-?[0-9]+$' THEN $6::int ELSE probability END,
         expected_close_date=CASE WHEN $7 ~ '^\d{4}-\d{2}-\d{2}' THEN $7::date ELSE expected_close_date END,
         ${notesCol}=COALESCE(NULLIF($8,''),${notesCol}), updated_at=NOW() WHERE id=$1`,
        [id, r.name, r.value, r.stage, r.priority, r.probability, r.expected_close_date, r.notes]
      );
    }
    console.log(`deals updated: ${dealRows.length}`);
  } else if (dealRows.length && DRY_RUN) {
    console.log(`[dry-run] deals: ${dealRows.length}`);
  }

  if (DRY_RUN) await c.query('ROLLBACK');
  else await c.query('COMMIT');

  await c.end();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
