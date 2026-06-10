"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  PanelLeftClose,
  X,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/lib/auth";
import {
  sidebarMenuConfig,
  getUserRole,
  hasPermission,
  MENU_ITEM_TYPES,
} from "@/config/sidebarMenu";
import { useChat } from "@/components/providers/ChatProvider";
import { fetchDedicatedPoc, getCurrentUser } from "@/lib/api/authService";
import {
  getClientAccountFromStorage,
  getDedicatedPoc,
  isPocAssigned,
} from "@/lib/pocUtils";
import DedicatedPocSidebarCard from "./DedicatedPocSidebarCard";
import SupportAssistanceCard from "./SupportAssistanceCard";

export function Sidebar({ isOpen, onClose, onToggle }) {
  const collapsed = false;
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = getUserRole(session);
  const { unreadCount } = useChat();

  // Track expanded/collapsed state for each section
  const [expandedSections, setExpandedSections] = useState(() => {
    const initialState = {};
    sidebarMenuConfig.forEach((section) => {
      if (section.collapsible) {
        initialState[section.id] = section.defaultExpanded ?? true;
      }
    });
    return initialState;
  });

  // Track expanded submenu items (e.g., Billing submenu)
  const [expandedSubmenus, setExpandedSubmenus] = useState({});
  const [pocSnapshot, setPocSnapshot] = useState({
    pocAssigned: false,
    dedicatedPoc: null,
  });

  const refreshClientAccount = useCallback(async () => {
    try {
      await getCurrentUser();
    } catch {
      // fall back to cached account
    }

    const pocFromApi = await fetchDedicatedPoc();
    if (pocFromApi) {
      setPocSnapshot({
        pocAssigned: pocFromApi.pocAssigned,
        dedicatedPoc: pocFromApi.dedicatedPoc,
      });
      return;
    }

    const account = getClientAccountFromStorage();
    setPocSnapshot({
      pocAssigned: isPocAssigned(account),
      dedicatedPoc: getDedicatedPoc(account),
    });
  }, []);

  useEffect(() => {
    refreshClientAccount();
    const onFocus = () => refreshClientAccount();
    const interval = setInterval(refreshClientAccount, 60000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(interval);
    };
  }, [refreshClientAccount, pathname]);

  // Keep Settings & System expanded when viewing settings or legal pages
  useEffect(() => {
    const settingsPaths = ["/settings", "/about", "/privacy", "/terms"];
    if (settingsPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      setExpandedSections((prev) => ({
        ...prev,
        "settings-system": true,
      }));
    }
  }, [pathname]);

  const showPocCard = pocSnapshot.pocAssigned;
  const pocForCard =
    pocSnapshot.dedicatedPoc ||
    (pocSnapshot.pocAssigned
      ? { fullName: "Dedicated POC", designation: "Point of Contact", teamName: "Customer Success" }
      : null);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // Toggle submenu expansion
  const toggleSubmenu = (itemId) => {
    setExpandedSubmenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Check if route is active
  const isActiveRoute = (href) => {
    if (!href) return false;
    if (href === pathname) return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  // Render menu item
  const renderMenuItem = (item) => {
    if (!hasPermission(item, userRole)) return null;

    const Icon = item.icon;
    const isActive = isActiveRoute(item.href);
    const hasSubmenu =
      item.hasSubmenu && item.submenu && item.submenu.length > 0;
    const isSubmenuExpanded = expandedSubmenus[item.id] ?? false;

    // Filter submenu items by permissions
    const visibleSubmenuItems = hasSubmenu
      ? item.submenu.filter((subItem) => hasPermission(subItem, userRole))
      : [];

    const navBadge =
      item.id === "messages" && unreadCount > 0 ? unreadCount : null;

    if (collapsed) {
      // Collapsed: show only icon, submenu not accessible
      return (
        <Link
          key={item.id}
          href={item.href}
          className={cn(
            "group relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
            isActive
              ? "bg-xtrawrkx-500 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
          title={item.label}
        >
          <Icon className="w-5 h-5" />
          {navBadge != null && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
              {navBadge > 9 ? "9+" : navBadge}
            </span>
          )}
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            {item.label}
          </div>
        </Link>
      );
    }

    // Expanded: show item with optional submenu
    if (hasSubmenu && visibleSubmenuItems.length > 0) {
      return (
        <div key={item.id} className="space-y-1">
          <button
            onClick={() => toggleSubmenu(item.id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-xtrawrkx-500 text-white shadow-sm"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                isSubmenuExpanded && "rotate-180"
              )}
            />
          </button>
          <AnimatePresence>
            {isSubmenuExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pl-8 space-y-1"
              >
                {visibleSubmenuItems.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = isActiveRoute(subItem.href);
                  return (
                    <Link
                      key={subItem.id}
                      href={subItem.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                        isSubActive
                          ? "bg-xtrawrkx-500/20 text-xtrawrkx-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <SubIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{subItem.label}</span>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Regular menu item without submenu
    return (
      <Link
        key={item.id}
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-xtrawrkx-500 text-white shadow-sm"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
        {navBadge != null && (
          <span
            className={cn(
              "min-w-[22px] h-[22px] px-1.5 flex items-center justify-center rounded-full text-xs font-bold shadow",
              isActive
                ? "bg-white/25 text-white"
                : "bg-red-500 text-white"
            )}
          >
            {navBadge > 9 ? "9+" : navBadge}
          </span>
        )}
      </Link>
    );
  };

  // Render section
  const renderSection = (section) => {
    // Filter items based on permissions
    const visibleItems = section.items?.filter((item) =>
      hasPermission(item, userRole)
    );

    if (!visibleItems || visibleItems.length === 0) return null;

    if (collapsed) {
      // Collapsed: show only icons
      return (
        <div key={section.id} className="space-y-1">
          {visibleItems.map((item) => renderMenuItem(item))}
        </div>
      );
    }

    // Expanded: show section with header
    const isExpanded = expandedSections[section.id] ?? true;
    const SectionIcon = section.icon;

    return (
      <div key={section.id} className="space-y-1">
        {section.collapsible ? (
          <>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
            >
              <span>{section.label}</span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-1"
                >
                  {visibleItems.map((item) => renderMenuItem(item))}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            {section.label && (
              <div className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.label}
              </div>
            )}
            <div className="space-y-1">
              {visibleItems.map((item) => renderMenuItem(item))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-gray-600/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all duration-300",
          "flex flex-col",
          collapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "lg:flex-shrink-0 shadow-sm"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-900">
              Client Portal
            </h2>
          )}
          <button
            onClick={() => {
              onToggle?.();
              if (isOpen) onClose();
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-900"
            aria-label="Hide sidebar"
          >
            <PanelLeftClose className="w-5 h-5" strokeWidth={1.75} />
          </button>
          {isOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation + POC — single scrollable column */}
        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {sidebarMenuConfig.map((section) => renderSection(section))}

          <div
            className={cn(
              "rounded-2xl border border-gray-200 bg-white shadow-sm",
              collapsed && "flex justify-center py-2"
            )}
            aria-label="Point of contact"
          >
            {showPocCard && pocForCard ? (
              <DedicatedPocSidebarCard poc={pocForCard} collapsed={collapsed} />
            ) : (
              <SupportAssistanceCard collapsed={collapsed} />
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
