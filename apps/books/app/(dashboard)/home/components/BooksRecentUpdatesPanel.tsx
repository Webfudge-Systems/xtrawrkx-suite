'use client'

import { Card } from '@webfudge/ui'
import { History } from 'lucide-react'

export default function BooksRecentUpdatesPanel() {
  return (
    <Card
      variant="elevated"
      padding={false}
      className="relative overflow-hidden border border-slate-100 bg-slate-50/80 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.12)_1px,transparent_0)] bg-[length:20px_20px]"
    >
      <div className="relative px-4 py-14 sm:py-20">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-gray-200">
              <History className="h-10 w-10 text-orange-500" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Your recent activity will show here</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
            When you create or edit invoices, bills, expenses, journals, and other records, the latest changes will appear in
            this feed.
          </p>
        </div>
      </div>
    </Card>
  )
}
