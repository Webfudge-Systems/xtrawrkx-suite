'use client'

import type { DragEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { Button } from '@webfudge/ui'

type Col = { key: string; label?: string; title?: string }

function colLabel(c: Col) {
  const raw = c.label ?? c.title ?? c.key
  return typeof raw === 'string' ? raw : String(c.key)
}

function defaultVisibility(keys: string[]) {
  return keys.reduce<Record<string, boolean>>((acc, k) => {
    acc[k] = true
    return acc
  }, {})
}

function loadVis(storageKey: string, keys: string[]) {
  const base = defaultVisibility(keys)
  if (typeof window === 'undefined') return base
  try {
    const raw = window.localStorage.getItem(`${storageKey}.visibility`)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return { ...base, ...parsed }
  } catch {
    return base
  }
}

function loadOrder(storageKey: string, reorderable: string[]) {
  if (typeof window === 'undefined') return [...reorderable]
  try {
    const raw = window.localStorage.getItem(`${storageKey}.order`)
    if (!raw) return [...reorderable]
    const parsed = JSON.parse(raw) as string[]
    if (!Array.isArray(parsed)) return [...reorderable]
    const valid = new Set(reorderable)
    const ordered = parsed.filter((k) => valid.has(k))
    const missing = reorderable.filter((k) => !ordered.includes(k))
    return [...ordered, ...missing]
  } catch {
    return [...reorderable]
  }
}

function persistVis(storageKey: string, vis: Record<string, boolean>) {
  try {
    window.localStorage.setItem(`${storageKey}.visibility`, JSON.stringify(vis))
  } catch {
    /* ignore */
  }
}

function persistOrder(storageKey: string, order: string[]) {
  try {
    window.localStorage.setItem(`${storageKey}.order`, JSON.stringify(order))
  } catch {
    /* ignore */
  }
}

export function useBooksTableColumnPicker({ columns, storageKey }: { columns: Col[]; storageKey: string }) {
  const keys = useMemo(() => (columns || []).map((c) => c?.key).filter(Boolean) as string[], [columns])
  const pinnedKey = keys[0]
  const reorderableKeys = useMemo(() => keys.slice(1), [keys])

  const [columnPickerOpen, setColumnPickerOpen] = useState(false)
  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => defaultVisibility(keys))
  const [order, setOrder] = useState<string[]>(() => [...reorderableKeys])
  const [columnDropIndicator, setColumnDropIndicator] = useState<{ targetKey: string; place: 'before' | 'after' } | null>(
    null
  )

  const columnDragKeyRef = useRef<string | null>(null)
  const columnDropIndicatorRef = useRef<{ targetKey: string; place: 'before' | 'after' } | null>(null)
  const toolbarRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setVisibility(loadVis(storageKey, keys))
    setOrder(loadOrder(storageKey, reorderableKeys))
  }, [storageKey, keys, reorderableKeys])

  useEffect(() => {
    if (!columnPickerOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setColumnPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [columnPickerOpen])

  const byKey = useMemo(() => {
    const m: Record<string, Col> = {}
    for (const c of columns || []) {
      if (c?.key) m[c.key] = c
    }
    return m
  }, [columns])

  const visibleColumns = useMemo(() => {
    const out: Col[] = []
    if (pinnedKey && visibility[pinnedKey] !== false && byKey[pinnedKey]) out.push(byKey[pinnedKey])
    for (const k of order) {
      if (k === pinnedKey) continue
      if (visibility[k] !== false && byKey[k]) out.push(byKey[k])
    }
    return out
  }, [byKey, order, pinnedKey, visibility])

  const setColumnVisible = useCallback(
    (key: string, visible: boolean) => {
      setVisibility((prev) => {
        const next = { ...prev, [key]: visible }
        const onCount = keys.filter((k) => next[k] !== false).length
        if (onCount === 0) return prev
        persistVis(storageKey, next)
        return next
      })
    },
    [keys, storageKey]
  )

  const handleColumnDragStart = useCallback((e: DragEvent, key: string) => {
    columnDragKeyRef.current = key
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', key)
    const row = (e.currentTarget as HTMLElement).closest('[data-column-row]')
    if (row) row.classList.add('opacity-60')
  }, [])

  const handleColumnDragEnd = useCallback((e: DragEvent) => {
    columnDragKeyRef.current = null
    columnDropIndicatorRef.current = null
    setColumnDropIndicator(null)
    const row = (e.currentTarget as HTMLElement).closest('[data-column-row]')
    if (row) row.classList.remove('opacity-60')
  }, [])

  const handleColumnRowDragOver = useCallback((e: DragEvent, key: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const fromKey = columnDragKeyRef.current || e.dataTransfer.getData('text/plain')
    if (!fromKey || fromKey === key) {
      columnDropIndicatorRef.current = null
      setColumnDropIndicator(null)
      return
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const place: 'before' | 'after' =
      e.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
    const hint = { targetKey: key, place }
    columnDropIndicatorRef.current = hint
    setColumnDropIndicator(hint)
  }, [])

  const handleColumnListDragLeave = useCallback((e: DragEvent) => {
    const related = e.relatedTarget as Node | null
    if (related && (e.currentTarget as HTMLElement).contains(related)) return
    columnDropIndicatorRef.current = null
    setColumnDropIndicator(null)
  }, [])

  const handleColumnDrop = useCallback(
    (e: DragEvent, targetKey: string) => {
      e.preventDefault()
      const fromKey = columnDragKeyRef.current || e.dataTransfer.getData('text/plain')
      const hint = columnDropIndicatorRef.current
      const place = hint?.targetKey === targetKey ? hint.place : 'before'
      columnDropIndicatorRef.current = null
      setColumnDropIndicator(null)
      if (!fromKey || fromKey === targetKey || fromKey === pinnedKey || targetKey === pinnedKey) return
      setOrder((prev) => {
        const next = [...prev]
        const fi = next.indexOf(fromKey)
        const ti0 = next.indexOf(targetKey)
        if (fi === -1 || ti0 === -1) return prev
        next.splice(fi, 1)
        const ti = next.indexOf(targetKey)
        const insertAt = place === 'after' ? ti + 1 : ti
        next.splice(insertAt, 0, fromKey)
        persistOrder(storageKey, next)
        return next
      })
    },
    [pinnedKey, storageKey]
  )

  const resetColumnTablePreferences = useCallback(() => {
    const vis = defaultVisibility(keys)
    const ord = [...reorderableKeys]
    setVisibility(vis)
    setOrder(ord)
    columnDropIndicatorRef.current = null
    setColumnDropIndicator(null)
    persistVis(storageKey, vis)
    persistOrder(storageKey, ord)
  }, [keys, reorderableKeys, storageKey])

  const toggleColumnPicker = useCallback(() => {
    setColumnPickerOpen((o) => !o)
  }, [])

  const dropdown =
    columnPickerOpen && keys.length > 0 ? (
      <div
        className="absolute right-0 top-full z-40 mt-2 w-[min(100vw-2rem,20rem)] rounded-xl border border-[color:var(--books-border)] bg-[var(--books-bg-elevated)] p-2.5 shadow-[var(--books-shell-shadow)]"
        role="dialog"
        aria-label="Table columns"
      >
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--books-text-secondary)]">
          Columns
        </p>
        <p className="mb-2 text-xs leading-snug text-[var(--books-text-tertiary)]">
          First column stays first. Drag the grip to reorder; an orange line shows where the row will land.
        </p>
        <ul
          className="max-h-[min(51vh,18.75rem)] space-y-0 overflow-y-auto pr-1"
          onDragLeave={handleColumnListDragLeave}
        >
          {pinnedKey ? (
            <li data-column-row className="relative flex items-stretch rounded-lg border border-transparent">
              <span
                className="flex w-8 shrink-0 items-center justify-center text-[var(--books-text-tertiary)]"
                aria-hidden
                title="Fixed order"
              >
                —
              </span>
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1 text-sm text-[var(--books-text-primary)] hover:bg-[var(--books-bg-card)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-[color:var(--books-border-em)] text-[var(--books-orange-text)] focus:ring-[var(--books-orange-text)]"
                  checked={Boolean(visibility[pinnedKey])}
                  onChange={(e) => setColumnVisible(pinnedKey, e.target.checked)}
                />
                <span>{colLabel(byKey[pinnedKey] ?? { key: pinnedKey })}</span>
              </label>
            </li>
          ) : null}
          {order.map((key) => {
            const def = byKey[key]
            if (!def) return null
            const showLineBefore =
              columnDropIndicator?.targetKey === key && columnDropIndicator.place === 'before'
            const showLineAfter = columnDropIndicator?.targetKey === key && columnDropIndicator.place === 'after'
            return (
              <li
                key={key}
                data-column-row
                className="relative flex items-stretch rounded-lg border border-transparent hover:border-[color:var(--books-border)]"
                onDragOver={(e) => handleColumnRowDragOver(e, key)}
                onDrop={(e) => handleColumnDrop(e, key)}
              >
                {showLineBefore ? (
                  <div
                    className="pointer-events-none absolute left-1 right-2 top-0 z-10 h-[3px] -translate-y-1 rounded-full bg-[var(--books-orange-text)] shadow-[0_0_0_1px_var(--books-bg-elevated)]"
                    aria-hidden
                  />
                ) : null}
                <span
                  draggable
                  onDragStart={(e) => handleColumnDragStart(e, key)}
                  onDragEnd={handleColumnDragEnd}
                  className="flex w-8 shrink-0 cursor-grab items-center justify-center rounded-l-lg text-[var(--books-text-tertiary)] active:cursor-grabbing hover:bg-[var(--books-bg-card)] hover:text-[var(--books-text-secondary)]"
                  aria-label={`Drag to reorder ${colLabel(def)}`}
                >
                  <GripVertical className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1 text-sm text-[var(--books-text-primary)] hover:bg-[var(--books-bg-card)]">
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-[color:var(--books-border-em)] text-[var(--books-orange-text)] focus:ring-[var(--books-orange-text)]"
                    checked={Boolean(visibility[key])}
                    onChange={(e) => setColumnVisible(key, e.target.checked)}
                  />
                  <span>{colLabel(def)}</span>
                </label>
                {showLineAfter ? (
                  <div
                    className="pointer-events-none absolute bottom-0 left-1 right-2 z-10 h-[3px] translate-y-1 rounded-full bg-[var(--books-orange-text)] shadow-[0_0_0_1px_var(--books-bg-elevated)]"
                    aria-hidden
                  />
                ) : null}
              </li>
            )
          })}
        </ul>
        <div className="mt-2 border-t border-[color:var(--books-border)] pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-[color:var(--books-orange-text)] text-sm font-medium text-[var(--books-orange-text)] hover:bg-[var(--books-orange-bg)]"
            onClick={resetColumnTablePreferences}
          >
            Reset to default
          </Button>
        </div>
      </div>
    ) : null

  return {
    visibleColumns,
    toolbarRef,
    columnPickerOpen,
    setColumnPickerOpen,
    onColumnVisibilityClick: toggleColumnPicker,
    columnPickerDropdown: dropdown,
  }
}
