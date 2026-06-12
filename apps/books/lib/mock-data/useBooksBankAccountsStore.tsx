'use client'

import { MOCK_BANK_ACCOUNTS, MOCK_UNCATEGORIZED_COUNT, type BankAccountRow } from './banking'
import { createBooksRecordStore } from './createBooksRecordStore'

const store = createBooksRecordStore<BankAccountRow>(
  'books.mock-bank-accounts.v1',
  'books-bank-accounts-storage',
  MOCK_BANK_ACCOUNTS
)

export const BooksBankAccountsStoreProvider = store.Provider

export function useBooksBankAccountsStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = store.useStore()
  return {
    accounts: records,
    uncategorizedCount: MOCK_UNCATEGORIZED_COUNT,
    getById,
    updateAccount: updateRecord,
    deleteAccount: deleteRecord,
    createAccount: createRecord,
    resetAccounts: resetRecords,
  }
}
