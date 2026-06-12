import { formatCurrencyCompact } from '@webfudge/utils'

const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Parse ₹ strings, grouped numbers, or plain numeric input into rupees. */
export function parseIndianCurrency(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const cleaned = trimmed.replace(/[₹,\s]/g, '')
  const amount = Number(cleaned)
  return Number.isFinite(amount) ? amount : null
}

/** Full Indian grouping, e.g. ₹7,00,000.00 */
export function formatIndianCurrency(value: unknown, fallback = '₹0.00'): string {
  const amount = parseIndianCurrency(value)
  if (amount === null) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    return fallback
  }
  return INR_FORMATTER.format(amount)
}

/** Compact label for large amounts, e.g. ₹7.00 Lakh or ₹1.25 Cr */
export function formatIndianCurrencyCompact(value: unknown): string | null {
  const amount = parseIndianCurrency(value)
  if (amount === null || Math.abs(amount) < 100_000) return null
  return formatCurrencyCompact(amount)
}

const KPI_INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/**
 * KPI-friendly INR: full grouping below ₹1 Lakh (e.g. ₹1,000), compact Lakh/Cr at or above.
 */
export function formatKpiIndianCurrency(value: unknown, fallback = '₹0'): string {
  const amount = parseIndianCurrency(value)
  if (amount === null) return fallback
  if (Math.abs(amount) >= 100_000) {
    const decimals = Math.abs(amount) >= 10_000_000 ? 2 : 2
    return formatCurrencyCompact(amount, { decimals })
      .replace(/\sCr$/, ' Crore')
      .replace(/\.?0+(?=\s)/, '')
  }
  return KPI_INR_FORMATTER.format(amount)
}

/** Full INR label for tooltips when KPI shows compact Lakh/Crore. */
export function formatKpiIndianCurrencyFull(value: unknown, fallback = '₹0'): string {
  const amount = parseIndianCurrency(value)
  if (amount === null) return fallback
  return KPI_INR_FORMATTER.format(amount)
}

/** Plain number for edit inputs (no symbol, keeps decimals). */
export function formatIndianCurrencyInput(value: unknown): string {
  const amount = parseIndianCurrency(value)
  if (amount === null) return typeof value === 'string' ? value : ''
  return String(amount)
}
