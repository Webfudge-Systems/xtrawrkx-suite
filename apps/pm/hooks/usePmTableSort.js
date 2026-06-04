'use client';

import { useMemo } from 'react';
import { useTableSort } from '@webfudge/ui';
import { getPmSortValue } from '../lib/tableSortValues';
import { SORT_COLUMNS_BY_ENTITY, sortableKeysForEntity } from '../lib/tableSortColumns';

/**
 * PM table sort hook — persists rules and sorts row data for a given entity type.
 *
 * @param {{
 *   entity: keyof typeof SORT_COLUMNS_BY_ENTITY,
 *   storageKey?: string,
 *   data?: unknown[],
 *   defaultRules?: { key: string, direction: 'asc' | 'desc' }[],
 * }} options
 */
export function usePmTableSort({ entity, storageKey, data = [], defaultRules = [] }) {
  const columnOptions = SORT_COLUMNS_BY_ENTITY[entity] || [];
  const sortableKeys = useMemo(() => sortableKeysForEntity(entity), [entity]);

  const tableSort = useTableSort({ storageKey, defaultRules });

  const sortedData = useMemo(
    () =>
      tableSort.sortData(data, (row, key) => getPmSortValue(entity, row, key)),
    [data, entity, tableSort.sortData, tableSort.sortRules]
  );

  const bindSortableColumns = (columns) => tableSort.bindSortableColumns(columns, sortableKeys);

  return {
    ...tableSort,
    columnOptions,
    sortableKeys,
    sortedData,
    bindSortableColumns,
  };
}

export default usePmTableSort;
