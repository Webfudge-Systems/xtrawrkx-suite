// Notification service for CRM Portal
import strapiClient from '../strapiClient';
import { addPopulate } from './strapiContentApi';
import { transformNotificationForDisplay } from '@webfudge/ui/utils/notificationDisplay';

class NotificationService {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(userId, options = {}) {
    try {
      // Try multiple user ID formats to ensure we find the user
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;

      const params = {
        'pagination[pageSize]': options.pageSize || 100,
        sort: 'createdAt:desc',
      };
      addPopulate(params, ['user']);

      // Try filtering by user id (numeric) - this is what notifications are created with
      if (!isNaN(userIdNum) && userIdNum > 0) {
        params['filters[user][id][$eq]'] = userIdNum;
      } else {
        // Fallback to documentId if id is not numeric
        params['filters[user][documentId][$eq]'] = String(userId);
      }


      const response = await strapiClient.get('/notifications', params);

      // Handle different response structures
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
      // 404 = notifications API not implemented yet; return empty without logging
      const is404 = error?.message?.includes('404') || error?.message?.includes('Not Found');
      if (is404) {
        return [];
      }
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId) {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter(n => !n.isRead).length;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      await strapiClient.put(`/notifications/${notificationId}`, {
        data: {
          isRead: true,
          readAt: new Date().toISOString(),
        },
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      const notifications = await this.getNotifications(userId);
      const unreadNotifications = notifications.filter(n => !n.isRead);

      await Promise.all(
        unreadNotifications.map(n => this.markAsRead(n.id))
      );

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Format notification time
   */
  formatTime(timestamp) {
    if (!timestamp) return "";
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

  /**
   * Transform notification data for frontend
   */
  transformNotification(notification) {
    return transformNotificationForDisplay(notification, (ts) => this.formatTime(ts));
  }
}

export default new NotificationService();
