/**
 * Shared notification display helpers for PM/CRM headers and inbox.
 */

export function isUrgentNotification(notification) {
  const data = notification?.data || notification?.attributes?.data || {};
  const type = String(notification?.type || notification?.attributes?.type || '').toLowerCase();
  return data.priority === 'urgent' || type === 'mention';
}

export function notificationHref(notification) {
  const data = notification?.data || notification?.attributes?.data || {};
  return data.href || null;
}

export function transformNotificationForDisplay(notification, formatTime) {
  const notificationData = notification.attributes || notification;
  const rawData = notificationData.data || notification.data || {};
  const user = notificationData.user || notification.user || {};
  const userData = user.attributes || user;
  const userName =
    userData.firstName && userData.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData.name || userData.email || 'Unknown User';

  const row = {
    id: notificationData.id || notification.id,
    type: notificationData.type || notification.type,
    title: notificationData.title || notification.title,
    message: notificationData.message || notification.message,
    isRead:
      notificationData.isRead !== undefined ? notificationData.isRead : notification.isRead || false,
    createdAt: notificationData.createdAt || notification.createdAt,
    readAt: notificationData.readAt || notification.readAt,
    name: userName,
    timeAgo: formatTime(notificationData.createdAt || notification.createdAt),
    date: notificationData.createdAt || notification.createdAt,
    data: rawData,
    href: rawData.href || null,
    isUrgent: rawData.priority === 'urgent' || (notificationData.type || notification.type) === 'mention',
  };

  return row;
}
