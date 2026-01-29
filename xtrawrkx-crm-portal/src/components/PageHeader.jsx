"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Filter,
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  Settings,
  User,
  Share,
  Bell,
  Image,
  Check,
  CheckCheck,
} from "lucide-react";
import { Card } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import GlobalSearchModal from "./GlobalSearchModal";
import notificationService from "../lib/api/notificationService";

export default function PageHeader({
  title,
  subtitle,
  breadcrumb = [],
  showSearch = false,
  showActions = false,
  showProfile = true,
  searchPlaceholder,
  onSearchChange,
  onAddClick,
  onFilterClick,
  onImportClick,
  onExportClick,
  onShareImageClick,
  actions,
  children,
  hasActiveFilters = false,
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationDropdownRef = useRef(null);

  // Get current user ID - try multiple formats
  const getCurrentUserId = () => {
    if (!user) return null;
    const userData = user.attributes || user;
    // Try numeric id first, then documentId
    const userId = userData.id || user.id;
    const documentId = userData.documentId || user.documentId;

    // Prefer numeric id, fallback to documentId
    return userId || documentId || null;
  };

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      const userId = getCurrentUserId();
      if (!userId) return;

      try {
        setLoadingNotifications(true);
        const notificationsData = await notificationService.getNotifications(
          userId
        );
        const transformed = notificationsData.map(
          notificationService.transformNotification
        );
        setNotifications(transformed);
        setUnreadCount(transformed.filter((n) => !n.isRead).length);
      } catch (error) {
        console.error("Error loading notifications:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          userId: userId,
        });
      } finally {
        setLoadingNotifications(false);
      }
    };

    loadNotifications();

    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(loadNotifications, 30000);
    return () => clearInterval(pollInterval);
  }, [user]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
      ) {
        setShowNotificationDropdown(false);
      }
    };

    if (showNotificationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showNotificationDropdown]);

  // Handle keyboard shortcut (Cmd/Ctrl + K) to open global search
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (showSearch) {
          setShowGlobalSearch(true);
        }
      }
      // Also handle Escape to close
      if (e.key === "Escape" && showGlobalSearch) {
        setShowGlobalSearch(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, showGlobalSearch]);

  // Handle mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      await notificationService.markAllAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getUserInitials = () => {
    if (!user) {
      return "U";
    }

    // Handle different user data structures
    const userData = user.attributes || user;

    const firstName = userData.firstName || userData.name?.split(" ")[0] || "";
    const lastName = userData.lastName || userData.name?.split(" ")[1] || "";

    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    if (initials && initials !== " " && initials.length === 2) {
      return initials;
    }

    // Fallback to email first letter
    if (userData.email) {
      return userData.email.charAt(0).toUpperCase();
    }

    return "U";
  };

  const getUserDisplayName = () => {
    if (!user) {
      return "User";
    }

    // Handle different user data structures
    const userData = user.attributes || user;

    // Try firstName and lastName first
    if (userData.firstName && userData.lastName) {
      return `${userData.firstName} ${userData.lastName}`.trim();
    }

    // Try firstName only
    if (userData.firstName) {
      return userData.firstName;
    }

    // Try name field
    if (userData.name) {
      return userData.name;
    }

    // Try username
    if (userData.username) {
      return userData.username;
    }

    // Fallback to email
    if (userData.email) {
      return userData.email.split("@")[0];
    }

    return "User";
  };

  const getUserRole = () => {
    if (!user) {
      return "User";
    }

    // Handle different user data structures
    const userData = user.attributes || user;

    // Try primaryRole first
    if (userData.primaryRole) {
      const roleName =
        typeof userData.primaryRole === "object"
          ? userData.primaryRole.name ||
            userData.primaryRole.attributes?.name ||
            userData.primaryRole.data?.attributes?.name ||
            userData.primaryRole.data?.name
          : userData.primaryRole;
      if (roleName) {
        return roleName;
      }
    }

    // Try userRoles array
    if (
      userData.userRoles &&
      Array.isArray(userData.userRoles) &&
      userData.userRoles.length > 0
    ) {
      const firstRole = userData.userRoles[0];
      const roleName =
        typeof firstRole === "object"
          ? firstRole.name ||
            firstRole.attributes?.name ||
            firstRole.data?.attributes?.name ||
            firstRole.data?.name
          : firstRole;
      if (roleName) {
        return roleName;
      }
    }

    // Fallback to role field
    if (userData.role) {
      const roleName =
        typeof userData.role === "object"
          ? userData.role.name ||
            userData.role.attributes?.name ||
            userData.role.data?.attributes?.name ||
            userData.role.data?.name ||
            userData.role
          : userData.role;
      if (roleName) {
        return roleName;
      }
    }

    return "User";
  };

  // Build breadcrumb from pathname if not provided
  const breadcrumbItems =
    breadcrumb.length > 0
      ? breadcrumb.map((item) => {
          // Handle both string and object formats
          if (typeof item === "string") {
            // If it's a string, create a href from pathname segments
            const segments = pathname.split("/").filter(Boolean);
            const itemIndex = breadcrumb.findIndex((b) => b === item);
            if (itemIndex >= 0 && itemIndex < segments.length) {
              const href = "/" + segments.slice(0, itemIndex + 1).join("/");
              return { label: item, href };
            }
            // Fallback: use item as label, try to construct href
            return { label: item, href: "#" };
          }
          // If it's already an object, ensure it has href and label is a string
          const label =
            typeof item.label === "string"
              ? item.label
              : typeof item === "string"
              ? item
              : "";
          return {
            label: label || "Page",
            href: item.href || "#",
          };
        })
      : pathname
          .split("/")
          .filter(Boolean)
          .map((segment, index, array) => {
            const href = "/" + array.slice(0, index + 1).join("/");
            const label =
              segment.charAt(0).toUpperCase() +
              segment.slice(1).replace(/-/g, " ");
            return { label, href };
          });

  return (
    <Card glass={true} className="relative z-[40]">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Breadcrumb */}
          {breadcrumbItems.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-brand-text-light mb-2">
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index === breadcrumbItems.length - 1 ? (
                    <span className="text-brand-foreground font-medium">
                      {typeof item.label === "string"
                        ? item.label
                        : String(item.label || "")}
                    </span>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className="text-brand-text-light hover:text-brand-foreground transition-colors duration-200 cursor-pointer"
                    >
                      {typeof item.label === "string"
                        ? item.label
                        : String(item.label || "")}
                    </Link>
                  )}
                  {index < breadcrumbItems.length - 1 && (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Title and Subtitle */}
          <h1 className="text-5xl font-light text-brand-foreground mb-1 tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="text-brand-text-light">{subtitle}</p>}
        </div>

        {/* Custom content or default actions */}
        {(children || showSearch || showActions || actions) && (
          <div className="flex items-center gap-4 ml-4">
            {/* Search Bar */}
            {showSearch && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-text-light" />
                <input
                  type="text"
                  placeholder={searchPlaceholder || "Search... (⌘K)"}
                  onFocus={() => {
                    // If no custom search handler, open global search modal
                    if (!onSearchChange) {
                      setShowGlobalSearch(true);
                    }
                  }}
                  onClick={() => {
                    // If no custom search handler, open global search modal
                    if (!onSearchChange) {
                      setShowGlobalSearch(true);
                    }
                  }}
                  value={searchInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchInputValue(value);
                    // If custom handler provided, use it
                    if (onSearchChange) {
                      onSearchChange(value);
                    }
                    // Don't auto-open modal on typing - user can press Enter to open
                  }}
                  onKeyDown={(e) => {
                    // Open global search modal on Enter key
                    if (e.key === "Enter") {
                      e.preventDefault();
                      // Open modal with current search value
                      setShowGlobalSearch(true);
                    }
                  }}
                  className="w-64 pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary focus:bg-white/15 transition-all duration-300 placeholder:text-brand-text-light shadow-lg cursor-pointer"
                />
              </div>
            )}

            {/* Actions */}
            {children ||
              (showActions && (
                <div className="flex items-center gap-2">
                  {onAddClick && (
                    <button
                      onClick={onAddClick}
                      className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-brand-primary rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group shadow-lg"
                    >
                      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                  )}

                  {onFilterClick && (
                    <button
                      onClick={onFilterClick}
                      className="relative p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                    >
                      <Filter className="w-5 h-5 text-brand-text-light" />
                      {hasActiveFilters && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white/95 shadow-sm"></span>
                      )}
                    </button>
                  )}

                  {onImportClick && (
                    <button
                      onClick={onImportClick}
                      className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                    >
                      <Upload className="w-5 h-5 text-brand-text-light" />
                    </button>
                  )}

                  {onExportClick && (
                    <button
                      onClick={onExportClick}
                      className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                    >
                      <Download className="w-5 h-5 text-brand-text-light" />
                    </button>
                  )}

                  {onShareImageClick && (
                    <button
                      onClick={onShareImageClick}
                      className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                      title="Share Image"
                    >
                      <Image className="w-5 h-5 text-brand-text-light" />
                    </button>
                  )}
                </div>
              ))}

            {/* Custom Actions */}
            {actions &&
              actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg ${
                    action.className || ""
                  }`}
                >
                  {action.icon && (
                    <action.icon className="w-5 h-5 text-brand-text-light" />
                  )}
                </button>
              ))}
          </div>
        )}

        {/* Notifications & User Profile */}
        {showProfile && (
          <div className="flex items-center gap-3 ml-4">
            {/* Notification Button */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() =>
                  setShowNotificationDropdown(!showNotificationDropdown)
                }
                className="relative p-2.5 rounded-xl hover:bg-white/10 hover:backdrop-blur-md transition-all duration-300"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-brand-text-light" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white/95 shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotificationDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-[99998]"
                    onClick={() => setShowNotificationDropdown(false)}
                  />
                  <div
                    className="fixed right-6 top-20 w-96 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 z-[99999] max-h-[600px] flex flex-col"
                    style={{ zIndex: 99999 }}
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-white/20 flex items-center justify-between">
                      <h3 className="font-semibold text-brand-foreground">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-brand-primary hover:text-brand-primary/80 flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="flex-1 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="p-8 text-center text-brand-text-light">
                          <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          <p className="text-sm">Loading notifications...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-brand-text-light">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => handleMarkAsRead(notification.id)}
                              className={`w-full text-left p-4 hover:bg-brand-hover transition-colors ${
                                !notification.isRead ? "bg-blue-50/50" : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    !notification.isRead
                                      ? "bg-blue-500"
                                      : "bg-transparent"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-medium ${
                                      !notification.isRead
                                        ? "text-brand-foreground"
                                        : "text-brand-text-light"
                                    }`}
                                  >
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-brand-text-light mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-brand-text-light mt-2">
                                    {notification.timeAgo}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-1" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 hover:backdrop-blur-md transition-all duration-300"
                onMouseEnter={() => setShowProfileDropdown(true)}
                onMouseLeave={() => setShowProfileDropdown(false)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-brand-primary text-sm font-medium">
                      {getUserInitials()}
                    </span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-brand-foreground">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-brand-text-light">
                      {getUserRole()}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-brand-text-light transition-transform ${
                    showProfileDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-[99998]"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  <div
                    className="fixed right-6 top-20 w-72 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 z-[99999]"
                    onMouseEnter={() => setShowProfileDropdown(true)}
                    onMouseLeave={() => setShowProfileDropdown(false)}
                    style={{ zIndex: 99999 }}
                  >
                    <div className="p-4 border-b border-white/20">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-brand-primary text-sm font-medium">
                            {getUserInitials()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-brand-foreground">
                            {getUserDisplayName()}
                          </p>
                          <p className="text-sm text-brand-text-light">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-hover rounded-lg transition-colors">
                        <User className="w-4 h-4 text-brand-text-light" />
                        <span className="text-sm text-brand-foreground">
                          View Profile
                        </span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-brand-hover rounded-lg transition-colors">
                        <Settings className="w-4 h-4 text-brand-text-light" />
                        <span className="text-sm text-brand-foreground">
                          Settings
                        </span>
                      </button>
                      <div className="h-px bg-brand-border my-2 mx-3"></div>
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                      >
                        <Share className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      {showSearch && (
        <GlobalSearchModal
          isOpen={showGlobalSearch}
          onClose={() => {
            setShowGlobalSearch(false);
            // Optionally clear search input when closing
            // setSearchInputValue("");
          }}
          initialQuery={searchInputValue}
        />
      )}
    </Card>
  );
}
