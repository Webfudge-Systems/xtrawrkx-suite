'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { Avatar } from '@webfudge/ui'
import { resolveUserDisplayName, resolveUserInitials, resolveUserRole, useAuth } from '@webfudge/auth'
import {
  Banknote,
  BarChart3,
  Briefcase,
  Calculator,
  Clock3,
  FileText,
  HelpCircle,
  Home,
  Moon,
  Package,
  Plus,
  Receipt,
  Sun,
  UserPlus,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useBooksTheme } from '@/components/theme/BooksThemeProvider'

type SidebarProps = {
  onConfigureFeatures: () => void
}

type RailLink = {
  type: 'link'
  href: string
  icon: LucideIcon
  label: string
  isActive: (pathname: string) => boolean
}

type QuickActionItem = {
  label: string
  href: string
  icon: LucideIcon
}

export default function Sidebar({ onConfigureFeatures }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { isDark, toggleTheme } = useBooksTheme()
  const collapsed = true
  const [quickOpen, setQuickOpen] = useState(false)
  const [quickMenuPos, setQuickMenuPos] = useState({ top: 0, left: 0 })
  const quickBtnRef = useRef<HTMLButtonElement | null>(null)
  const quickMenuRef = useRef<HTMLDivElement | null>(null)

  const quickActionItems = useMemo<QuickActionItem[]>(
    () => [
      { label: 'Invoice', href: '/sales/invoices/new', icon: Receipt },
      { label: 'Customer', href: '/sales/customers/new', icon: UserPlus },
      { label: 'Expense', href: '/purchases/expenses/new', icon: Wallet },
      { label: 'Bill', href: '/purchases/bills/new', icon: FileText },
      { label: 'Project', href: '/time-tracking/projects/new', icon: Clock3 },
    ],
    []
  )

  const updateQuickMenuPosition = useCallback(() => {
    const btn = quickBtnRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setQuickMenuPos({
      top: rect.top,
      left: rect.right + 10,
    })
  }, [])

  useEffect(() => {
    if (!quickOpen) return
    updateQuickMenuPosition()
    window.addEventListener('resize', updateQuickMenuPosition)
    window.addEventListener('scroll', updateQuickMenuPosition, true)
    return () => {
      window.removeEventListener('resize', updateQuickMenuPosition)
      window.removeEventListener('scroll', updateQuickMenuPosition, true)
    }
  }, [quickOpen, updateQuickMenuPosition])

  useEffect(() => {
    if (!quickOpen) return
    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (quickBtnRef.current?.contains(t) || quickMenuRef.current?.contains(t)) return
      setQuickOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setQuickOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [quickOpen])

  const primaryLinks: RailLink[] = [
    {
      type: 'link',
      href: '/home',
      icon: Home,
      label: 'Dashboard',
      isActive: (p) => p === '/home' || p === '/',
    },
    {
      type: 'link',
      href: '/items/all',
      icon: Package,
      label: 'Items',
      isActive: (p) => p.startsWith('/items'),
    },
    {
      type: 'link',
      href: '/banking',
      icon: Banknote,
      label: 'Banking',
      isActive: (p) => p.startsWith('/banking'),
    },
    {
      type: 'link',
      href: '/sales/customers',
      icon: Receipt,
      label: 'Sales',
      isActive: (p) => p.startsWith('/sales'),
    },
    {
      type: 'link',
      href: '/purchases/vendors',
      icon: Briefcase,
      label: 'Purchases',
      isActive: (p) => p.startsWith('/purchases'),
    },
    {
      type: 'link',
      href: '/time-tracking/projects',
      icon: Clock3,
      label: 'Time Tracking',
      isActive: (p) => p.startsWith('/time-tracking'),
    },
    {
      type: 'link',
      href: '/accountant/manual-journals',
      icon: Calculator,
      label: 'Accountant',
      isActive: (p) => p.startsWith('/accountant'),
    },
    {
      type: 'link',
      href: '/reports',
      icon: BarChart3,
      label: 'Reports',
      isActive: (p) => p.startsWith('/reports'),
    },
    {
      type: 'link',
      href: '/documents',
      icon: FileText,
      label: 'Documents',
      isActive: (p) => p.startsWith('/documents'),
    },
  ]

  /** 32×32 targets inside rail pills — nav, theme, help. */
  const railIconBtnClass = (active: boolean) =>
    clsx(
      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
      active
        ? 'bg-[var(--books-brand,#ea580c)] text-white shadow-[0_0_0_1px_rgba(234,88,12,0.35)]'
        : 'text-[var(--books-text-secondary)] hover:bg-[var(--books-bg-elevated)] hover:text-[var(--books-text-primary)]'
    )

  const quickActionBtnClass = clsx(
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all',
    'bg-[var(--books-brand,#ea580c)] text-white shadow-[0_2px_10px_rgba(234,88,12,0.5)]',
    'hover:brightness-110 active:scale-95',
    quickOpen &&
      'ring-2 ring-[var(--books-orange-text)] ring-offset-2 ring-offset-[var(--books-bg-card,#1e2128)] brightness-110'
  )

  /** Shared rail chrome; overflow per-shell (nav scrolls when viewport is short). */
  const railPillBaseClass = clsx('books-shell-surface books-shell-surface--rail border-0')

  /** Even inset on all sides inside each rail pill (top / nav / bottom). */
  const railPillInnerClass = 'flex w-full flex-col items-center gap-2 p-2'

  const sidebarWidth = 'w-16'
  const booksLogoSrc = '/Vertical logo 1 bg removed.png'

  const quickMenu =
    quickOpen && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={quickMenuRef}
            role="menu"
            aria-label="Quick create"
            className="fixed z-[200] w-52 overflow-hidden rounded-xl border border-[color:var(--books-border)] bg-[var(--books-bg-elevated)] shadow-[var(--books-shell-shadow)]"
            style={{ top: quickMenuPos.top, left: quickMenuPos.left }}
          >
            <p className="border-b border-[color:var(--books-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--books-text-secondary)]">
              Quick create
            </p>
            <ul className="p-1">
              {quickActionItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setQuickOpen(false)
                        router.push(item.href)
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-card)]"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--books-orange-bg)] text-[var(--books-orange-text)]">
                        <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      </span>
                      {item.label}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>,
          document.body
        )
      : null

  return (
    <aside
      className={`books-hide-scrollbar relative z-40 flex h-full min-h-0 shrink-0 flex-col items-center gap-3 overflow-y-auto overflow-x-hidden bg-transparent px-2 py-3 ${sidebarWidth}`}
    >
      <Link
        href="/home"
        className="flex w-full shrink-0 items-center justify-center"
        title="Fudge Books home"
        aria-label="Fudge Books home"
      >
        <Image
          src={booksLogoSrc}
          alt="Fudge Books"
          width={40}
          height={32}
          className="h-8 w-auto max-w-[2.5rem] object-contain"
          priority
        />
      </Link>

      <div className="flex w-full shrink-0 flex-col items-center">
        <div className={clsx(railPillBaseClass, railPillInnerClass, 'overflow-visible')}>
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className={railIconBtnClass(false)}
          >
            {isDark ? (
              <Moon className="h-4 w-4" aria-hidden />
            ) : (
              <Sun className="h-4 w-4 text-[var(--books-brand,#ea580c)]" aria-hidden />
            )}
          </button>

          <div className="relative flex justify-center">
            <button
              ref={quickBtnRef}
              type="button"
              title="Quick create"
              aria-label="Quick create"
              aria-haspopup="menu"
              aria-expanded={quickOpen}
              onClick={() => {
                setQuickOpen((v) => {
                  const next = !v
                  if (next) queueMicrotask(updateQuickMenuPosition)
                  return next
                })
              }}
              className={quickActionBtnClass}
            >
              <Plus className={clsx('h-4 w-4 transition-transform', quickOpen && 'rotate-45')} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* Nav pill — vertically centered in the rail */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div className={clsx(railPillBaseClass, railPillInnerClass, 'shrink-0')}>
          <nav className="flex w-full flex-col items-center gap-2" aria-label="Main">
            {primaryLinks.map((item, i) => {
              const Icon = item.icon
              const active = item.isActive(pathname)
              const showDivider = i === 2 || i === 4
              return (
                <Fragment key={item.href}>
                  {showDivider ? (
                    <div className="h-px w-full bg-[color:var(--books-border)]" aria-hidden />
                  ) : null}
                  <Link
                    href={item.href}
                    title={item.label}
                    className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start gap-2'}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={railIconBtnClass(active)}>
                      <Icon className={clsx('h-3.5 w-3.5', active && 'stroke-[1.75]')} aria-hidden />
                    </span>
                    {!collapsed ? (
                      <span
                        className={`text-sm ${active ? 'font-medium text-[var(--books-brand,#ea580c)]' : 'text-[var(--books-text-secondary)]'}`}
                      >
                        {item.label}
                      </span>
                    ) : null}
                  </Link>
                </Fragment>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Help + profile — bottom of sidebar */}
      <div className="w-full shrink-0">
        <div className={clsx(railPillBaseClass, railPillInnerClass, 'overflow-hidden')}>
          <button type="button" title="Help" className={railIconBtnClass(false)}>
            <HelpCircle className="h-4 w-4" aria-hidden />
          </button>
          <div
            className="flex items-center justify-center"
            title={`${resolveUserDisplayName(user)} · ${resolveUserRole(user)}`}
          >
            <Avatar
              shape="circle"
              fallback={resolveUserInitials(user)}
              alt={resolveUserDisplayName(user)}
              size="sm"
              className="h-8 w-8 shrink-0 border-0 bg-[var(--books-brand,#ea580c)] font-semibold text-white"
            />
            {!collapsed ? (
              <span className="text-sm font-medium text-[var(--books-text-primary)]">{resolveUserInitials(user)}</span>
            ) : null}
          </div>
        </div>
      </div>
      {quickMenu}
    </aside>
  )
}
