"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Bell, X, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    type: "message",
    title: "New message from Gabriel",
    message: "Thanks for the feedback on the designs!",
    time: "2 min ago",
    unread: true,
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    conversationId: 1,
  },
  {
    id: 2,
    type: "message",
    title: "New message from Support Team",
    message: "Your issue has been resolved",
    time: "1 hour ago",
    unread: true,
    avatar:
      "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=40&h=40&fit=crop&crop=face",
    conversationId: 2,
  },
  {
    id: 3,
    type: "message",
    title: "New message from Layla",
    message: "The wireframes look great, let's proceed",
    time: "3 hours ago",
    unread: false,
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612b47e?w=40&h=40&fit=crop&crop=face",
    conversationId: 3,
  },
];

export function ChatNotifications({ onNotificationClick }) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate unread count
  useEffect(() => {
    const unread = notifications.filter((n) => n.unread).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, unread: false } : n))
    );

    // Call parent handler
    onNotificationClick?.(notification);
    setIsOpen(false);
  };

  // Handle mark all as read
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  // Handle clear all notifications
  const handleClearAll = () => {
    setNotifications([]);
  };

  // Format time
  const formatTime = (timeString) => {
    return timeString;
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.div>
        )}
      </Button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Messages</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllRead}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear all
                    </Button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center">
                    <MessageCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="p-2">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          notification.unread
                            ? "bg-blue-50 hover:bg-blue-100"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={notification.avatar} />
                            <AvatarFallback>
                              {notification.title.split(" ")[0][0]}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4
                                className={`text-sm font-medium truncate ${
                                  notification.unread
                                    ? "text-blue-900"
                                    : "text-gray-900"
                                }`}
                              >
                                {notification.title}
                              </h4>
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">
                                  {formatTime(notification.time)}
                                </span>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                              </div>
                            </div>

                            <p
                              className={`text-sm truncate mt-1 ${
                                notification.unread
                                  ? "text-blue-700"
                                  : "text-gray-600"
                              }`}
                            >
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-blue-600 hover:text-blue-700"
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to messages page
                      window.location.href = "/messages";
                    }}
                  >
                    View all messages
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
