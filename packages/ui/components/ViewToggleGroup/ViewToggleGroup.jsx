'use client';

import { clsx } from 'clsx';

/**
 * Segmented control chrome for table / kanban / list view icons (used after TabsWithActions tabs).
 */
export function ViewToggleGroup({ children, className, 'aria-label': ariaLabel = 'View layout' }) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-full border border-gray-200/95 bg-gradient-to-b from-white to-gray-50/90 p-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_2px_8px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.04]',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Single icon toggle inside ViewToggleGroup — no outer border (group supplies chrome).
 */
export function ViewToggleButton({ active, onClick, title, children, className, ...rest }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200',
        active
          ? 'bg-[#FF7A20] text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
          : 'text-gray-500 hover:bg-white hover:text-gray-800 active:scale-[0.98]',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export default ViewToggleGroup;
