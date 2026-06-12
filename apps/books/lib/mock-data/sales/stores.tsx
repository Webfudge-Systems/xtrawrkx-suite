'use client'

import type { ReactNode } from 'react'
import { createBooksRecordStore } from '../createBooksRecordStore'
import {
  MOCK_CREDIT_NOTE_ROWS,
  MOCK_CUSTOMER_ROWS,
  MOCK_DELIVERY_CHALLAN_ROWS,
  MOCK_ESTIMATE_ROWS,
  MOCK_PAYMENT_RECEIVED_ROWS,
  MOCK_RECURRING_INVOICE_ROWS,
  MOCK_RETAINER_INVOICE_ROWS,
  MOCK_SALES_INVOICE_ROWS,
  MOCK_SALES_ORDER_ROWS,
  type CustomerRow,
  type SalesDocRow,
  type SalesInvoiceRow,
} from './seeds'

const estimateStore = createBooksRecordStore<SalesDocRow>(
  'books.mock-estimates.v1',
  'books-estimates-storage',
  MOCK_ESTIMATE_ROWS
)
const retainerStore = createBooksRecordStore<SalesDocRow>(
  'books.mock-retainer-invoices.v1',
  'books-retainer-invoices-storage',
  MOCK_RETAINER_INVOICE_ROWS
)
const salesOrderStore = createBooksRecordStore<SalesDocRow>(
  'books.mock-sales-orders.v1',
  'books-sales-orders-storage',
  MOCK_SALES_ORDER_ROWS
)
const deliveryChallanStore = createBooksRecordStore<SalesDocRow>(
  'books.mock-delivery-challans.v1',
  'books-delivery-challans-storage',
  MOCK_DELIVERY_CHALLAN_ROWS
)
const recurringInvoiceStore = createBooksRecordStore<SalesDocRow>(
  'books.mock-recurring-invoices.v1',
  'books-recurring-invoices-storage',
  MOCK_RECURRING_INVOICE_ROWS
)
const paymentReceivedStore = createBooksRecordStore<SalesDocRow>(
  'books.mock-payments-received.v1',
  'books-payments-received-storage',
  MOCK_PAYMENT_RECEIVED_ROWS
)
const creditNoteStore = createBooksRecordStore<SalesDocRow>(
  'books.mock-credit-notes.v1',
  'books-credit-notes-storage',
  MOCK_CREDIT_NOTE_ROWS
)
const customerStore = createBooksRecordStore<CustomerRow>(
  'books.mock-customers.v1',
  'books-customers-storage',
  MOCK_CUSTOMER_ROWS
)
const invoiceStore = createBooksRecordStore<SalesInvoiceRow>(
  'books.mock-sales-invoices.v1',
  'books-sales-invoices-storage',
  MOCK_SALES_INVOICE_ROWS
)

function wrapDocStore(store: ReturnType<typeof createBooksRecordStore<SalesDocRow>>) {
  return {
    Provider: store.Provider,
    useStore: () => {
      const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = store.useStore()
      return { records, getById, updateRecord, deleteRecord, createRecord, resetRecords }
    },
  }
}

const estimates = wrapDocStore(estimateStore)
const retainerInvoices = wrapDocStore(retainerStore)
const salesOrders = wrapDocStore(salesOrderStore)
const deliveryChallans = wrapDocStore(deliveryChallanStore)
const recurringInvoices = wrapDocStore(recurringInvoiceStore)
const paymentsReceived = wrapDocStore(paymentReceivedStore)
const creditNotes = wrapDocStore(creditNoteStore)

export function BooksSalesStoresProvider({ children }: { children: ReactNode }) {
  return (
    <customerStore.Provider>
      <invoiceStore.Provider>
        <estimateStore.Provider>
          <retainerStore.Provider>
            <salesOrderStore.Provider>
              <deliveryChallanStore.Provider>
                <recurringInvoiceStore.Provider>
                  <paymentReceivedStore.Provider>
                    <creditNoteStore.Provider>{children}</creditNoteStore.Provider>
                  </paymentReceivedStore.Provider>
                </recurringInvoiceStore.Provider>
              </deliveryChallanStore.Provider>
            </salesOrderStore.Provider>
          </retainerStore.Provider>
        </estimateStore.Provider>
      </invoiceStore.Provider>
    </customerStore.Provider>
  )
}

export function useBooksCustomersStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = customerStore.useStore()
  return {
    customers: records,
    getById,
    updateCustomer: updateRecord,
    deleteCustomer: deleteRecord,
    createCustomer: createRecord,
    resetCustomers: resetRecords,
  }
}

export function useBooksEstimatesStore() {
  const s = estimates.useStore()
  return { estimates: s.records, ...pickAliases(s, 'Estimate') }
}

export function useBooksRetainerInvoicesStore() {
  const s = retainerInvoices.useStore()
  return { retainerInvoices: s.records, ...pickAliases(s, 'RetainerInvoice') }
}

export function useBooksSalesOrdersStore() {
  const s = salesOrders.useStore()
  return { salesOrders: s.records, ...pickAliases(s, 'SalesOrder') }
}

export function useBooksDeliveryChallansStore() {
  const s = deliveryChallans.useStore()
  return { deliveryChallans: s.records, ...pickAliases(s, 'DeliveryChallan') }
}

export function useBooksRecurringInvoicesStore() {
  const s = recurringInvoices.useStore()
  return { recurringInvoices: s.records, ...pickAliases(s, 'RecurringInvoice') }
}

export function useBooksPaymentsReceivedStore() {
  const s = paymentsReceived.useStore()
  return { paymentsReceived: s.records, ...pickAliases(s, 'PaymentReceived') }
}

export function useBooksCreditNotesStore() {
  const s = creditNotes.useStore()
  return { creditNotes: s.records, ...pickAliases(s, 'CreditNote') }
}

export function useBooksSalesInvoicesStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = invoiceStore.useStore()
  return {
    invoices: records,
    getById,
    updateInvoice: updateRecord,
    deleteInvoice: deleteRecord,
    createInvoice: createRecord,
    resetInvoices: resetRecords,
  }
}

function pickAliases(
  s: ReturnType<typeof estimates.useStore>,
  _label: string
) {
  return {
    getById: s.getById,
    updateRecord: s.updateRecord,
    deleteRecord: s.deleteRecord,
    createRecord: s.createRecord,
    resetRecords: s.resetRecords,
  }
}
