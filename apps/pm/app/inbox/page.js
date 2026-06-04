'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@webfudge/auth'
import Link from 'next/link'
import {
  Card,
  EmptyState,
  Badge,
  Button,
  LoadingSpinner,
  TabsWithActions,
  Input,
  ActivitiesTimeline,
  Pagination,
} from '@webfudge/ui'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Search,
  Info,
  AlertTriangle,
  AlertCircle,
  MessageSquare,
  Archive,
  RefreshCw,
  Activity,
} from 'lucide-react'
import PMPageHeader from '../../components/PMPageHeader'
import PmInboxThreadsTab from '../../components/PmInboxThreadsTab'
import notificationService from '../../lib/api/notificationService'
import { fetchPmActivityFeed } from '../../lib/api/pmInboxService'

const PAGE_SIZE = 25
const ARCHIVE_KEY = 'pm-inbox-archived-notification-ids'

const NOTIFY_SUB = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
  { id: 'archived', label: 'Archived' },
]

function loadArchivedIds() {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return new Set(Array.isArray(arr) ? arr.map(String) : [])
  } catch {
    return new Set()
  }
}

function saveArchivedIds(set) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

function getNotificationIcon(type, isUrgent) {
  if (isUrgent || (type || '').toLowerCase() === 'mention') {
    return <AlertTriangle className="h-4 w-4 text-amber-600" />
  }
  const map = {
    info: <Info className="h-4 w-4 text-blue-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
    error: <AlertCircle className="h-4 w-4 text-red-500" />,
    message: <MessageSquare className="h-4 w-4 text-purple-500" />,
    success: <Check className="h-4 w-4 text-green-500" />,
    mention: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    task_comment: <MessageSquare className="h-4 w-4 text-purple-500" />,
    project_comment: <MessageSquare className="h-4 w-4 text-purple-500" />,
  }
  return map[(type || '').toLowerCase()] || <Bell className="h-4 w-4 text-gray-400" />
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

/** Deep link to project/task detail from CRM activity row. */
function pmEntityHrefForRow(row) {
  const st = String(row?.subjectType || '').toLowerCase()
  const id = row?.subjectId
  if (id == null || id === '') return null
  if (st === 'project') return `/projects/${id}`
  if (st === 'task') return `/tasks/${id}`
  return null
}

function notificationIsUrgent(attrs) {
  const data = attrs?.data || {}
  return data.priority === 'urgent' || String(attrs?.type || '').toLowerCase() === 'mention'
}

export default function InboxPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [mainTab, setMainTab] = useState('activity')
  const [notifySub, setNotifySub] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [markingRead, setMarkingRead] = useState(false)
  const [archivedIds, setArchivedIds] = useState(() => new Set())

  const [actItems, setActItems] = useState([])
  const [actTotal, setActTotal] = useState(0)
  const [actPage, setActPage] = useState(1)
  const [actLoading, setActLoading] = useState(false)
  const [actError, setActError] = useState(null)

  const getCurrentUserId = () => {
    if (!user) return null
    const u = user.attributes || user
    return u.id || user.id || u.documentId || user.documentId || null
  }

  useEffect(() => {
    setArchivedIds(loadArchivedIds())
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      setNotifLoading(true)
      const userId = getCurrentUserId()
      const res = await notificationService.getNotifications(userId, { pageSize: 200 })
      setNotifications(Array.isArray(res) ? res : res?.data || [])
    } catch {
      setNotifications([])
    } finally {
      setNotifLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [loadNotifications])

  const loadActivity = useCallback(async () => {
    try {
      setActLoading(true)
      setActError(null)
      const start = (actPage - 1) * PAGE_SIZE
      const { data, total } = await fetchPmActivityFeed({ limit: PAGE_SIZE, start })
      setActItems(Array.isArray(data) ? data : [])
      setActTotal(typeof total === 'number' ? total : 0)
    } catch (e) {
      console.error(e)
      setActError(e?.message || 'Failed to load activity')
      setActItems([])
      setActTotal(0)
    } finally {
      setActLoading(false)
    }
  }, [actPage])

  useEffect(() => {
    if (mainTab !== 'activity') return
    loadActivity()
  }, [mainTab, loadActivity])

  const handleMarkRead = async (id) => {
    try {
      setMarkingRead(true)
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                attributes: {
                  ...(n.attributes || {}),
                  read: true,
                  isRead: true,
                },
              }
            : n
        )
      )
    } catch {
      /* ignore */
    } finally {
      setMarkingRead(false)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      setMarkingRead(true)
      const userId = getCurrentUserId()
      await notificationService.markAllAsRead(userId)
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          attributes: {
            ...(n.attributes || {}),
            read: true,
            isRead: true,
          },
        }))
      )
    } catch {
      /* ignore */
    } finally {
      setMarkingRead(false)
    }
  }

  const toggleArchive = (id) => {
    const sid = String(id)
    setArchivedIds((prev) => {
      const next = new Set(prev)
      if (next.has(sid)) next.delete(sid)
      else next.add(sid)
      saveArchivedIds(next)
      return next
    })
  }

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => {
      const attrs = n.attributes || n
      const isRead = attrs.read || attrs.isRead
      if (isRead) return false
      if (archivedIds.has(String(n.id))) return false
      return true
    }).length
  }, [notifications, archivedIds])

  const archivedCount = archivedIds.size

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const attrs = n.attributes || n
      const isRead = attrs.read || attrs.isRead
      const isArchived = archivedIds.has(String(n.id))
      if (notifySub === 'archived') return isArchived
      if (isArchived) return false
      if (notifySub === 'unread') return !isRead
      if (notifySub === 'read') return isRead
      return true
    })
  }, [notifications, notifySub, archivedIds])

  const filtered = filteredNotifications.filter((n) => {
    if (!searchQuery) return true
    const attrs = n.attributes || n
    const q = searchQuery.toLowerCase()
    return (
      (attrs.title || '').toLowerCase().includes(q) ||
      (attrs.message || attrs.body || '').toLowerCase().includes(q)
    )
  })

  const notifySubTabsWithBadges = useMemo(() => {
    let all = 0
    let unread = 0
    let read = 0
    for (const n of notifications) {
      const attrs = n.attributes || n
      const isRead = attrs.read || attrs.isRead
      const isArchived = archivedIds.has(String(n.id))
      if (isArchived) continue
      all += 1
      if (!isRead) unread += 1
      else read += 1
    }
    return NOTIFY_SUB.map((t) => {
      if (t.id === 'all') return { ...t, badge: all || undefined }
      if (t.id === 'unread') return { ...t, badge: unread || undefined }
      if (t.id === 'read') return { ...t, badge: read || undefined }
      if (t.id === 'archived') return { ...t, badge: archivedCount || undefined }
      return t
    })
  }, [notifications, archivedIds, archivedCount])

  const selectedNotification = selectedId ? notifications.find((n) => n.id === selectedId) : null

  const totalPages = Math.max(1, Math.ceil(actTotal / PAGE_SIZE))
  const from = actTotal === 0 ? 0 : (actPage - 1) * PAGE_SIZE + 1
  const to = Math.min(actPage * PAGE_SIZE, actTotal)

  const mainTabsWithBadges = [
    { id: 'activity', label: 'All activity', badge: actTotal > 0 ? actTotal : undefined },
    { id: 'notifications', label: 'Notifications & alerts', badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'threads', label: 'Threads' },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PMPageHeader
        title="Inbox"
        subtitle="PM-wide activity, alerts, and project & task comment threads for your organization."
        showProfile
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Inbox', href: '/inbox' },
        ]}
        actions={
          mainTab === 'notifications' && unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          ) : mainTab === 'activity' ? (
            <Button variant="outline" size="sm" onClick={() => loadActivity()} disabled={actLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${actLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          ) : null
        }
      />

      <TabsWithActions
        variant="pill"
        tabs={mainTabsWithBadges}
        activeTab={mainTab}
        onTabChange={(id) => {
          setMainTab(id)
          setSelectedId(null)
        }}
      />

      {mainTab === 'notifications' ? (
        <TabsWithActions
          variant="modern"
          className="max-w-2xl"
          tabs={notifySubTabsWithBadges}
          activeTab={notifySub}
          onTabChange={setNotifySub}
        />
      ) : null}

      {mainTab === 'activity' ? (
        <Card className="overflow-hidden rounded-xl border border-gray-200 shadow-md">
          <div className="flex flex-col gap-1 border-b border-gray-200 bg-gray-50/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Activity className="h-5 w-5 text-orange-500" aria-hidden />
              Projects & tasks — all activity
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!actLoading && actTotal > 0 && (
                <span className="tabular-nums text-xs text-gray-600">
                  {from}–{to} of {actTotal}
                </span>
              )}
              <Button type="button" variant="outline" size="sm" disabled={actLoading} onClick={() => loadActivity()}>
                <RefreshCw className={`mr-2 h-4 w-4 ${actLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <div className="p-4 md:p-6">
            <ActivitiesTimeline
              items={actItems}
              loading={actLoading}
              error={actError}
              entityHrefForRow={pmEntityHrefForRow}
            />
          </div>
          {totalPages > 1 && !actLoading && !actError && (
            <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 md:px-6">
              <Pagination
                currentPage={actPage}
                totalPages={totalPages}
                totalItems={actTotal}
                itemsPerPage={PAGE_SIZE}
                onPageChange={setActPage}
              />
            </div>
          )}
        </Card>
      ) : null}

      {mainTab === 'notifications' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card padding={false} variant="elevated" className="overflow-hidden rounded-xl border border-gray-100 shadow-md">
              {notifications.length > 0 && (
                <div className="border-b border-gray-100 p-3">
                  <Input
                    icon={Search}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search alerts…"
                    className="rounded-lg"
                    containerClassName="mb-0"
                  />
                </div>
              )}

              {notifLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <LoadingSpinner size="md" message="Loading…" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={notifySub === 'archived' ? Archive : BellOff}
                    title={notifySub === 'archived' ? 'Nothing archived' : 'No notifications found'}
                    description={
                      notifySub === 'archived'
                        ? 'Archive items from the detail panel to hide them from your main lists.'
                        : 'System alerts, assignments, and mentions will appear here.'
                    }
                  />
                </div>
              ) : (
                <div className="max-h-[600px] divide-y divide-gray-50 overflow-y-auto">
                  {filtered.map((notification) => {
                    const attrs = notification.attributes || notification
                    const isRead = attrs.read || attrs.isRead
                    const isUrgent = notificationIsUrgent(attrs)
                    const isSelected = selectedId === notification.id
                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => {
                          setSelectedId(notification.id)
                          if (!isRead && notifySub !== 'archived') handleMarkRead(notification.id)
                          const href = attrs.data?.href
                          if (href) router.push(href)
                        }}
                        className={`w-full p-4 text-left transition-colors ${
                          isSelected
                            ? 'border-r-2 border-orange-500 bg-orange-50'
                            : isUrgent && !isRead
                              ? 'bg-amber-50/60 hover:bg-amber-50'
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                              isUrgent && !isRead
                                ? 'bg-amber-100'
                                : isRead
                                  ? 'bg-gray-100'
                                  : 'bg-orange-100'
                            }`}
                          >
                            {getNotificationIcon(attrs.type, isUrgent)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`truncate text-sm font-medium ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                                {attrs.title || 'Notification'}
                              </p>
                              {isUrgent && !isRead ? (
                                <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                                  Urgent
                                </Badge>
                              ) : null}
                              {!isRead && notifySub !== 'archived' && (
                                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-orange-500" />
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-gray-500">{attrs.message || attrs.body || ''}</p>
                            <p className="mt-1 text-xs text-gray-400">{timeAgo(attrs.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-3">
            {selectedNotification ? (
              <Card variant="elevated" className="rounded-xl border border-gray-100 shadow-md">
                {(() => {
                  const attrs = selectedNotification.attributes || selectedNotification
                  const isRead = attrs.read || attrs.isRead
                  const isUrgent = notificationIsUrgent(attrs)
                  const isArchived = archivedIds.has(String(selectedNotification.id))
                  const deepLink = attrs.data?.href
                  return (
                    <>
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              isUrgent ? 'bg-amber-100' : 'bg-orange-100'
                            }`}
                          >
                            {getNotificationIcon(attrs.type, isUrgent)}
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">{attrs.title || 'Notification'}</h2>
                            <p className="text-sm text-gray-500">{timeAgo(attrs.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {!isRead && <Badge variant="warning" dot>Unread</Badge>}
                          {isUrgent && !isRead ? (
                            <Badge variant="warning" className="text-[10px]">
                              Urgent
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <p className="leading-relaxed text-gray-700">{attrs.message || attrs.body || 'No content.'}</p>
                      {deepLink && (
                        <Link
                          href={deepLink}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:underline"
                        >
                          Open related item →
                        </Link>
                      )}
                      {attrs.link && (
                        <a href={attrs.link} className="mt-4 inline-flex items-center gap-2 text-sm text-orange-600 hover:underline">
                          Open link →
                        </a>
                      )}
                      <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                        {!isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkRead(selectedNotification.id)}
                            disabled={markingRead}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Mark read
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => toggleArchive(selectedNotification.id)}>
                          <Archive className="mr-2 h-4 w-4" />
                          {isArchived ? 'Unarchive' : 'Archive'}
                        </Button>
                        <a href="/message" className="inline-flex items-center text-sm text-gray-500 hover:text-orange-600">
                          <MessageSquare className="mr-1 h-4 w-4" />
                          Direct messages
                        </a>
                      </div>
                    </>
                  )
                })()}
              </Card>
            ) : (
              <Card variant="elevated" className="flex min-h-[300px] h-full items-center justify-center rounded-xl border border-gray-100 shadow-md">
                <EmptyState
                  icon={Bell}
                  title="Nothing selected"
                  description="Choose an alert from the list. Unread items are marked read when opened."
                />
              </Card>
            )}
          </div>
        </div>
      ) : null}

      {mainTab === 'threads' ? <PmInboxThreadsTab /> : null}
    </div>
  )
}
