// Notification service for Books Portal (mirrors CRM behavior)

type StrapiListParams = Record<string, string | number | boolean | undefined>

const API_BASE_URL =
  process.env.NEXT_PUBLIC_STRAPI_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'

function getAuthHeaders() {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('strapi_token') || localStorage.getItem('auth-token')
      : null
  const orgId = typeof window !== 'undefined' ? localStorage.getItem('current-org-id') : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(orgId ? { 'X-Organization-Id': orgId } : {}),
    ...(process.env.STRAPI_API_TOKEN ? { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` } : {}),
  }
}

function qs(params?: StrapiListParams) {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) searchParams.set(k, String(v))
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers ?? {}) },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Request failed (${response.status}): ${text}`)
  }

  return response.json()
}

class NotificationService {
  async getNotifications(userId: string | number, options: { pageSize?: number } = {}) {
    try {
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId

      const params: StrapiListParams = {
        'pagination[pageSize]': options.pageSize || 100,
        sort: 'createdAt:desc',
        populate: 'user',
      }

      if (!Number.isNaN(userIdNum) && Number(userIdNum) > 0) {
        params['filters[user][id][$eq]'] = Number(userIdNum)
      } else {
        params['filters[user][documentId][$eq]'] = String(userId)
      }

      const response: any = await request(`/notifications${qs(params)}`)

      if (response?.data && Array.isArray(response.data)) return response.data
      if (response?.data?.data && Array.isArray(response.data.data)) return response.data.data
      if (Array.isArray(response)) return response
      return []
    } catch (error: any) {
      const is404 = String(error?.message || '').includes('404') || String(error?.message || '').includes('Not Found')
      if (is404) return []
      // eslint-disable-next-line no-console
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  async markAsRead(notificationId: string | number) {
    try {
      await request(`/notifications/${notificationId}`, {
        method: 'PUT',
        body: JSON.stringify({
          data: {
            isRead: true,
            readAt: new Date().toISOString(),
          },
        }),
      })
      return true
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  async markAllAsRead(userId: string | number) {
    try {
      const notifications = await this.getNotifications(userId)
      const unread = notifications.filter((n: any) => !(n?.attributes || n)?.isRead)
      await Promise.all(unread.map((n: any) => this.markAsRead((n?.attributes || n)?.id ?? n?.id)))
      return true
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  formatTime(timestamp?: string) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  transformNotification(notification: any) {
    const notificationData = notification?.attributes || notification
    const user = notificationData?.user || notification?.user || notificationData?.createdBy || {}
    const userData = user?.attributes || user
    const userName =
      userData?.firstName && userData?.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData?.name || userData?.email || 'Unknown User'

    const createdAt = notificationData?.createdAt || notification?.createdAt

    return {
      id: notificationData?.id || notification?.id,
      type: notificationData?.type || notification?.type,
      title: notificationData?.title || notification?.title,
      message: notificationData?.message || notification?.message,
      isRead:
        notificationData?.isRead !== undefined ? Boolean(notificationData.isRead) : Boolean(notification?.isRead || false),
      createdAt,
      readAt: notificationData?.readAt || notification?.readAt,
      name: userName,
      timeAgo: this.formatTime(createdAt),
      date: createdAt,
    }
  }
}

export default new NotificationService()

