'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import leadCompanyService from './api/leadCompanyService';
import clientAccountService from './api/clientAccountService';
import { isConvertedLeadCompany } from './dealFormOptions';

export const COMPANY_PICKER_PAGE_SIZE = 40;
const SEARCH_DEBOUNCE_MS = 250;

export function companyPickerId(row) {
  if (!row) return '';
  const id = row.id ?? row.documentId;
  return id != null && id !== '' ? String(id) : '';
}

export function companyPickerLabel(row, { markConverted = false } = {}) {
  if (!row) return '';
  const name = String(row.companyName || row.name || '').trim();
  const id = companyPickerId(row);
  const base = name || (id ? `Company #${id}` : '');
  if (markConverted && isConvertedLeadCompany(row)) return `${base} (converted)`;
  return base;
}

function toOption(row, { markConverted = false } = {}) {
  const value = companyPickerId(row);
  if (!value) return null;
  return { value, label: companyPickerLabel(row, { markConverted }) };
}

async function searchCompanies(type, args) {
  if (type === 'clientAccount') {
    return clientAccountService.searchForPicker(args);
  }
  return leadCompanyService.searchForPicker(args);
}

async function fetchCompany(type, id) {
  if (!id) return null;
  const service = type === 'clientAccount' ? clientAccountService : leadCompanyService;
  const res = await service.getOne(id);
  return res?.data ?? null;
}

function mergeOptions(prev, rows, { markConverted = false, prepend = false } = {}) {
  const next = new Map(prev.map((o) => [o.value, o]));
  for (const row of rows) {
    const opt = toOption(row, { markConverted: markConverted && isConvertedLeadCompany(row) });
    if (!opt) continue;
    if (!next.has(opt.value)) next.set(opt.value, opt);
  }
  const list = [...next.values()];
  if (!prepend) return list;
  return list;
}

/**
 * Server-backed lead company / client account options for Select `asyncSearch`.
 */
export function useCompanyPicker({
  type = 'leadCompany',
  value = '',
  excludeConverted = true,
  enabled = true,
} = {}) {
  const leadExclude = type === 'leadCompany' && excludeConverted;
  const [options, setOptions] = useState([]);
  const [itemsById, setItemsById] = useState({});
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');

  const pageRef = useRef(1);
  const queryRef = useRef('');
  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(false);
  const valueRef = useRef(value);
  const debounceRef = useRef(null);
  const itemsRef = useRef({});

  itemsRef.current = itemsById;
  valueRef.current = value;

  const rememberRows = useCallback((rows) => {
    if (!rows?.length) return;
    setItemsById((prev) => {
      const next = { ...prev };
      for (const row of rows) {
        const id = companyPickerId(row);
        if (id) next[id] = row;
      }
      return next;
    });
  }, []);

  const runFetch = useCallback(
    async (rawQuery, page, append) => {
      if (!enabled) return;
      const requestId = ++requestIdRef.current;
      if (append) loadingMoreRef.current = true;
      else setLoading(true);

      try {
        const res = await searchCompanies(type, {
          search: rawQuery,
          page,
          pageSize: COMPANY_PICKER_PAGE_SIZE,
          excludeConverted: leadExclude,
        });
        if (requestId !== requestIdRef.current) return;

        let batch = Array.isArray(res?.data) ? res.data : [];
        if (leadExclude) {
          batch = batch.filter((row) => !isConvertedLeadCompany(row));
        }
        rememberRows(batch);

        const pageCount = res?.meta?.pagination?.pageCount ?? 1;
        pageRef.current = page;
        const more = page < pageCount;
        hasMoreRef.current = more;
        setHasMore(more);

        setOptions((prev) => {
          if (!append) {
            const selectedId = String(valueRef.current || '').trim();
            const selectedRow = selectedId ? itemsRef.current[selectedId] : null;
            const fresh = [];
            if (selectedRow) {
              const opt = toOption(selectedRow, {
                markConverted: leadExclude && isConvertedLeadCompany(selectedRow),
              });
              if (opt) fresh.push(opt);
            }
            return mergeOptions(fresh, batch, { markConverted: leadExclude });
          }
          return mergeOptions(prev, batch, { markConverted: leadExclude });
        });
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error('Company picker search failed', err);
        if (!append) {
          setOptions([]);
          hasMoreRef.current = false;
          setHasMore(false);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [enabled, type, leadExclude, rememberRows]
  );

  const onSearch = useCallback(
    (rawQuery) => {
      if (!enabled) return;
      const q = String(rawQuery || '');
      queryRef.current = q;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      const delay = q.trim() ? SEARCH_DEBOUNCE_MS : 0;
      debounceRef.current = window.setTimeout(() => {
        runFetch(q, 1, false);
      }, delay);
    },
    [enabled, runFetch]
  );

  const onLoadMore = useCallback(() => {
    if (!enabled || loadingMoreRef.current || !hasMoreRef.current) return;
    runFetch(queryRef.current, pageRef.current + 1, true);
  }, [enabled, runFetch]);

  const getItem = useCallback((id) => {
    const key = String(id || '').trim();
    if (!key) return null;
    return itemsRef.current[key] || null;
  }, []);

  const resolveItem = useCallback(
    async (id, { force = false } = {}) => {
      const key = String(id || '').trim();
      if (!key) return null;
      if (!force && itemsRef.current[key]) return itemsRef.current[key];
      try {
        const row = await fetchCompany(type, key);
        if (row) rememberRows([row]);
        return row;
      } catch (err) {
        console.error('Company picker failed to resolve row', err);
        return itemsRef.current[key] || null;
      }
    },
    [type, rememberRows]
  );

  useEffect(() => {
    const id = String(value || '').trim();
    if (!id) {
      setSelectedLabel('');
      return undefined;
    }
    const cached = itemsRef.current[id];
    if (cached) {
      setSelectedLabel(
        companyPickerLabel(cached, {
          markConverted: leadExclude && isConvertedLeadCompany(cached),
        })
      );
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchCompany(type, id);
        if (cancelled || !row) return;
        rememberRows([row]);
        const markConverted = leadExclude && isConvertedLeadCompany(row);
        setSelectedLabel(companyPickerLabel(row, { markConverted }));
        setOptions((prev) => {
          if (prev.some((o) => o.value === id)) return prev;
          const opt = toOption(row, { markConverted });
          return opt ? [opt, ...prev] : prev;
        });
      } catch (err) {
        console.error('Company picker failed to load selected row', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, value, leadExclude, rememberRows]);

  useEffect(
    () => () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    },
    []
  );

  return {
    options,
    loading,
    hasMore,
    selectedLabel,
    onSearch,
    onLoadMore,
    getItem,
    resolveItem,
  };
}
