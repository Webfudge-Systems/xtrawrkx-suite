/** Display rows for Books list pages (table-friendly shapes). */

export type { PurchaseDocRow, VendorRow } from './purchases/seeds'
export {
  MOCK_BILL_ROWS,
  MOCK_EXPENSE_ROWS,
  MOCK_PAYMENT_MADE_ROWS as MOCK_PAYMENTS_MADE,
  MOCK_PURCHASE_ORDER_ROWS as MOCK_PURCHASE_ORDERS,
  MOCK_RECURRING_BILL_ROWS as MOCK_RECURRING_BILLS,
  MOCK_RECURRING_EXPENSE_ROWS as MOCK_RECURRING_EXPENSES,
  MOCK_VENDOR_CREDIT_ROWS as MOCK_VENDOR_CREDITS,
  MOCK_VENDOR_ROWS,
} from './purchases/seeds'

export type SalesDocRow = {
  id: number
  date: string
  number: string
  customer: string
  status: string
  amount: string
  dueDate?: string
}

export const MOCK_ESTIMATES: SalesDocRow[] = [
  { id: 1, date: '2026-05-26', number: 'EST-0044', customer: 'Northwind Traders', status: 'Accepted', amount: '₹1,05,000.00' },
  { id: 2, date: '2026-05-22', number: 'EST-0043', customer: 'Acme Corp', status: 'Sent', amount: '₹48,500.00' },
  { id: 3, date: '2026-05-18', number: 'EST-0042', customer: 'Brightline Studio', status: 'Draft', amount: '₹32,000.00' },
]

export const MOCK_CREDIT_NOTES: SalesDocRow[] = [
  { id: 1, date: '2026-05-20', number: 'CN-0012', customer: 'Acme Corp', status: 'Issued', amount: '₹5,000.00' },
  { id: 2, date: '2026-05-15', number: 'CN-0011', customer: 'Northwind Traders', status: 'Draft', amount: '₹2,500.00' },
]

export const MOCK_PAYMENTS_RECEIVED: SalesDocRow[] = [
  { id: 1, date: '2026-05-20', number: 'PAY-2201', customer: 'Brightline Studio', status: 'Completed', amount: '₹22,000.00' },
  { id: 2, date: '2026-05-10', number: 'PAY-2198', customer: 'Greenfield Labs', status: 'Completed', amount: '₹42,000.00' },
]

export const MOCK_SALES_ORDERS: SalesDocRow[] = [
  { id: 1, date: '2026-05-26', number: 'SO-0088', customer: 'Northwind Traders', status: 'Confirmed', amount: '₹1,05,000.00' },
  { id: 2, date: '2026-05-18', number: 'SO-0087', customer: 'Acme Corp', status: 'Draft', amount: '₹48,500.00' },
]

export const MOCK_DELIVERY_CHALLANS: SalesDocRow[] = [
  { id: 1, date: '2026-05-24', number: 'DC-0031', customer: 'Acme Corp', status: 'Delivered', amount: '—' },
  { id: 2, date: '2026-05-19', number: 'DC-0030', customer: 'Brightline Studio', status: 'In transit', amount: '—' },
]

export const MOCK_RECURRING_INVOICES: SalesDocRow[] = [
  { id: 1, date: '2026-05-01', number: 'RI-0004', customer: 'Brightline Studio', status: 'Active', amount: '₹22,000.00' },
  { id: 2, date: '2026-04-01', number: 'RI-0003', customer: 'Acme Corp', status: 'Paused', amount: '₹15,000.00' },
]

export const MOCK_RETAINER_INVOICES: SalesDocRow[] = [
  { id: 1, date: '2026-05-01', number: 'RET-0007', customer: 'Brightline Studio', status: 'Sent', amount: '₹22,000.00' },
  { id: 2, date: '2026-04-01', number: 'RET-0006', customer: 'Acme Corp', status: 'Paid', amount: '₹15,000.00' },
]
