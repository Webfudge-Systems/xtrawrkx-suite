'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const url = process.env.DATABASE_URL;

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
  const raw = fs
    .readFileSync(path.resolve('exports/contact-assignees-from-backup-2026-06-04.csv'), 'utf8')
    .replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const ci = header.indexOf('contact_id');
  const li = header.indexOf('lead_company_id');

  let emptyLead = 0;
  const csvMap = new Map();
  for (let i = 1; i < lines.length; i += 1) {
    const p = parseCsvLine(lines[i]);
    const cid = parseInt(p[ci], 10);
    const lid = parseInt(p[li], 10);
    if (Number.isNaN(cid)) continue;
    if (Number.isNaN(lid)) emptyLead += 1;
    else csvMap.set(cid, lid);
  }

  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const noLink = await c.query(`
    SELECT c.id FROM contacts c
    WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk cl WHERE cl.contact_id = c.id)
    LIMIT 20
  `);

  let fixable = 0;
  for (const { id } of noLink.rows) {
    if (csvMap.has(id)) fixable += 1;
  }

  const totalNoLink = await c.query(`
    SELECT COUNT(*)::int AS n FROM contacts c
    WHERE NOT EXISTS (SELECT 1 FROM contacts_lead_company_lnk cl WHERE cl.contact_id = c.id)
  `);

  console.log('CSV rows without lead_company_id:', emptyLead);
  console.log('contacts without link in DB:', totalNoLink.rows[0].n);
  console.log('orphans fixable from CSV:', fixable, '(sample of 20 checked:', noLink.rows.length, ')');

  await c.end();
}

main().catch(console.error);
