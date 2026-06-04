'use client'

import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { resolveUserDisplayName, useAuth } from '@webfudge/auth'
import { getRouteMeta } from '@/lib/routes'

type TopbarProps = {
  className?: string
}

export default function Topbar({ className }: TopbarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const meta = getRouteMeta(pathname)

  const displayName = resolveUserDisplayName(user)
  const firstName = displayName.split(' ')[0] || displayName
  const isHome = pathname === '/home' || pathname === '/'
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className={clsx('shrink-0 min-w-0 pl-0 pr-2 md:pr-3', className)}>
      <div className="min-w-0">
        {isHome ? (
          <>
            <h1 className="text-[2.25rem] font-medium leading-tight text-[var(--books-text-primary)]">
              Welcome, {firstName}
            </h1>
            <p className="mt-1 text-[0.95rem] text-[var(--books-text-secondary)]">{formattedDate}</p>
          </>
        ) : (
          <>
            <nav className="mb-1 text-xs text-[var(--books-text-secondary)]" aria-label="Breadcrumb">
              {meta.breadcrumbs.join(' > ')}
            </nav>
            <h1 className="text-[30px] font-medium leading-tight text-[var(--books-text-primary)]">{meta.title}</h1>
            <p className="mt-1 text-sm text-[var(--books-text-secondary)]">{meta.subtitle}</p>
          </>
        )}
      </div>
    </header>
  )
}
