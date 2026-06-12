import { redirect } from 'next/navigation'
import { getDefaultTabForModule } from '@/lib/tabs'

/** /accountant → first tab (Manual Journals). No hub flash. */
export default function AccountantRootRedirectPage() {
  redirect(getDefaultTabForModule('/accountant') ?? '/accountant/manual-journals')
}
