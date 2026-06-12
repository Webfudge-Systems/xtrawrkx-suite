'use client'

import { MOCK_PRICE_LISTS, type PriceListRow } from './price-lists'
import { createBooksRecordStore } from './createBooksRecordStore'

const store = createBooksRecordStore<PriceListRow>(
  'books.mock-price-lists.v1',
  'books-price-lists-storage',
  MOCK_PRICE_LISTS
)

export const BooksPriceListsStoreProvider = store.Provider

export function useBooksPriceListsStore() {
  const { records, getById, updateRecord, deleteRecord, createRecord, resetRecords } = store.useStore()
  return {
    priceLists: records,
    getById,
    updatePriceList: updateRecord,
    deletePriceList: deleteRecord,
    createPriceList: createRecord,
    resetPriceLists: resetRecords,
  }
}
