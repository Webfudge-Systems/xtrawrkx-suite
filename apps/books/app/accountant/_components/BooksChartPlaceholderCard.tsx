'use client'

import { Card } from '@webfudge/ui'
import { BarChart3 } from 'lucide-react'

type BooksChartPlaceholderCardProps = {
  title: string
  subtitle?: string
}

export default function BooksChartPlaceholderCard({
  title,
  subtitle = 'Chart will appear here when connected to backend',
}: BooksChartPlaceholderCardProps) {
  return (
    <Card
      variant="elevated"
      padding={false}
      className="overflow-hidden !bg-[var(--books-bg-card,#ffffff)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.55),0_2px_10px_rgba(0,0,0,0.38)]"
    >
      <div className="p-5">
        <h3 className="text-base font-semibold text-[var(--books-text-primary,#111827)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--books-text-secondary,#6b7280)]">{subtitle}</p>
        <div className="mt-4 flex h-44 items-center justify-center rounded-xl border border-dashed border-[color:var(--books-border,rgba(0,0,0,0.12))] bg-[var(--books-bg-elevated,#f9fafb)]">
          <div className="flex flex-col items-center text-center">
            <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--books-orange-bg,rgba(234,88,12,0.1))] text-[var(--books-orange-text,#ea580c)]">
              <BarChart3 className="h-4 w-4" aria-hidden />
            </span>
            <span className="text-xs font-medium text-[var(--books-text-secondary,#6b7280)]">No data yet</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

