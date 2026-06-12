import { formatCurrency } from '@webfudge/utils'
import { formatKpiIndianCurrency, formatKpiIndianCurrencyFull } from '@/lib/formatCurrency'

/** Reference FX: amount in INR per 1 unit of foreign currency (mock / dashboard display). */
export const BOOKS_FX_FROM_INR: Record<string, number> = {
  INR: 1,
  USD: 83.5,
  EUR: 90.2,
}

export const BOOKS_BALANCE_CURRENCIES = ['INR', 'USD', 'EUR'] as const
export type BooksBalanceCurrency = (typeof BOOKS_BALANCE_CURRENCIES)[number]

export function convertInrToCurrency(amountInr: number, currency: string): number {
  if (!Number.isFinite(amountInr)) return 0
  const code = currency.toUpperCase()
  if (code === 'INR') return amountInr
  const rate = BOOKS_FX_FROM_INR[code]
  if (!rate || rate <= 0) return 0
  return amountInr / rate
}

function localeForCurrency(currency: string): string {
  if (currency === 'INR') return 'en-IN'
  if (currency === 'EUR') return 'de-DE'
  return 'en-US'
}

/** Compact display for balance card & KPI-style INR amounts. */
export function formatBooksBalanceDisplay(amountInr: number, currency: string): string {
  const code = currency.toUpperCase()
  const converted = convertInrToCurrency(amountInr, code)
  if (code === 'INR') return formatKpiIndianCurrency(converted)
  return formatCurrency(
    converted,
    { currency: code, minimumFractionDigits: 0, maximumFractionDigits: 0 },
    localeForCurrency(code)
  )
}

/** Full precision for hover tooltips. */
export function formatBooksBalanceFull(amountInr: number, currency: string): string {
  const code = currency.toUpperCase()
  const converted = convertInrToCurrency(amountInr, code)
  if (code === 'INR') return formatKpiIndianCurrencyFull(converted)
  return formatCurrency(
    converted,
    { currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2 },
    localeForCurrency(code)
  )
}
