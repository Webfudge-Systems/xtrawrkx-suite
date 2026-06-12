'use strict';

/**
 * Flush API cache keys for an org (or all cache keys).
 * Usage:
 *   npm run flush:api-cache
 *   npm run flush:api-cache -- --org 1
 *
 * Loads REDIS_URL from apps/backend/.env when not set in the shell.
 */

const fs = require('fs');
const path = require('path');
const redis = require('../src/utils/redis');
const cache = require('../src/utils/cache');

function loadEnvFile() {
  if (process.env.REDIS_URL) return;
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile();

async function main() {
  const orgArg = process.argv.indexOf('--org');
  const orgId = orgArg >= 0 ? process.argv[orgArg + 1] : null;

  if (!redis.isRedisConfigured()) {
    console.error('Set REDIS_URL first (or add it to apps/backend/.env).');
    process.exit(1);
  }

  await redis.ping();

  if (orgId) {
    const n = await cache.invalidateOrg(orgId);
    console.log(`Invalidated ${n} cache keys for org ${orgId}`);
  } else {
    const n = await cache.invalidatePattern('*');
    console.log(`Invalidated ${n} cache keys (all ${cache.PREFIX}:* )`);
  }

  await redis.disconnect();
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
