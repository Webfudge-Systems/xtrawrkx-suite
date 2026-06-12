'use client'

import type { ReactNode } from 'react'
import { createBooksRecordStore } from '../createBooksRecordStore'
import {
  MOCK_BILL_ROWS,
  MOCK_EXPENSE_ROWS,
  MOCK_PAYMENT_MADE_ROWS,
  MOCK_PURCHASE_ORDER_ROWS,
  MOCK_RECURRING_BILL_ROWS,
  MOCK_RECURRING_EXPENSE_ROWS,
  MOCK_VENDOR_CREDIT_ROWS,
  MOCK_VENDOR_ROWS,
  type PurchaseDocRow,
  type VendorRow,
} from './seeds'

const vendorStore = createBooksRecordStore<VendorRow>(
  'books.mock-vendors.v1',
  'books-vendors-storage',
  MOCK_VENDOR_ROWS
)
const expenseStore = createBooksRecordStore<PurchaseDocRow>(
  'books.mock-expenses.v1',
  'books-expenses-storage',
  MOCK_EXPENSE_ROWS
)
const recurringExpenseStore = createBooksRecordStore<PurchaseDocRow>(
  'books.mock-recurring-expenses.v1',
  'books-recurring-expenses-storage',
  MOCK_RECURRING_EXPENSE_ROWS
)
const purchaseOrderStore = createBooksRecordStore<PurchaseDocRow>(
  'books.mock-purchase-orders.v1',
  'books-purchase-orders-storage',
  MOCK_PURCHASE_ORDER_ROWS
)
const billStore = createBooksRecordStore<PurchaseDocRow>(
  'books.mock-bills.v1',
  'books-bills-storage',
  MOCK_BILL_ROWS
)
const paymentMadeStore = createBooksRecordStore<PurchaseDocRow>(
  'books.mock-payments-made.v1',
  'books-payments-made-storage',
  MOCK_PAYMENT_MADE_ROWS
)
const recurringBillStore = createBooksRecordStore<PurchaseDocRow>(
  'books.mock-recurring-bills.v1',
  'books-recurring-bills-storage',
  MOCK_RECURRING_BILL_ROWS
)
const vendorCreditStore = createBooksRecordStore<PurchaseDocRow>(
  'books.mock-vendor-credits.v1',
  'books-vendor-credits-storage',
  MOCK_VENDOR_CREDIT_ROWS
)

function wrapDocStore(store: ReturnType<typeof createBooksRecordStore<PurchaseDocRow>>) {
  return {
    Provider: store.Provider,
    useStore: () => {
      const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = store.useStore()
      return { records, getById, updateRecord, deleteRecord, createRecord, resetRecords }
    },
  }
}

const expenses = wrapDocStore(expenseStore)
const recurringExpenses = wrapDocStore(recurringExpenseStore)
const purchaseOrders = wrapDocStore(purchaseOrderStore)
const bills = wrapDocStore(billStore)
const paymentsMade = wrapDocStore(paymentMadeStore)
const recurringBills = wrapDocStore(recurringBillStore)
const vendorCredits = wrapDocStore(vendorCreditStore)

export function BooksPurchasesStoresProvider({ children }: { children: ReactNode }) {
  return (
    <vendorStore.Provider>
      <expenseStore.Provider>
        <recurringExpenseStore.Provider>
          <purchaseOrderStore.Provider>
            <billStore.Provider>
              <paymentMadeStore.Provider>
                <recurringBillStore.Provider>
                  <vendorCreditStore.Provider>{children}</vendorCreditStore.Provider>
                </recurringBillStore.Provider>
              </paymentMadeStore.Provider>
            </billStore.Provider>
          </purchaseOrderStore.Provider>
        </recurringExpenseStore.Provider>
      </expenseStore.Provider>
    </vendorStore.Provider>
  )
}

export function useBooksVendorsStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = vendorStore.useStore()
  return {
    vendors: records,
    getById,
    updateVendor: updateRecord,
    deleteVendor: deleteRecord,
    createVendor: createRecord,
    resetVendors: resetRecords,
  }
}

export function useBooksExpensesStore() {
  const s = expenses.useStore()
  return { expenses: s.records, ...pickAliases(s) }
}

export function useBooksRecurringExpensesStore() {
  const s = recurringExpenses.useStore()
  return { recurringExpenses: s.records, ...pickAliases(s) }
}

export function useBooksPurchaseOrdersStore() {
  const s = purchaseOrders.useStore()
  return { purchaseOrders: s.records, ...pickAliases(s) }
}

export function useBooksBillsStore() {
  const s = bills.useStore()
  return { bills: s.records, ...pickAliases(s) }
}

export function useBooksPaymentsMadeStore() {
  const s = paymentsMade.useStore()
  return { paymentsMade: s.records, ...pickAliases(s) }
}

export function useBooksRecurringBillsStore() {
  const s = recurringBills.useStore()
  return { recurringBills: s.records, ...pickAliases(s) }
}

export function useBooksVendorCreditsStore() {
  const s = vendorCredits.useStore()
  return { vendorCredits: s.records, ...pickAliases(s) }
}

function pickAliases(s: ReturnType<typeof expenses.useStore>) {
  return {
    getById: s.getById,
    updateRecord: s.updateRecord,
    deleteRecord: s.deleteRecord,
    createRecord: s.createRecord,
    resetRecords: s.resetRecords,
  }
}
