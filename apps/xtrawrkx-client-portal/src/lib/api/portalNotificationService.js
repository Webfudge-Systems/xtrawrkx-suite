import { transformNotificationForDisplay } from "@webfudge/ui/utils/notificationDisplay";

/**
 * Portal notification adapter — same shape as PM/CRM notificationService
 * for future AppPageHeader integration. Returns empty until Strapi
 * client notifications are wired.
 */
class PortalNotificationService {
  async getNotifications() {
    return [];
  }

  async getUnreadCount() {
    return 0;
  }

  async markAsRead() {
    return true;
  }

  async markAllAsRead() {
    return true;
  }

  transformNotification(notification) {
    return transformNotificationForDisplay(notification);
  }
}

const portalNotificationService = new PortalNotificationService();
export default portalNotificationService;
