'use strict';

/**
 * Backfill deal + client account assignees from linked lead company owners.
 * Safe to re-run — only inserts where assignee link is missing.
 *
 * Usage: node scripts/backfill-deal-account-assignees.js
 */

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

  const dealRes = await c.query(`
    INSERT INTO deals_assigned_to_lnk (deal_id, user_id)
    SELECT DISTINCT dl.deal_id, la.user_id
    FROM deals d
    JOIN deals_lead_company_lnk dl ON dl.deal_id = d.id
    JOIN lead_companies_assigned_to_lnk la ON la.lead_company_id = dl.lead_company_id
    WHERE la.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM deals_assigned_to_lnk da
        WHERE da.deal_id = dl.deal_id AND da.user_id IS NOT NULL
      )
    ON CONFLICT DO NOTHING
  `).catch(async (err) => {
    if (!String(err.message).includes('ON CONFLICT')) {
      const r = await c.query(`
        INSERT INTO deals_assigned_to_lnk (deal_id, user_id)
        SELECT DISTINCT dl.deal_id, la.user_id
        FROM deals d
        JOIN deals_lead_company_lnk dl ON dl.deal_id = d.id
        JOIN lead_companies_assigned_to_lnk la ON la.lead_company_id = dl.lead_company_id
        WHERE la.user_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM deals_assigned_to_lnk da
            WHERE da.deal_id = dl.deal_id AND da.user_id IS NOT NULL
          )
      `);
      return r;
    }
    throw err;
  });

  const accountRes = await c.query(`
    INSERT INTO client_accounts_assigned_to_lnk (client_account_id, user_id)
    SELECT DISTINCT ca.id, la.user_id
    FROM client_accounts ca
    JOIN lead_companies lc ON LOWER(TRIM(lc.company_name)) = LOWER(TRIM(ca.company_name))
    JOIN lead_companies_assigned_to_lnk la ON la.lead_company_id = lc.id
    WHERE la.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM client_accounts_assigned_to_lnk aa
        WHERE aa.client_account_id = ca.id AND aa.user_id IS NOT NULL
      )
  `);

  const accountFromContact = await c.query(`
    INSERT INTO client_accounts_assigned_to_lnk (client_account_id, user_id)
    SELECT DISTINCT cl.client_account_id, ca2.user_id
    FROM contacts_client_account_lnk cl
    JOIN contacts_assigned_to_lnk ca2 ON ca2.contact_id = cl.contact_id
    WHERE ca2.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM client_accounts_assigned_to_lnk aa
        WHERE aa.client_account_id = cl.client_account_id AND aa.user_id IS NOT NULL
      )
  `).catch(() => ({ rowCount: 0 }));

  const dealCount = await c.query(
    `SELECT COUNT(*)::int AS n FROM deals_assigned_to_lnk WHERE user_id IS NOT NULL`
  );
  const accountCount = await c.query(
    `SELECT COUNT(*)::int AS n FROM client_accounts_assigned_to_lnk WHERE user_id IS NOT NULL`
  );

  console.log('Deal assignee rows inserted:', dealRes.rowCount ?? 0);
  console.log('Client account manager rows inserted (by company):', accountRes.rowCount ?? 0);
  console.log('Client account manager rows inserted (by contact):', accountFromContact.rowCount ?? 0);
  console.log('Total deals with assignee:', dealCount.rows[0].n);
  console.log('Total client accounts with manager:', accountCount.rows[0].n);

  await c.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
