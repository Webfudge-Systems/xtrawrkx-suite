import { redirect } from 'next/navigation'
import { getDefaultTabForModule } from '@/lib/tabs'

/** /purchases → first tab (Vendors). No hub flash. */
export default function PurchasesRootRedirectPage() {
  redirect(getDefaultTabForModule('/purchases') ?? '/purchases/vendors')
}
