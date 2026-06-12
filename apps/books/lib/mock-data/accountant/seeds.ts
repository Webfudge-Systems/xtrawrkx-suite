export type AccountantJournalRow = {
  id: number
  date: string
  journalNumber: string
  referenceNumber: string
  status: string
  notes: string
  createdAt: string
  updatedAt?: string
}

export type ChartOfAccountRow = {
  id: number
  code: string
  name: string
  type: string
  balance: string
  updatedAt: string
  createdAt: string
}

export type CurrencyAdjustmentRow = {
  id: number
  date: string
  reference: string
  currency: string
  status: string
  amount: string
  createdAt: string
  updatedAt?: string
}

function journalSeed(
  id: number,
  date: string,
  journalNumber: string,
  referenceNumber: string,
  status: string,
  notes: string
): AccountantJournalRow {
  return {
    id,
    date,
    journalNumber,
    referenceNumber,
    status,
    notes,
    createdAt: `${date}T09:00:00.000Z`,
    updatedAt: `${date}T09:00:00.000Z`,
  }
}

export const MOCK_MANUAL_JOURNAL_ROWS: AccountantJournalRow[] = [
  journalSeed(1, '2026-05-26', 'JE-2026-003', 'PREPAID-MAY', 'Published', 'Prepaid expense adjustment'),
  journalSeed(2, '2026-05-20', 'JE-2026-002', 'ACCRUAL-Q1', 'Published', 'Q1 accrual reversal'),
  journalSeed(3, '2026-05-15', 'JE-2026-001', '—', 'Draft', 'Opening balance correction'),
]

export const MOCK_BULK_UPDATE_ROWS: AccountantJournalRow[] = [
  journalSeed(1, '2026-05-18', 'BU-0004', 'COA-RECLASS', 'Completed', '12 accounts updated'),
  journalSeed(2, '2026-05-05', 'BU-0003', 'TAX-CODES', 'Draft', 'GST code bulk update'),
]

export const MOCK_TRANSACTION_LOCK_ROWS: AccountantJournalRow[] = [
  journalSeed(1, '2026-04-30', 'LOCK-APR', 'FY-2026', 'Locked', 'April 2026 books locked'),
  journalSeed(2, '2026-03-31', 'LOCK-MAR', 'FY-2026', 'Locked', 'March 2026 books locked'),
]

export const MOCK_CHART_OF_ACCOUNT_ROWS: ChartOfAccountRow[] = [
  { id: 1, code: '1000', name: 'Cash and Bank', type: 'Asset', balance: '₹1,84,250.00', updatedAt: 'May 27, 2026', createdAt: '2026-01-01T09:00:00.000Z' },
  { id: 2, code: '1100', name: 'Accounts Receivable', type: 'Asset', balance: '₹1,55,500.00', updatedAt: 'May 27, 2026', createdAt: '2026-01-01T09:00:00.000Z' },
  { id: 3, code: '2000', name: 'Accounts Payable', type: 'Liability', balance: '₹21,150.00', updatedAt: 'May 27, 2026', createdAt: '2026-01-01T09:00:00.000Z' },
  { id: 4, code: '4000', name: 'Service Revenue', type: 'Income', balance: '₹4,15,500.00', updatedAt: 'May 27, 2026', createdAt: '2026-01-01T09:00:00.000Z' },
  { id: 5, code: '5000', name: 'Software & SaaS', type: 'Expense', balance: '₹66,360.00', updatedAt: 'May 27, 2026', createdAt: '2026-01-01T09:00:00.000Z' },
]

export const MOCK_CURRENCY_ADJUSTMENT_ROWS: CurrencyAdjustmentRow[] = [
  { id: 1, date: '2026-05-20', reference: 'USD-MAY', currency: 'USD', status: 'Posted', amount: '₹18,400.00', createdAt: '2026-05-20T09:00:00.000Z' },
  { id: 2, date: '2026-05-01', reference: 'EUR-APR', currency: 'EUR', status: 'Draft', amount: '₹6,200.00', createdAt: '2026-05-01T09:00:00.000Z' },
]
