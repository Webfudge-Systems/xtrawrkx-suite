import type { Vendor } from '@/lib/types'

export type VendorRow = Vendor & {
  createdAt: string
  updatedAt?: string
}

export const MOCK_VENDOR_ROWS: VendorRow[] = [
  {
    id: 1,
    name: 'CloudHost Services',
    company: 'CloudHost Services Pvt Ltd',
    email: 'invoices@cloudhost.io',
    phone: '+91 88001 22001',
    payables: 12400,
    unusedCredits: 0,
    createdAt: '2026-01-10T09:00:00.000Z',
    updatedAt: '2026-05-27T10:00:00.000Z',
  },
  {
    id: 2,
    name: 'Office Supplies Co.',
    company: 'Office Supplies Co.',
    email: 'billing@officesupplies.in',
    phone: '+91 88002 33002',
    payables: 8750,
    unusedCredits: 250,
    createdAt: '2026-02-14T11:00:00.000Z',
    updatedAt: '2026-05-24T08:00:00.000Z',
  },
  {
    id: 3,
    name: 'Design Assets Ltd',
    company: 'Design Assets Ltd',
    email: 'accounts@designassets.com',
    phone: '—',
    payables: 0,
    unusedCredits: 1000,
    createdAt: '2026-03-20T14:00:00.000Z',
    updatedAt: '2026-05-12T09:00:00.000Z',
  },
]

export type PurchaseDocRow = {
  id: number
  date: string
  number: string
  vendor: string
  status: string
  amount: string
  createdAt: string
  updatedAt?: string
}

function docSeed(
  id: number,
  date: string,
  number: string,
  vendor: string,
  status: string,
  amount: string
): PurchaseDocRow {
  return {
    id,
    date,
    number,
    vendor,
    status,
    amount,
    createdAt: `${date}T09:00:00.000Z`,
    updatedAt: `${date}T09:00:00.000Z`,
  }
}

export const MOCK_BILL_ROWS: PurchaseDocRow[] = [
  docSeed(1, '2026-05-27', 'BILL-0091', 'CloudHost Services', 'Open', '₹12,400.00'),
  docSeed(2, '2026-05-20', 'BILL-0090', 'Office Supplies Co.', 'Overdue', '₹8,750.00'),
  docSeed(3, '2026-04-15', 'BILL-0088', 'CloudHost Services', 'Paid', '₹11,800.00'),
]

export const MOCK_EXPENSE_ROWS: PurchaseDocRow[] = [
  docSeed(1, '2026-05-27', 'EXP-441', 'CloudHost Services', 'Recorded', '₹12,400.00'),
  docSeed(2, '2026-05-24', 'EXP-440', 'Office Supplies Co.', 'Billable', '₹8,750.00'),
  docSeed(3, '2026-05-20', 'EXP-439', '—', 'Recorded', '₹45,000.00'),
]

export const MOCK_PAYMENT_MADE_ROWS: PurchaseDocRow[] = [
  docSeed(1, '2026-05-24', 'VP-2201', 'Office Supplies Co.', 'Paid', '₹8,750.00'),
  docSeed(2, '2026-05-10', 'VP-2199', 'CloudHost Services', 'Paid', '₹11,800.00'),
]

export const MOCK_VENDOR_CREDIT_ROWS: PurchaseDocRow[] = [
  docSeed(1, '2026-05-12', 'VC-0018', 'Design Assets Ltd', 'Open', '₹1,000.00'),
]

export const MOCK_PURCHASE_ORDER_ROWS: PurchaseDocRow[] = [
  docSeed(1, '2026-05-18', 'PO-0042', 'Office Supplies Co.', 'Issued', '₹9,200.00'),
  docSeed(2, '2026-05-05', 'PO-0041', 'CloudHost Services', 'Draft', '₹12,400.00'),
]

export const MOCK_RECURRING_EXPENSE_ROWS: PurchaseDocRow[] = [
  docSeed(1, '2026-05-01', 'RE-0012', 'CloudHost Services', 'Active', '₹12,400.00'),
]

export const MOCK_RECURRING_BILL_ROWS: PurchaseDocRow[] = [
  docSeed(1, '2026-05-01', 'RB-0006', 'CloudHost Services', 'Active', '₹12,400.00'),
]
