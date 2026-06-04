'use client'

import Link from 'next/link'

function trialHeadline(daysRemaining) {
  const n = Math.floor(Number(daysRemaining))
  if (Number.isNaN(n) || n < 0) return 'Your trial is active'
  if (n === 0) return 'Your trial ends today'
  if (n === 1) return '1 day left in your trial'
  return `${n} days left in your trial`
}

/**
 * Sidebar CTA styled like upgrade promos (warm gradient, sparkle, pill button).
 * Use at the bottom of app sidebars instead of a profile chip.
 */
export function SidebarTrialUpsell({
  collapsed = false,
  daysRemaining = 12,
  upgradeHref = '/coming-soon?feature=upgrade',
  upgradeLabel = 'Upgrade plan',
}) {
  const headline = trialHeadline(daysRemaining)

  if (collapsed) {
    return (
      <div className="flex justify-center p-2 pb-5">
        <Link
          href={upgradeHref}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-400/45 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md transition hover:brightness-105 text-lg font-bold"
          title={`${headline} — ${upgradeLabel}`}
        >
          +
        </Link>
      </div>
    )
  }

  return (
    <div className="p-3">
      <div className="rounded-2xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-amber-50/95 to-orange-100/85 p-3 shadow-md ring-1 ring-orange-900/[0.06]">
        <p className="text-sm font-bold leading-snug text-gray-900">{headline}</p>
        <Link
          href={upgradeHref}
          className="mt-2.5 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:from-orange-600 hover:to-orange-700"
        >
          {upgradeLabel}
        </Link>
      </div>
    </div>
  )
}
