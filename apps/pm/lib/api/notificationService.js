import strapiClient from '../strapiClient';
import { transformNotificationForDisplay } from '@webfudge/ui/utils/notificationDisplay';

class NotificationService {
  async getNotifications(userId, options = {}) {
    try {
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      const params = {
        'pagination[pageSize]': options.pageSize || 100,
        'sort': 'createdAt:desc',
        populate: 'user',
      };

      if (!isNaN(userIdNum) && userIdNum > 0) {
        params['filters[user][id][$eq]'] = userIdNum;
      } else {
        params['filters[user][documentId][$eq]'] = String(userId);
      }

      const response = await strapiClient.get('/notifications', params);

      let notifications = [];
      if (response?.data && Array.isArray(response.data)) {
        notifications = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        notifications = response.data.data;
      } else if (Array.isArray(response)) {
        notifications = response;
      }

      return notifications;
    } catch (error) {
      const is404 = error?.message?.includes('404') || error?.message?.includes('Not Found');
      if (is404) return [];
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async getUnreadCount(userId) {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter((n) => !n.isRead).length;
    } catch {
      return 0;
    }
  }

  async markAsRead(notificationId) {
    try {
      await strapiClient.put(`/notifications/${notificationId}`, {
        data: { isRead: true, readAt: new Date().toISOString() },
      });
      return true;
    } catch {
      return false;
    }
  }

  async markAllAsRead(userId) {
    try {
      const notifications = await this.getNotifications(userId);
      await Promise.all(notifications.filter((n) => !n.isRead).map((n) => this.markAsRead(n.id)));
      return true;
    } catch {
      return false;
    }
  }

  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  transformNotification(notification) {
    return transformNotificationForDisplay(notification, (ts) => this.formatTime(ts));
  }
}

export default new NotificationService();
