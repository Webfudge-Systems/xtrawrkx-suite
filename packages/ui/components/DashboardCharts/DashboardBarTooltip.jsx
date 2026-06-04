'use client'

/**
 * Recharts bar tooltip — matches manager dashboard cards (LeadAssignment, LeadSources).
 */
export default function DashboardBarTooltip({
  active,
  payload,
  label,
  /** Noun after the count, e.g. "deals" or "leads". Omit for count only. */
  unit = '',
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const row = entry?.payload
  const name = row?.name ?? label ?? '—'
  const raw = Number(entry?.value)
  const value = Number.isFinite(raw) ? raw : 0
  const unitText = typeof unit === 'function' ? unit(value, row, entry) : unit

  return (
    <div className="min-w-[9rem] rounded-xl border border-gray-200/90 bg-white/95 px-3 py-2.5 shadow-lg ring-1 ring-black/5 backdrop-blur-sm">
      <p className="text-sm font-semibold text-gray-900">{name}</p>
      <p className="mt-1 text-xs text-gray-600">
        <span className="font-bold tabular-nums text-gray-900">{value}</span>
        {unitText ? (
          <>
            {' '}
            <span className="font-medium text-gray-600">{unitText}</span>
          </>
        ) : null}
      </p>
    </div>
  )
}

/** Shared hover highlight for dashboard bar charts. */
export const DASHBOARD_BAR_TOOLTIP_CURSOR = { fill: 'rgba(255, 122, 32, 0.07)', radius: 8 }
