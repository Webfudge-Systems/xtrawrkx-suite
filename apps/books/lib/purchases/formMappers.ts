import { formatIndianCurrency, parseIndianCurrency } from '@/lib/formatCurrency'
import type { PurchaseDocRow, VendorRow } from '@/lib/mock-data/purchases/seeds'

const DOC_NUMBER_KEYS: Record<string, string> = {
  expenses: 'expenseNumber',
  'recurring-expenses': 'recurringName',
  'purchase-orders': 'poNumber',
  bills: 'billNumber',
  'payments-made': 'paymentNumber',
  'recurring-bills': 'recurringName',
  'vendor-credits': 'creditNumber',
}

const DOC_DATE_KEYS: Record<string, string> = {
  expenses: 'expenseDate',
  'recurring-expenses': 'nextDate',
  'purchase-orders': 'orderDate',
  bills: 'billDate',
  'payments-made': 'paymentDate',
  'recurring-bills': 'nextDate',
  'vendor-credits': 'creditDate',
}

export function resolveVendorLabel(vendorId: string, vendors: VendorRow[]): string {
  const match = vendors.find((v) => String(v.id) === vendorId)
  if (match) return match.company || match.name
  return vendorId
}

export function buildPurchaseDocFromForm(
  moduleKey: string,
  values: Record<string, string>,
  vendorLabel: string
): Omit<PurchaseDocRow, 'id' | 'createdAt' | 'updatedAt'> {
  const today = new Date().toISOString().slice(0, 10)
  const numberKey = DOC_NUMBER_KEYS[moduleKey] ?? 'number'
  const dateKey = DOC_DATE_KEYS[moduleKey] ?? 'date'

  const rawAmount = values.amount ?? values.total ?? ''
  const parsed = parseIndianCurrency(rawAmount)
  const amount = parsed != null && parsed > 0 ? formatIndianCurrency(parsed) : formatIndianCurrency(0)

  return {
    number: values[numberKey]?.trim() || `${moduleKey.toUpperCase()}-${Date.now()}`,
    date: values[dateKey]?.trim() || today,
    vendor: vendorLabel || '—',
    status: values.status?.trim() || 'Draft',
    amount,
  }
}

export function buildVendorFromForm(
  values: Record<string, string>
): Omit<VendorRow, 'id' | 'createdAt' | 'updatedAt'> {
  const company = values.companyName?.trim() || values.name?.trim() || 'New Vendor'
  return {
    name: values.name?.trim() || company,
    company,
    email: values.email?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    payables: 0,
    unusedCredits: 0,
  }
}
