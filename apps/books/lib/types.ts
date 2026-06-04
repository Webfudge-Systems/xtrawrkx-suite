export type CurrencyCode = string

export type ClientType = 'AgencyClient' | 'DirectClient' | 'Partner'
export type ItemType = 'Service' | 'Goods' | 'Digital' | 'RetainerPackage' | 'Milestone'
export type InvoiceStatus = 'Draft' | 'Sent' | 'Viewed' | 'Partial' | 'Paid' | 'Overdue' | 'Void'
export type ExpenseCategory =
  | 'Subcontractor'
  | 'SoftwareSaaS'
  | 'Travel'
  | 'Office'
  | 'Meals'
  | 'Training'
  | 'Marketing'
  | 'Other'
export type BillingMethod = 'DailyRatePerUser' | 'FixedCost' | 'BasedOnTasks'
export type BillingType = 'FixedFee' | 'Hourly' | 'Milestone'
export type JournalStatus = 'Draft' | 'Published'
export type BankAccountType = 'Bank' | 'Cash' | 'CreditCard' | 'PaymentClearing'
export type BankTransactionStatus = 'Categorized' | 'Uncategorized'
export type DocumentStatus = 'Processed' | 'Unreadable'
export type DocumentInbox = 'AllDocuments' | 'BankStatements'

export type EntityBase = {
  id: number
  documentId?: string
  createdAt?: string
  updatedAt?: string
}

export type Address = {
  line1?: string
  line2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export type Customer = EntityBase & {
  name: string
  email?: string
  phone?: string
  company?: string
  type: ClientType
  currency: CurrencyCode
  billingAddress?: Address
  shippingAddress?: Address
  unusedCredits: number
  receivables: number
  lifetimeBilled?: number
  portalLink?: string
}

export type Vendor = EntityBase & {
  name: string
  email?: string
  phone?: string
  company?: string
  payables: number
  unusedCredits: number
}

export type Item = EntityBase & {
  name: string
  sku: string
  type: ItemType
  description?: string
  rate: number
  taxable: boolean
  unit?: string
}

export type InvoiceLineItem = {
  id?: string
  description: string
  quantityOrHours: number
  rate: number
  amount: number
  itemId?: number
  billingType: BillingType
}

export type Invoice = EntityBase & {
  number: string
  customerId: number
  date: string
  dueDate: string
  status: InvoiceStatus
  lineItems: InvoiceLineItem[]
  subtotal: number
  tax: number
  total: number
  balanceDue?: number
  projectId?: number
  milestoneRef?: string
  retainerBalanceRemaining?: number
}

export type Expense = EntityBase & {
  date: string
  category: ExpenseCategory
  vendorId?: number
  amount: number
  billable: boolean
  clientId?: number
  projectId?: number
  reimbursable: boolean
  status: string
}

export type Project = EntityBase & {
  name: string
  customerId: number
  billingMethod: BillingMethod
  budget: number
  currency: CurrencyCode
  status: string
  totalLoggedHours?: number
  billableHours?: number
  unbilledAmount?: number
}

export type TimeEntry = EntityBase & {
  projectId: number
  task?: string
  userId: number
  date: string
  hours: number
  billable: boolean
  invoiced: boolean
  notes?: string
}

export type Bill = EntityBase & {
  vendorId: number
  date: string
  dueDate: string
  status: string
  lineItems: InvoiceLineItem[]
  total: number
}

export type ManualJournalEntry = {
  account: string
  debit: number
  credit: number
}

export type ManualJournal = EntityBase & {
  date: string
  journalNumber: string
  referenceNumber?: string
  status: JournalStatus
  entries: ManualJournalEntry[]
  notes?: string
}

export type BankAccount = EntityBase & {
  name: string
  accountNumber: string
  type: BankAccountType
  balance: number
}

export type BankTransaction = EntityBase & {
  accountId: number
  date: string
  description: string
  amount: number
  category?: string
  status: BankTransactionStatus
}

export type Document = EntityBase & {
  fileName: string
  fileUrl: string
  uploadedBy: string
  uploadedOn: string
  status: DocumentStatus
  details?: string
  inbox: DocumentInbox
}

export type DashboardMetrics = {
  totalReceivables: number
  totalPayables: number
  unbilledHours: number
  unbilledExpenses: number
  monthRevenue: number
  lastMonthRevenue: number
}
