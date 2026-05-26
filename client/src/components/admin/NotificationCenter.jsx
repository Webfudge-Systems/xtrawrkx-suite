"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { formatRelativeTime } from "../../utils/dateUtils";

const NotificationCenter = ({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("all"); // all, unread, important
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = notifications.filter((notification) => {
    switch (filter) {
      case "unread":
        return !notification.read;
      case "important":
        return notification.priority === "high";
      default:
        return true;
    }
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case "system":
        return "solar:settings-bold";
      case "user":
        return "solar:user-bold";
      case "content":
        return "solar:document-text-bold";
      case "error":
        return "solar:danger-triangle-bold";
      case "success":
        return "solar:check-circle-bold";
      case "warning":
        return "solar:info-circle-bold";
      case "event":
        return "solar:calendar-bold";
      case "inquiry":
        return "solar:letter-bold";
      case "booking":
        return "solar:calendar-mark-bold";
      default:
        return "solar:bell-bold";
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === "high") return "text-red-600";

    switch (type) {
      case "system":
        return "text-blue-600";
      case "user":
        return "text-purple-600";
      case "content":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "event":
        return "text-blue-600";
      case "inquiry":
        return "text-orange-600";
      case "booking":
        return "text-teal-600";
      default:
        return "text-gray-600";
    }
  };

  const getNotificationBgColor = (type, priority) => {
    if (priority === "high") return "bg-red-50";

    switch (type) {
      case "system":
        return "bg-blue-50";
      case "user":
        return "bg-purple-50";
      case "content":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      case "success":
        return "bg-green-50";
      case "warning":
        return "bg-yellow-50";
      case "event":
        return "bg-blue-50";
      case "inquiry":
        return "bg-orange-50";
      case "booking":
        return "bg-teal-50";
      default:
        return "bg-gray-50";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Icon icon="solar:bell-bold" width={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-[600px] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Icon
                    icon="solar:close-circle-bold"
                    width={20}
                    className="text-gray-400"
                  />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1">
              {[
                { key: "all", label: "All", count: notifications.length },
                { key: "unread", label: "Unread", count: unreadCount },
                {
                  key: "important",
                  label: "Important",
                  count: notifications.filter((n) => n.priority === "high")
                    .length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filter === tab.key
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-blue-50/50" : ""
                    }`}
                    onClick={() => {
                      onMarkAsRead(notification.id);
                      if (notification.action) {
                        router.push(notification.action);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div
                        className={`p-2 rounded-lg ${getNotificationBgColor(
                          notification.type,
                          notification.priority
                        )}`}
                      >
                        <Icon
                          icon={getNotificationIcon(notification.type)}
                          width={16}
                          className={getNotificationColor(
                            notification.type,
                            notification.priority
                          )}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p
                              className={`text-sm ${
                                !notification.read
                                  ? "font-semibold text-gray-900"
                                  : "font-medium text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center mt-2 space-x-2">
                              <span className="text-xs text-gray-400">
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                              {notification.priority === "high" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  <Icon
                                    icon="solar:danger-triangle-bold"
                                    width={10}
                                    className="mr-1"
                                  />
                                  High Priority
                                </span>
                              )}
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Icon
                  icon="solar:bell-off-bold"
                  width={48}
                  className="text-gray-300 mx-auto mb-4"
                />
                <p className="text-gray-500 text-sm">
                  {filter === "all"
                    ? "No notifications yet"
                    : filter === "unread"
                    ? "No unread notifications"
                    : "No important notifications"}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={onClearAll}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                >
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
