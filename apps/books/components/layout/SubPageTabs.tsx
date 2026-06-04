'use client'

import type { MouseEvent, ReactNode } from 'react'
import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button, TableRowActionMenuPortal, TabsWithActions } from '@webfudge/ui'
import { ChevronDown } from 'lucide-react'
import { getTabsForRoute } from '@/lib/tabs'

type MoreAnchor = { top: number; left: number; triggerEl: HTMLElement }

type SubPageTabsProps = {
  /** Shown immediately to the right of the tab pill (actions, notifications, profile). */
  trailing?: ReactNode
}

export default function SubPageTabs({ trailing }: SubPageTabsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [moreAnchor, setMoreAnchor] = useState<MoreAnchor | null>(null)

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

  if (!tabs.length) {
    return (
      <div className="flex min-w-0 shrink-0 items-center justify-end gap-3 py-1 md:ml-auto">
        {trailing}
      </div>
    )
  }

  const visibleTabs = tabs.slice(0, 4)
  const overflowTabs = tabs.slice(4)

  const activeFor = (href: string) => {
    const [pathOnly, queryPart] = href.split('?')
    if (!queryPart) {
      if (pathOnly === '/home') return pathname === '/home' || pathname === '/'
      return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`)
    }
    if (pathname !== pathOnly) return false
    const q = new URLSearchParams(queryPart)
    return Array.from(q.entries()).every(([k, v]) => searchParams.get(k) === v)
  }

  const visibleTabItems = visibleTabs.map((tab) => ({
    id: tab.href,
    label: tab.label,
  }))
  const activeVisibleId = visibleTabs.find((tab) => activeFor(tab.href))?.href ?? visibleTabs[0]?.href

  return (
    <>
      <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-3 md:ml-auto md:gap-4 md:flex-nowrap py-1">
        <nav className="min-w-0 shrink-0" aria-label="Sub page tabs">
          <TabsWithActions
            variant="pill"
            pillTheme="books"
            pillTrack="hug"
            tabs={visibleTabItems}
            activeTab={activeVisibleId}
            onTabChange={(tabId: string) => router.push(tabId)}
            className="justify-start"
            inlineRight={
              overflowTabs.length ? (
                <div className="mr-1 shrink-0">
                  <Button
                    type="button"
                    variant="muted"
                    className="inline-flex h-10 rounded-full border border-transparent bg-transparent px-3 text-sm font-medium text-[var(--books-text-secondary,#6b7280)] shadow-none hover:bg-transparent hover:text-[var(--books-text-primary,#f8fafc)]"
                    aria-expanded={Boolean(moreAnchor)}
                    aria-haspopup="menu"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      const el = e.currentTarget
                      const r = el.getBoundingClientRect()
                      setMoreAnchor((prev) =>
                        prev?.triggerEl === el ? null : { top: r.bottom + 4, left: r.left, triggerEl: el }
                      )
                    }}
                  >
                    More
                    <ChevronDown className="ml-1 h-4 w-4" aria-hidden />
                  </Button>
                </div>
              ) : null
            }
          />
        </nav>
        {trailing}
      </div>

      {moreAnchor && overflowTabs.length > 0 ? (
        <TableRowActionMenuPortal
          open
          anchor={{
            top: moreAnchor.top,
            left: moreAnchor.left,
            triggerEl: moreAnchor.triggerEl,
          }}
          onClose={() => setMoreAnchor(null)}
          menuClassName="z-[140] min-w-[14rem] max-w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-[color:var(--books-border,rgba(0,0,0,0.12))] !bg-[var(--books-bg-elevated,#111827)] py-1 shadow-[0_18px_40px_rgba(0,0,0,0.4)]"
          menuWidthPx={280}
        >
          {overflowTabs.map((tab) => {
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
                onClick={() => setMoreAnchor(null)}
              >
                {tab.label}
              </Link>
            )
          })}
        </TableRowActionMenuPortal>
      ) : null}
    </>
  )
}
