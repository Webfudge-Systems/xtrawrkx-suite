'use strict';

const redis = require('../../../utils/redis');
const cache = require('../../../utils/cache');

module.exports = {
  async redis(ctx) {
    const configured = redis.isRedisConfigured();
    if (!configured) {
      return ctx.send({
        configured: false,
        connected: false,
        message: 'Set REDIS_URL (or REDISHOST + REDISPASSWORD) on the API service.',
      });
    }

    try {
      const ok = await redis.ping();
      const cacheKeys = ok ? await redis.keys(`${cache.PREFIX}:*`) : [];
      return ctx.send({
        configured: true,
        connected: ok,
        ping: ok ? 'PONG' : null,
        apiCacheEnabled: process.env.CACHE_API_ENABLED !== 'false',
        cacheKeyPrefix: cache.PREFIX,
        cacheKeyCount: cacheKeys.length,
        cacheKeySample: cacheKeys.slice(0, 20),
        note: 'GET /api/* list/detail responses are cached per user, org, and role (see global::api-cache middleware).',
      });
    } catch (error) {
      return ctx.send({
        configured: true,
        connected: false,
        error: error?.message || String(error),
      });
    }
  },
};
