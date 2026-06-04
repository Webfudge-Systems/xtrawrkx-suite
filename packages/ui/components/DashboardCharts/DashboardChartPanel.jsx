'use client'

import { LoadingSpinner } from '../../feedback'
import { DashboardChartCanvas } from './dashboardChartCanvas'

/**
 * Reusable chart card shell — matches existing Sales Analytics panel styling.
 */
export default function DashboardChartPanel({
  title,
  subtitle,
  icon: Icon,
  children,
  loading = false,
  className = '',
  chartClassName = 'h-60',
  fullHeight = false,
  /** When true, chart area uses orange gradient canvas (manager-style). */
  brandChart = false,
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/60 p-5 shadow-md ${
        fullHeight ? 'flex h-full min-h-0 flex-col' : ''
      } ${className}`}
    >
      <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-orange-200 bg-orange-50">
            <Icon className="h-5 w-5 text-orange-600" aria-hidden />
          </div>
        ) : null}
      </div>
      <div
        className={`w-full min-w-0 ${
          brandChart
            ? fullHeight
              ? 'min-h-[15rem] flex-1'
              : chartClassName
            : `rounded-xl border border-gray-100 bg-white p-3 ${fullHeight ? 'min-h-[15rem] flex-1' : ''} ${chartClassName}`
        }`}
      >
        {loading ? (
          <div
            className={`flex items-center justify-center ${
              brandChart ? 'h-full min-h-[15rem]' : 'h-full'
            }`}
          >
            <LoadingSpinner size="md" />
          </div>
        ) : brandChart ? (
          <DashboardChartCanvas className={fullHeight ? 'h-full min-h-[15rem]' : chartClassName}>
            {children}
          </DashboardChartCanvas>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export function DashboardChartEmpty({ message }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-4 text-center text-sm text-gray-500">
      {message}
    </div>
  )
}

export const DASHBOARD_CHART_ACCENT = '#ea580c'
