'use strict';

const { Client } = require('pg');

const url =
  process.env.DATABASE_URL ||
  'postgresql://postgres:YAReZxuLFnpbuVnPvfTTmVBKSlxfduUc@tramway.proxy.rlwy.net:43388/railway';

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const rows = await c.query('SELECT id, type, title, message, data FROM notifications ORDER BY id');
  for (const r of rows.rows) {
    console.log('---', r.id, r.type);
    console.log(r.title);
    console.log(JSON.stringify(r.data)?.slice(0, 500));
  }

  await c.end();
}

main().catch(console.error);
