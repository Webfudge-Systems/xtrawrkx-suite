'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, Star, X } from 'lucide-react'

export default function DepartmentPillMultiSelect({
  departments,
  selectedIds,
  primaryId,
  onToggle,
  onPrimaryChange,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (rootRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!departments.length) {
    return <p className="text-sm text-gray-500">No departments yet. Create departments first.</p>
  }

  const selected = departments.filter((d) => selectedIds.includes(d.id))
  const available = departments.filter((d) => !selectedIds.includes(d.id))

  return (
    <div ref={rootRef} className="relative">
      <div
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
        className={clsx(
          'flex min-h-[42px] w-full cursor-pointer items-start gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm',
          'focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20',
          open && 'border-orange-500 ring-2 ring-orange-500/20'
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selected.length === 0 ? (
            <span className="px-1 py-1 text-gray-400">Select departments…</span>
          ) : (
            selected.map((dept) => {
              const isPrimary = primaryId === dept.id
              const showPrimaryControl = selected.length > 1
              return (
                <span
                  key={dept.id}
                  className={clsx(
                    'inline-flex max-w-full items-center gap-0.5 rounded-full py-0.5 pl-2 pr-0.5 text-xs font-medium',
                    isPrimary
                      ? 'bg-orange-100 text-orange-900 ring-1 ring-orange-300'
                      : 'bg-gray-100 text-gray-800'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {showPrimaryControl ? (
                    <button
                      type="button"
                      title={isPrimary ? 'Primary department' : 'Set as primary'}
                      onClick={() => onPrimaryChange(dept.id)}
                      className={clsx(
                        'shrink-0 rounded-full p-0.5 transition',
                        isPrimary ? 'text-orange-600' : 'text-gray-400 hover:text-orange-600'
                      )}
                    >
                      <Star className={clsx('h-3 w-3', isPrimary && 'fill-current')} />
                    </button>
                  ) : null}
                  <span className="truncate">{dept.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${dept.name}`}
                    onClick={() => onToggle(dept.id)}
                    className="shrink-0 rounded-full p-0.5 text-gray-500 hover:bg-black/5 hover:text-gray-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })
          )}
        </div>
        <ChevronDown
          className={clsx('mt-1 h-4 w-4 shrink-0 text-gray-400 transition', open && 'rotate-180')}
          aria-hidden
        />
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {available.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">All departments selected</li>
          ) : (
            available.map((dept) => (
              <li key={dept.id}>
                <button
                  type="button"
                  role="option"
                  className="w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-orange-50 hover:text-orange-900"
                  onClick={() => {
                    onToggle(dept.id)
                    setOpen(available.length > 1)
                  }}
                >
                  {dept.name}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {selected.length > 1 ? (
        <p className="mt-1 text-xs text-gray-500">Click the star on a pill to set the primary department.</p>
      ) : null}
    </div>
  )
}
