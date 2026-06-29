'use strict';

/**
 * Add missing `onboarding_data` JSON column on `client_accounts`.
 *
 * Fixes landing signup error:
 *   column "onboarding_data" of relation "client_accounts" does not exist
 *
 * Usage (backend API may stay running for read-only check; prefer brief downtime for alter):
 *   DATABASE_URL="postgresql://..." node scripts/migrate-client-accounts-onboarding-data.js
 *   DRY_RUN=true DATABASE_URL="..." node scripts/migrate-client-accounts-onboarding-data.js
 */

const { Client } = require('pg');

const DRY_RUN =
  String(process.env.DRY_RUN || '').toLowerCase() === 'true' ||
  process.argv.includes('--dry-run');

const url = process.env.DATABASE_URL;

async function columnExists(client, table, column) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return rows.length > 0;
}

async function main() {
  if (!url) {
    throw new Error('Set DATABASE_URL');
  }

  const client = new Client({
    connectionString: url,
    ssl: /railway|rlwy\.net|sslmode=require|ssl=true/i.test(url)
      ? { rejectUnauthorized: false }
      : undefined,
  });

  await client.connect();

  const table = 'client_accounts';
  const column = 'onboarding_data';

  if (await columnExists(client, table, column)) {
    console.log(`✅ ${table}.${column} already exists — nothing to do.`);
    await client.end();
    return;
  }

  const sql = `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} JSONB`;
  if (DRY_RUN) {
    console.log(`[dry-run] Would run: ${sql}`);
  } else {
    await client.query(sql);
    console.log(`✅ Added ${table}.${column} (JSONB)`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
