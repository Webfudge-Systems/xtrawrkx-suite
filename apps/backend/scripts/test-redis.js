'use strict';

/**
 * Quick Redis connectivity test (no redis-cli required).
 * Usage (PowerShell):
 *   $env:REDIS_URL="redis://..."
 *   node scripts/test-redis.js
 */

const { createClient } = require('redis');

const url = process.env.REDIS_URL?.trim();
if (!url) {
  console.error('Set REDIS_URL first (Railway Connect → public URL for local machine).');
  process.exit(1);
}

const masked = url.replace(/:([^:@]+)@/, ':****@');

(async () => {
  const client = createClient({ url });
  client.on('error', (e) => console.error('Redis error:', e.message));
  await client.connect();
  console.log('URL:', masked);
  console.log('PING ->', await client.ping());
  await client.set('webfudge:healthcheck', 'ok', { EX: 120 });
  console.log('GET  ->', await client.get('webfudge:healthcheck'));
  console.log('KEYS ->', await client.keys('*'));
  await client.quit();
  console.log('Done. Check Railway Redis → Database → Data for keys.');
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
