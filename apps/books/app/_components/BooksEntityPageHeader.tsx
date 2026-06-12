'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { clsx } from 'clsx'
import {
  BooksTopbarCenterUtilities,
  BooksTopbarProfile,
} from '@/components/layout/BooksTopbarShared'

export type BooksEntityBreadcrumb = {
  label: string
  href?: string | null
}

type BooksEntityPageHeaderProps = {
  title: string
  subtitle?: ReactNode
  breadcrumb?: BooksEntityBreadcrumb[]
  /** Edit / share / download — right pill before notifications (list-page layout). */
  utilityActions?: ReactNode
  className?: string
}

export default function BooksEntityPageHeader({
  title,
  subtitle,
  breadcrumb = [],
  utilityActions,
  className,
}: BooksEntityPageHeaderProps) {
  return (
    <div
      className={clsx(
        'relative z-30 mb-6 border-b border-[color:var(--books-border,rgba(255,255,255,0.08))] pb-5',
        className
      )}
    >
      <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0 md:max-w-[min(100%,36rem)] md:flex-1">
          {breadcrumb.length > 0 ? (
            <nav
              className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-[var(--books-text-secondary,#9ca3af)]"
              aria-label="Breadcrumb"
            >
              {breadcrumb.map((item, index) => (
                <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
                  {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0 opacity-70" aria-hidden /> : null}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-[var(--books-text-primary,#f8fafc)]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-[var(--books-text-primary,#f8fafc)]">{item.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : null}
          <h1 className="text-[1.75rem] font-semibold leading-tight text-[var(--books-text-primary,#f8fafc)] sm:text-[2rem]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-[var(--books-text-secondary,#9ca3af)]">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3 md:ml-auto">
          <BooksTopbarCenterUtilities>{utilityActions}</BooksTopbarCenterUtilities>
          <BooksTopbarProfile />
        </div>
      </div>
    </div>
  )
}
