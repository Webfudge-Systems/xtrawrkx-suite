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
import { logBooksRecordActivity } from './booksActivityLog'

type RecordBase = { id: number; createdAt: string; updatedAt?: string }

export type BooksRecordStore<T extends RecordBase> = {
  records: T[]
  getById: (id: number | string) => T | null
  updateRecord: (id: number | string, patch: Partial<T>) => void
  deleteRecord: (id: number | string) => void
  createRecord: (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => T
  resetRecords: () => void
}

export function createBooksRecordStore<T extends RecordBase>(
  storageKey: string,
  storageEvent: string,
  seed: T[]
) {
  function load(): T[] {
    if (typeof window === 'undefined') return [...seed]
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (!raw) return [...seed]
      const parsed = JSON.parse(raw) as T[]
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...seed]
    } catch {
      return [...seed]
    }
  }

  function persist(records: T[]) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(records))
      window.dispatchEvent(new CustomEvent(storageEvent))
    } catch {
      /* ignore */
    }
  }

  const Context = createContext<BooksRecordStore<T> | null>(null)

  function Provider({ children }: { children: ReactNode }) {
    const [records, setRecords] = useState<T[]>(() => load())

    useEffect(() => {
      const sync = () => setRecords(load())
      window.addEventListener(storageEvent, sync)
      window.addEventListener('storage', sync)
      return () => {
        window.removeEventListener(storageEvent, sync)
        window.removeEventListener('storage', sync)
      }
    }, [])

    const getById = useCallback(
      (id: number | string) => {
        const num = Number(id)
        return records.find((row) => row.id === num) ?? null
      },
      [records]
    )

    const updateRecord = useCallback((id: number | string, patch: Partial<T>) => {
      const num = Number(id)
      setRecords((prev) => {
        const next = prev.map((row) =>
          row.id === num ? ({ ...row, ...patch, updatedAt: new Date().toISOString() } as T) : row
        )
        persist(next)
        const updated = next.find((row) => row.id === num)
        if (updated) {
          logBooksRecordActivity(storageKey, 'updated', updated as Record<string, unknown>)
        }
        return next
      })
    }, [storageKey])

    const deleteRecord = useCallback((id: number | string) => {
      const num = Number(id)
      setRecords((prev) => {
        const removed = prev.find((row) => row.id === num)
        if (removed) {
          logBooksRecordActivity(storageKey, 'deleted', removed as Record<string, unknown>)
        }
        const next = prev.filter((row) => row.id !== num)
        persist(next)
        return next
      })
    }, [storageKey])

    const createRecord = useCallback(
      (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T => {
        const now = new Date().toISOString()
        const nextId = records.reduce((max, row) => Math.max(max, row.id), 0) + 1
        const created = { ...data, id: nextId, createdAt: now, updatedAt: now } as T
        const next = [...records, created]
        persist(next)
        setRecords(next)
        logBooksRecordActivity(storageKey, 'created', created as Record<string, unknown>)
        return created
      },
      [records, storageKey]
    )

    const resetRecords = useCallback(() => {
      const next = [...seed]
      persist(next)
      setRecords(next)
    }, [])

    const value = useMemo(
      () => ({ records, getById, updateRecord, deleteRecord, createRecord, resetRecords }),
      [records, getById, updateRecord, deleteRecord, createRecord, resetRecords]
    )

    return <Context.Provider value={value}>{children}</Context.Provider>
  }

  function useStore() {
    const ctx = useContext(Context)
    if (!ctx) {
      throw new Error(`Store hook must be used within ${storageKey} provider`)
    }
    return ctx
  }

  return { Provider, useStore }
}
