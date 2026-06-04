"use client";

import { motion } from "framer-motion";
import { Bell, CheckCircle2, AlertCircle, Info, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const notifications = [
  {
    id: 1,
    type: "success",
    title: "Project Completed",
    message: "Website Redesign project has been completed successfully",
    time: "2 min ago",
    read: false,
  },
  {
    id: 2,
    type: "warning",
    title: "Deadline Approaching",
    message: "Mobile App Development deadline is in 3 days",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    type: "info",
    title: "New Message",
    message: "You have received a new message from Gabriel Matuła",
    time: "3 hours ago",
    read: true,
  },
  {
    id: 4,
    type: "success",
    title: "Payment Received",
    message: "Payment of $2,500 has been received for SEO project",
    time: "1 day ago",
    read: true,
  },
];

const typeConfig = {
  success: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
};

export default function NotificationsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notifications
            </h1>
            <p className="text-gray-600">
              Stay updated with your latest activities
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              Mark all as read
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">4</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-sm text-gray-600">Unread</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">2</p>
                <p className="text-sm text-gray-600">Read</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {notifications.map((notification, index) => {
          const config = typeConfig[notification.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-200 ${
                !notification.read
                  ? "border-l-4 border-l-blue-500"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`w-10 h-10 ${config.bg} rounded-lg flex items-center justify-center border ${config.border}`}
                >
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {notification.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <Badge
                          variant="secondary"
                          className="bg-blue-100 text-blue-800"
                        >
                          New
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600">{notification.message}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
