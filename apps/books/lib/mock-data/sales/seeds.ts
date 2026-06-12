import type { Customer } from '@/lib/types'

export type CustomerRow = Customer & {
  createdAt: string
  updatedAt?: string
}

export const MOCK_CUSTOMER_ROWS: CustomerRow[] = [
  {
    id: 1,
    name: 'Rahul Mehta',
    company: 'Acme Corp',
    email: 'billing@acmecorp.com',
    phone: '+91 98765 43210',
    type: 'AgencyClient',
    currency: 'INR',
    receivables: 4850000,
    unusedCredits: 0,
    lifetimeBilled: 24850000,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    company: 'Northwind Traders',
    email: 'accounts@northwind.in',
    phone: '+91 91234 56789',
    type: 'DirectClient',
    currency: 'INR',
    receivables: 0,
    unusedCredits: 150000,
    lifetimeBilled: 10500000,
    createdAt: '2026-02-04T14:15:00.000Z',
    updatedAt: '2026-04-10T12:00:00.000Z',
  },
  {
    id: 3,
    name: 'Arjun Patel',
    company: 'Brightline Studio',
    email: 'finance@brightline.io',
    phone: '+91 99887 76655',
    type: 'Partner',
    currency: 'INR',
    receivables: 2200000,
    unusedCredits: 50000,
    lifetimeBilled: 18200000,
    createdAt: '2026-03-08T11:15:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
  },
  {
    id: 4,
    name: 'Sneha Iyer',
    company: 'Greenfield Labs',
    email: 'ap@greenfieldlabs.com',
    phone: '+91 88003 44003',
    type: 'DirectClient',
    currency: 'INR',
    receivables: 0,
    unusedCredits: 0,
    lifetimeBilled: 6400000,
    createdAt: '2026-04-12T09:00:00.000Z',
    updatedAt: '2026-05-01T11:30:00.000Z',
  },
]

export type SalesDocRow = {
  id: number
  date: string
  number: string
  customer: string
  status: string
  amount: string
  dueDate?: string
  createdAt: string
  updatedAt?: string
}

export type SalesInvoiceRow = {
  id: number
  date: string
  number: string
  customer: string
  status: string
  dueDate: string
  amount: number
  balance: number
  createdAt: string
  updatedAt?: string
}

function docSeed(
  id: number,
  date: string,
  number: string,
  customer: string,
  status: string,
  amount: string,
  dueDate?: string
): SalesDocRow {
  return {
    id,
    date,
    number,
    customer,
    status,
    amount,
    dueDate,
    createdAt: `${date}T09:00:00.000Z`,
    updatedAt: `${date}T09:00:00.000Z`,
  }
}

export const MOCK_ESTIMATE_ROWS: SalesDocRow[] = [
  docSeed(1, '2026-05-26', 'EST-0044', 'Northwind Traders', 'Accepted', '₹1,05,000.00'),
  docSeed(2, '2026-05-22', 'EST-0043', 'Acme Corp', 'Sent', '₹48,500.00'),
  docSeed(3, '2026-05-18', 'EST-0042', 'Brightline Studio', 'Draft', '₹32,000.00'),
]

export const MOCK_RETAINER_INVOICE_ROWS: SalesDocRow[] = [
  docSeed(1, '2026-05-01', 'RET-0007', 'Brightline Studio', 'Sent', '₹22,000.00'),
  docSeed(2, '2026-04-01', 'RET-0006', 'Acme Corp', 'Paid', '₹15,000.00'),
]

export const MOCK_SALES_ORDER_ROWS: SalesDocRow[] = [
  docSeed(1, '2026-05-26', 'SO-0088', 'Northwind Traders', 'Confirmed', '₹1,05,000.00'),
  docSeed(2, '2026-05-18', 'SO-0087', 'Acme Corp', 'Draft', '₹48,500.00'),
]

export const MOCK_DELIVERY_CHALLAN_ROWS: SalesDocRow[] = [
  docSeed(1, '2026-05-24', 'DC-0031', 'Acme Corp', 'Delivered', '—'),
  docSeed(2, '2026-05-19', 'DC-0030', 'Brightline Studio', 'In transit', '—'),
]

export const MOCK_RECURRING_INVOICE_ROWS: SalesDocRow[] = [
  docSeed(1, '2026-05-01', 'RI-0004', 'Brightline Studio', 'Active', '₹22,000.00'),
  docSeed(2, '2026-04-01', 'RI-0003', 'Acme Corp', 'Paused', '₹15,000.00'),
]

export const MOCK_PAYMENT_RECEIVED_ROWS: SalesDocRow[] = [
  docSeed(1, '2026-05-20', 'PAY-2201', 'Brightline Studio', 'Completed', '₹22,000.00'),
  docSeed(2, '2026-05-10', 'PAY-2198', 'Greenfield Labs', 'Completed', '₹42,000.00'),
]

export const MOCK_CREDIT_NOTE_ROWS: SalesDocRow[] = [
  docSeed(1, '2026-05-20', 'CN-0012', 'Acme Corp', 'Issued', '₹5,000.00'),
  docSeed(2, '2026-05-15', 'CN-0011', 'Northwind Traders', 'Draft', '₹2,500.00'),
]

export const MOCK_SALES_INVOICE_ROWS: SalesInvoiceRow[] = [
  {
    id: 1,
    date: '2026-05-26',
    number: 'INV-0044',
    customer: 'Northwind Traders',
    status: 'Sent',
    dueDate: '2026-06-25',
    amount: 10500000,
    balance: 10500000,
    createdAt: '2026-05-26T09:00:00.000Z',
    updatedAt: '2026-05-26T09:00:00.000Z',
  },
  {
    id: 2,
    date: '2026-05-22',
    number: 'INV-0043',
    customer: 'Acme Corp',
    status: 'Paid',
    dueDate: '2026-06-21',
    amount: 4850000,
    balance: 0,
    createdAt: '2026-05-22T09:00:00.000Z',
    updatedAt: '2026-05-24T14:00:00.000Z',
  },
  {
    id: 3,
    date: '2026-05-18',
    number: 'INV-0042',
    customer: 'Brightline Studio',
    status: 'Overdue',
    dueDate: '2026-05-17',
    amount: 3200000,
    balance: 3200000,
    createdAt: '2026-05-18T09:00:00.000Z',
    updatedAt: '2026-05-18T09:00:00.000Z',
  },
]
