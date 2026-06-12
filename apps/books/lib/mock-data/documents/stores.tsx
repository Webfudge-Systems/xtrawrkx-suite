'use client'

import type { ReactNode } from 'react'
import { createBooksRecordStore } from '../createBooksRecordStore'
import { MOCK_BANK_STATEMENT_ROWS, MOCK_DOCUMENT_ROWS, type DocumentRow } from './seeds'

const documentStore = createBooksRecordStore<DocumentRow>(
  'books.mock-documents.v1',
  'books-documents-storage',
  MOCK_DOCUMENT_ROWS
)
const bankStatementStore = createBooksRecordStore<DocumentRow>(
  'books.mock-bank-statements.v1',
  'books-bank-statements-storage',
  MOCK_BANK_STATEMENT_ROWS
)

export function BooksDocumentsStoresProvider({ children }: { children: ReactNode }) {
  return (
    <documentStore.Provider>
      <bankStatementStore.Provider>{children}</bankStatementStore.Provider>
    </documentStore.Provider>
  )
}

export function useBooksDocumentsStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = documentStore.useStore()
  return {
    documents: records,
    getById,
    updateDocument: updateRecord,
    deleteDocument: deleteRecord,
    createDocument: createRecord,
    resetDocuments: resetRecords,
  }
}

export function useBooksBankStatementsStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = bankStatementStore.useStore()
  return {
    bankStatements: records,
    getById,
    updateStatement: updateRecord,
    deleteStatement: deleteRecord,
    createStatement: createRecord,
    resetStatements: resetRecords,
  }
}
