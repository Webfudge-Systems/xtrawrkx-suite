'use client'

/** Orange gradient chart well — matches manager lead-assignment donut cards. */
export function DashboardChartCanvas({ children, className = '' }) {
  return (
    <div
      className={`relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-orange-100/70 bg-gradient-to-b from-orange-50/50 via-white to-white px-3 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_35%,rgba(255,122,32,0.12),transparent_68%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-200/20 blur-2xl"
      />
      <div className="relative min-h-[12rem] flex-1">{children}</div>
    </div>
  )
}

/** Primary orange scale for dashboard charts (manager assignment donut family). */
export const PRIMARY_ORANGE_SHADES = [
  '#9a3412',
  '#c2410c',
  '#ea580c',
  '#FF7A20',
  '#fb923c',
  '#fdba74',
  '#fcd34d',
  '#f97316',
]
