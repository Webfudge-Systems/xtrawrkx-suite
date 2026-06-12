'use client';

import { GripVertical } from 'lucide-react';
import { Button } from '../Button';

/**
 * Shared column visibility + reorder dropdown for data tables.
 */
export function TableColumnPicker({
  open,
  pinnedRows = [],
  reorderableRows = [],
  columnVisibility = {},
  columnOrder = [],
  columnDropIndicator,
  onSetVisible,
  onDragStart,
  onDragEnd,
  onRowDragOver,
  onListDragLeave,
  onDrop,
  onReset,
  title = 'Columns',
  description = 'Drag the grip to reorder; an orange line shows where the row will land.',
  className = '',
}) {
  if (!open) return null;

  const rowByKey = Object.fromEntries(reorderableRows.map((r) => [r.key, r]));

  return (
    <div
      className={`absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-gray-200 bg-white p-2.5 shadow-xl ${className}`}
      role="dialog"
      aria-label="Table columns"
    >
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      {description ? (
        <p className="mb-2 text-xs leading-snug text-gray-500">{description}</p>
      ) : null}
      <ul
        className="max-h-[min(51vh,18.75rem)] space-y-0 overflow-y-auto pr-1"
        onDragLeave={onListDragLeave}
      >
        {pinnedRows.map((row) => (
          <li
            key={row.key}
            data-column-row
            className="relative flex items-stretch rounded-lg border border-transparent"
          >
            <span
              className="flex w-8 shrink-0 items-center justify-center text-gray-300"
              aria-hidden
              title="Fixed order"
            >
              —
            </span>
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1 text-sm text-gray-800 hover:bg-gray-50">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                checked={Boolean(columnVisibility[row.key])}
                onChange={(e) => onSetVisible?.(row.key, e.target.checked)}
              />
              <span>{row.label}</span>
            </label>
          </li>
        ))}
        {columnOrder.map((key) => {
          const def = rowByKey[key];
          if (!def) return null;
          const showLineBefore =
            columnDropIndicator?.targetKey === key && columnDropIndicator.place === 'before';
          const showLineAfter =
            columnDropIndicator?.targetKey === key && columnDropIndicator.place === 'after';
          return (
            <li
              key={key}
              data-column-row
              className="relative flex items-stretch rounded-lg border border-transparent hover:border-gray-100"
              onDragOver={(e) => onRowDragOver?.(e, key)}
              onDrop={(e) => onDrop?.(e, key)}
            >
              {showLineBefore ? (
                <div
                  className="pointer-events-none absolute left-1 right-2 top-0 z-10 h-[3px] -translate-y-1 rounded-full bg-orange-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
                  aria-hidden
                />
              ) : null}
              <span
                draggable
                onDragStart={(e) => onDragStart?.(e, key)}
                onDragEnd={onDragEnd}
                className="flex w-8 shrink-0 cursor-grab items-center justify-center rounded-l-lg text-gray-400 active:cursor-grabbing hover:bg-gray-100 hover:text-gray-600"
                aria-label={`Drag to reorder ${def.label}`}
              >
                <GripVertical className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1 text-sm text-gray-800 hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  checked={Boolean(columnVisibility[key])}
                  onChange={(e) => onSetVisible?.(key, e.target.checked)}
                />
                <span>{def.label}</span>
              </label>
              {showLineAfter ? (
                <div
                  className="pointer-events-none absolute bottom-0 left-1 right-2 z-10 h-[3px] translate-y-1 rounded-full bg-orange-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      <div className="mt-2 border-t border-gray-100 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-sm font-medium text-gray-700"
          onClick={onReset}
        >
          Reset to default
        </Button>
      </div>
    </div>
  );
}

export default TableColumnPicker;
