'use strict';

const { createClient } = require('redis');

/** @type {import('redis').RedisClientType | null} */
let client = null;
/** @type {Promise<import('redis').RedisClientType | null> | null} */
let connectPromise = null;

/**
 * Build Redis URL from Railway / standard env vars.
 * @returns {string | null}
 */
function resolveRedisUrl() {
  const explicit = process.env.REDIS_URL?.trim();
  if (explicit) return explicit;

  const host = process.env.REDISHOST || process.env.REDIS_HOST;
  const port = process.env.REDISPORT || process.env.REDIS_PORT || '6379';
  const user = process.env.REDISUSER || process.env.REDIS_USER || 'default';
  const password = process.env.REDISPASSWORD || process.env.REDIS_PASSWORD;

  if (host && password) {
    const encodedUser = encodeURIComponent(user);
    const encodedPass = encodeURIComponent(password);
    return `redis://${encodedUser}:${encodedPass}@${host}:${port}`;
  }

  return null;
}

function isRedisConfigured() {
  if (process.env.REDIS_ENABLED === 'false') return false;
  return Boolean(resolveRedisUrl());
}

/**
 * @returns {Promise<import('redis').RedisClientType | null>}
 */
async function getClient() {
  if (!isRedisConfigured()) return null;
  if (client?.isOpen) return client;

  if (!connectPromise) {
    connectPromise = (async () => {
      const url = resolveRedisUrl();
      const next = createClient({ url });
      next.on('error', (err) => {
        console.error('[redis] client error:', err?.message || err);
      });
      await next.connect();
      client = next;
      return client;
    })().catch((err) => {
      connectPromise = null;
      console.error('[redis] connect failed:', err?.message || err);
      return null;
    });
  }

  return connectPromise;
}

/**
 * @returns {Promise<boolean>}
 */
async function ping() {
  const c = await getClient();
  if (!c) return false;
  const result = await c.ping();
  return result === 'PONG';
}

/**
 * @param {string} key
 * @returns {Promise<string | null>}
 */
async function get(key) {
  const c = await getClient();
  if (!c) return null;
  return c.get(key);
}

/**
 * @param {string} key
 * @param {string} value
 * @param {number} [ttlSeconds]
 */
async function set(key, value, ttlSeconds) {
  const c = await getClient();
  if (!c) return false;
  if (ttlSeconds && ttlSeconds > 0) {
    await c.set(key, value, { EX: ttlSeconds });
  } else {
    await c.set(key, value);
  }
  return true;
}

/**
 * @param {string} key
 */
async function del(key) {
  const c = await getClient();
  if (!c) return false;
  await c.del(key);
  return true;
}

/**
 * @param {string} pattern
 * @returns {Promise<string[]>}
 */
async function keys(pattern) {
  const c = await getClient();
  if (!c) return [];
  return c.keys(pattern);
}

async function disconnect() {
  connectPromise = null;
  if (client?.isOpen) {
    await client.quit();
  }
  client = null;
}

module.exports = {
  resolveRedisUrl,
  isRedisConfigured,
  getClient,
  ping,
  get,
  set,
  del,
  keys,
  disconnect,
};
