'use strict';

/**
 * Ensures `up_users.is_platform_admin` exists (Strapi field `isPlatformAdmin`).
 * Legacy Postgres databases may lack this column required for platform login.
 */
async function ensureUpUserPlatformAdminColumn(strapi) {
  const knex = strapi?.db?.connection;
  if (!knex) return { ok: false, skipped: true, reason: 'No database connection' };

  const table = 'up_users';
  const column = 'is_platform_admin';

  const tableExists = await knex.schema.hasTable(table);
  if (!tableExists) {
    return { ok: true, skipped: true, reason: `Table ${table} does not exist yet` };
  }

  const hasColumn = await knex.schema.hasColumn(table, column);
  if (!hasColumn) {
    await knex.schema.alterTable(table, (t) => {
      t.boolean(column).defaultTo(false);
    });
    return { ok: true, added: true, column, table };
  }

  return { ok: true, skipped: true, reason: 'Column already present' };
}

module.exports = {
  ensureUpUserPlatformAdminColumn,
};
