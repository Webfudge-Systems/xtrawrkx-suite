'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { TableRowActionMenuPortal } from '@webfudge/ui';

export default function PMRowActions({ items = [], label = 'Row actions', triggerClassName, wrapperClassName }) {
  const [anchor, setAnchor] = useState(null);

  const open = Boolean(anchor);

  const onTrigger = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setAnchor(open ? null : { top: rect.bottom + 6, left: rect.right - 176, triggerEl: event.currentTarget });
  };

  const defaultTriggerClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600';

  return (
    <div className={wrapperClassName ?? 'flex justify-end'} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={onTrigger}
        className={triggerClassName ?? defaultTriggerClass}
        aria-label={label}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <TableRowActionMenuPortal open={open} anchor={anchor} onClose={() => setAnchor(null)} menuClassName="w-44">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setAnchor(null);
                item.onClick?.();
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                item.danger
                  ? 'text-red-700 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
              }`}
              role="menuitem"
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </TableRowActionMenuPortal>
    </div>
  );
}
