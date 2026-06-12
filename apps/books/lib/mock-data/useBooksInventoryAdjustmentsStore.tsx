'use client'

import { MOCK_INVENTORY_ADJUSTMENTS, type InventoryAdjustmentRow } from './inventory-adjustments'
import { createBooksRecordStore } from './createBooksRecordStore'

const store = createBooksRecordStore<InventoryAdjustmentRow>(
  'books.mock-inventory-adjustments.v1',
  'books-inventory-adjustments-storage',
  MOCK_INVENTORY_ADJUSTMENTS
)

export const BooksInventoryAdjustmentsStoreProvider = store.Provider

export function useBooksInventoryAdjustmentsStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = store.useStore()
  return {
    adjustments: records,
    getById,
    updateAdjustment: updateRecord,
    deleteAdjustment: deleteRecord,
    createAdjustment: createRecord,
    resetAdjustments: resetRecords,
  }
}
