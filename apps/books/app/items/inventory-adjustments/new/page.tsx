import BooksItemsModuleNewPage from '@/app/_components/BooksItemsModuleNewPage'

/** Static route so `/items/inventory-adjustments/new` wins over `[id]` (id = "new"). */
export default function InventoryAdjustmentsNewPage() {
  return <BooksItemsModuleNewPage moduleKey="inventory-adjustments" />
}
