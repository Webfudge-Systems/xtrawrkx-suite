'use strict';

/**
 * Backfill task.assigner (Reporter) from assignee when missing.
 * Legacy PM creates often stored the creator only on assignee; without assigner,
 * member visibility and reporter filters could omit rows after list reloads.
 *
 * Usage (from apps/backend; stop `npm run dev:backend` first on SQLite):
 *   npm run backfill:task-assigners
 *   npm run backfill:task-assigners:dry-run
 *
 * Local SQLite uses direct DB updates (no Strapi boot). Postgres uses Strapi entityService.
 */

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const TASK_UID = 'api::task.task';
const appDir = path.join(__dirname, '..');
const defaultSqlitePath = path.join(appDir, '.tmp', 'data.db');

function relationId(rel) {
  if (rel == null || rel === '') return null;
  if (typeof rel === 'number' || typeof rel === 'string') return rel;
  if (typeof rel === 'object') return rel.id ?? rel.documentId ?? null;
  return null;
}

function resolveSqlitePath() {
  if (process.env.DATABASE_CLIENT && process.env.DATABASE_CLIENT !== 'sqlite') return null;
  const filename = process.env.DATABASE_FILENAME || '.tmp/data.db';
  const dbPath = path.isAbsolute(filename) ? filename : path.join(appDir, filename);
  return fs.existsSync(dbPath) ? dbPath : null;
}

function backfillViaSqliteCli(dbPath, { dryRun = false } = {}) {
  const pending = execFileSync(
    'sqlite3',
    [
      dbPath,
      `SELECT t.id, t.name, asg.user_id
       FROM tasks t
       JOIN tasks_assignee_lnk asg ON asg.task_id = t.id
       LEFT JOIN tasks_assigner_lnk asn ON asn.task_id = t.id
       WHERE asn.task_id IS NULL AND asg.user_id IS NOT NULL
       ORDER BY t.id;`,
    ],
    { encoding: 'utf8' }
  ).trim();

  const rows = pending
    ? pending.split(/\r?\n/).map((line) => {
        const [id, name, userId] = line.split('|');
        return { id: Number(id), name, userId: Number(userId) };
      })
    : [];

  if (dryRun) {
    for (const row of rows) {
      console.log(`[dry-run] task ${row.id} "${row.name}" → assigner ${row.userId}`);
    }
    console.log(`Dry run complete: ${rows.length} would update.`);
    return { updated: rows.length, skipped: 0 };
  }

  if (!rows.length) {
    console.log('Backfill complete: 0 updated (all tasks already have assigner).');
    return { updated: 0, skipped: 0 };
  }

  const insertSql = rows
    .map((row) => `INSERT INTO tasks_assigner_lnk (task_id, user_id) VALUES (${row.id}, ${row.userId});`)
    .join('\n');

  execFileSync('sqlite3', [dbPath, insertSql], { encoding: 'utf8' });

  for (const row of rows) {
    console.log(`Updated task ${row.id} "${row.name}" → assigner ${row.userId}`);
  }
  console.log(`Backfill complete: ${rows.length} updated.`);
  return { updated: rows.length, skipped: 0 };
}

async function backfillViaStrapi({ dryRun = false } = {}) {
  const { createStrapi } = require('@strapi/strapi');
  let strapi;
  try {
    strapi = createStrapi({ appDir, distDir: appDir });
    await strapi.load();

    const tasks = await strapi.entityService.findMany(TASK_UID, {
      populate: ['assigner', 'assignee'],
      limit: 5000,
    });

    let updated = 0;
    let skipped = 0;

    for (const task of tasks) {
      const assignerId = relationId(task.assigner);
      const assigneeId = relationId(task.assignee);
      if (assignerId != null || assigneeId == null) {
        skipped += 1;
        continue;
      }

      if (dryRun) {
        console.log(`[dry-run] task ${task.id} "${task.name}" → assigner ${assigneeId}`);
        updated += 1;
        continue;
      }

      await strapi.entityService.update(TASK_UID, task.id, {
        data: { assigner: assigneeId },
      });
      console.log(`Updated task ${task.id} "${task.name}" → assigner ${assigneeId}`);
      updated += 1;
    }

    console.log(
      dryRun
        ? `Dry run complete: ${updated} would update, ${skipped} skipped.`
        : `Backfill complete: ${updated} updated, ${skipped} skipped.`
    );
  } finally {
    if (strapi) await strapi.destroy();
  }
}

async function backfillTaskAssigners(options = {}) {
  const sqlitePath = resolveSqlitePath();
  if (sqlitePath) {
    console.log(`Using SQLite backfill (${sqlitePath})`);
    return backfillViaSqliteCli(sqlitePath, options);
  }
  console.log('Using Strapi entityService backfill (Postgres / remote DB)');
  return backfillViaStrapi(options);
}

const dryRun = process.argv.includes('--dry-run');

backfillTaskAssigners({ dryRun }).catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
