'use client'

import type { ReactNode } from 'react'
import { createBooksRecordStore } from '../createBooksRecordStore'
import {
  MOCK_BULK_UPDATE_ROWS,
  MOCK_CHART_OF_ACCOUNT_ROWS,
  MOCK_CURRENCY_ADJUSTMENT_ROWS,
  MOCK_MANUAL_JOURNAL_ROWS,
  MOCK_TRANSACTION_LOCK_ROWS,
  type AccountantJournalRow,
  type ChartOfAccountRow,
  type CurrencyAdjustmentRow,
} from './seeds'

const manualJournalStore = createBooksRecordStore<AccountantJournalRow>(
  'books.mock-manual-journals.v1',
  'books-manual-journals-storage',
  MOCK_MANUAL_JOURNAL_ROWS
)
const bulkUpdateStore = createBooksRecordStore<AccountantJournalRow>(
  'books.mock-bulk-update.v1',
  'books-bulk-update-storage',
  MOCK_BULK_UPDATE_ROWS
)
const transactionLockStore = createBooksRecordStore<AccountantJournalRow>(
  'books.mock-transaction-locking.v1',
  'books-transaction-locking-storage',
  MOCK_TRANSACTION_LOCK_ROWS
)
const chartOfAccountStore = createBooksRecordStore<ChartOfAccountRow>(
  'books.mock-chart-of-accounts.v1',
  'books-chart-of-accounts-storage',
  MOCK_CHART_OF_ACCOUNT_ROWS
)
const currencyAdjustmentStore = createBooksRecordStore<CurrencyAdjustmentRow>(
  'books.mock-currency-adjustments.v1',
  'books-currency-adjustments-storage',
  MOCK_CURRENCY_ADJUSTMENT_ROWS
)

function wrapJournalStore(store: ReturnType<typeof createBooksRecordStore<AccountantJournalRow>>) {
  return {
    Provider: store.Provider,
    useStore: () => {
      const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = store.useStore()
      return { records, getById, updateRecord, deleteRecord, createRecord, resetRecords }
    },
  }
}

const manualJournals = wrapJournalStore(manualJournalStore)
const bulkUpdates = wrapJournalStore(bulkUpdateStore)
const transactionLocks = wrapJournalStore(transactionLockStore)

export function BooksAccountantStoresProvider({ children }: { children: ReactNode }) {
  return (
    <manualJournalStore.Provider>
      <bulkUpdateStore.Provider>
        <transactionLockStore.Provider>
          <chartOfAccountStore.Provider>
            <currencyAdjustmentStore.Provider>{children}</currencyAdjustmentStore.Provider>
          </chartOfAccountStore.Provider>
        </transactionLockStore.Provider>
      </bulkUpdateStore.Provider>
    </manualJournalStore.Provider>
  )
}

export function useBooksManualJournalsStore() {
  const s = manualJournals.useStore()
  return { manualJournals: s.records, ...pickJournalAliases(s) }
}

export function useBooksBulkUpdatesStore() {
  const s = bulkUpdates.useStore()
  return { bulkUpdates: s.records, ...pickJournalAliases(s) }
}

export function useBooksTransactionLocksStore() {
  const s = transactionLocks.useStore()
  return { transactionLocks: s.records, ...pickJournalAliases(s) }
}

export function useBooksChartOfAccountsStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = chartOfAccountStore.useStore()
  return {
    chartOfAccounts: records,
    getById,
    updateAccount: updateRecord,
    deleteAccount: deleteRecord,
    createAccount: createRecord,
    resetAccounts: resetRecords,
  }
}

export function useBooksCurrencyAdjustmentsStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } =
    currencyAdjustmentStore.useStore()
  return {
    currencyAdjustments: records,
    getById,
    updateAdjustment: updateRecord,
    deleteAdjustment: deleteRecord,
    createAdjustment: createRecord,
    resetAdjustments: resetRecords,
  }
}

function pickJournalAliases(s: ReturnType<typeof manualJournals.useStore>) {
  return {
    getById: s.getById,
    updateRecord: s.updateRecord,
    deleteRecord: s.deleteRecord,
    createRecord: s.createRecord,
    resetRecords: s.resetRecords,
  }
}
