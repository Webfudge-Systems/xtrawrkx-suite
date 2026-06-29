'use strict';

/**
 * Ensures `client_accounts.onboarding_data` exists (Strapi schema field `onboardingData`).
 * Legacy Railway Postgres databases may lack this column after the website-signup feature shipped.
 */
async function ensureClientAccountOnboardingDataColumn(strapi) {
  const knex = strapi?.db?.connection;
  if (!knex) return { ok: false, skipped: true, reason: 'No database connection' };

  const table = 'client_accounts';
  const column = 'onboarding_data';

  const tableExists = await knex.schema.hasTable(table);
  if (!tableExists) {
    return { ok: true, skipped: true, reason: `Table ${table} does not exist yet` };
  }

  const hasColumn = await knex.schema.hasColumn(table, column);
  if (hasColumn) {
    return { ok: true, skipped: true, reason: 'Column already present' };
  }

  const client = knex.client?.config?.client || 'sqlite';
  await knex.schema.alterTable(table, (t) => {
    if (client === 'postgres') {
      t.jsonb(column);
    } else {
      t.json(column);
    }
  });

  return { ok: true, added: true, column, table };
}

module.exports = {
  ensureClientAccountOnboardingDataColumn,
};
