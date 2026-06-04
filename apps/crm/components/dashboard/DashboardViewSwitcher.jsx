'use client'

import { clsx } from 'clsx'

/**
 * Segmented control for Personal / Sales / Manager dashboard views.
 */
export default function DashboardViewSwitcher({ views = [], activeId, onChange, className = '' }) {
  if (!views || views.length <= 1) return null

  return (
    <div
      role="tablist"
      aria-label="Dashboard view"
      className={clsx(
        'inline-flex flex-wrap items-center gap-0.5 rounded-full border border-gray-200/95 bg-gradient-to-b from-white to-gray-50/90 p-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.04]',
        className
      )}
    >
      {views.map((view) => {
        const active = view.id === activeId
        return (
          <button
            key={view.id}
            type="button"
            role="tab"
            aria-selected={active}
            title={view.description}
            onClick={() => onChange(view.id)}
            className={clsx(
              'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200',
              active
                ? 'bg-[#FF7A20] text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)]'
                : 'text-gray-600 hover:bg-white hover:text-gray-900'
            )}
          >
            {view.label}
          </button>
        )
      })}
    </div>
  )
}
