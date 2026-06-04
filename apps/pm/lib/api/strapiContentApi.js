/**
 * Shared helpers for CRM Strapi 5 content-type REST clients.
 * Use across *Service.js files so populate, list queries, and response shape stay consistent.
 */

/**
 * Strapi 5: use `populate[0]=a&populate[1]=b` — comma-separated `populate=` breaks the API (500).
 * @param {Record<string, unknown>} query
 * @param {string|string[]|undefined} populate
 */
export function addPopulate(query, populate) {
  if (populate == null || populate === '') return;
  if (Array.isArray(populate)) {
    populate.forEach((p, i) => {
      if (p != null && p !== '') query[`populate[${i}]`] = p;
    });
  } else {
    query.populate = populate;
  }
}

/**
 * Build GET list query: passes through flat keys (`filters[$or][0]...`, `pagination[page]`, …),
 * and normalizes `sort`, `pagination` object, `filters`, and `populate`.
 *
 * @param {Record<string, unknown>} params
 * @param {{ omit?: string[] }} [options] — keys to drop (e.g. CRM-only flags)
 */
export function buildListQuery(params = {}, options = {}) {
  const omit = new Set(options.omit ?? []);
  const { pagination: paginationObj, populate, filters, sort, ...rest } = params;

  const query = {};
  for (const key of Object.keys(rest)) {
    if (omit.has(key)) continue;
    query[key] = rest[key];
  }

  if (sort != null && sort !== '') query.sort = sort;

  if (paginationObj && typeof paginationObj === 'object') {
    if (query['pagination[page]'] == null && paginationObj.page != null) {
      query['pagination[page]'] = paginationObj.page;
    }
    if (query['pagination[pageSize]'] == null && paginationObj.pageSize != null) {
      query['pagination[pageSize]'] = paginationObj.pageSize;
    }
  }

  if (filters !== undefined && filters !== null) {
    query.filters = filters;
  }

  addPopulate(query, populate);
  return query;
}

/**
 * Unwrap Strapi list `response.data` (array or `{ data: [] }`).
 */
export function normalizeStrapiListBody(response) {
  let raw = response?.data ?? response;
  if (raw && typeof raw === 'object' && Array.isArray(raw.data)) {
    raw = raw.data;
  }
  return Array.isArray(raw) ? raw : [];
}

/**
 * Flatten a single Strapi entry `{ id, attributes }` and nested `data` relations.
 * @param {unknown} entry
 * @returns {unknown}
 */
export function normalizeStrapiEntry(entry) {
  if (!entry) return null;
  if (entry.attributes) {
    const { id, attributes } = entry;
    const relations = {};
    for (const [key, value] of Object.entries(attributes)) {
      if (value && typeof value === 'object' && (value.data !== undefined || Array.isArray(value))) {
        relations[key] = value;
      }
    }
    const flat = {
      id,
      documentId: attributes.documentId ?? id,
      ...Object.fromEntries(
        Object.entries(attributes).filter(
          ([_, v]) =>
            v === null ||
            v === undefined ||
            typeof v !== 'object' ||
            (v && !('data' in v) && !Array.isArray(v))
        )
      ),
    };
    for (const [key, value] of Object.entries(relations)) {
      if (value && typeof value === 'object' && value.data !== undefined) {
        flat[key] = Array.isArray(value.data)
          ? value.data.map(normalizeStrapiEntry).filter(Boolean)
          : normalizeStrapiEntry(value.data);
      } else if (Array.isArray(value)) {
        flat[key] = value.map(normalizeStrapiEntry).filter(Boolean);
      } else {
        flat[key] = value;
      }
    }
    return flat;
  }
  return entry;
}

/**
 * @param {unknown} response
 * @param {(e: unknown) => unknown} normalizeEntry
 */
export function normalizeStrapiListResponse(response, normalizeEntry) {
  const list = normalizeStrapiListBody(response);
  return {
    data: list.map((item) => normalizeEntry(item)).filter(Boolean),
    meta: response?.meta ?? { pagination: { page: 1, pageCount: 1, total: list.length } },
  };
}

/**
 * @param {unknown} response
 * @param {(e: unknown) => unknown} normalizeEntry
 */
export function normalizeStrapiOneResponse(response, normalizeEntry) {
  const data = response?.data ?? response;
  return { data: normalizeEntry(data) };
}
