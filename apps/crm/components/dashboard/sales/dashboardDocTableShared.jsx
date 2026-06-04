'use client'

import Link from 'next/link'
import { Eye, Pencil } from 'lucide-react'
import { Button } from '@webfudge/ui'

export const COMPACT_HEADER = '!px-2.5 !py-2'
export const COMPACT_CELL = '!px-2.5 !py-2'

export function DashboardDocRowActions({ viewHref, editHref }) {
  return (
    <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      <Button
        as={Link}
        href={viewHref}
        variant="ghost"
        size="sm"
        className="!px-1.5 !py-1.5 text-teal-600 hover:bg-teal-50"
        title="View"
      >
        <Eye className="h-4 w-4" aria-hidden />
      </Button>
      <Button
        as={Link}
        href={editHref}
        variant="ghost"
        size="sm"
        className="!px-1.5 !py-1.5 text-orange-600 hover:bg-orange-50"
        title="Edit"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  )
}
