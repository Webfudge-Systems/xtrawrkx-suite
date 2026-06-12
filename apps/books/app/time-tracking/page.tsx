import { redirect } from 'next/navigation'
import { getDefaultTabForModule } from '@/lib/tabs'

/** /time-tracking → first tab (Projects). */
export default function TimeTrackingRootRedirectPage() {
  redirect(getDefaultTabForModule('/time-tracking') ?? '/time-tracking/projects')
}
