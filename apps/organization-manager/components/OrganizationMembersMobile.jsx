'use client'

import { Badge, ownerDisplayFromUser } from '@webfudge/ui'

export default function OrganizationMembersMobile({ members }) {
  if (!members.length) return null

  return (
    <div className="space-y-4 md:hidden">
      {members.map((row) => {
        const u = row.user
        const derived = u ? ownerDisplayFromUser(u) : null
        const primary =
          derived && derived.label !== 'Unassigned' ? derived.label : u?.email || `User ${row.id}`
        const secondary = derived && derived.label !== 'Unassigned' ? u?.email : null

        return (
          <div
            key={row.id}
            className="rounded-2xl border border-gray-200/90 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.08),0_1px_4px_rgba(15,23,42,0.04)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{primary}</p>
                {secondary ? (
                  <p className="mt-0.5 truncate text-sm text-gray-500">{secondary}</p>
                ) : null}
              </div>
              <Badge variant="secondary" size="sm" className="shrink-0">
                {row.role?.name || 'Member'}
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
