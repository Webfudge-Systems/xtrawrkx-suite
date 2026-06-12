'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'books.monthly-spend-limit.v1'
const STORAGE_EVENT = 'books-monthly-spend-limit-changed'

function loadLimit(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const parsed = Number(JSON.parse(raw))
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  } catch {
    return 0
  }
}

function persistLimit(limit: number) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(limit))
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
  } catch {
    /* ignore */
  }
}

export function useBooksMonthlySpendLimit() {
  const [limit, setLimitState] = useState<number>(() => loadLimit())

  const refresh = useCallback(() => {
    setLimitState(loadLimit())
  }, [])

  useEffect(() => {
    const sync = () => refresh()
    window.addEventListener(STORAGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(STORAGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [refresh])

  const setLimit = useCallback((next: number) => {
    const normalized = Math.max(0, Math.round(next))
    persistLimit(normalized)
    setLimitState(normalized)
  }, [])

  const clearLimit = useCallback(() => {
    persistLimit(0)
    setLimitState(0)
  }, [])

  return { limit, setLimit, clearLimit, hasLimit: limit > 0 }
}
