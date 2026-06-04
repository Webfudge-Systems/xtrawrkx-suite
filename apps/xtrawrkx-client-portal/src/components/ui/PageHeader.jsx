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
import { Card } from "./Card";
import { useSession } from "@/lib/auth";
import { strapiClient } from "@/lib/strapiClient";
import { resolveClientAccountCompanyName } from "@/utils/clientAccountCompany";

export function PageHeader({
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
  const { data: session } = useSession();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [contacts, setContacts] = useState(null);
  const notificationDropdownRef = useRef(null);

  // Fetch contacts if not in localStorage
  useEffect(() => {
    const loadContacts = async () => {
      if (typeof window === "undefined") return;

      // Check if contacts are already in localStorage
      const contactsData = localStorage.getItem("client_contacts");
      if (contactsData) {
        try {
          setContacts(JSON.parse(contactsData));
          return;
        } catch (e) {
          console.error("Error parsing contacts from localStorage:", e);
        }
      }

      // If not in localStorage, try to fetch from API
      try {
        const currentUser = await strapiClient.getCurrentUser();
        if (currentUser?.contacts && Array.isArray(currentUser.contacts)) {
          localStorage.setItem(
            "client_contacts",
            JSON.stringify(currentUser.contacts)
          );
          setContacts(currentUser.contacts);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    };

    if (session) {
      loadContacts();
    }
  }, [session]);

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

  // Get logged-in user (person) information
  const getLoggedInUser = () => {
    if (!session) return null;

    // Get account email from localStorage (this is the logged-in contact's email)
    let loggedInEmail = null;
    let accountData = null;

    if (typeof window !== "undefined") {
      try {
        const accountDataStr = localStorage.getItem("client_account");
        if (accountDataStr) {
          accountData = JSON.parse(accountDataStr);
          loggedInEmail = accountData.email;
        }
      } catch (e) {
        console.error("Error parsing client_account:", e);
      }
    }

    // Fallback to session email
    if (!loggedInEmail) {
      const user = session.user || session.account || session;
      const userData = user?.profile || user;
      loggedInEmail = user?.email || userData?.email || session?.email;
    }

    // Try to get contact/person info from contacts state or localStorage
    let contactData = null;
    const contactsToSearch =
      contacts ||
      (typeof window !== "undefined"
        ? (() => {
            try {
              const contactsData = localStorage.getItem("client_contacts");
              return contactsData ? JSON.parse(contactsData) : null;
            } catch (e) {
              return null;
            }
          })()
        : null);

    if (
      contactsToSearch &&
      Array.isArray(contactsToSearch) &&
      contactsToSearch.length > 0
    ) {
      // Match contact by email (case-insensitive)
      if (loggedInEmail) {
        contactData = contactsToSearch.find(
          (c) => c.email?.toLowerCase() === loggedInEmail.toLowerCase()
        );
      }

      // If no match, use the first contact as fallback
      if (!contactData) {
        contactData = contactsToSearch[0];
      }
    }

    // Use contact data if available
    if (contactData) {
      const firstName = contactData.firstName || "";
      const lastName = contactData.lastName || "";
      // Capitalize first letter of each name part
      const capitalizedFirstName = firstName
        ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
        : "";
      const capitalizedLastName = lastName
        ? lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()
        : "";
      const fullName = `${capitalizedFirstName} ${capitalizedLastName}`.trim();
      return {
        name:
          fullName ||
          (contactData.email?.split("@")[0]
            ? contactData.email.split("@")[0].charAt(0).toUpperCase() +
              contactData.email.split("@")[0].slice(1).toLowerCase()
            : "User"),
        email: contactData.email || loggedInEmail || "",
        role:
          contactData.role ||
          contactData.position ||
          contactData.portalAccessLevel ||
          "Member",
        initials: fullName
          ? `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
          : (contactData.email?.charAt(0) || "U").toUpperCase(),
      };
    }

    // Fallback: Use account data formatted as person info
    if (accountData && loggedInEmail) {
      const emailName = loggedInEmail.split("@")[0];
      const capitalizedEmailName = emailName
        ? emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase()
        : "User";
      return {
        name: capitalizedEmailName,
        email: loggedInEmail,
        role: "Member",
        initials: emailName.charAt(0).toUpperCase() || "U",
      };
    }

    // Final fallback to session data
    const user = session.user || session.account || session;
    const userData = user?.profile || user;
    const name =
      user?.name || userData?.name || loggedInEmail?.split("@")[0] || "";
    // Capitalize first letter
    const capitalizedName = name
      ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
      : "User";
    return {
      name: capitalizedName,
      email: loggedInEmail || "",
      role: user?.role || userData?.role || user?.position || "Member",
      initials: name.charAt(0).toUpperCase() || "U",
    };
  };

  const loggedInUser = getLoggedInUser();

  const getUserInitials = () => {
    return loggedInUser?.initials || "U";
  };

  const getUserDisplayName = () => {
    const name = String(loggedInUser?.name || "User").trim();
    if (!name) return "User";
    return name;
  };

  const getClientDisplayName = () => {
    // Prefer the client account company name (client = company, not person).
    const fromStorage = getCompanyInfo();
    if (fromStorage) return fromStorage;

    const account = session?.account || session?.user?.account || session;
    const resolved =
      resolveClientAccountCompanyName(account) ||
      String(account?.companyName || "").trim();
    return resolved || "Client";
  };

  const getClientInitials = () => {
    const name = getClientDisplayName();
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return "C";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const getUserRole = () => {
    return loggedInUser?.role || "Member";
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Get company information
  const getCompanyInfo = () => {
    if (typeof window === "undefined") return null;

    try {
      const accountData = localStorage.getItem("client_account");
      if (accountData) {
        const account = JSON.parse(accountData);
        const resolved =
          resolveClientAccountCompanyName(account) ||
          String(account?.companyName || "").trim();
        return resolved || null;
      }
    } catch (e) {
      console.error("Error parsing client_account:", e);
    }
    return null;
  };

  // Check if this is the dashboard page
  const isDashboard = pathname === "/dashboard";

  // Build breadcrumb from pathname if not provided (dashboard omits path crumb)
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
      : isDashboard
        ? []
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
    <Card glass={true} className="relative z-[40]" padding={false}>
      <div className="flex items-center justify-between p-6">
        <div className="flex-1">
          {/* Breadcrumb */}
          {breadcrumbItems.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              {breadcrumbItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index === breadcrumbItems.length - 1 ? (
                    <span className="text-gray-900 font-medium">
                      {typeof item.label === "string"
                        ? item.label
                        : String(item.label || "")}
                    </span>
                  ) : (
                    <Link
                      href={item.href || "#"}
                      className="text-gray-500 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
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
          {isDashboard ? (
            <div>
              <h1 className="text-5xl font-light text-gray-900 tracking-tight mb-2">
                {getGreeting()}, {getUserDisplayName()}
              </h1>
              {(getCompanyInfo() || subtitle) && (
                <div className="mt-1 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-0">
                  {getCompanyInfo() && (
                    <p className="text-2xl font-semibold text-xtrawrkx-500 leading-snug">
                      {getCompanyInfo()}
                    </p>
                  )}
                  {getCompanyInfo() && subtitle && (
                    <span
                      className="hidden h-7 w-px shrink-0 bg-gray-300 sm:mx-4 sm:block"
                      aria-hidden
                    />
                  )}
                  {subtitle && (
                    <p className="text-2xl font-medium leading-snug text-gray-700">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <h1 className="text-5xl font-light text-gray-900 mb-1 tracking-tight">
                {title}
              </h1>
              {subtitle && <p className="text-gray-600">{subtitle}</p>}
            </>
          )}
        </div>

        {/* Custom content or default actions */}
        {(children || showSearch || showActions || actions) && (
          <div className="flex items-center gap-4 ml-4">
            {/* Search Bar */}
            {showSearch && (
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder={searchPlaceholder || "Search... (⌘K)"}
                  value={searchInputValue}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchInputValue(value);
                    if (onSearchChange) {
                      onSearchChange(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }}
                  className="w-64 pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30 focus:border-xtrawrkx-500 focus:bg-white/15 transition-all duration-300 placeholder:text-gray-500 shadow-lg"
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
                      className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-xtrawrkx-500 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 group shadow-lg"
                    >
                      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    </button>
                  )}

                  {onFilterClick && (
                    <button
                      onClick={onFilterClick}
                      className="relative p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                    >
                      <Filter className="w-5 h-5 text-gray-600" />
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
                      <Upload className="w-5 h-5 text-gray-600" />
                    </button>
                  )}

                  {onExportClick && (
                    <button
                      onClick={onExportClick}
                      className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                    </button>
                  )}

                  {onShareImageClick && (
                    <button
                      onClick={onShareImageClick}
                      className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 shadow-lg"
                      title="Share Image"
                    >
                      <Image className="w-5 h-5 text-gray-600" />
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
                    <action.icon className="w-5 h-5 text-gray-600" />
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
                <Bell className="w-5 h-5 text-gray-600" />
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
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                    </div>

                    {/* Notifications List */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
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
                    <span className="text-xtrawrkx-500 text-sm font-medium">
                      {getUserInitials()}
                    </span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-gray-900">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500">{getClientDisplayName()}</p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
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
                          <span className="text-xtrawrkx-500 text-sm font-medium">
                            {getUserInitials()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {getUserDisplayName()}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getClientDisplayName()}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {getUserRole()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          View Profile
                        </span>
                      </button>
                      <button className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 rounded-lg transition-colors">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-900">Settings</span>
                      </button>
                      <div className="h-px bg-gray-200 my-2 mx-3"></div>
                      <button
                        onClick={() => {
                          // Handle logout
                          if (typeof window !== "undefined") {
                            localStorage.removeItem("auth_token");
                            localStorage.removeItem("client_token");
                            window.location.href = "/auth";
                          }
                        }}
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
    </Card>
  );
}
