"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useAuth } from "../../contexts/AuthContext";
import Button from "../common/Button";
import Image from "next/image";
import { commonToasts, toastUtils } from "@/src/utils/toast";
import NotificationCenter from "./NotificationCenter";
import { notificationService } from "../../services/notificationService";

const AdminLayout = ({ children, title = "Dashboard" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, signOut, refreshUser } = useAuth();
  const router = useRouter();

  // Load notifications on component mount
  useEffect(() => {
    const loadNotifications = () => {
      setNotifications(notificationService.getNotifications());
    };

    loadNotifications();

    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe(
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
      }
    );

    return unsubscribe;
  }, []);

  // Refresh user data periodically to show real-time updates
  useEffect(() => {
    if (!user || !refreshUser) return;

    // Don't refresh immediately on mount - wait a bit to avoid race conditions
    // Refresh every 10 minutes to keep user data up-to-date (less aggressive)
    const interval = setInterval(() => {
      refreshUser().catch((error) => {
        // Silently handle refresh errors - don't disrupt user experience
        console.warn("User data refresh failed:", error);
      });
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [user, refreshUser]);

  const handleSignOut = async () => {
    const loadingToast = toastUtils.loading("Signing out...");

    try {
      await signOut();
      toastUtils.update(
        loadingToast,
        "success",
        "Successfully logged out. See you next time!"
      );
      router.push("/admin/login");
    } catch (error) {
      toastUtils.update(
        loadingToast,
        "error",
        "Error signing out. Please try again."
      );
    }
  };

  // Notification handlers
  const handleMarkAsRead = (notificationId) => {
    notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: "solar:home-2-bold" },
    {
      name: "Resources",
      href: "/admin/resources",
      icon: "solar:document-text-bold",
    },
    { name: "Events", href: "/admin/events", icon: "solar:calendar-bold" },
    {
      name: "Registrations",
      href: "/admin/registrations",
      icon: "solar:users-group-rounded-bold",
    },
    { name: "Services", href: "/admin/services", icon: "solar:widget-bold" },
    { name: "Gallery", href: "/admin/gallery", icon: "solar:gallery-bold" },
    {
      name: "Team",
      href: "/admin/team",
      icon: "solar:users-group-two-rounded-bold",
    },
    {
      name: "Contact Inquiries",
      href: "/admin/contact-inquiries",
      icon: "solar:letter-bold",
    },
    {
      name: "Consultation Bookings",
      href: "/admin/consultation-bookings",
      icon: "solar:calendar-mark-bold",
    },
    // {
    //   name: "Users",
    //   href: "/admin/users",
    //   icon: "solar:users-group-rounded-bold",
    // },
    // {
    //   name: "Analytics",
    //   href: "/admin/analytics",
    //   icon: "solar:chart-square-bold",
    // },
    // { name: "Settings", href: "/admin/settings", icon: "solar:settings-bold" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <Icon
                icon="solar:close-square-bold"
                width={24}
                className="text-white"
              />
            </button>
          </div>
          <SidebarContent navigation={navigation} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent navigation={navigation} />
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Icon icon="solar:hamburger-menu-bold" width={24} />
          </button>

          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>

            <div className="ml-4 flex items-center md:ml-6">
              {/* Notifications */}
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onClearAll={handleClearAll}
              />

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center">
                  {/* User Avatar */}
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-b from-orange-400 to-pink-600 flex items-center justify-center shadow-sm">
                    {user?.email ? (
                      <span className="text-white font-semibold text-sm">
                        {user.email.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <Icon
                        icon="solar:user-bold"
                        width={20}
                        className="text-white"
                      />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="ml-3 hidden md:block">
                    <div className="text-sm font-medium text-gray-700">
                      {user?.email ||
                        user?.username ||
                        user?.displayName ||
                        "User"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.primaryRole?.name ||
                        user?.userRoles?.[0]?.name ||
                        user?.role ||
                        (user?.isAdmin ? "Administrator" : "User")}
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="ml-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
                    title="Sign out"
                  >
                    <Icon icon="solar:logout-2-bold" width={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ navigation }) => {
  const router = useRouter();
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            {/* <div className="h-8 w-8 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
              <Icon
                icon="solar:widget-bold"
                width={20}
                className="text-white"
              />
            </div> */}
            <div className=" flex items-center">
              <div className="w-10 h-10 relative mr-2">
                <Image
                  src="/logo.png"
                  alt="xtrawrkx"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  CMS Admin
                </h1>
                <p className="text-xs text-gray-500">Xtrawrkx</p>
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`${
                  isActive
                    ? "bg-brand-primary text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
              >
                <Icon
                  icon={item.icon}
                  width={20}
                  className={`${
                    isActive
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-500"
                  } mr-3`}
                />
                {item.name}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default AdminLayout;
