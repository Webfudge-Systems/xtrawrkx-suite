'use client'

import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import { Badge, ownerDisplayFromUser } from '@webfudge/ui'
import { formatOrgStatus, orgStatusVariant } from '../lib/orgDisplay'
import OrganizationRowActions from './OrganizationRowActions'

const MOBILE_ORG_CARD_CLASS =
  'overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.08),0_1px_4px_rgba(15,23,42,0.04)]'

export default function OrganizationListMobile({ rows, onDeleted }) {
  if (!rows.length) return null

  return (
    <div className="space-y-4 md:hidden">
      {rows.map((row) => {
        const owner = ownerDisplayFromUser(row.owner)
        return (
          <div key={row.id} className={MOBILE_ORG_CARD_CLASS}>
            <Link
              href={`/organizations/${row.id}`}
              className="flex items-start gap-3 p-4 transition-colors active:bg-gray-50/80"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-base font-semibold text-brand-primary">{row.name}</h3>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                </div>
                <p className="mt-1 truncate text-sm text-gray-500">
                  {row.companyEmail || row.slug}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant={orgStatusVariant(row.status)} size="sm" className="capitalize">
                    {formatOrgStatus(row.status)}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    {row.memberCount ?? 0} users
                  </span>
                  {owner.label !== 'Unassigned' ? (
                    <span className="truncate text-xs text-gray-500">{owner.label}</span>
                  ) : null}
                </div>
              </div>
            </Link>
            <div className="border-t border-gray-200/80 bg-gray-50/70 px-4 py-3">
              <OrganizationRowActions orgId={row.id} orgName={row.name} onDeleted={onDeleted} compact />
            </div>
          </div>
        )
      })}
    </div>
  )
}