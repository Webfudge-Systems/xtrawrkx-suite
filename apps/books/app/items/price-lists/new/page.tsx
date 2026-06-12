import BooksItemsModuleNewPage from '@/app/_components/BooksItemsModuleNewPage'

/** Static route so `/items/price-lists/new` wins over `/items/price-lists/[id]` (id = "new"). */
export default function PriceListsNewPage() {
  return <BooksItemsModuleNewPage moduleKey="price-lists" />
}
