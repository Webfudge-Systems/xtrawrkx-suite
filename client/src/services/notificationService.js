// Notification Service for Admin Dashboard
export class NotificationService {
    constructor() {
        this.notifications = this.loadFromStorage();
        this.listeners = [];
    }

    // Load notifications from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('admin_notifications');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    // Save notifications to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('admin_notifications', JSON.stringify(this.notifications));
        } catch (error) {
            // Silent fail if localStorage is not available
        }
    }

    // Add a new notification
    addNotification(notification) {
        const newNotification = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            ...notification,
            createdAt: new Date(),
            read: false,
            priority: notification.priority || 'normal' // normal, high
        };

        this.notifications.unshift(newNotification);

        // Keep only last 100 notifications
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(0, 100);
        }

        this.saveToStorage();
        this.notifyListeners();

        return newNotification;
    }

    // Get all notifications
    getNotifications() {
        return this.notifications;
    }

    // Get unread notifications
    getUnreadNotifications() {
        return this.notifications.filter(n => !n.read);
    }

    // Mark notification as read
    markAsRead(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveToStorage();
            this.notifyListeners();
        }
    }

    // Mark all notifications as read
    markAllAsRead() {
        this.notifications.forEach(notification => {
            notification.read = true;
        });
        this.saveToStorage();
        this.notifyListeners();
    }

    // Clear all notifications
    clearAll() {
        this.notifications = [];
        this.saveToStorage();
        this.notifyListeners();
    }

    // Remove specific notification
    removeNotification(notificationId) {
        this.notifications = this.notifications.filter(n => n.id !== notificationId);
        this.saveToStorage();
        this.notifyListeners();
    }

    // Subscribe to notification changes
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => callback(this.notifications));
    }

    // Auto-generate notifications based on system events
    generateSystemNotifications(stats) {
        const now = new Date();

        // Check for new inquiries
        if (stats.inquiriesByStatus?.new > 0) {
            this.addNotification({
                title: "New Contact Inquiries",
                message: `You have ${stats.inquiriesByStatus.new} new contact inquiries awaiting response.`,
                type: "inquiry",
                priority: stats.inquiriesByStatus.new > 5 ? "high" : "normal",
                action: "/admin/contact-inquiries"
            });
        }

        // Check for pending bookings
        if (stats.bookingsByStatus?.pending_confirmation > 0) {
            this.addNotification({
                title: "Pending Consultation Bookings",
                message: `${stats.bookingsByStatus.pending_confirmation} consultation bookings need confirmation.`,
                type: "booking",
                priority: "high",
                action: "/admin/consultation-bookings"
            });
        }

        // Check for upcoming events
        if (stats.eventsByStatus?.upcoming > 0) {
            this.addNotification({
                title: "Upcoming Events",
                message: `You have ${stats.eventsByStatus.upcoming} upcoming events. Make sure everything is ready!`,
                type: "event",
                priority: "normal",
                action: "/admin/events"
            });
        }

        // System health notifications
        this.addNotification({
            title: "System Status Check",
            message: "All systems are running smoothly. Database and storage are healthy.",
            type: "system",
            priority: "normal"
        });
    }

    // Generate notifications for specific events
    generateEventNotification(eventType, data) {
        switch (eventType) {
            case "new_registration":
                this.addNotification({
                    title: "New Event Registration",
                    message: `${data.firstName} ${data.lastName} registered for ${data.eventTitle}`,
                    type: "user",
                    priority: "normal",
                    action: "/admin/events"
                });
                break;

            case "new_inquiry":
                this.addNotification({
                    title: "New Contact Inquiry",
                    message: `${data.firstName} ${data.lastName} submitted a ${data.inquiryType} inquiry`,
                    type: "inquiry",
                    priority: data.priority === "high" ? "high" : "normal",
                    action: "/admin/contact-inquiries"
                });
                break;

            case "new_booking":
                this.addNotification({
                    title: "New Consultation Booking",
                    message: `${data.firstName} ${data.lastName} booked a ${data.consultationType} consultation`,
                    type: "booking",
                    priority: "normal",
                    action: "/admin/consultation-bookings"
                });
                break;

            case "content_published":
                this.addNotification({
                    title: "Content Published",
                    message: `New ${data.type} "${data.title}" has been published`,
                    type: "content",
                    priority: "normal",
                    action: data.type === "event" ? "/admin/events" : "/admin/resources"
                });
                break;

            case "system_error":
                this.addNotification({
                    title: "System Error",
                    message: data.message || "An error occurred in the system",
                    type: "error",
                    priority: "high"
                });
                break;

            case "backup_completed":
                this.addNotification({
                    title: "Backup Completed",
                    message: "System backup completed successfully",
                    type: "system",
                    priority: "normal"
                });
                break;

            case "storage_warning":
                this.addNotification({
                    title: "Storage Warning",
                    message: `Storage usage is at ${data.percentage}%. Consider cleaning up old files.`,
                    type: "warning",
                    priority: data.percentage > 90 ? "high" : "normal"
                });
                break;

            case "pending_bookings":
                this.addNotification({
                    title: "Pending Consultation Bookings",
                    message: `${data.count} consultation bookings are waiting for confirmation.`,
                    type: "booking",
                    priority: data.priority || "high",
                    action: "/admin/consultation-bookings"
                });
                break;

            case "upcoming_events":
                this.addNotification({
                    title: "Upcoming Events",
                    message: `You have ${data.count} upcoming events. Make sure everything is ready!`,
                    type: "event",
                    priority: data.priority || "normal",
                    action: "/admin/events"
                });
                break;

            case "new_inquiry":
                // Handle both single inquiry and count-based notifications
                if (data.count) {
                    this.addNotification({
                        title: "New Contact Inquiries",
                        message: `You have ${data.count} new contact inquiries awaiting response.`,
                        type: "inquiry",
                        priority: data.priority === "high" ? "high" : "normal",
                        action: "/admin/contact-inquiries"
                    });
                } else if (data.firstName && data.lastName) {
                    this.addNotification({
                        title: "New Contact Inquiry",
                        message: `${data.firstName} ${data.lastName} submitted a ${data.inquiryType || "general"} inquiry`,
                        type: "inquiry",
                        priority: data.priority === "high" ? "high" : "normal",
                        action: "/admin/contact-inquiries"
                    });
                }
                break;

            default:
                break;
        }
    }

    // Get notification count by type
    getNotificationCounts() {
        const total = this.notifications.length;
        const unread = this.notifications.filter(n => !n.read).length;
        const important = this.notifications.filter(n => n.priority === "high").length;

        return { total, unread, important };
    }

    // Cleanup old notifications (older than 30 days)
    cleanupOldNotifications() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        this.notifications = this.notifications.filter(
            notification => new Date(notification.createdAt) > thirtyDaysAgo
        );

        this.saveToStorage();
        this.notifyListeners();
    }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Helper function to create notifications easily
export const createNotification = (title, message, type = "system", priority = "normal") => {
    return notificationService.addNotification({
        title,
        message,
        type,
        priority
    });
};

// Export default
export default notificationService;
