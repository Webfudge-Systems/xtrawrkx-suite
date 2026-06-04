import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** Reports (formerly analytics dashboard) — not released yet. */
export default function AnalyticsPage() {
  redirect('/coming-soon?feature=reports')
}
