/**
 * Sidebar Menu Configuration
 * 
 * Defines the structure and permissions for sidebar navigation items.
 * Supports role-based visibility and collapsible sections.
 */

import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    MessageSquare,
    Calendar,
    Users,
    Settings,
    CreditCard,
    HelpCircle,
    Shield,
    FileText,
    File,
    Receipt,
    Wallet,
    Package,
    LogOut,
    UserCircle,
} from "lucide-react";

/**
 * User roles
 */
export const USER_ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    CLIENT: "client",
    MEMBER: "member",
};

/**
 * Menu item types
 */
export const MENU_ITEM_TYPES = {
    LINK: "link",
    SECTION: "section",
    DIVIDER: "divider",
};

/**
 * Check if user has required role/permission
 */
export const hasPermission = (item, userRole) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRole);
};

/**
 * Main sidebar menu configuration
 */
export const sidebarMenuConfig = [
    // Primary Work Section
    {
        id: "primary-work",
        type: MENU_ITEM_TYPES.SECTION,
        label: "Primary Work",
        collapsible: true,
        defaultExpanded: true,
        items: [
            {
                id: "dashboard",
                type: MENU_ITEM_TYPES.LINK,
                label: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
                roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
            {
                id: "projects",
                type: MENU_ITEM_TYPES.LINK,
                label: "Projects",
                href: "/projects",
                icon: FolderKanban,
                roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
            {
                id: "tasks",
                type: MENU_ITEM_TYPES.LINK,
                label: "Tasks",
                href: "/tasks",
                icon: CheckSquare,
                roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
            {
                id: "messages",
                type: MENU_ITEM_TYPES.LINK,
                label: "Messages",
                href: "/messages",
                icon: MessageSquare,
                roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
        ],
    },

    // Collaboration Section
    {
        id: "collaboration",
        type: MENU_ITEM_TYPES.SECTION,
        label: "Collaboration",
        collapsible: true,
        defaultExpanded: true,
        items: [
            {
                id: "events",
                type: MENU_ITEM_TYPES.LINK,
                label: "Events",
                href: "/events",
                icon: Calendar,
                roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
            {
                id: "communities",
                type: MENU_ITEM_TYPES.LINK,
                label: "Communities",
                href: "/communities",
                icon: Users,
                roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
            {
                id: "services",
                type: MENU_ITEM_TYPES.LINK,
                label: "Services",
                href: "/services",
                icon: Settings,
                roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
        ],
    },

    // Management Section
    {
        id: "management",
        type: MENU_ITEM_TYPES.SECTION,
        label: "Management",
        collapsible: true,
        defaultExpanded: false,
        items: [
            {
                id: "company-members",
                type: MENU_ITEM_TYPES.LINK,
                label: "Company Members",
                href: "/company",
                icon: UserCircle,
                roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
            {
                id: "files",
                type: MENU_ITEM_TYPES.LINK,
                label: "Files / Documents",
                href: "/files",
                icon: File,
                roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
            {
                id: "billing",
                type: MENU_ITEM_TYPES.LINK,
                label: "Billing",
                href: "/billing",
                icon: CreditCard,
                roles: [USER_ROLES.ADMIN, USER_ROLES.CLIENT], // Admin/Owner only
                hasSubmenu: true,
                submenu: [
                    {
                        id: "invoices",
                        type: MENU_ITEM_TYPES.LINK,
                        label: "Invoices",
                        href: "/billing/invoices",
                        icon: Receipt,
                        roles: [USER_ROLES.ADMIN, USER_ROLES.CLIENT],
                    },
                    {
                        id: "payments",
                        type: MENU_ITEM_TYPES.LINK,
                        label: "Payments",
                        href: "/billing/payments",
                        icon: Wallet,
                        roles: [USER_ROLES.ADMIN, USER_ROLES.CLIENT],
                    },
                    {
                        id: "plan",
                        type: MENU_ITEM_TYPES.LINK,
                        label: "Plan / Subscription",
                        href: "/billing/plan",
                        icon: Package,
                        roles: [USER_ROLES.ADMIN, USER_ROLES.CLIENT],
                    },
                ],
            },
        ],
    },

    // Settings & System Section (Bottom)
    {
        id: "settings-system",
        type: MENU_ITEM_TYPES.SECTION,
        label: "Settings & System",
        collapsible: true,
        defaultExpanded: false,
        items: [
            {
                id: "settings",
                type: MENU_ITEM_TYPES.LINK,
                label: "Settings",
                href: "/settings",
                icon: Settings,
                roles: [USER_ROLES.ADMIN, USER_ROLES.MANAGER, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
            {
                id: "about",
                type: MENU_ITEM_TYPES.LINK,
                label: "About",
                href: "/about",
                icon: HelpCircle,
                roles: [USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
            {
                id: "privacy",
                type: MENU_ITEM_TYPES.LINK,
                label: "Privacy Policy",
                href: "/privacy",
                icon: Shield,
                roles: [USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
            {
                id: "terms",
                type: MENU_ITEM_TYPES.LINK,
                label: "Terms of Service",
                href: "/terms",
                icon: FileText,
                roles: [USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.MEMBER],
            },
        ],
    },
];

/**
 * Footer links (always visible at bottom)
 */
export const footerLinks = [
    {
        id: "about",
        label: "About",
        href: "/about",
        icon: HelpCircle,
    },
    {
        id: "privacy",
        label: "Privacy Policy",
        href: "/privacy",
        icon: Shield,
    },
    {
        id: "terms",
        label: "Terms of Service",
        href: "/terms",
        icon: FileText,
    },
];

/**
 * Get user role from session
 */
export const getUserRole = (session) => {
    if (!session) return USER_ROLES.MEMBER;

    // Handle different session structures
    const user = session.user || session.account || session;
    const userData = user?.profile || user;

    const role = user?.role?.toLowerCase() ||
        userData?.role?.toLowerCase() ||
        user?.userRole?.toLowerCase();

    // Map common role names
    if (role === "admin" || role === "administrator") return USER_ROLES.ADMIN;
    if (role === "manager") return USER_ROLES.MANAGER;
    if (role === "client" || role === "owner" || role === "primary_contact") return USER_ROLES.CLIENT;

    return USER_ROLES.MEMBER;
};

