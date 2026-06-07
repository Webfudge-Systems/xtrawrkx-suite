'use strict';

const { Client } = require('pg');

const url = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL;

async function cols(c, table) {
  const r = await c.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,
    [table]
  );
  return r.rows.map((x) => x.column_name);
}

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  for (const t of ['contacts', 'deals', 'projects', 'tasks', 'client_accounts']) {
    console.log(`\n${t}:`, (await cols(c, t)).join(', '));
  }
  await c.end();
}

main().catch(console.error);
