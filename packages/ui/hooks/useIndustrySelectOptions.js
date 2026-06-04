'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildIndustrySelectOptions,
  readCachedCustomIndustries,
  rememberCustomIndustry,
} from '@webfudge/utils';

/**
 * Collect distinct industry strings from paginated list API responses.
 * @param {() => Promise<{ data?: Array<{ industry?: string }> }>} fetchPage
 */
export async function collectDistinctIndustriesFromList(fetchPage) {
  const values = new Set();
  let page = 1;
  let hasMore = true;
  const pageSize = 100;

  while (hasMore) {
    const res = await fetchPage(page, pageSize);
    const rows = res?.data ?? [];
    const list = Array.isArray(rows) ? rows : [];
    for (const row of list) {
      const industry = row?.industry;
      if (industry && String(industry).trim()) {
        values.add(String(industry).trim());
      }
    }
    const pageCount = res?.meta?.pagination?.pageCount ?? 1;
    hasMore = page < pageCount && list.length === pageSize;
    page += 1;
  }

  return [...values];
}

/**
 * Merges preset industries with values from accounts/leads and local cache.
 */
export function useIndustrySelectOptions({ fetchStoredIndustries, seedIndustries = [] } = {}) {
  const [storedIndustries, setStoredIndustries] = useState(() => [
    ...seedIndustries,
    ...readCachedCustomIndustries(),
  ]);
  const [loading, setLoading] = useState(Boolean(fetchStoredIndustries));

  const refresh = useCallback(async () => {
    if (!fetchStoredIndustries) return;
    setLoading(true);
    try {
      const fromApi = await fetchStoredIndustries();
      setStoredIndustries((prev) => {
        const merged = new Set([...prev, ...fromApi, ...readCachedCustomIndustries()]);
        return [...merged];
      });
    } catch (err) {
      console.error('Failed to load stored industries:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchStoredIndustries]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const options = useMemo(
    () => buildIndustrySelectOptions(storedIndustries),
    [storedIndustries]
  );

  const onIndustrySaved = useCallback((resolvedIndustry) => {
    const v = (resolvedIndustry || '').trim();
    if (!v) return;
    rememberCustomIndustry(v);
    setStoredIndustries((prev) => {
      const key = v.toLowerCase();
      if (prev.some((e) => String(e).trim().toLowerCase() === key)) return prev;
      return [v, ...prev];
    });
  }, []);

  return { options, loading, refresh, onIndustrySaved };
}

export default useIndustrySelectOptions;
