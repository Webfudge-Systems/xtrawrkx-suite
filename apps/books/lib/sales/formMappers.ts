import { formatIndianCurrency, parseIndianCurrency } from '@/lib/formatCurrency'
import type { CustomerRow, SalesDocRow, SalesInvoiceRow } from '@/lib/mock-data/sales/seeds'

const DOC_NUMBER_KEYS: Record<string, string> = {
  estimates: 'estimateNumber',
  'retainer-invoices': 'retainerInvoiceNumber',
  'sales-orders': 'orderNumber',
  'delivery-challans': 'challanNumber',
  'recurring-invoices': 'recurringName',
  'credit-notes': 'creditNoteNumber',
  'payments-received': 'paymentNumber',
}

const DOC_DATE_KEYS: Record<string, string> = {
  estimates: 'estimateDate',
  'retainer-invoices': 'invoiceDate',
  'sales-orders': 'orderDate',
  'delivery-challans': 'deliveryDate',
  'recurring-invoices': 'nextBillingDate',
  'credit-notes': 'creditDate',
  'payments-received': 'paymentDate',
}

const DOC_DUE_DATE_KEYS: Record<string, string | undefined> = {
  'retainer-invoices': 'dueDate',
}

export function resolveCustomerLabel(
  customerId: string,
  customers: CustomerRow[]
): string {
  const match = customers.find((c) => String(c.id) === customerId)
  if (match) return match.company || match.name
  const legacy: Record<string, string> = {
    acme: 'Acme Studio',
    northline: 'Northline Co',
    orbit: 'Orbit Labs',
  }
  return legacy[customerId] ?? customerId
}

export function buildSalesDocFromForm(
  moduleKey: string,
  values: Record<string, string>,
  customerLabel: string
): Omit<SalesDocRow, 'id' | 'createdAt' | 'updatedAt'> {
  const today = new Date().toISOString().slice(0, 10)
  const numberKey = DOC_NUMBER_KEYS[moduleKey] ?? 'number'
  const dateKey = DOC_DATE_KEYS[moduleKey] ?? 'date'
  const dueKey = DOC_DUE_DATE_KEYS[moduleKey]

  const rawAmount = values.amount ?? values.total ?? ''
  const parsed = parseIndianCurrency(rawAmount)
  const amount =
    parsed != null && parsed > 0
      ? formatIndianCurrency(parsed)
      : moduleKey === 'delivery-challans'
        ? '—'
        : formatIndianCurrency(0)

  return {
    number: values[numberKey]?.trim() || `${moduleKey.toUpperCase()}-${Date.now()}`,
    date: values[dateKey]?.trim() || today,
    customer: customerLabel,
    status: values.status?.trim() || 'Draft',
    amount,
    dueDate: dueKey ? values[dueKey]?.trim() || undefined : undefined,
  }
}

export function buildCustomerFromForm(
  values: Record<string, string>
): Omit<CustomerRow, 'id' | 'createdAt' | 'updatedAt'> {
  const company = values.companyName?.trim() || 'New Customer'
  return {
    name: company,
    company,
    email: values.email?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    type: (values.clientType as CustomerRow['type']) || 'DirectClient',
    currency: 'INR',
    receivables: 0,
    unusedCredits: 0,
    lifetimeBilled: 0,
    portalLink: values.portalLink?.trim() || undefined,
  }
}

export function buildInvoiceFromForm(
  values: Record<string, string>,
  customerLabel: string
): Omit<SalesInvoiceRow, 'id' | 'createdAt' | 'updatedAt'> {
  const today = new Date().toISOString().slice(0, 10)
  const amount =
    parseIndianCurrency(values.total) ??
    parseIndianCurrency(values.subtotal) ??
    0
  const status = values.status?.trim() || 'Draft'
  const balance = status.toLowerCase() === 'paid' ? 0 : amount

  return {
    number: values.invoiceNumber?.trim() || `INV-${Date.now()}`,
    date: values.invoiceDate?.trim() || today,
    dueDate: values.dueDate?.trim() || today,
    customer: customerLabel,
    status,
    amount,
    balance,
  }
}
