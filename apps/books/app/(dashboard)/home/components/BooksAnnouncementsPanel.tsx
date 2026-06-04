'use client'

import { Card } from '@webfudge/ui'
import { Megaphone } from 'lucide-react'

export default function BooksAnnouncementsPanel() {
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
              <Megaphone className="h-10 w-10 text-orange-500" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">Never miss an announcement</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
            This tab is your one-stop hub to keep track of our latest events, webinars, and important product updates.
          </p>
        </div>
      </div>
    </Card>
  )
}
