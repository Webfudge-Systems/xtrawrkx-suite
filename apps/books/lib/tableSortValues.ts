import { parseIndianCurrency } from '@/lib/formatCurrency'
import type { BooksSortEntity } from '@/lib/tableSortColumns'

const STATUS_ORDER: Record<string, number> = {
  active: 1,
  connected: 1,
  posted: 1,
  accepted: 1,
  confirmed: 1,
  completed: 1,
  paid: 1,
  sent: 1,
  issued: 1,
  delivered: 1,
  draft: 2,
  manual: 2,
  paused: 3,
  overdue: 0,
}

function dateValue(value: unknown) {
  if (value == null || value === '') return null
  const t = Date.parse(String(value))
  return Number.isFinite(t) ? t : null
}

function stringValue(value: unknown) {
  if (value == null) return null
  const s = String(value).trim()
  return s ? s.toLowerCase() : null
}

function statusValue(value: unknown) {
  const key = String(value ?? '')
    .trim()
    .toLowerCase()
  return STATUS_ORDER[key] ?? 99
}

export function getItemSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'name':
      return stringValue(row.name)
    case 'sku':
      return stringValue(row.sku)
    case 'type':
      return stringValue(row.type)
    case 'rate': {
      const parsed = parseIndianCurrency(row.rate)
      return parsed ?? stringValue(row.rate)
    }
    case 'status':
      return statusValue(row.status)
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getPriceListSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'name':
      return stringValue(row.name)
    case 'code':
      return stringValue(row.code)
    case 'status':
      return statusValue(row.status)
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getInventoryAdjustmentSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'name':
      return stringValue(row.name)
    case 'reference':
      return stringValue(row.reference)
    case 'status':
      return statusValue(row.status)
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getBankAccountSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'name':
      return stringValue(row.name)
    case 'institution':
      return stringValue(row.institution)
    case 'balance': {
      const n = Number(row.balance)
      return Number.isFinite(n) ? n : null
    }
    case 'status':
      return statusValue(row.status)
    case 'lastSyncAt':
      return dateValue(row.lastSyncAt)
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getCustomerSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'name':
      return stringValue(row.name)
    case 'company':
      return stringValue(row.company)
    case 'email':
      return stringValue(row.email)
    case 'receivables': {
      const n = Number(row.receivables)
      return Number.isFinite(n) ? n : null
    }
    case 'unusedCredits': {
      const n = Number(row.unusedCredits)
      return Number.isFinite(n) ? n : null
    }
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getSalesDocSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'number':
      return stringValue(row.number)
    case 'customer':
      return stringValue(row.customer)
    case 'status':
      return statusValue(row.status)
    case 'amount':
      return parseIndianCurrency(row.amount) ?? stringValue(row.amount)
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getSalesInvoiceSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'number':
      return stringValue(row.number)
    case 'customer':
      return stringValue(row.customer)
    case 'status':
      return statusValue(row.status)
    case 'dueDate':
      return dateValue(row.dueDate)
    case 'amount': {
      const n = Number(row.amount)
      return Number.isFinite(n) ? n : null
    }
    case 'balance': {
      const n = Number(row.balance)
      return Number.isFinite(n) ? n : null
    }
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getVendorSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'name':
      return stringValue(row.name)
    case 'company':
      return stringValue(row.company)
    case 'email':
      return stringValue(row.email)
    case 'payables': {
      const n = Number(row.payables)
      return Number.isFinite(n) ? n : null
    }
    case 'unusedCredits': {
      const n = Number(row.unusedCredits)
      return Number.isFinite(n) ? n : null
    }
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getPurchaseDocSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'number':
      return stringValue(row.number)
    case 'vendor':
      return stringValue(row.vendor)
    case 'status':
      return statusValue(row.status)
    case 'amount':
      return parseIndianCurrency(row.amount) ?? stringValue(row.amount)
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getProjectSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'name':
      return stringValue(row.name)
    case 'customerName':
      return stringValue(row.customerName)
    case 'billingMethod':
      return stringValue(row.billingMethod)
    case 'unbilledAmount':
    case 'budget': {
      const n = Number(row[key])
      return Number.isFinite(n) ? n : null
    }
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getTimeEntrySortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'date':
      return dateValue(row.date)
    case 'projectName':
      return stringValue(row.projectName)
    case 'task':
      return stringValue(row.task)
    case 'hours': {
      const n = Number(row.hours)
      return Number.isFinite(n) ? n : null
    }
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getAccountantJournalSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'journalNumber':
      return stringValue(row.journalNumber)
    case 'referenceNumber':
      return stringValue(row.referenceNumber)
    case 'status':
      return statusValue(row.status)
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getChartOfAccountSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'code':
      return stringValue(row.code)
    case 'name':
      return stringValue(row.name)
    case 'type':
      return stringValue(row.type)
    case 'balance':
      return parseIndianCurrency(row.balance) ?? stringValue(row.balance)
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getCurrencyAdjustmentSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'reference':
      return stringValue(row.reference)
    case 'currency':
      return stringValue(row.currency)
    case 'status':
      return statusValue(row.status)
    case 'amount':
      return parseIndianCurrency(row.amount) ?? stringValue(row.amount)
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

export function getDocumentSortValue(row: Record<string, unknown>, key: string) {
  switch (key) {
    case 'name':
      return stringValue(row.name)
    case 'status':
      return statusValue(row.status)
    case 'updatedAt':
      return stringValue(row.updatedAt)
    case 'createdAt':
      return dateValue(row.createdAt)
    default:
      return row[key]
  }
}

const VALUE_GETTERS: Partial<Record<BooksSortEntity, (row: Record<string, unknown>, key: string) => unknown>> = {
  item: getItemSortValue,
  priceList: getPriceListSortValue,
  inventoryAdjustment: getInventoryAdjustmentSortValue,
  bankAccount: getBankAccountSortValue,
  customer: getCustomerSortValue,
  salesEstimate: getSalesDocSortValue,
  salesRetainerInvoice: getSalesDocSortValue,
  salesOrder: getSalesDocSortValue,
  deliveryChallan: getSalesDocSortValue,
  recurringInvoice: getSalesDocSortValue,
  paymentReceived: getSalesDocSortValue,
  creditNote: getSalesDocSortValue,
  salesInvoice: getSalesInvoiceSortValue,
  vendor: getVendorSortValue,
  purchaseExpense: getPurchaseDocSortValue,
  recurringExpense: getPurchaseDocSortValue,
  purchaseOrder: getPurchaseDocSortValue,
  bill: getPurchaseDocSortValue,
  paymentMade: getPurchaseDocSortValue,
  recurringBill: getPurchaseDocSortValue,
  vendorCredit: getPurchaseDocSortValue,
  project: getProjectSortValue,
  timeEntry: getTimeEntrySortValue,
  manualJournal: getAccountantJournalSortValue,
  bulkUpdate: getAccountantJournalSortValue,
  currencyAdjustment: getCurrencyAdjustmentSortValue,
  chartOfAccount: getChartOfAccountSortValue,
  transactionLock: getAccountantJournalSortValue,
  document: getDocumentSortValue,
  bankStatement: getDocumentSortValue,
}

export function getBooksSortValue(entity: BooksSortEntity, row: Record<string, unknown>, key: string) {
  const fn = VALUE_GETTERS[entity]
  if (!fn) return row[key]
  return fn(row, key)
}
