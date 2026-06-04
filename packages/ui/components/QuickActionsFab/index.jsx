'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, ChevronRight, X } from 'lucide-react'

/**
 * Shared Quick Actions FAB base.
 *
 * @param {{
 *   actions: Array<{
 *     label: string,
 *     icon: import('react').ComponentType,
 *     onClick: () => void,
 *     color?: string,
 *     bgColor?: string,
 *     borderColor?: string,
 *   }>,
 *   menuWidth?: string,
 * }} props
 */
export function QuickActionsFab({ actions = [], menuWidth = 'w-52' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [open])

  if (actions.length === 0) return null

  return (
    <div ref={rootRef} className="fixed bottom-5 right-5 z-[200] flex flex-col items-end gap-2">
      {open && (
        <div
          className={`${menuWidth} max-h-[min(70vh,24rem)] overflow-hidden overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-2xl`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Quick actions
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-1.5">
            {actions.map((item) => {
              const QIcon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    item.onClick()
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${item.bgColor ?? 'bg-gray-50'} ${item.borderColor ?? 'border-gray-200'}`}
                  >
                    <QIcon className={`h-4 w-4 ${item.color ?? 'text-gray-600'}`} />
                  </div>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-xl ${
          open ? 'rotate-45' : ''
        }`}
        aria-expanded={open}
        aria-label={open ? 'Close quick actions' : 'Quick actions'}
        title="Quick actions"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </div>
  )
}
