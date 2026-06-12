'use strict';

const crypto = require('crypto');
const redis = require('../utils/redis');
const cache = require('../utils/cache');

const TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS) || 300;

const SKIP_PREFIXES = [
  '/api/auth',
  '/api/health',
  '/api/connect',
  '/api/upload',
  '/api/entity-attachments',
  '/admin',
  '/_health',
];

function isCacheEnabled() {
  if (process.env.CACHE_API_ENABLED === 'false') return false;
  return redis.isRedisConfigured();
}

function isTaskApiPath(path) {
  return path === '/api/tasks' || path.startsWith('/api/tasks/');
}

/** Paths that must never trigger org cache invalidation (auth, uploads, etc.). */
function shouldSkipMutationInvalidate(path) {
  if (!path || !path.startsWith('/api')) return true;
  return SKIP_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/** GET responses that must never be stored in Redis. */
function shouldSkipGetCache(path) {
  if (shouldSkipMutationInvalidate(path)) return true;
  // Task reads are paginated and high-churn; caching any task GET caused stale My Tasks lists.
  if (isTaskApiPath(path)) return true;
  return false;
}

/**
 * Scoped per user + org + role + URL so RBAC and tenant isolation stay correct.
 * @param {import('koa').Context} ctx
 */
function buildCacheKey(ctx) {
  const userId = ctx.state.user?.id ?? 'anon';
  const orgId =
    ctx.state.orgId ??
    ctx.request.headers['x-organization-id'] ??
    'none';
  const role = ctx.state.orgRoleCode ?? 'none';
  const qs = ctx.querystring || '';
  const digest = crypto
    .createHash('sha256')
    .update(`${ctx.path}?${qs}`)
    .digest('hex')
    .slice(0, 20);
  return `u:${userId}:o:${orgId}:r:${role}:p:${digest}`;
}

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    if (!isCacheEnabled()) {
      return next();
    }

    const path = ctx.path || '';

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(ctx.method)) {
      await next();
      // Always invalidate org cache on task writes (POST /api/tasks was previously skipped).
      if (
        ctx.status >= 200 &&
        ctx.status < 300 &&
        path.startsWith('/api') &&
        !shouldSkipMutationInvalidate(path)
      ) {
        const orgId = ctx.state.orgId ?? ctx.request.headers['x-organization-id'];
        const removed = await cache.invalidateOrg(orgId);
        if (removed > 0) {
          ctx.set('X-Cache-Invalidate', String(removed));
        }
      }
      return;
    }

    if (ctx.method !== 'GET' || shouldSkipGetCache(path)) {
      return next();
    }

    const cacheKey = buildCacheKey(ctx);
    const hit = await cache.getJson(cacheKey);

    if (hit != null) {
      ctx.body = hit;
      ctx.status = 200;
      ctx.set('X-Cache', 'HIT');
      return;
    }

    await next();

    if (ctx.status === 200 && ctx.body != null) {
      await cache.setJson(cacheKey, ctx.body, TTL_SECONDS);
      ctx.set('X-Cache', 'MISS');
    }
  };
};
