import strapiClient from '../strapiClient'

class NotificationService {
  async getNotifications() {
    try {
      const response = await strapiClient.get('/notifications', {
        'pagination[pageSize]': 20,
        sort: 'createdAt:desc',
      })
      return response?.data || []
    } catch {
      return []
    }
  }

  transformNotification(item) {
    const a = item?.attributes || item || {}
    return {
      id: item?.id || a.id,
      title: a.title || 'Notification',
      message: a.message || 'No message',
      isRead: !!a.isRead,
      timeAgo: a.createdAt ? new Date(a.createdAt).toLocaleString() : 'now',
    }
  }

  async markAsRead() {
    return true
  }

  async markAllAsRead() {
    return true
  }
}

const notificationService = new NotificationService()
export default notificationService
