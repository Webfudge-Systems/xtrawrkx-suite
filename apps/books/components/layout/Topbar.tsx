'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import { resolveUserDisplayName, useAuth } from '@webfudge/auth'
import { WorkspaceBackButton } from '@webfudge/ui'
import { getBreadcrumbItems, getRouteMeta } from '@/lib/routes'

type TopbarProps = {
  className?: string
}

export default function Topbar({ className }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const meta = getRouteMeta(pathname)
  const breadcrumbItems = getBreadcrumbItems(pathname)

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
            <div className="mb-1">
              <WorkspaceBackButton onClick={() => router.back()} />
            </div>
            <nav className="mb-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--books-text-secondary)]" aria-label="Breadcrumb">
              {breadcrumbItems.map((item, index) => (
                <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
                  {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0 opacity-70" aria-hidden /> : null}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-[var(--books-text-primary)]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-[var(--books-text-primary)]">{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="text-[30px] font-medium leading-tight text-[var(--books-text-primary)]">{meta.title}</h1>
            <p className="mt-1 text-sm text-[var(--books-text-secondary)]">{meta.subtitle}</p>
          </>
        )}
      </div>
    </header>
  )
}
