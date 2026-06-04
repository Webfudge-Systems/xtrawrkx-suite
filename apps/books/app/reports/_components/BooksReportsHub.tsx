'use client'

import Link from 'next/link'
import { BarChart3, FileStack, LineChart, PieChart, TrendingUp } from 'lucide-react'
import { Button, Card, KPICard } from '@webfudge/ui'
import BooksSystemAnalytics from '../components/BooksSystemAnalytics'

const insightCards = [
  {
    title: 'Profit & loss',
    description: 'Revenue, expenses, and margin by fiscal period.',
    href: '/reports',
    icon: LineChart,
    cta: 'View P&L',
    variant: 'primary' as const,
  },
  {
    title: 'Balance sheet',
    description: 'Assets, liabilities, and equity snapshot.',
    href: '/coming-soon?feature=Balance%20sheet',
    icon: PieChart,
    cta: 'Coming soon',
    variant: 'secondary' as const,
  },
  {
    title: 'Cash flow',
    description: 'Operating, investing, and financing movements.',
    href: '/coming-soon?feature=Cash%20flow',
    icon: TrendingUp,
    cta: 'Coming soon',
    variant: 'secondary' as const,
  },
  {
    title: 'Document vault',
    description: 'Statements, receipts, and attachments linked to records.',
    href: '/documents',
    icon: FileStack,
    cta: 'Open documents',
    variant: 'secondary' as const,
  },
]

/**
 * Reports & analysis hub — CRM analytics cards + PM-style KPI/charts layout for Books dark theme.
 */
export default function BooksReportsHub() {
  return (
    <div className="min-h-full space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard theme="books" title="Reports" value={4} subtitle="Core financial views" icon={BarChart3} />
        <KPICard theme="books" title="Fiscal year" value="FY 25–26" subtitle="Org books settings" icon={LineChart} />
        <KPICard theme="books" title="Exports" value="CSV" subtitle="List & ledger exports" icon={FileStack} />
        <KPICard theme="books" title="Insights" value="Live" subtitle="Charts below" icon={TrendingUp} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {insightCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              variant="elevated"
              padding={false}
              className="flex flex-col gap-3 p-5 !bg-[var(--books-bg-card,#1e2128)] dark:shadow-[0_4px_28px_rgba(0,0,0,0.55)]"
            >
              <div className="flex items-center gap-2 font-semibold text-[var(--books-text-primary,#f0f0f0)]">
                <Icon className="h-5 w-5 text-[var(--books-orange-text,#fb923c)]" aria-hidden />
                {card.title}
              </div>
              <p className="text-sm text-[var(--books-text-secondary,#9ca3af)]">{card.description}</p>
              <Button as={Link} href={card.href} variant={card.variant} className="mt-auto w-fit">
                {card.cta}
              </Button>
            </Card>
          )
        })}
      </div>

      <BooksSystemAnalytics />
    </div>
  )
}
