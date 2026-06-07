'use strict';
const { Client } = require('pg');
const url = process.env.DATABASE_URL;
(async () => {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();
  const u = await c.query(`
    SELECT
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='up_users') AS is_current,
      EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='xtrawrkx_users') AS is_legacy
  `);
  console.log(u.rows[0]);
  await c.end();
})();
