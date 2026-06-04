'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { Search, X } from 'lucide-react'

/**
 * Command-palette style search shell (portaled to document.body).
 * Use for workspace-wide search in PM/CRM headers — avoids backdrop-filter
 * ancestors clipping a fixed overlay to the header card only.
 */
export function WorkspaceSearchModal({
  isOpen,
  onClose,
  query,
  onQueryChange,
  placeholder = 'Search...',
  children,
  footer,
  inputRef,
  maxWidth = 'max-w-2xl',
  'aria-label': ariaLabel = 'Search workspace',
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !mounted || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[min(10vh,4.5rem)] sm:pt-20"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={clsx(
          'relative flex w-full flex-col overflow-hidden rounded-3xl bg-[#F1F1F1]',
          'shadow-[0_24px_64px_-16px_rgba(15,23,42,0.22),0_0_0_1px_rgba(15,23,42,0.06)]',
          maxWidth
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-300 px-5 py-4">
          <Search className="h-5 w-5 shrink-0 text-gray-400" strokeWidth={1.75} aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-base text-slate-900 placeholder:text-gray-400 focus:outline-none"
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-200/80 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="hidden shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 sm:inline"
          >
            Esc
          </button>
        </div>

        <div className="min-h-0 max-h-[min(26rem,55vh)] overflow-y-auto">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-gray-300 bg-white/70 px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  )
}

export default WorkspaceSearchModal
