'use client'

/** Recharts tooltip must sit above the center label overlay. */
export const DONUT_TOOLTIP_WRAPPER_STYLE = { zIndex: 50, outline: 'none' }

export function DonutChartCenterLabel({ total, label = 'Leads' }) {
  return (
    <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-white shadow-[0_4px_20px_rgba(15,23,42,0.08)] ring-[5px] ring-orange-50/90">
      <p className="text-[28px] font-black leading-none tabular-nums tracking-tight text-gray-900">
        {total}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-orange-600/90">
        {label}
      </p>
    </div>
  )
}

/**
 * Donut chart shell: center total behind chart (z-0) so hover tooltips are not clipped.
 */
export function DonutChartFrame({ total, centerLabel = 'Leads', children }) {
  return (
    <div className="relative mx-auto h-[200px] w-full max-w-[260px]">
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        <DonutChartCenterLabel total={total} label={centerLabel} />
      </div>
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  )
}
