'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function loadJson(storageKey, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function persistJson(storageKey, value) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function loadWidths(storageKey, defaultWidths, minWidths = {}) {
  const merged = { ...defaultWidths, ...loadJson(storageKey, {}) };
  for (const [key, min] of Object.entries(minWidths)) {
    if (typeof merged[key] === 'number' && merged[key] < min) {
      merged[key] = min;
    }
  }
  return merged;
}

function loadOrder(storageKey, reorderableKeys) {
  const parsed = loadJson(storageKey, null);
  if (!Array.isArray(parsed)) return [...reorderableKeys];
  const valid = new Set(reorderableKeys);
  const ordered = parsed.filter((k) => valid.has(k));
  const missing = reorderableKeys.filter((k) => !ordered.includes(k));
  return [...ordered, ...missing];
}

function loadVisibility(storageKey, defaultVisibility) {
  return { ...defaultVisibility, ...loadJson(storageKey, {}) };
}

/**
 * Shared table column preferences: visibility, drag-reorder, and resize widths (localStorage).
 *
 * @param {object} options
 * @param {string} options.visibilityStorageKey
 * @param {string} options.orderStorageKey
 * @param {string} options.widthsStorageKey
 * @param {Record<string, boolean>} options.defaultVisibility
 * @param {string[]} options.reorderableKeys
 * @param {Record<string, number>} [options.defaultWidths]
 * @param {Record<string, number>} [options.minWidths]
 */
export function useTableColumnPreferences({
  visibilityStorageKey,
  orderStorageKey,
  widthsStorageKey,
  defaultVisibility,
  reorderableKeys,
  defaultWidths = {},
  minWidths = {},
}) {
  const [columnVisibility, setColumnVisibility] = useState(() => ({ ...defaultVisibility }));
  const [columnOrder, setColumnOrder] = useState(() => [...reorderableKeys]);
  const [columnWidths, setColumnWidths] = useState(() => ({ ...defaultWidths }));
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const [columnDropIndicator, setColumnDropIndicator] = useState(null);

  const columnDragKeyRef = useRef(null);
  const columnDropIndicatorRef = useRef(null);
  const toolbarRef = useRef(null);

  useEffect(() => {
    setColumnVisibility(loadVisibility(visibilityStorageKey, defaultVisibility));
    setColumnOrder(loadOrder(orderStorageKey, reorderableKeys));
    const widths = loadWidths(widthsStorageKey, defaultWidths, minWidths);
    setColumnWidths(widths);
    if (widthsStorageKey) persistJson(widthsStorageKey, widths);
  }, [
    defaultVisibility,
    defaultWidths,
    minWidths,
    orderStorageKey,
    reorderableKeys,
    visibilityStorageKey,
    widthsStorageKey,
  ]);

  const handleColumnResizeEnd = useCallback(
    (next) => {
      if (widthsStorageKey) persistJson(widthsStorageKey, next);
    },
    [widthsStorageKey]
  );

  const setColumnVisible = useCallback(
    (key, visible) => {
      setColumnVisibility((prev) => {
        const next = { ...prev, [key]: visible };
        persistJson(visibilityStorageKey, next);
        return next;
      });
    },
    [visibilityStorageKey]
  );

  const handleColumnDragStart = useCallback((e, key) => {
    columnDragKeyRef.current = key;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
    const row = e.currentTarget.closest('[data-column-row]');
    if (row) row.classList.add('opacity-60');
  }, []);

  const handleColumnDragEnd = useCallback((e) => {
    columnDragKeyRef.current = null;
    columnDropIndicatorRef.current = null;
    setColumnDropIndicator(null);
    const row = e.currentTarget.closest('[data-column-row]');
    if (row) row.classList.remove('opacity-60');
  }, []);

  const handleColumnRowDragOver = useCallback((e, key) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const fromKey = columnDragKeyRef.current || e.dataTransfer.getData('text/plain');
    if (!fromKey || fromKey === key) {
      columnDropIndicatorRef.current = null;
      setColumnDropIndicator(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const place = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    const hint = { targetKey: key, place };
    columnDropIndicatorRef.current = hint;
    setColumnDropIndicator(hint);
  }, []);

  const handleColumnListDragLeave = useCallback((e) => {
    const related = e.relatedTarget;
    if (related && e.currentTarget.contains(related)) return;
    columnDropIndicatorRef.current = null;
    setColumnDropIndicator(null);
  }, []);

  const handleColumnDrop = useCallback(
    (e, targetKey) => {
      e.preventDefault();
      const fromKey = columnDragKeyRef.current || e.dataTransfer.getData('text/plain');
      const hint = columnDropIndicatorRef.current;
      const place = hint?.targetKey === targetKey ? hint.place : 'before';
      columnDropIndicatorRef.current = null;
      setColumnDropIndicator(null);
      if (!fromKey || fromKey === targetKey) return;
      setColumnOrder((prev) => {
        const next = [...prev];
        const fi = next.indexOf(fromKey);
        const ti0 = next.indexOf(targetKey);
        if (fi === -1 || ti0 === -1) return prev;
        next.splice(fi, 1);
        const ti = next.indexOf(targetKey);
        const insertAt = place === 'after' ? ti + 1 : ti;
        next.splice(insertAt, 0, fromKey);
        persistJson(orderStorageKey, next);
        return next;
      });
    },
    [orderStorageKey]
  );

  const resetColumnTablePreferences = useCallback(() => {
    const vis = { ...defaultVisibility };
    const order = [...reorderableKeys];
    setColumnVisibility(vis);
    setColumnOrder(order);
    columnDropIndicatorRef.current = null;
    setColumnDropIndicator(null);
    persistJson(visibilityStorageKey, vis);
    persistJson(orderStorageKey, order);
  }, [defaultVisibility, orderStorageKey, reorderableKeys, visibilityStorageKey]);

  const toggleColumnPicker = useCallback(() => {
    setColumnPickerOpen((open) => !open);
  }, []);

  const closeColumnPicker = useCallback(() => {
    setColumnPickerOpen(false);
  }, []);

  const tableResizeProps = useMemo(
    () => ({
      resizableColumns: true,
      columnWidths,
      onColumnWidthsChange: setColumnWidths,
      onColumnResizeEnd: handleColumnResizeEnd,
    }),
    [columnWidths, handleColumnResizeEnd]
  );

  return {
    columnVisibility,
    columnOrder,
    columnWidths,
    setColumnWidths,
    columnPickerOpen,
    setColumnPickerOpen,
    toggleColumnPicker,
    closeColumnPicker,
    columnDropIndicator,
    toolbarRef,
    setColumnVisible,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnRowDragOver,
    handleColumnListDragLeave,
    handleColumnDrop,
    resetColumnTablePreferences,
    tableResizeProps,
    handleColumnResizeEnd,
  };
}
