'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Download,
  Image,
  LogOut,
  Search,
  Settings,
  Upload,
  User,
} from 'lucide-react'
import {
  useAuth,
  resolveUserDisplayName,
  resolveUserInitials,
  resolveUserRole,
} from '@webfudge/auth'
import { Avatar, Card } from '../index'
import { LoadingSpinner } from '../../feedback'

export function WorkspaceHeader({
  title,
  subtitle,
  breadcrumb = [],
  showSearch = false,
  showActions = false,
  showProfile = true,
  searchPlaceholder,
  onSearchChange,
  onAddClick,
  onFilterClick,
  onImportClick,
  onExportClick,
  onShareImageClick,
  actions,
  children,
  hasActiveFilters = false,
  notificationService,
  renderGlobalSearchModal,
  searchInputClassName,
  actionButtonClassName,
  notificationDropdownClassName,
  profileDropdownClassName,
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, currentOrg } = useAuth()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [searchInputValue, setSearchInputValue] = useState('')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const notificationDropdownRef = useRef(null)
  const profileCloseTimerRef = useRef(null)

  const getCurrentUserId = () => {
    if (!user) return null
    const userData = user.attributes || user
    return userData.id || user.id || userData.documentId || user.documentId || null
  }

  useEffect(() => {
    if (!notificationService) return undefined
    const loadNotifications = async () => {
      const userId = getCurrentUserId()
      if (!userId) return
      try {
        setLoadingNotifications(true)
        const list = await notificationService.getNotifications(userId)
        const transformed = list.map(notificationService.transformNotification)
        setNotifications(transformed)
        setUnreadCount(transformed.filter((n) => !n.isRead).length)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoadingNotifications(false)
      }
    }
    void loadNotifications()
    const pollInterval = setInterval(loadNotifications, 30000)
    return () => clearInterval(pollInterval)
  }, [user, notificationService])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
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

  const openProfileDropdown = () => {
    if (profileCloseTimerRef.current) {
      clearTimeout(profileCloseTimerRef.current)
      profileCloseTimerRef.current = null
    }
    setShowProfileDropdown(true)
  }

  const scheduleCloseProfileDropdown = () => {
    if (profileCloseTimerRef.current) clearTimeout(profileCloseTimerRef.current)
    profileCloseTimerRef.current = setTimeout(() => {
      setShowProfileDropdown(false)
      profileCloseTimerRef.current = null
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (profileCloseTimerRef.current) clearTimeout(profileCloseTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && showSearch) {
        e.preventDefault()
        setShowGlobalSearch(true)
      }
      if (e.key === 'Escape' && showGlobalSearch) setShowGlobalSearch(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSearch, showGlobalSearch])

  const handleNotificationClick = async (notification) => {
    if (!notification?.id) return
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }
    if (notification.href) {
      setShowNotificationDropdown(false)
      router.push(notification.href)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    if (!notificationService) return
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
    if (!notificationService) return
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

  const breadcrumbItems =
    breadcrumb.length > 0
      ? breadcrumb.map((item) => {
          if (typeof item === 'string') {
            const segments = pathname.split('/').filter(Boolean)
            const itemIndex = breadcrumb.findIndex((b) => b === item)
            if (itemIndex >= 0 && itemIndex < segments.length) {
              const href = '/' + segments.slice(0, itemIndex + 1).join('/')
              return { label: item, href }
            }
            return { label: item, href: '#' }
          }
          const label = typeof item.label === 'string' ? item.label : 'Page'
          return { label, href: item.href || '#' }
        })
      : pathname
          .split('/')
          .filter(Boolean)
          .map((segment, index, array) => ({
            href: '/' + array.slice(0, index + 1).join('/'),
            label: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
          }))

  const resolvedActionClass =
    actionButtonClassName ||
    'p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg'

  const resolvedSearchClass =
    searchInputClassName ||
    'w-64 pl-10 pr-4 py-2.5 bg-white border border-orange-500/40 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all duration-300 placeholder:text-gray-400 text-gray-800'

  const hasDefaultActionButtons = !!(onImportClick || onExportClick || onShareImageClick)
  const activeRole =
    currentOrg?.role ||
    currentOrg?.roleName ||
    currentOrg?.roleCode ||
    resolveUserRole(user) ||
    'User'
  const activeOrgName = currentOrg?.name || 'Active workspace'
  const activeRoleLabel = String(activeRole)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  const profileEmail = (user?.attributes || user)?.email || user?.email || ''
  const premiumAvatarClass =
    'bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-white shadow-lg text-white font-bold'
  const profileMenuItemClass =
    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-hover'
  const profileMenuIconClass = 'h-[18px] w-[18px] shrink-0 text-brand-text-light stroke-[2.2]'

  return (
    <Card glass className="relative z-[40]">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {breadcrumbItems.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-brand-text-light mb-2">
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index === breadcrumbItems.length - 1 ? (
                    <span className="text-brand-foreground font-medium">
                      {String(item.label || '')}
                    </span>
                  ) : (
                    <Link
                      href={item.href || '#'}
                      className="text-brand-text-light hover:text-brand-foreground transition-colors duration-200 cursor-pointer"
                    >
                      {String(item.label || '')}
                    </Link>
                  )}
                  {index < breadcrumbItems.length - 1 && <ChevronRight className="w-4 h-4" />}
                </div>
              ))}
            </div>
          )}
          <h1 className="text-xl sm:text-4xl font-normal text-brand-foreground mb-0.5 tracking-tight leading-snug">
            {title}
          </h1>
          {subtitle ? <p className="text-brand-text-light leading-relaxed">{subtitle}</p> : null}
        </div>

        {(children || showSearch || (showActions && hasDefaultActionButtons) || actions) && (
          <div className="flex items-center gap-4 ml-4">
            {showSearch && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder || 'Search... (⌘K)'}
                  value={searchInputValue}
                  onChange={(e) => {
                    const value = e.target.value
                    setSearchInputValue(value)
                    if (onSearchChange) onSearchChange(value)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !onSearchChange) {
                      e.preventDefault()
                      setShowGlobalSearch(true)
                    }
                  }}
                  className={resolvedSearchClass}
                />
              </div>
            )}

            {children ||
              (showActions && hasDefaultActionButtons && (
                <div className="flex items-center gap-2">
                  {onImportClick && (
                    <button
                      onClick={onImportClick}
                      className={`${resolvedActionClass} flex items-center gap-2 whitespace-nowrap`}
                    >
                      <Upload className="w-5 h-5 text-brand-text-light" />
                      <span className="text-sm font-semibold text-brand-text-light">Import</span>
                    </button>
                  )}
                  {onExportClick && (
                    <button
                      onClick={onExportClick}
                      className={`${resolvedActionClass} flex items-center gap-2 whitespace-nowrap`}
                    >
                      <Download className="w-5 h-5 text-brand-text-light" />
                      <span className="text-sm font-bold text-brand-text-light">Export</span>
                    </button>
                  )}
                  {onShareImageClick && (
                    <button
                      onClick={onShareImageClick}
                      className={resolvedActionClass}
                      title="Share Image"
                    >
                      <Image className="w-5 h-5 text-brand-text-light" />
                    </button>
                  )}
                </div>
              ))}

            {actions &&
              (Array.isArray(actions) ? (
                actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className={`${resolvedActionClass} ${action.className || ''}`}
                  >
                    {action.icon ? <action.icon className="w-5 h-5 text-brand-text-light" /> : null}
                  </button>
                ))
              ) : (
                <div className="flex items-center gap-2">{actions}</div>
              ))}
          </div>
        )}

        {showProfile && (
          <div className="flex items-center gap-3 ml-4">
            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="relative p-2.5 rounded-xl hover:bg-white/10 hover:backdrop-blur-md transition-all duration-300"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-brand-text-light" />
                {unreadCount > 0 ? (
                  <span className="absolute top-1.5 right-1.5 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white/95 shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
                {notifications.some((n) => !n.isRead && n.isUrgent) ? (
                  <span
                    className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-amber-400 border border-white animate-pulse"
                    aria-hidden
                  />
                ) : null}
              </button>
              {showNotificationDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-[99998]"
                    onClick={() => setShowNotificationDropdown(false)}
                  />
                  <div
                    className={`fixed right-6 top-20 w-96 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 z-[99999] max-h-[600px] flex flex-col ${notificationDropdownClassName || ''}`}
                  >
                    <div className="p-4 border-b border-white/20 flex items-center justify-between">
                      <h3 className="font-semibold text-brand-foreground">Notifications</h3>
                      {unreadCount > 0 ? (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-brand-primary hover:text-brand-primary/80 flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          Mark all as read
                        </button>
                      ) : null}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-8 text-center text-brand-text-light">
                          <LoadingSpinner size="sm" message="Loading notifications..." />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-brand-text-light">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left p-4 hover:bg-brand-hover transition-colors ${
                                notification.isUrgent && !notification.isRead
                                  ? 'bg-amber-50/80 border-l-4 border-amber-500'
                                  : !notification.isRead
                                    ? 'bg-blue-50/50'
                                    : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {notification.isUrgent ? (
                                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <div
                                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.isRead ? 'bg-blue-500' : 'bg-transparent'}`}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p
                                      className={`text-sm font-medium ${!notification.isRead ? 'text-brand-foreground' : 'text-brand-text-light'}`}
                                    >
                                      {notification.title}
                                    </p>
                                    {notification.isUrgent && !notification.isRead ? (
                                      <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                        Urgent
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="text-xs text-brand-text-light mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-brand-text-light mt-2">
                                    {notification.timeAgo}
                                  </p>
                                </div>
                                {!notification.isRead ? (
                                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                                ) : null}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <div
                className="relative"
                onMouseEnter={openProfileDropdown}
                onMouseLeave={scheduleCloseProfileDropdown}
              >
                <button className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 hover:backdrop-blur-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <Avatar
                      fallback={resolveUserInitials(user)}
                      alt={resolveUserDisplayName(user)}
                      size="md"
                      className={premiumAvatarClass}
                    />
                    <div className="text-left hidden lg:block">
                      <p className="text-sm font-semibold text-brand-foreground">
                        {resolveUserDisplayName(user)}
                      </p>
                      <p className="max-w-[11rem] truncate text-xs text-brand-text-light">
                        {profileEmail}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-brand-text-light transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}
                  />
                </button>
                {showProfileDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-[99998]"
                      onClick={() => setShowProfileDropdown(false)}
                    />
                    <div
                      className={`fixed right-6 top-20 w-80 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 z-[99999] ${profileDropdownClassName || ''}`}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            fallback={resolveUserInitials(user)}
                            alt={resolveUserDisplayName(user)}
                            size="xl"
                            className={premiumAvatarClass}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-brand-foreground">
                              {resolveUserDisplayName(user)}
                            </p>
                            <p className="truncate text-xs text-brand-text-light">{profileEmail}</p>
                            <p
                              className="mt-2 truncate text-xs font-medium text-orange-700"
                              title={`${activeRoleLabel} • ${activeOrgName}`}
                            >
                              {activeRoleLabel} • {activeOrgName}
                            </p>
                            <p className="mt-1 text-[11px] text-brand-text-light">
                              Account access synced from workspace role
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mx-4 border-t border-neutral-200/60" />
                      <div className="p-2">
                        <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-brand-text-light">
                          Account Actions
                        </p>
                        <button className={profileMenuItemClass}>
                          <User className={profileMenuIconClass} />
                          <span>View Profile</span>
                        </button>
                        <button className={profileMenuItemClass}>
                          <Settings className={profileMenuIconClass} />
                          <span>Settings</span>
                        </button>
                      </div>
                      <div className="mx-4 border-t border-neutral-200/60" />
                      <div className="p-2">
                        <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-brand-text-light">
                          Danger Zone
                        </p>
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
                        >
                          <LogOut className="h-[18px] w-[18px] shrink-0 stroke-[2.2]" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showSearch && renderGlobalSearchModal
        ? renderGlobalSearchModal({
            isOpen: showGlobalSearch,
            onClose: () => setShowGlobalSearch(false),
            initialQuery: searchInputValue,
          })
        : null}
    </Card>
  )
}

export default WorkspaceHeader
