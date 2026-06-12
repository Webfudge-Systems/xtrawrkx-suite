'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export type BooksActivityAction = 'created' | 'updated' | 'deleted'

export type BooksActivityEntry = {
  id: string
  action: BooksActivityAction
  module: string
  entityLabel: string
  href?: string
  amount?: number
  at: string
}

const STORAGE_KEY = 'books.activity-log.v1'
const STORAGE_EVENT = 'books-activity-log-changed'
const MAX_ENTRIES = 150

/** Maps mock store keys to detail-page routes. */
const STORAGE_KEY_HREF: Record<string, (id: number | string) => string> = {
  'books.mock-items.v1': (id) => `/items/all/${id}`,
  'books.mock-price-lists.v1': (id) => `/items/price-lists/${id}`,
  'books.mock-inventory-adjustments.v1': (id) => `/items/inventory-adjustments/${id}`,
  'books.mock-bank-accounts.v1': (id) => `/banking/${id}`,
  'books.mock-estimates.v1': (id) => `/sales/estimates/${id}`,
  'books.mock-retainer-invoices.v1': (id) => `/sales/retainer-invoices/${id}`,
  'books.mock-sales-orders.v1': (id) => `/sales/sales-orders/${id}`,
  'books.mock-delivery-challans.v1': (id) => `/sales/delivery-challans/${id}`,
  'books.mock-recurring-invoices.v1': (id) => `/sales/recurring-invoices/${id}`,
  'books.mock-payments-received.v1': (id) => `/sales/payments-received/${id}`,
  'books.mock-credit-notes.v1': (id) => `/sales/credit-notes/${id}`,
  'books.mock-customers.v1': (id) => `/sales/customers/${id}`,
  'books.mock-sales-invoices.v1': (id) => `/sales/invoices/${id}`,
  'books.mock-vendors.v1': (id) => `/purchases/vendors/${id}`,
  'books.mock-expenses.v1': (id) => `/purchases/expenses/${id}`,
  'books.mock-recurring-expenses.v1': (id) => `/purchases/recurring-expenses/${id}`,
  'books.mock-purchase-orders.v1': (id) => `/purchases/purchase-orders/${id}`,
  'books.mock-bills.v1': (id) => `/purchases/bills/${id}`,
  'books.mock-payments-made.v1': (id) => `/purchases/payments-made/${id}`,
  'books.mock-recurring-bills.v1': (id) => `/purchases/recurring-bills/${id}`,
  'books.mock-vendor-credits.v1': (id) => `/purchases/vendor-credits/${id}`,
  'books.mock-projects.v1': (id) => `/time-tracking/projects/${id}`,
  'books.mock-time-entries.v1': (id) => `/time-tracking/timesheet/${id}`,
  'books.mock-manual-journals.v1': (id) => `/accountant/manual-journals/${id}`,
  'books.mock-bulk-update.v1': (id) => `/accountant/bulk-update/${id}`,
  'books.mock-transaction-locking.v1': (id) => `/accountant/transaction-locking/${id}`,
  'books.mock-chart-of-accounts.v1': (id) => `/accountant/chart-of-accounts/${id}`,
  'books.mock-currency-adjustments.v1': (id) => `/accountant/currency-adjustments/${id}`,
  'books.mock-documents.v1': (id) => `/documents/${id}`,
  'books.mock-bank-statements.v1': (id) => `/documents/bank-statements/${id}`,
}

function loadEntries(): BooksActivityEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as BooksActivityEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistEntries(entries: BooksActivityEntry[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)))
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
  } catch {
    /* ignore */
  }
}

export function moduleLabelFromStorageKey(storageKey: string): string {
  const slug = storageKey.replace(/^books\.mock-/, '').replace(/\.v\d+$/, '')
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function inferEntityLabel(record: Record<string, unknown>): string {
  const keys = ['name', 'number', 'company', 'title', 'reference', 'accountName', 'sku', 'displayName']
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  const id = record.id
  return id != null ? `Record #${id}` : 'Record'
}

function inferAmount(record: Record<string, unknown>): number | undefined {
  const keys = ['total', 'amount', 'balance', 'balanceDue']
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'number' && !Number.isNaN(value)) return value
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''))
      if (!Number.isNaN(parsed)) return parsed
    }
  }
  return undefined
}

export function inferHref(storageKey: string, record: Record<string, unknown>): string | undefined {
  const builder = STORAGE_KEY_HREF[storageKey]
  if (!builder || record.id == null) return undefined
  return builder(record.id as number | string)
}

export function appendBooksActivity(
  entry: Omit<BooksActivityEntry, 'id' | 'at'> & { at?: string }
): BooksActivityEntry {
  const created: BooksActivityEntry = {
    ...entry,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: entry.at ?? new Date().toISOString(),
  }
  const next = [created, ...loadEntries()].slice(0, MAX_ENTRIES)
  persistEntries(next)
  return created
}

export function logBooksRecordActivity(
  storageKey: string,
  action: BooksActivityAction,
  record: Record<string, unknown>
) {
  if (typeof window === 'undefined') return
  appendBooksActivity({
    action,
    module: moduleLabelFromStorageKey(storageKey),
    entityLabel: inferEntityLabel(record),
    href: inferHref(storageKey, record),
    amount: inferAmount(record),
  })
}

export function useBooksActivityLog(limit = 20) {
  const [entries, setEntries] = useState<BooksActivityEntry[]>(() => loadEntries())

  const refresh = useCallback(() => {
    setEntries(loadEntries())
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

  return useMemo(() => entries.slice(0, limit), [entries, limit])
}
