'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  resolveUserDisplayName,
  resolveUserInitials,
  resolveUserRole,
  useAuth,
} from '@webfudge/auth'
import { Avatar, LoadingSpinner } from '@webfudge/ui'
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  LogOut,
  Settings,
  User,
} from 'lucide-react'
import { clsx } from 'clsx'
import notificationService from '@/lib/notificationService'

export const booksTopbarPillClass =
  'books-shell-surface-pill flex min-h-[48px] shrink-0 items-center border-0 px-1.5 py-1 sm:px-2'

export const booksTopbarIconBtnClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--books-text-secondary,#4b5563)] transition-colors hover:bg-[var(--books-bg-elevated,#e5e7eb)]/80 hover:text-[var(--books-text-primary,#111827)] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40'

export function BooksTopbarIconButton({
  title,
  onClick,
  active,
  disabled,
  children,
  className,
  href,
}: {
  title: string
  onClick?: () => void
  active?: boolean
  disabled?: boolean
  children: ReactNode
  className?: string
  href?: string
}) {
  const cls = clsx(
    booksTopbarIconBtnClass,
    active && 'text-[var(--books-brand,#ea580c)]',
    disabled && 'pointer-events-none opacity-40',
    className
  )

  if (href) {
    return (
      <Link href={href} title={title} aria-label={title} className={cls}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={cls}
    >
      {children}
    </button>
  )
}

export function BooksTopbarNotifications() {
  const router = useRouter()
  const { user } = useAuth()
  const notificationDropdownRef = useRef<HTMLDivElement | null>(null)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [notifications, setNotifications] = useState<
    Array<{
      id: string | number
      title?: string
      message?: string
      isRead?: boolean
      isUrgent?: boolean
      timeAgo?: string
      href?: string
    }>
  >([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  const getCurrentUserId = () => {
    if (!user) return null
    const userData = (user as { attributes?: Record<string, unknown> }).attributes || user
    return (
      (userData as { id?: string | number }).id ||
      (user as { id?: string | number }).id ||
      (userData as { documentId?: string }).documentId ||
      (user as { documentId?: string }).documentId ||
      null
    )
  }

  useEffect(() => {
    const loadNotifications = async () => {
      const userId = getCurrentUserId()
      if (!userId) return
      try {
        setLoadingNotifications(true)
        const list = await notificationService.getNotifications(userId)
        const transformed = list.map((n: unknown) => notificationService.transformNotification(n))
        setNotifications(transformed)
        setUnreadCount(transformed.filter((n: { isRead?: boolean }) => !n.isRead).length)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoadingNotifications(false)
      }
    }

    void loadNotifications()
    const pollInterval = setInterval(loadNotifications, 30000)
    return () => clearInterval(pollInterval)
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotificationDropdown(false)
      }
    }
    if (showNotificationDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [showNotificationDropdown])

  const handleMarkAsRead = async (notificationId: string | number) => {
    try {
      await notificationService.markAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    const userId = getCurrentUserId()
    if (!userId) return
    try {
      await notificationService.markAllAsRead(userId)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = async (notification: (typeof notifications)[number]) => {
    if (!notification?.id) return
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }
    if (notification.href) {
      setShowNotificationDropdown(false)
      router.push(notification.href)
    }
  }

  return (
    <div className="relative" ref={notificationDropdownRef}>
      <BooksTopbarIconButton title="Notifications" onClick={() => setShowNotificationDropdown((open) => !open)}>
        <Bell className="h-4 w-4" aria-hidden />
      </BooksTopbarIconButton>
      {unreadCount > 0 ? (
        <span className="pointer-events-none absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      ) : null}

      {showNotificationDropdown ? (
        <>
          <div
            className="fixed inset-0 z-[130]"
            onClick={() => setShowNotificationDropdown(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[140] flex max-h-[min(70vh,28rem)] w-[min(100vw-2rem,24rem)] flex-col overflow-hidden rounded-xl border border-[color:var(--books-border,rgba(255,255,255,0.08))] bg-[var(--books-bg-elevated,#111827)] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between border-b border-[color:var(--books-border,rgba(255,255,255,0.08))] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--books-text-primary)]">Notifications</h3>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-1 text-xs text-[var(--books-brand,#ea580c)] hover:opacity-80"
                >
                  <CheckCheck className="h-3 w-3" />
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingNotifications ? (
                <div className="p-6 text-center">
                  <LoadingSpinner size="sm" message="Loading notifications..." />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-[var(--books-text-secondary)]">
                  <Bell className="mx-auto mb-2 h-10 w-10 opacity-40" />
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-[color:var(--books-border,rgba(255,255,255,0.06))]">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void handleNotificationClick(notification)}
                      className={clsx(
                        'w-full px-4 py-3 text-left transition-colors hover:bg-[var(--books-bg-card,#1f2937)]',
                        !notification.isRead && 'bg-[rgba(234,88,12,0.08)]'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {notification.isUrgent ? (
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        ) : (
                          <span
                            className={clsx(
                              'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                              !notification.isRead ? 'bg-[var(--books-brand,#ea580c)]' : 'bg-transparent'
                            )}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--books-text-primary)]">
                            {notification.title}
                          </p>
                          {notification.message ? (
                            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--books-text-secondary)]">
                              {notification.message}
                            </p>
                          ) : null}
                          {notification.timeAgo ? (
                            <p className="mt-1 text-[11px] text-[var(--books-text-secondary)]">
                              {notification.timeAgo}
                            </p>
                          ) : null}
                        </div>
                        {!notification.isRead ? (
                          <Check className="h-4 w-4 shrink-0 text-[var(--books-brand,#ea580c)]" />
                        ) : null}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export function BooksTopbarProfile() {
  const { user, logout, currentOrg } = useAuth()
  const profileButtonRef = useRef<HTMLButtonElement | null>(null)
  const profileCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [profileMenuStyle, setProfileMenuStyle] = useState<{ top: number; right: number } | null>(null)

  useEffect(() => {
    return () => {
      if (profileCloseTimerRef.current) clearTimeout(profileCloseTimerRef.current)
    }
  }, [])

  const openProfileDropdown = () => {
    if (profileCloseTimerRef.current) {
      clearTimeout(profileCloseTimerRef.current)
      profileCloseTimerRef.current = null
    }
    const rect = profileButtonRef.current?.getBoundingClientRect()
    if (rect) {
      setProfileMenuStyle({
        top: rect.bottom + 6,
        right: Math.max(16, window.innerWidth - rect.right),
      })
    }
    setShowProfileDropdown(true)
  }

  const scheduleCloseProfileDropdown = () => {
    if (profileCloseTimerRef.current) clearTimeout(profileCloseTimerRef.current)
    profileCloseTimerRef.current = setTimeout(() => {
      setShowProfileDropdown(false)
      setProfileMenuStyle(null)
      profileCloseTimerRef.current = null
    }, 150)
  }

  const displayName = resolveUserDisplayName(user)
  const profileEmail =
    ((user as { attributes?: { email?: string } })?.attributes || user)?.email ||
    (user as { email?: string })?.email ||
    ''
  const activeRole =
    currentOrg?.role ||
    currentOrg?.roleName ||
    currentOrg?.roleCode ||
    resolveUserRole(user) ||
    'User'
  const activeOrgName = currentOrg?.name || 'Books Workspace'
  const activeRoleLabel = String(activeRole)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  const profileMenu =
    showProfileDropdown && profileMenuStyle && typeof document !== 'undefined' ? (
      <div
        className="fixed z-[120] w-80 overflow-hidden rounded-xl border border-[color:var(--books-border,rgba(255,255,255,0.08))] bg-[var(--books-bg-elevated,#111827)] shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
        style={{ top: profileMenuStyle.top, right: profileMenuStyle.right }}
        onMouseEnter={openProfileDropdown}
        onMouseLeave={scheduleCloseProfileDropdown}
        role="menu"
      >
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar
              shape="rounded"
              size="lg"
              fallback={resolveUserInitials(user)}
              alt={displayName}
              className="h-12 w-12 shrink-0 rounded-full border-0 bg-[var(--books-brand,#ea580c)] font-semibold text-white"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--books-text-primary)]">{displayName}</p>
              <p className="truncate text-xs text-[var(--books-text-secondary)]">{profileEmail}</p>
              <p
                className="mt-2 truncate text-xs font-medium text-[var(--books-brand,#fb923c)]"
                title={`${activeRoleLabel} • ${activeOrgName}`}
              >
                {activeRoleLabel} • {activeOrgName}
              </p>
            </div>
          </div>
        </div>
        <div className="mx-4 border-t border-[color:var(--books-border,rgba(255,255,255,0.08))]" />
        <div className="p-2">
          <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--books-text-secondary)]">
            Account
          </p>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-card,#1f2937)]"
          >
            <User className="h-[18px] w-[18px] shrink-0 text-[var(--books-text-secondary)]" />
            View Profile
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-[var(--books-text-primary)] transition-colors hover:bg-[var(--books-bg-card,#1f2937)]"
          >
            <Settings className="h-[18px] w-[18px] shrink-0 text-[var(--books-text-secondary)]" />
            Settings
          </button>
        </div>
        <div className="mx-4 border-t border-[color:var(--books-border,rgba(255,255,255,0.08))]" />
        <div className="p-2">
          <button
            type="button"
            onClick={() => logout?.()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    ) : null

  return (
    <div className={clsx(booksTopbarPillClass, 'relative pl-2 pr-2 sm:pl-2.5 sm:pr-3')}>
      <div
        className="relative"
        onMouseEnter={openProfileDropdown}
        onMouseLeave={scheduleCloseProfileDropdown}
      >
        <button
          ref={profileButtonRef}
          type="button"
          className="inline-flex max-w-[min(100vw-12rem,16rem)] min-w-0 items-center gap-2 rounded-full py-0.5 text-left transition-colors hover:bg-[var(--books-bg-elevated)]/90 sm:max-w-none"
          aria-expanded={showProfileDropdown}
          aria-haspopup="menu"
        >
          <Avatar
            shape="rounded"
            size="sm"
            fallback={resolveUserInitials(user)}
            alt={displayName}
            className="h-8 w-8 shrink-0 rounded-full border-0 bg-[var(--books-brand,#ea580c)] font-semibold text-white"
          />
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-medium text-[var(--books-text-primary,#111827)]">
              {displayName}
            </span>
            <span className="block truncate text-xs text-[var(--books-text-secondary,#6b7280)]">
              Books Workspace
            </span>
          </span>
          <ChevronDown
            className={clsx(
              'h-4 w-4 shrink-0 text-[var(--books-text-secondary,#6b7280)] transition-transform',
              showProfileDropdown && 'rotate-180'
            )}
            aria-hidden
          />
        </button>
        {profileMenu ? createPortal(profileMenu, document.body) : null}
      </div>
    </div>
  )
}

/** Center pill: page actions + divider + notifications (CRM/PM-style). */
export function BooksTopbarCenterUtilities({ children }: { children?: ReactNode }) {
  const hasChildren = Boolean(children)
  return (
    <div className={clsx(booksTopbarPillClass, 'relative gap-0.5 px-2 sm:px-2.5')}>
      {hasChildren ? children : null}
      {hasChildren ? (
        <div
          className="mx-0.5 hidden h-7 w-px shrink-0 bg-[color:var(--books-border,rgba(0,0,0,0.08))] sm:block"
          aria-hidden
        />
      ) : null}
      <BooksTopbarNotifications />
    </div>
  )
}
