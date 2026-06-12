'use client'

import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@webfudge/ui'

type BooksComingSoonProps = {
  featureName?: string
  backHref?: string
  backLabel?: string
  /** Fills dashboard content area (cancels main horizontal padding). */
  embedded?: boolean
  className?: string
}

/**
 * Theme-aware coming-soon placeholder — uses `--books-*` tokens for light/dark parity.
 */
export default function BooksComingSoon({
  featureName = 'This feature',
  backHref = '/home',
  backLabel = 'Back to Dashboard',
  embedded = false,
  className,
}: BooksComingSoonProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center bg-[var(--books-bg-page)] px-6 py-12',
        embedded ? '-mx-6 -mb-6 min-h-[calc(100vh-7rem)]' : 'min-h-screen',
        className
      )}
    >
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--books-orange-bg)]">
          <Clock className="h-10 w-10 text-[var(--books-orange-text)]" aria-hidden />
        </div>
        <h1 className="mb-3 text-3xl font-bold text-[var(--books-text-primary)]">Coming Soon</h1>
        <p className="mb-2 text-[var(--books-text-secondary)]">
          <span className="font-semibold text-[var(--books-text-primary)]">{featureName}</span> is
          currently under development.
        </p>
        <p className="mb-8 text-[var(--books-text-secondary)]">
          We&apos;re working hard to bring you this feature soon. Stay tuned!
        </p>
        <Button as={Link} href={backHref} variant="primary" className="inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {backLabel}
        </Button>
      </div>
    </div>
  )
}
