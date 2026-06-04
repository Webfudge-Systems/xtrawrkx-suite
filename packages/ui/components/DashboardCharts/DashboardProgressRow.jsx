'use client'

import { Avatar } from '../Avatar'

const BAR_COLORS = {
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
  indigo: 'bg-indigo-500',
}

/** Compact progress row for dashboard insight lists (workload, project progress, etc.) */
export default function DashboardProgressRow({
  label,
  meta,
  percent = 0,
  avatarFallback,
  avatarClassName = 'bg-orange-500 text-white',
  barColor = 'orange',
  avatarSrc,
  showPercent = true,
}) {
  const value = Math.max(0, Math.min(100, Number(percent) || 0))
  const barClass = BAR_COLORS[barColor] || BAR_COLORS.orange

  return (
    <div className="flex items-center gap-2">
      <Avatar
        size="sm"
        src={avatarSrc || undefined}
        fallback={avatarFallback}
        alt={label}
        className={`!h-7 !w-7 shrink-0 text-[10px] font-semibold ${avatarClassName}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="min-w-0 truncate text-xs font-semibold text-gray-900" title={label}>
            {label}
          </p>
          {meta ? (
            <span className="shrink-0 text-[10px] text-gray-500" title={meta}>
              {meta}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200/90">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barClass}`}
              style={{ width: `${Math.max(value, value > 0 ? 4 : 0)}%` }}
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${label} progress`}
            />
          </div>
          {showPercent ? (
            <span className="w-8 shrink-0 text-right text-[11px] font-bold tabular-nums text-gray-700">
              {value}%
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function progressBarColorForValue(value) {
  const v = Number(value) || 0
  if (v >= 70) return 'green'
  if (v >= 40) return 'purple'
  return 'orange'
}
