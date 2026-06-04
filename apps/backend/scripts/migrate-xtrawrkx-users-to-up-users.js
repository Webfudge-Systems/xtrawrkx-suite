'use strict';

/**
 * One-time production migration: legacy xtrawrkx_users → up_users.
 *
 * Your Railway DB may have xtrawrkx_users (28 rows) but NO up_users yet because
 * Strapi never finished boot. This script renames the table and adds required columns.
 *
 * Usage (API service stopped):
 *   DATABASE_URL="postgresql://..." node scripts/migrate-xtrawrkx-users-to-up-users.js
 *   DRY_RUN=true DATABASE_URL="..." node scripts/migrate-xtrawrkx-users-to-up-users.js
 */

const { Client } = require('pg');

const DRY_RUN = process.env.DRY_RUN === 'true';

function log(msg) {
  console.log(DRY_RUN ? `[DRY RUN] ${msg}` : msg);
}

async function tableExists(client, name) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [name]
  );
  return rows.length > 0;
}

async function columnExists(client, table, column) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return rows.length > 0;
}

async function getColumns(client, table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return rows.map((r) => r.column_name);
}

async function getAuthenticatedRoleId(client) {
  if (!(await tableExists(client, 'up_roles'))) return null;
  const { rows } = await client.query(
    `SELECT id FROM up_roles WHERE type = 'authenticated' ORDER BY id LIMIT 1`
  );
  return rows[0]?.id ?? null;
}

async function listFkDependents(client, referencedTable) {
  const { rows } = await client.query(
    `SELECT conrelid::regclass::text AS dependent_table, conname AS constraint_name
     FROM pg_constraint
     WHERE confrelid = $1::regclass AND contype = 'f'
     ORDER BY 1`,
    [`public.${referencedTable}`]
  );
  return rows;
}

async function ensureUpUsersPluginColumns(client) {
  const alters = [
    `ALTER TABLE up_users ADD COLUMN IF NOT EXISTS username VARCHAR(255)`,
    `ALTER TABLE up_users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`,
    `ALTER TABLE up_users ADD COLUMN IF NOT EXISTS provider VARCHAR(255)`,
    `ALTER TABLE up_users ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT true`,
    `ALTER TABLE up_users ADD COLUMN IF NOT EXISTS blocked BOOLEAN DEFAULT false`,
    `ALTER TABLE up_users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false`,
  ];
  for (const sql of alters) {
    if (!DRY_RUN) await client.query(sql);
    else log(sql);
  }

  if (!(await columnExists(client, 'up_users', 'first_name'))) {
    const sql = `ALTER TABLE up_users ADD COLUMN IF NOT EXISTS first_name VARCHAR(80)`;
    if (!DRY_RUN) await client.query(sql);
    else log(sql);
  }
  if (!(await columnExists(client, 'up_users', 'last_name'))) {
    const sql = `ALTER TABLE up_users ADD COLUMN IF NOT EXISTS last_name VARCHAR(80)`;
    if (!DRY_RUN) await client.query(sql);
    else log(sql);
  }
}

/** Rename xtrawrkx_users → up_users; keeps all 28 rows and existing FKs. */
async function renameLegacyToUpUsers(client) {
  log('Rename xtrawrkx_users → up_users (preserves row ids + FK links)');
  if (!DRY_RUN) {
    await client.query('ALTER TABLE xtrawrkx_users RENAME TO up_users');
  }
  await ensureUpUsersPluginColumns(client);

  if (!DRY_RUN) {
    await client.query(`
      UPDATE up_users
      SET
        username = COALESCE(
          NULLIF(TRIM(username), ''),
          LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-zA-Z0-9_.-]', '_', 'g'))
        ),
        provider = COALESCE(NULLIF(TRIM(provider), ''), 'local'),
        confirmed = COALESCE(confirmed, true),
        blocked = COALESCE(blocked, false),
        is_platform_admin = COALESCE(is_platform_admin, false),
        updated_at = COALESCE(updated_at, NOW())
      WHERE email IS NOT NULL AND TRIM(email) <> ''
    `);

    const { rows: dupes } = await client.query(`
      SELECT username FROM up_users
      WHERE username IS NOT NULL
      GROUP BY username HAVING COUNT(*) > 1
    `);
    for (const { username } of dupes) {
      await client.query(
        `UPDATE up_users SET username = username || '_' || id::text
         WHERE username = $1 AND id NOT IN (
           SELECT MIN(id) FROM up_users WHERE username = $1
         )`,
        [username]
      );
    }
  } else {
    log('Would backfill username, provider, confirmed, blocked on up_users');
  }

  const authRoleId = await getAuthenticatedRoleId(client);
  if (authRoleId && (await tableExists(client, 'up_users_role_lnk')) && !DRY_RUN) {
    await client.query(
      `INSERT INTO up_users_role_lnk (user_id, role_id)
       SELECT u.id, $1 FROM up_users u
       WHERE NOT EXISTS (
         SELECT 1 FROM up_users_role_lnk l WHERE l.user_id = u.id AND l.role_id = $1
       )`,
      [authRoleId]
    );
    log('Linked users to authenticated role where up_users_role_lnk exists');
  }
}

async function copyLegacyIntoExistingUpUsers(client) {
  const legacyCols = await getColumns(client, 'xtrawrkx_users');
  const upCols = await getColumns(client, 'up_users');
  const upHasFirst = upCols.includes('first_name');

  const { rows: legacyRows } = await client.query(
    `SELECT id, LOWER(TRIM(email)) AS email, document_id,
            first_name, last_name, password, provider, confirmed, blocked,
            created_at, updated_at, published_at
     FROM xtrawrkx_users
     WHERE email IS NOT NULL AND TRIM(email) <> ''`
  );

  const authRoleId = await getAuthenticatedRoleId(client);

  for (const row of legacyRows) {
    const { rows: existing } = await client.query(
      `SELECT id FROM up_users WHERE LOWER(TRIM(email)) = $1 LIMIT 1`,
      [row.email]
    );

    if (existing.length > 0) {
      log(`Already in up_users: ${row.email} (id ${existing[0].id})`);
      continue;
    }

    const usernameBase =
      row.email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 50) || `user_${row.id}`;
    let username = usernameBase;
    let suffix = 0;
    while (true) {
      const { rows: clash } = await client.query(
        `SELECT 1 FROM up_users WHERE username = $1 LIMIT 1`,
        [username]
      );
      if (clash.length === 0) break;
      suffix += 1;
      username = `${usernameBase}_${suffix}`.slice(0, 50);
    }

    if (!DRY_RUN) {
      const insertCols = [
        'id',
        'email',
        'username',
        'provider',
        'confirmed',
        'blocked',
        'created_at',
        'updated_at',
      ];
      const insertVals = [
        row.id,
        row.email,
        username,
        row.provider || 'local',
        row.confirmed !== false,
        Boolean(row.blocked),
        row.created_at || new Date(),
        row.updated_at || new Date(),
      ];

      if (legacyCols.includes('document_id') && upCols.includes('document_id') && row.document_id) {
        insertCols.push('document_id');
        insertVals.push(row.document_id);
      }
      if (upHasFirst) {
        insertCols.push('first_name', 'last_name');
        insertVals.push(row.first_name || null, row.last_name || null);
      }
      if (upCols.includes('password') && row.password) {
        insertCols.push('password');
        insertVals.push(row.password);
      }
      if (upCols.includes('published_at')) {
        insertCols.push('published_at');
        insertVals.push(row.published_at || row.created_at || new Date());
      }

      const placeholders = insertVals.map((_, idx) => `$${idx + 1}`).join(', ');
      await client.query(
        `INSERT INTO up_users (${insertCols.join(', ')}) VALUES (${placeholders})`,
        insertVals
      );

      if (authRoleId && (await tableExists(client, 'up_users_role_lnk'))) {
        await client.query(
          `INSERT INTO up_users_role_lnk (user_id, role_id)
           SELECT $1, $2 WHERE NOT EXISTS (
             SELECT 1 FROM up_users_role_lnk WHERE user_id = $1 AND role_id = $2
           )`,
          [row.id, authRoleId]
        );
      }
    }
    log(`Insert up_users id=${row.id} email=${row.email}`);
  }
}

async function dropLegacyTable(client) {
  if (!(await tableExists(client, 'xtrawrkx_users'))) return;

  const dependents = await listFkDependents(client, 'xtrawrkx_users');
  for (const dep of dependents) {
    const table = dep.dependent_table.replace(/^public\./, '');
    if (!DRY_RUN) {
      await client.query(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${dep.constraint_name}`);
    }
    log(`Drop FK ${dep.constraint_name} on ${table}`);
  }
  if (!DRY_RUN) await client.query('DROP TABLE IF EXISTS public.xtrawrkx_users');
  log('Dropped xtrawrkx_users');
}

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Set DATABASE_URL (Railway Postgres → Connect).');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl:
      connectionString.includes('sslmode=require') || connectionString.includes('rlwy.net')
        ? { rejectUnauthorized: false }
        : undefined,
  });

  await client.connect();

  try {
    const hasLegacy = await tableExists(client, 'xtrawrkx_users');
    const hasUp = await tableExists(client, 'up_users');

    if (!hasLegacy && !hasUp) {
      console.log('No xtrawrkx_users or up_users — nothing to do.');
      return;
    }

    const legacyCount = hasLegacy
      ? (await client.query('SELECT COUNT(*)::int AS c FROM xtrawrkx_users')).rows[0].c
      : 0;
    const upCountBefore = hasUp
      ? (await client.query('SELECT COUNT(*)::int AS c FROM up_users')).rows[0].c
      : 0;

    console.log(`\nxtrawrkx_users: ${hasLegacy ? legacyCount : 'n/a'} rows`);
    console.log(`up_users: ${hasUp ? upCountBefore : 'table missing'} rows`);
    console.log(
      `organization_users: ${(await tableExists(client, 'organization_users'))
        ? (await client.query('SELECT COUNT(*)::int AS c FROM organization_users')).rows[0].c
        : 'created on first successful Strapi boot'
      }\n`
    );

    await client.query('BEGIN');

    if (hasLegacy && !hasUp) {
      await renameLegacyToUpUsers(client);
    } else if (hasLegacy && hasUp) {
      await copyLegacyIntoExistingUpUsers(client);
      await dropLegacyTable(client);
    } else if (hasUp && !hasLegacy) {
      log('up_users already exists, xtrawrkx_users gone — OK');
    }

    if (DRY_RUN) {
      await client.query('ROLLBACK');
      console.log('\nDRY_RUN complete (rolled back). Unset DRY_RUN to apply.\n');
    } else {
      await client.query('COMMIT');
      const upAfter = (await client.query('SELECT COUNT(*)::int AS c FROM up_users')).rows[0].c;
      console.log(`\nDone. up_users: ${upAfter} rows.`);
      console.log('Redeploy API — Strapi will create organization_users and other missing tables.\n');
    }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => { });
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
