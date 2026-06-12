import { redirect } from 'next/navigation'
import { getDefaultTabForModule } from '@/lib/tabs'

/** /items → first tab (All Items). No hub flash. */
export default function ItemsRootRedirectPage() {
  redirect(getDefaultTabForModule('/items') ?? '/items/all')
}
