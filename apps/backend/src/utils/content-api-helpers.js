'use strict';

/**
 * Shared pieces for org-scoped Strapi content API controllers (CRM-style).
 * Keeps find/list pagination, populate allowlists, and org relation parsing consistent.
 */

/** @param {unknown} rel */
function orgIdFromRelation(rel) {
  if (rel == null) return null;
  if (typeof rel === 'object') return rel.id ?? null;
  return rel;
}

/**
 * @param {import('koa').Context} ctx
 * @param {{ maxPageSize?: number, defaultPageSize?: number, defaultSort?: string }} [opts]
 */
function readListQuery(ctx, opts = {}) {
  const query = ctx.query || {};
  const maxPageSize = opts.maxPageSize ?? 100;
  const defaultPageSize = opts.defaultPageSize ?? 25;
  const pag = query.pagination && typeof query.pagination === 'object' ? query.pagination : null;
  const page = parseInt(
    query['pagination[page]'] || pag?.page || query.page || '1',
    10
  );
  const pageSize = Math.min(
    parseInt(
      query['pagination[pageSize]'] ||
        pag?.pageSize ||
        query.pageSize ||
        String(defaultPageSize),
      10
    ),
    maxPageSize
  );
  const sortStr = query.sort || opts.defaultSort || 'createdAt:desc';
  const [sortField, sortOrder] = sortStr.split(':');
  const sort = sortField
    ? { [sortField]: (sortOrder || 'desc').toUpperCase() }
    : { createdAt: 'DESC' };
  return { query, page, pageSize, sort };
}

/**
 * @param {Set<string> | string[]} allowedKeys
 * @param {string[]} fallbackPopulate
 */
function createPopulateSanitizer(allowedKeys, fallbackPopulate) {
  const ALLOWED = allowedKeys instanceof Set ? allowedKeys : new Set(allowedKeys);
  const fallback = [...fallbackPopulate];

  return function sanitizePopulate(populate) {
    if (populate == null || populate === '' || populate === '*') {
      return [...fallback];
    }
    let keys = [];
    if (Array.isArray(populate)) {
      keys = populate.map((p) => (typeof p === 'string' ? p : '')).filter(Boolean);
    } else if (typeof populate === 'object' && populate !== null) {
      // Nested REST params like populate[projects][fields][0]=id parse as objects; use keys
      // so `projects: { fields: [...] }` still resolves to "projects".
      const fromKeys = Object.keys(populate).filter((k) => ALLOWED.has(k));
      if (fromKeys.length) {
        keys = fromKeys;
      } else {
        keys = Object.values(populate)
          .map((v) => (typeof v === 'string' ? v : ''))
          .filter(Boolean);
      }
    } else if (typeof populate === 'string') {
      keys = populate
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const filtered = [...new Set(keys.filter((k) => ALLOWED.has(k)))];
    return filtered.length ? filtered : [...fallback];
  };
}

/**
 * @param {import('@strapi/strapi').Strapi} strapi
 * @param {string} uid
 * @param {object} where
 * @param {number} fallbackTotal
 */
async function safeCount(strapi, uid, where, fallbackTotal) {
  try {
    return await strapi.db.query(uid).count({ where });
  } catch (_) {
    return fallbackTotal;
  }
}

/**
 * Strapi 5: CRM URLs often use stable `documentId` (string); `entityService.findOne/update/delete`
 * expect the integer primary key. Numeric-only params are treated as DB id.
 *
 * @param {import('@strapi/strapi').Strapi} strapi
 * @param {string} uid
 * @param {string|number} param - route :id
 * @returns {Promise<number|null>}
 */
async function resolveEntityPkForRouteParam(strapi, uid, param) {
  if (param == null || param === '') return null;
  const s = String(param).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return Number.isNaN(n) ? null : n;
  }
  try {
    const rows = await strapi.entityService.findMany(uid, {
      filters: { documentId: s },
      fields: ['id'],
      limit: 1,
    });
    return rows?.[0]?.id ?? null;
  } catch (_) {
    return null;
  }
}

module.exports = {
  orgIdFromRelation,
  readListQuery,
  createPopulateSanitizer,
  safeCount,
  resolveEntityPkForRouteParam,
};
