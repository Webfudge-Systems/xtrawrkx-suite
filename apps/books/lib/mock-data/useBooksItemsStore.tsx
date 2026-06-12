'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_ITEMS, type ItemRow } from './items'
import { formatIndianCurrency } from '@/lib/formatCurrency'
import { logBooksRecordActivity } from './booksActivityLog'

const STORAGE_KEY = 'books.mock-items.v1'

function loadItems(): ItemRow[] {
  if (typeof window === 'undefined') return [...MOCK_ITEMS]
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...MOCK_ITEMS]
    const parsed = JSON.parse(raw) as ItemRow[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_ITEMS]
  } catch {
    return [...MOCK_ITEMS]
  }
}

function persistItems(items: ItemRow[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new CustomEvent('books-items-storage'))
  } catch {
    /* ignore */
  }
}

type BooksItemsStoreValue = {
  items: ItemRow[]
  getById: (id: number | string) => ItemRow | null
  updateItem: (id: number | string, patch: Partial<ItemRow>) => void
  deleteItem: (id: number | string) => void
  createItem: (data: Omit<ItemRow, 'id' | 'createdAt' | 'updatedAt'>) => ItemRow
  resetItems: () => void
}

const BooksItemsStoreContext = createContext<BooksItemsStoreValue | null>(null)

export function BooksItemsStoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemRow[]>(() => loadItems())

  useEffect(() => {
    const sync = () => setItems(loadItems())
    window.addEventListener('books-items-storage', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('books-items-storage', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const getById = useCallback(
    (id: number | string) => {
      const num = Number(id)
      return items.find((row) => row.id === num) ?? null
    },
    [items]
  )

  const updateItem = useCallback((id: number | string, patch: Partial<ItemRow>) => {
    const num = Number(id)
    const normalizedPatch =
      patch.rate != null ? { ...patch, rate: formatIndianCurrency(patch.rate, String(patch.rate)) } : patch
    setItems((prev) => {
      const next = prev.map((row) =>
        row.id === num ? { ...row, ...normalizedPatch, updatedAt: new Date().toISOString() } : row
      )
      persistItems(next)
      const updated = next.find((row) => row.id === num)
      if (updated) {
        logBooksRecordActivity(STORAGE_KEY, 'updated', updated as Record<string, unknown>)
      }
      return next
    })
  }, [])

  const deleteItem = useCallback((id: number | string) => {
    const num = Number(id)
    setItems((prev) => {
      const removed = prev.find((row) => row.id === num)
      if (removed) {
        logBooksRecordActivity(STORAGE_KEY, 'deleted', removed as Record<string, unknown>)
      }
      const next = prev.filter((row) => row.id !== num)
      persistItems(next)
      return next
    })
  }, [])

  const createItem = useCallback((data: Omit<ItemRow, 'id' | 'createdAt' | 'updatedAt'>): ItemRow => {
    const now = new Date().toISOString()
    const nextId = items.reduce((max, row) => Math.max(max, row.id), 0) + 1
    const created: ItemRow = {
      ...data,
      rate: formatIndianCurrency(data.rate, data.rate),
      id: nextId,
      createdAt: now,
      updatedAt: now,
    }
    const next = [...items, created]
    persistItems(next)
    setItems(next)
    logBooksRecordActivity(STORAGE_KEY, 'created', created as Record<string, unknown>)
    return created
  }, [items])

  const resetItems = useCallback(() => {
    const next = [...MOCK_ITEMS]
    persistItems(next)
    setItems(next)
  }, [])

  const value = useMemo(
    () => ({ items, getById, updateItem, deleteItem, createItem, resetItems }),
    [items, getById, updateItem, deleteItem, createItem, resetItems]
  )

  return <BooksItemsStoreContext.Provider value={value}>{children}</BooksItemsStoreContext.Provider>
}

export function useBooksItemsStore() {
  const ctx = useContext(BooksItemsStoreContext)
  if (!ctx) {
    throw new Error('useBooksItemsStore must be used within BooksItemsStoreProvider')
  }
  return ctx
}

export function formatItemUnit(unit?: string) {
  if (!unit) return '—'
  const map: Record<string, string> = {
    hour: 'Per hour',
    fixed: 'Fixed price',
    month: 'Per month',
    unit: 'Per unit',
  }
  return map[unit] ?? unit
}
