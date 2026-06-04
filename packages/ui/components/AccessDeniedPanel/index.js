'use client'

import { ShieldX } from 'lucide-react'

/**
 * Shown when RBAC blocks the current route.
 *
 * @param {{
 *   title?: string,
 *   description?: string,
 *   variant?: 'centered' | 'card',
 * }} props
 *
 * - `centered` (default for PM-style): white full-height, icon + heading centred.
 * - `card`: constrained-width red-tinted card on white (CRM-style).
 */
export function AccessDeniedPanel({
  title = 'Access denied',
  description = 'Your current role does not have access to this module.',
  variant = 'centered',
}) {
  if (variant === 'card') {
    return (
      <div className="min-h-full bg-white p-4 md:p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-red-600 shadow-sm ring-1 ring-red-100">
              <ShieldX className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">No access</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-700">{description}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-white p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}

export default AccessDeniedPanel
