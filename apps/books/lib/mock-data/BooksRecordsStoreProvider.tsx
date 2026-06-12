'use client'

import type { ReactNode } from 'react'
import { BooksItemsStoreProvider } from './useBooksItemsStore'
import { BooksPriceListsStoreProvider } from './useBooksPriceListsStore'
import { BooksInventoryAdjustmentsStoreProvider } from './useBooksInventoryAdjustmentsStore'
import { BooksBankAccountsStoreProvider } from './useBooksBankAccountsStore'
import { BooksSalesStoresProvider } from './sales/stores'
import { BooksPurchasesStoresProvider } from './purchases/stores'
import { BooksTimeTrackingStoresProvider } from './time-tracking/stores'
import { BooksAccountantStoresProvider } from './accountant/stores'
import { BooksDocumentsStoresProvider } from './documents/stores'

export function BooksRecordsStoreProvider({ children }: { children: ReactNode }) {
  return (
    <BooksItemsStoreProvider>
      <BooksPriceListsStoreProvider>
        <BooksInventoryAdjustmentsStoreProvider>
          <BooksBankAccountsStoreProvider>
            <BooksSalesStoresProvider>
              <BooksPurchasesStoresProvider>
                <BooksTimeTrackingStoresProvider>
                  <BooksAccountantStoresProvider>
                    <BooksDocumentsStoresProvider>{children}</BooksDocumentsStoresProvider>
                  </BooksAccountantStoresProvider>
                </BooksTimeTrackingStoresProvider>
              </BooksPurchasesStoresProvider>
            </BooksSalesStoresProvider>
          </BooksBankAccountsStoreProvider>
        </BooksInventoryAdjustmentsStoreProvider>
      </BooksPriceListsStoreProvider>
    </BooksItemsStoreProvider>
  )
}
