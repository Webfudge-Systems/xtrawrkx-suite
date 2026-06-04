'use strict';

const redis = require('./redis');

const DEFAULT_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 300;
const PREFIX = process.env.CACHE_KEY_PREFIX || 'cache';

function fullKey(key) {
  return `${PREFIX}:${key}`;
}

/**
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} loader
 * @param {{ ttlSeconds?: number }} [options]
 * @returns {Promise<{ data: T, fromCache: boolean }>}
 */
async function getOrSet(key, loader, options = {}) {
  const cacheKey = fullKey(key);
  const ttl = options.ttlSeconds ?? DEFAULT_TTL_SECONDS;

  if (redis.isRedisConfigured()) {
    try {
      const raw = await redis.get(cacheKey);
      if (raw) {
        return { data: JSON.parse(raw), fromCache: true };
      }
    } catch (err) {
      console.warn('[cache] read failed:', err?.message || err);
    }
  }

  const data = await loader();

  if (redis.isRedisConfigured()) {
    try {
      await redis.set(cacheKey, JSON.stringify(data), ttl);
    } catch (err) {
      console.warn('[cache] write failed:', err?.message || err);
    }
  }

  return { data, fromCache: false };
}

/**
 * @param {string} pattern - suffix after prefix, e.g. `apps:*`
 */
async function invalidatePattern(pattern) {
  if (!redis.isRedisConfigured()) return 0;
  const fullPattern = fullKey(pattern);
  try {
    const matched = await redis.keys(fullPattern);
    for (const key of matched) {
      await redis.del(key);
    }
    return matched.length;
  } catch (err) {
    console.warn('[cache] invalidate failed:', err?.message || err);
    return 0;
  }
}

/**
 * @param {string} key
 * @returns {Promise<object | null>}
 */
async function getJson(key) {
  if (!redis.isRedisConfigured()) return null;
  try {
    const raw = await redis.get(fullKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('[cache] getJson failed:', err?.message || err);
    return null;
  }
}

/**
 * @param {string} key
 * @param {object} value
 * @param {number} [ttlSeconds]
 */
async function setJson(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!redis.isRedisConfigured()) return false;
  try {
    const body = JSON.stringify(value);
    if (body.length > Number(process.env.CACHE_MAX_BODY_BYTES || 5 * 1024 * 1024)) {
      return false;
    }
    await redis.set(fullKey(key), body, ttlSeconds);
    return true;
  } catch (err) {
    console.warn('[cache] setJson failed:', err?.message || err);
    return false;
  }
}

/**
 * @param {string | number} orgId
 */
async function invalidateOrg(orgId) {
  if (orgId == null || orgId === '' || orgId === 'none') return 0;
  return invalidatePattern(`*:o:${orgId}:*`);
}

module.exports = {
  DEFAULT_TTL_SECONDS,
  PREFIX,
  getOrSet,
  getJson,
  setJson,
  invalidatePattern,
  invalidateOrg,
  fullKey,
};
