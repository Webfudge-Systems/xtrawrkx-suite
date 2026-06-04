'use client';

import { useMemo } from 'react';
import { useTableSort } from '@webfudge/ui';
import { getCrmSortValue } from '../lib/tableSortValues';
import { SORT_COLUMNS_BY_ENTITY, sortableKeysForEntity } from '../lib/tableSortColumns';

/**
 * CRM table sort hook — persists rules and sorts row data for a given entity type.
 *
 * @param {{
 *   entity: 'leadCompany' | 'contact' | 'deal',
 *   storageKey?: string,
 *   data?: unknown[],
 *   defaultRules?: { key: string, direction: 'asc' | 'desc' }[],
 * }} options
 */
export function useCrmTableSort({ entity, storageKey, data = [], defaultRules = [] }) {
  const columnOptions = SORT_COLUMNS_BY_ENTITY[entity] || [];
  const sortableKeys = useMemo(() => sortableKeysForEntity(entity), [entity]);

  const tableSort = useTableSort({ storageKey, defaultRules });

  const sortedData = useMemo(
    () => tableSort.sortData(data, (row, key) => getCrmSortValue(entity, row, key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

export default useCrmTableSort;
