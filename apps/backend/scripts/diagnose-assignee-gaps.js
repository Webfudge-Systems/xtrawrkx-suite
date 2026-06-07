'use strict';

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const url =
  process.env.DATABASE_URL ||
  (fs.readFileSync(envPath, 'utf8').match(/DATABASE_URL=(.+)/) || [])[1]?.trim();

async function main() {
  const c = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await c.connect();

  const tables = await c.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name LIKE '%converted%'
    ORDER BY 1
  `);
  console.log('converted link tables:', tables.rows.map((r) => r.table_name).join(', '));

  const r1 = await c.query(`
    SELECT COUNT(*)::int AS n FROM deals d
    JOIN deals_lead_company_lnk dl ON dl.deal_id = d.id
    JOIN lead_companies_assigned_to_lnk la ON la.lead_company_id = dl.lead_company_id
    WHERE la.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM deals_assigned_to_lnk da
        WHERE da.deal_id = d.id AND da.user_id IS NOT NULL
      )
  `);
  console.log('deals with lead assignee but no deal assignee:', r1.rows[0].n);

  const r2 = await c.query(`
    SELECT COUNT(*)::int AS n FROM client_accounts ca
    JOIN client_accounts_converted_from_lead_lnk cf ON cf.client_account_id = ca.id
    JOIN lead_companies_assigned_to_lnk la ON la.lead_company_id = cf.inv_lead_company_id
    WHERE la.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM client_accounts_assigned_to_lnk aa
        WHERE aa.client_account_id = ca.id AND aa.user_id IS NOT NULL
      )
  `).catch(async () => {
    return c.query(`
      SELECT COUNT(*)::int AS n FROM client_accounts ca
      WHERE NOT EXISTS (
        SELECT 1 FROM client_accounts_assigned_to_lnk aa
        WHERE aa.client_account_id = ca.id AND aa.user_id IS NOT NULL
      )
    `);
  });
  console.log('client accounts missing manager (approx):', r2.rows[0].n);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
