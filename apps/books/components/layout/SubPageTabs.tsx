'use client'

import type { MouseEvent, ReactNode } from 'react'
import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button, TableRowActionMenuPortal } from '@webfudge/ui'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { getTabsForRoute, isBooksTabActive, type TabItem } from '@/lib/tabs'

const booksSubNavPillTrackClass =
  'books-shell-surface-pill flex min-h-[48px] w-fit max-w-full shrink-0 items-center gap-0.5 overflow-x-auto px-2 py-1.5 sm:px-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

type MenuAnchor = { top: number; left: number; triggerEl: HTMLElement }

type SubPageTabsProps = {
  /** Shown immediately to the right of the tab pill (actions, notifications, profile). */
  trailing?: ReactNode
}

function tabPillClass(active: boolean) {
  return clsx(
    'flex shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition-all duration-200',
    active
      ? 'bg-[var(--books-brand,#ea580c)] font-semibold text-white shadow-sm'
      : 'bg-transparent font-normal text-[var(--books-text-secondary,#9ca3af)] hover:bg-[var(--books-surface-muted,#2a2e38)] hover:text-[var(--books-text-primary,#f0f0f0)]'
  )
}

function TabMenuPortal({
  anchor,
  tabs,
  activeFor,
  onClose,
}: {
  anchor: MenuAnchor
  tabs: TabItem[]
  activeFor: (href: string) => boolean
  onClose: () => void
}) {
  return (
    <TableRowActionMenuPortal
      open
      anchor={{
        top: anchor.top,
        left: anchor.left,
        triggerEl: anchor.triggerEl,
      }}
      onClose={onClose}
      menuClassName="z-[140] min-w-[14rem] max-w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-[color:var(--books-border,rgba(0,0,0,0.12))] !bg-[var(--books-bg-elevated,#111827)] py-1 shadow-[0_18px_40px_rgba(0,0,0,0.4)]"
      menuWidthPx={280}
    >
      {tabs.map((tab) => {
        const active = activeFor(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="menuitem"
            className={`flex w-full items-center px-3 py-2 text-sm transition-colors ${
              active
                ? 'bg-[var(--books-orange-bg,rgba(234,88,12,0.18))] font-medium !text-[var(--books-orange-text,#fb923c)]'
                : '!text-[var(--books-text-primary,#f8fafc)] hover:bg-[var(--books-bg-card,#1f2937)] hover:!text-[var(--books-text-primary,#ffffff)]'
            }`}
            onClick={onClose}
          >
            {tab.label}
          </Link>
        )
      })}
    </TableRowActionMenuPortal>
  )
}

export default function SubPageTabs({ trailing }: SubPageTabsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [moreAnchor, setMoreAnchor] = useState<MenuAnchor | null>(null)

  useEffect(() => {
    setMoreAnchor(null)
  }, [pathname])

  const tabs = useMemo(() => {
    if (pathname === '/home' || pathname === '/' || pathname.startsWith('/home/')) {
      return [
        { label: 'Dashboard', href: '/home' },
        { label: 'Activity', href: '/home/activity' },
        { label: 'Recent Updates', href: '/home/recent-updates' },
      ]
    }
    return getTabsForRoute(pathname)
  }, [pathname])

  const activeFor = useMemo(
    () => (href: string) => isBooksTabActive(pathname, href, searchParams),
    [pathname, searchParams]
  )

  if (!tabs.length) {
    return (
      <div className="flex min-w-0 shrink-0 items-center justify-end gap-3 py-1 md:ml-auto">
        {trailing}
      </div>
    )
  }

  const visibleTabs = tabs.slice(0, 4)
  const overflowTabs = tabs.slice(4)

  const toggleMenuAnchor = (
    e: MouseEvent<HTMLButtonElement>,
    setter: (value: MenuAnchor | null) => void,
    current: MenuAnchor | null
  ) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    setter(current?.triggerEl === el ? null : { top: r.bottom + 4, left: r.left, triggerEl: el })
  }

  return (
    <>
      <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-3 py-1 md:ml-auto md:gap-4 md:flex-nowrap">
        <nav className="min-w-0 shrink-0" aria-label="Sub page tabs">
          <div className={booksSubNavPillTrackClass}>
            {visibleTabs.map((tab) => (
              <Link key={tab.href} href={tab.href} className={tabPillClass(activeFor(tab.href))}>
                {tab.label}
              </Link>
            ))}
            {overflowTabs.length ? (
              <div className="mr-1 shrink-0">
                <Button
                  type="button"
                  variant="muted"
                  className="inline-flex h-10 rounded-full border border-transparent bg-transparent px-3 text-sm font-medium text-[var(--books-text-secondary,#6b7280)] shadow-none hover:bg-transparent hover:text-[var(--books-text-primary,#f8fafc)]"
                  aria-expanded={Boolean(moreAnchor)}
                  aria-haspopup="menu"
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    toggleMenuAnchor(e, setMoreAnchor, moreAnchor)
                  }}
                >
                  More
                  <ChevronDown className="ml-1 h-4 w-4" aria-hidden />
                </Button>
              </div>
            ) : null}
          </div>
        </nav>
        {trailing}
      </div>

      {moreAnchor && overflowTabs.length > 0 ? (
        <TabMenuPortal
          anchor={moreAnchor}
          tabs={overflowTabs}
          activeFor={activeFor}
          onClose={() => setMoreAnchor(null)}
        />
      ) : null}
    </>
  )
}
