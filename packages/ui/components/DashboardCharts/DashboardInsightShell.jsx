'use client'

import { Card } from '../Card'

/**
 * Compact header + inner panel for dashboard insight cards (task overview, workload, projects).
 * Used across PM and CRM manager dashboard widgets.
 */
export default function DashboardInsightShell({
  title,
  badge,
  subtitle,
  action,
  children,
  className = '',
  panelClassName = '',
}) {
  return (
    <Card glass padding={false} className={`p-4 ${className}`}>
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-base font-semibold leading-tight text-gray-900">{title}</h2>
            {badge}
          </div>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-1 text-[11px] leading-snug text-gray-500">{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div
        className={`overflow-hidden rounded-lg border border-gray-100 bg-gray-50/60 ${panelClassName}`}
      >
        {children}
      </div>
    </Card>
  )
}

export function InsightCountBadge({ children, tone = 'orange' }) {
  const tones = {
    orange: 'bg-orange-100 text-orange-800',
    blue: 'bg-blue-100 text-blue-800',
    violet: 'bg-violet-100 text-violet-800',
  }
  return (
    <span
      className={`rounded-full px-1.5 py-px text-[10px] font-bold leading-none ${tones[tone] || tones.orange}`}
    >
      {children}
    </span>
  )
}
