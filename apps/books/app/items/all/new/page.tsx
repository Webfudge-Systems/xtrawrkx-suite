import BooksItemsModuleNewPage from '@/app/_components/BooksItemsModuleNewPage'

/** Static route so `/items/all/new` wins over `/items/all/[id]` (id = "new"). */
export default function ItemsAllNewPage() {
  return <BooksItemsModuleNewPage moduleKey="all" />
}
