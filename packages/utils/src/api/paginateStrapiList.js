/**
 * Paginate Strapi list API responses across all apps (PM, CRM, Books).
 * Handles stale meta.pagination.total from cached first pages.
 */

export function listCacheBust(options = {}) {
  if (options.cacheBust != null) return String(options.cacheBust);
  return String(Date.now());
}

export function strapiRowId(row) {
  return row?.id ?? row?.attributes?.id;
}

/**
 * Walk every page of a Strapi list response; merge rows by id.
 * @param {(page: number, pageSize: number, cacheBust: string) => Promise<{ data?: unknown[], meta?: { pagination?: object } }>} fetchPage
 * @param {{ pageSize?: number, cacheBust?: string|number, maxPages?: number }} [options]
 * @returns {Promise<object[]>}
 */
export async function paginateStrapiList(fetchPage, options = {}) {
  const pageSize = Math.min(Number(options.pageSize) || 100, 500);
  const cacheBust = listCacheBust(options);
  let page = 1;
  const byId = new Map();
  const maxPages = Number(options.maxPages) || 500;

  for (;;) {
    const res = await fetchPage(page, pageSize, cacheBust);
    const batch = Array.isArray(res?.data) ? res.data : [];
    for (const row of batch) {
      const id = strapiRowId(row);
      if (id != null) byId.set(id, row);
    }
    if (!batch.length) break;

    const metaTotal = Number(res?.meta?.pagination?.total);
    const metaPageCount = Number(res?.meta?.pagination?.pageCount) || 1;

    // Only trust meta.total when the last page is short (avoids stale single-page cache).
    if (
      Number.isFinite(metaTotal) &&
      metaTotal > 0 &&
      byId.size >= metaTotal &&
      batch.length < pageSize
    ) {
      break;
    }
    if (page >= metaPageCount) break;

    if (batch.length < pageSize) {
      if (Number.isFinite(metaTotal) && metaTotal > byId.size && page < metaPageCount) {
        page += 1;
        if (page > maxPages) break;
        continue;
      }
      break;
    }

    page += 1;
    if (page > maxPages) break;
  }

  return [...byId.values()];
}
