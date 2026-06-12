import { redirect } from 'next/navigation'
import { getDefaultTabForModule } from '@/lib/tabs'

/** /sales → first tab (Customers). No hub flash. */
export default function SalesRootRedirectPage() {
  redirect(getDefaultTabForModule('/sales') ?? '/sales/customers')
}
