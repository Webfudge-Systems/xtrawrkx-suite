'use strict';

/**
 * Export CRM/PM scalar fields + relation links from legacy backup Postgres.
 * Adapts column names between legacy (Jun 2026) and current Strapi schema.
 *
 *   BACKUP_DATABASE_URL="postgresql://..." OUT_DIR=exports/legacy-2026-06-04 node scripts/export-legacy-full-snapshot.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const url = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL;
const OUT_DIR = path.resolve(process.env.OUT_DIR || 'exports/legacy-snapshot');

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function writeCsv(file, header, rows, mapper) {
  const lines = [header.join(',')];
  for (const row of rows) lines.push(mapper(row).join(','));
  fs.writeFileSync(path.join(OUT_DIR, file), lines.join('\n') + '\n', 'utf8');
  console.log(`${file}: ${rows.length} row(s)`);
}

async function tableExists(c, name) {
  const r = await c.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [name]
  );
  return r.rowCount > 0;
}

async function columnExists(c, table, col) {
  const r = await c.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
    [table, col]
  );
  return r.rowCount > 0;
}

async function userJoinCol(c, linkTable) {
  if (await columnExists(c, linkTable, 'xtrawrkx_user_id')) return 'xtrawrkx_user_id';
  if (await columnExists(c, linkTable, 'user_id')) return 'user_id';
  return null;
}

async function pickCol(c, table, candidates, fallbackSql = 'NULL') {
  for (const col of candidates) {
    if (await columnExists(c, table, col)) return col;
  }
  return fallbackSql;
}

async function main() {
  if (!url) throw new Error('Set BACKUP_DATABASE_URL');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const c = new Client({
    connectionString: url,
    ssl: url.includes('rlwy.net') ? { rejectUnauthorized: false } : undefined,
  });
  await c.connect();

  const legacy = await tableExists(c, 'xtrawrkx_users');
  console.log(`Legacy schema: ${legacy}\n`);

  const nextConnectCol = (await columnExists(c, 'lead_companies', 'next_connect_date'))
    ? 'next_connect_date'
    : 'next_follow_up_date';
  const hasSubType = await columnExists(c, 'lead_companies', 'sub_type');

  const leadCols = [
    'id',
    'company_name',
    'deal_value',
    'status',
    'source',
    'segment',
    'score',
    'health_score',
    'industry',
    'type',
    ...(hasSubType ? ['sub_type'] : []),
    'notes',
    'email',
    'phone',
    'website',
    'linked_in',
    nextConnectCol,
  ];

  const leads = await c.query(`SELECT ${leadCols.join(', ')} FROM lead_companies ORDER BY id`);
  writeCsv('lead-companies-scalars.csv', leadCols, leads.rows, (r) =>
    leadCols.map((col) => {
      const v = r[col];
      if (['id', 'deal_value', 'score', 'health_score'].includes(col)) return v ?? 0;
      if (col.includes('date') && v) return csvEscape(String(v).slice(0, 10));
      return csvEscape(v);
    })
  );

  const jobTitleCol = (await columnExists(c, 'contacts', 'job_title')) ? 'c.job_title' : 'c.title AS job_title';
  const roleCol = (await columnExists(c, 'contacts', 'contact_role'))
    ? 'c.contact_role'
    : 'c.role AS contact_role';
  const notesCol = (await columnExists(c, 'contacts', 'notes')) ? 'c.notes' : 'c.description AS notes';
  const primaryExpr = (await columnExists(c, 'contacts', 'is_primary_contact'))
    ? 'c.is_primary_contact'
    : `CASE WHEN UPPER(COALESCE(c.role, '')) LIKE '%PRIMARY%' THEN true ELSE false END AS is_primary_contact`;

  const contacts = await c.query(`
    SELECT c.id, c.first_name, c.last_name, c.email, c.phone,
           lc.company_name,
           ${jobTitleCol}, c.department, ${roleCol}, ${primaryExpr},
           c.status, c.source, c.linked_in, ${notesCol}
    FROM contacts c
    LEFT JOIN contacts_lead_company_lnk cl ON cl.contact_id = c.id
    LEFT JOIN lead_companies lc ON lc.id = cl.lead_company_id
    ORDER BY c.id
  `);

  writeCsv(
    'contacts-scalars.csv',
    [
      'id',
      'first_name',
      'last_name',
      'email',
      'phone',
      'company_name',
      'job_title',
      'department',
      'contact_role',
      'is_primary_contact',
      'status',
      'source',
      'linked_in',
      'notes',
    ],
    contacts.rows,
    (r) => [
      r.id,
      csvEscape(r.first_name),
      csvEscape(r.last_name),
      csvEscape(r.email),
      csvEscape(r.phone),
      csvEscape(r.company_name),
      csvEscape(r.job_title),
      csvEscape(r.department),
      csvEscape(r.contact_role),
      r.is_primary_contact ? 'true' : 'false',
      csvEscape(r.status),
      csvEscape(r.source),
      csvEscape(r.linked_in),
      csvEscape(r.notes),
    ]
  );

  const cl = await c.query(`SELECT contact_id, lead_company_id FROM contacts_lead_company_lnk ORDER BY 1`);
  writeCsv('contacts-lead-links.csv', ['contact_id', 'lead_company_id'], cl.rows, (r) => [
    r.contact_id,
    r.lead_company_id,
  ]);

  if (await tableExists(c, 'deals')) {
    const closeCol = (await columnExists(c, 'deals', 'expected_close_date'))
      ? 'expected_close_date'
      : 'close_date AS expected_close_date';
    const statusCol = (await columnExists(c, 'deals', 'status'))
      ? 'status'
      : 'stage AS status';
    const notesDeal = (await columnExists(c, 'deals', 'notes')) ? 'notes' : 'description AS notes';

    const deals = await c.query(`
      SELECT id, name, value, stage, ${statusCol}, priority, probability, ${closeCol}, ${notesDeal}
      FROM deals ORDER BY id
    `);
    writeCsv(
      'deals-scalars.csv',
      ['id', 'name', 'value', 'stage', 'status', 'priority', 'probability', 'expected_close_date', 'notes'],
      deals.rows,
      (r) => [
        r.id,
        csvEscape(r.name),
        r.value ?? 0,
        csvEscape(r.stage),
        csvEscape(r.status),
        csvEscape(r.priority),
        r.probability ?? '',
        r.expected_close_date ? csvEscape(String(r.expected_close_date).slice(0, 10)) : '',
        csvEscape(r.notes),
      ]
    );

    if (await tableExists(c, 'deals_lead_company_lnk')) {
      const dl = await c.query(`SELECT deal_id, lead_company_id FROM deals_lead_company_lnk ORDER BY 1`);
      writeCsv('deals-lead-links.csv', ['deal_id', 'lead_company_id'], dl.rows, (r) => [
        r.deal_id,
        r.lead_company_id,
      ]);
    }
  }

  if (await tableExists(c, 'projects')) {
    const pmCol = await userJoinCol(c, 'projects_project_manager_lnk');
    if (pmCol) {
      const pm = await c.query(
        `SELECT project_id, ${pmCol} AS user_id FROM projects_project_manager_lnk ORDER BY 1`
      );
      writeCsv('projects-managers.csv', ['project_id', 'user_id'], pm.rows, (r) => [r.project_id, r.user_id]);
    }

    const nameCol = (await columnExists(c, 'projects', 'priority')) ? 'priority' : "NULL AS priority";
    const projects = await c.query(
      `SELECT id, name, status, ${nameCol}, description FROM projects ORDER BY id`
    );
    writeCsv(
      'projects-scalars.csv',
      ['id', 'name', 'status', 'priority', 'description'],
      projects.rows,
      (r) => [r.id, csvEscape(r.name), csvEscape(r.status), csvEscape(r.priority), csvEscape(r.description)]
    );
  }

  if (await tableExists(c, 'tasks')) {
    const assigneeCol = await userJoinCol(c, 'tasks_assignee_lnk');
    const assignerCol = await userJoinCol(c, 'tasks_assigner_lnk');
    if (assigneeCol) {
      const t = await c.query(`SELECT task_id, ${assigneeCol} AS user_id FROM tasks_assignee_lnk ORDER BY 1`);
      writeCsv('tasks-assignees.csv', ['task_id', 'user_id'], t.rows, (r) => [r.task_id, r.user_id]);
    }
    if (assignerCol) {
      const t = await c.query(`SELECT task_id, ${assignerCol} AS user_id FROM tasks_assigner_lnk ORDER BY 1`);
      writeCsv('tasks-assigners.csv', ['task_id', 'user_id'], t.rows, (r) => [r.task_id, r.user_id]);
    }

    const taskName = (await columnExists(c, 'tasks', 'name')) ? 'name' : 'title AS name';
    const tasks = await c.query(`SELECT id, ${taskName}, status, priority, description FROM tasks ORDER BY id`);
    writeCsv(
      'tasks-scalars.csv',
      ['id', 'name', 'status', 'priority', 'description'],
      tasks.rows,
      (r) => [r.id, csvEscape(r.name), csvEscape(r.status), csvEscape(r.priority), csvEscape(r.description)]
    );
  }

  if (await tableExists(c, 'client_accounts')) {
    const dealValCol = (await columnExists(c, 'client_accounts', 'deal_value'))
      ? 'deal_value'
      : 'revenue AS deal_value';
    const typeCol = (await columnExists(c, 'client_accounts', 'type'))
      ? 'type'
      : 'company_type AS type';

    const ca = await c.query(`
      SELECT id, company_name, status, industry, ${typeCol}, health_score, ${dealValCol}, notes
      FROM client_accounts ORDER BY id
    `);
    writeCsv(
      'client-accounts-scalars.csv',
      ['id', 'company_name', 'status', 'industry', 'type', 'health_score', 'deal_value', 'notes'],
      ca.rows,
      (r) => [
        r.id,
        csvEscape(r.company_name),
        csvEscape(r.status),
        csvEscape(r.industry),
        csvEscape(r.type),
        r.health_score ?? '',
        r.deal_value ?? 0,
        csvEscape(r.notes),
      ]
    );

    const assignCol = await userJoinCol(c, 'client_accounts_assigned_to_lnk');
    if (assignCol) {
      const links = await c.query(
        `SELECT client_account_id, ${assignCol} AS user_id FROM client_accounts_assigned_to_lnk`
      );
      writeCsv(
        'client-accounts-managers.csv',
        ['client_account_id', 'user_id'],
        links.rows,
        (r) => [r.client_account_id, r.user_id]
      );
    }
  }

  // Lead assignees (legacy xtrawrkx_user_id)
  const leadAssignCol = await userJoinCol(c, 'lead_companies_assigned_to_lnk');
  if (leadAssignCol) {
    const la = await c.query(`
      SELECT l.lead_company_id, l.${leadAssignCol} AS owner_user_id, u.email AS owner_email
      FROM lead_companies_assigned_to_lnk l
      LEFT JOIN xtrawrkx_users u ON u.id = l.${leadAssignCol}
      WHERE l.${leadAssignCol} IS NOT NULL
      ORDER BY l.lead_company_id
    `);
    writeCsv(
      'lead-assignees.csv',
      ['lead_company_id', 'owner_user_id', 'owner_email'],
      la.rows,
      (r) => [r.lead_company_id, r.owner_user_id, csvEscape(r.owner_email)]
    );
  }

  await c.end();
  console.log(`\nSnapshot written to ${OUT_DIR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
