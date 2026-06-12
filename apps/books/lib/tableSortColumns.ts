export const ITEM_SORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'type', label: 'Type' },
  { key: 'rate', label: 'Rate' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
]

export const PRICE_LIST_SORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
]

export const INVENTORY_ADJUSTMENT_SORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'reference', label: 'Reference' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
]

export const BANK_ACCOUNT_SORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'institution', label: 'Bank / Source' },
  { key: 'balance', label: 'Balance' },
  { key: 'status', label: 'Status' },
  { key: 'lastSyncAt', label: 'Last Sync' },
  { key: 'createdAt', label: 'Created' },
]

export const CUSTOMER_SORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'email', label: 'Email' },
  { key: 'receivables', label: 'Receivables' },
  { key: 'unusedCredits', label: 'Unused Credits' },
  { key: 'createdAt', label: 'Created' },
]

export const SALES_DOC_SORT_COLUMNS = [
  { key: 'number', label: 'Number' },
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount' },
  { key: 'createdAt', label: 'Created' },
]

export const SALES_INVOICE_SORT_COLUMNS = [
  { key: 'number', label: 'Invoice #' },
  { key: 'customer', label: 'Customer' },
  { key: 'status', label: 'Status' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'amount', label: 'Amount' },
  { key: 'balance', label: 'Balance' },
  { key: 'createdAt', label: 'Created' },
]

export const PURCHASE_DOC_SORT_COLUMNS = [
  { key: 'number', label: 'Number' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount' },
  { key: 'createdAt', label: 'Created' },
]

export const VENDOR_SORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'company', label: 'Company' },
  { key: 'email', label: 'Email' },
  { key: 'payables', label: 'Payables' },
  { key: 'unusedCredits', label: 'Unused Credits' },
  { key: 'createdAt', label: 'Created' },
]

export const PROJECT_SORT_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'customerName', label: 'Customer' },
  { key: 'billingMethod', label: 'Billing Method' },
  { key: 'unbilledAmount', label: 'Unbilled Amount' },
  { key: 'budget', label: 'Budget' },
  { key: 'createdAt', label: 'Created' },
]

export const TIME_ENTRY_SORT_COLUMNS = [
  { key: 'date', label: 'Date' },
  { key: 'projectName', label: 'Project' },
  { key: 'task', label: 'Task' },
  { key: 'hours', label: 'Hours' },
  { key: 'createdAt', label: 'Created' },
]

export const ACCOUNTANT_JOURNAL_SORT_COLUMNS = [
  { key: 'journalNumber', label: 'Journal #' },
  { key: 'referenceNumber', label: 'Reference' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
]

export const CURRENCY_ADJUSTMENT_SORT_COLUMNS = [
  { key: 'reference', label: 'Reference' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount' },
  { key: 'createdAt', label: 'Created' },
]

export const CHART_OF_ACCOUNT_SORT_COLUMNS = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'balance', label: 'Balance' },
  { key: 'createdAt', label: 'Created' },
]

export const DOCUMENT_SORT_COLUMNS = [
  { key: 'name', label: 'File' },
  { key: 'status', label: 'Status' },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'createdAt', label: 'Created' },
]

export const SORT_COLUMNS_BY_ENTITY = {
  item: ITEM_SORT_COLUMNS,
  priceList: PRICE_LIST_SORT_COLUMNS,
  inventoryAdjustment: INVENTORY_ADJUSTMENT_SORT_COLUMNS,
  bankAccount: BANK_ACCOUNT_SORT_COLUMNS,
  customer: CUSTOMER_SORT_COLUMNS,
  salesEstimate: SALES_DOC_SORT_COLUMNS,
  salesRetainerInvoice: SALES_DOC_SORT_COLUMNS,
  salesOrder: SALES_DOC_SORT_COLUMNS,
  deliveryChallan: SALES_DOC_SORT_COLUMNS,
  recurringInvoice: SALES_DOC_SORT_COLUMNS,
  paymentReceived: SALES_DOC_SORT_COLUMNS,
  creditNote: SALES_DOC_SORT_COLUMNS,
  salesInvoice: SALES_INVOICE_SORT_COLUMNS,
  vendor: VENDOR_SORT_COLUMNS,
  purchaseExpense: PURCHASE_DOC_SORT_COLUMNS,
  recurringExpense: PURCHASE_DOC_SORT_COLUMNS,
  purchaseOrder: PURCHASE_DOC_SORT_COLUMNS,
  bill: PURCHASE_DOC_SORT_COLUMNS,
  paymentMade: PURCHASE_DOC_SORT_COLUMNS,
  recurringBill: PURCHASE_DOC_SORT_COLUMNS,
  vendorCredit: PURCHASE_DOC_SORT_COLUMNS,
  project: PROJECT_SORT_COLUMNS,
  timeEntry: TIME_ENTRY_SORT_COLUMNS,
  manualJournal: ACCOUNTANT_JOURNAL_SORT_COLUMNS,
  bulkUpdate: ACCOUNTANT_JOURNAL_SORT_COLUMNS,
  currencyAdjustment: CURRENCY_ADJUSTMENT_SORT_COLUMNS,
  chartOfAccount: CHART_OF_ACCOUNT_SORT_COLUMNS,
  transactionLock: ACCOUNTANT_JOURNAL_SORT_COLUMNS,
  document: DOCUMENT_SORT_COLUMNS,
  bankStatement: DOCUMENT_SORT_COLUMNS,
} as const

export type BooksSortEntity = keyof typeof SORT_COLUMNS_BY_ENTITY

export function sortableKeysForEntity(entity: BooksSortEntity) {
  return (SORT_COLUMNS_BY_ENTITY[entity] || []).map((c) => c.key)
}
