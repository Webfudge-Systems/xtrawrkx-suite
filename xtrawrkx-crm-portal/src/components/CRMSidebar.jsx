"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  UserCheck,
  Package,
  FileText,
  Receipt,
  Mail,
  Phone,
  CheckSquare,
  FolderOpen,
  HeadphonesIcon,
  BarChart3,
  Settings,
  Shield,
  Calendar,
  Target,
  DollarSign,
  FileCheck,
  ShoppingCart,
  CreditCard,
  MessageSquare,
  GitBranch,
  Inbox,
  Clock,
  UserPlus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Bell,
  Star,
  Plus,
} from "lucide-react";
import SubSidebar from "./SubSidebar";
import commentService from "../lib/api/commentService";
import strapiClient from "../lib/strapiClient";

export default function CRMSidebar({ collapsed = false, onToggle }) {
  const [collapsedSections, setCollapsedSections] = useState({
    sales: false,
    delivery: false,
    analytics: false,
    favorites: false,
  });

  const [subSidebarOpen, setSubSidebarOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(null);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [toolsCollapsed, setToolsCollapsed] = useState(true);
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [showAllThreads, setShowAllThreads] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const quickActionsRef = useRef(null);

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (href) => {
    if (!href || href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const isSalesActive = () => {
    return pathname.startsWith("/sales/");
  };

  const isDeliveryActive = () => {
    return pathname.startsWith("/delivery/");
  };

  const isClientPortalActive = () => {
    return (
      pathname.startsWith("/clients/accounts") ||
      pathname.startsWith("/clients/proposals") ||
      pathname.startsWith("/clients/invoices")
    );
  };

  const handleTopLevelClick = (sectionId, sectionLabel) => {
    setCurrentSection(sectionId);
    setSubSidebarOpen(true);
  };

  const closeSubSidebar = () => {
    setSubSidebarOpen(false);
    setCurrentSection(null);
  };

  const handleNavigate = (href) => {
    closeSubSidebar();
    // Navigation will be handled by Next.js Link component
  };

  const toggleQuickActions = () => {
    setQuickActionsOpen(!quickActionsOpen);
  };

  // Keep only important quick action items
  const quickActionItems = [
    {
      label: "Add Lead Company",
      icon: Users,
      href: "/sales/lead-companies/new",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      label: "Add Deal",
      icon: Briefcase,
      href: "/sales/deals/new",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      label: "Add Contact",
      icon: UserCheck,
      href: "/sales/contacts/new",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      label: "Add Task",
      icon: CheckSquare,
      href: "/sales/tasks/new",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  ];

  // Handle quick action navigation
  const handleQuickActionClick = (href) => {
    setQuickActionsOpen(false);
    router.push(href);
  };

  // Close quick actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(event.target)
      ) {
        setQuickActionsOpen(false);
      }
    };

    if (quickActionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [quickActionsOpen]);

  // Fetch latest conversations for sidebar
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingThreads(true);

        // Fetch comments for lead companies, client accounts, contacts, and deals
        const [
          leadCompanyCommentsResponse,
          clientAccountCommentsResponse,
          contactCommentsResponse,
          dealCommentsResponse,
        ] = await Promise.all([
          commentService
            .getAllComments({
              filters: { commentableType: "LEAD_COMPANY" },
              populate: ["user", "replies", "replies.user", "parentComment"],
              sort: "createdAt:desc",
              pageSize: 500,
            })
            .catch(() => ({ data: [] })),
          commentService
            .getAllComments({
              filters: { commentableType: "CLIENT_ACCOUNT" },
              populate: ["user", "replies", "replies.user", "parentComment"],
              sort: "createdAt:desc",
              pageSize: 500,
            })
            .catch(() => ({ data: [] })),
          commentService
            .getAllComments({
              filters: { commentableType: "CONTACT" },
              populate: ["user", "replies", "replies.user", "parentComment"],
              sort: "createdAt:desc",
              pageSize: 500,
            })
            .catch(() => ({ data: [] })),
          commentService
            .getAllComments({
              filters: { commentableType: "DEAL" },
              populate: ["user", "replies", "replies.user", "parentComment"],
              sort: "createdAt:desc",
              pageSize: 500,
            })
            .catch(() => ({ data: [] })),
        ]);

        const leadComments = leadCompanyCommentsResponse?.data || [];
        const clientComments = clientAccountCommentsResponse?.data || [];
        const contactComments = contactCommentsResponse?.data || [];
        const dealComments = dealCommentsResponse?.data || [];

        // Group comments by entity and get latest activity
        const entityChats = new Map();

        // Process lead company comments
        leadComments.forEach((comment) => {
          const commentData = comment.attributes || comment;
          const entityId = commentData.commentableId;
          const key = `leadCompany-${entityId}`;

          if (!entityChats.has(key)) {
            entityChats.set(key, {
              entityId,
              entityType: "leadCompany",
              latestComment: null,
              latestActivity: null,
              commentsCount: 0,
            });
          }

          const chat = entityChats.get(key);
          chat.commentsCount++;

          const commentTime = new Date(commentData.createdAt);
          if (!chat.latestActivity || commentTime > chat.latestActivity) {
            chat.latestActivity = commentTime;
            chat.latestComment = commentData.content;
          }
        });

        // Process client account comments
        clientComments.forEach((comment) => {
          const commentData = comment.attributes || comment;
          const entityId = commentData.commentableId;
          const key = `clientAccount-${entityId}`;

          if (!entityChats.has(key)) {
            entityChats.set(key, {
              entityId,
              entityType: "clientAccount",
              latestComment: null,
              latestActivity: null,
              commentsCount: 0,
            });
          }

          const chat = entityChats.get(key);
          chat.commentsCount++;

          const commentTime = new Date(commentData.createdAt);
          if (!chat.latestActivity || commentTime > chat.latestActivity) {
            chat.latestActivity = commentTime;
            chat.latestComment = commentData.content;
          }
        });

        // Process contact comments
        contactComments.forEach((comment) => {
          const commentData = comment.attributes || comment;
          const entityId = commentData.commentableId;
          const key = `contact-${entityId}`;

          if (!entityChats.has(key)) {
            entityChats.set(key, {
              entityId,
              entityType: "contact",
              latestComment: null,
              latestActivity: null,
              commentsCount: 0,
            });
          }

          const chat = entityChats.get(key);
          chat.commentsCount++;

          const commentTime = new Date(commentData.createdAt);
          if (!chat.latestActivity || commentTime > chat.latestActivity) {
            chat.latestActivity = commentTime;
            chat.latestComment = commentData.content;
          }
        });

        // Process deal comments
        dealComments.forEach((comment) => {
          const commentData = comment.attributes || comment;
          const entityId = commentData.commentableId;
          const key = `deal-${entityId}`;

          if (!entityChats.has(key)) {
            entityChats.set(key, {
              entityId,
              entityType: "deal",
              latestComment: null,
              latestActivity: null,
              commentsCount: 0,
            });
          }

          const chat = entityChats.get(key);
          chat.commentsCount++;

          const commentTime = new Date(commentData.createdAt);
          if (!chat.latestActivity || commentTime > chat.latestActivity) {
            chat.latestActivity = commentTime;
            chat.latestComment = commentData.content;
          }
        });

        // Fetch entity names
        const entityPromises = Array.from(entityChats.keys()).map(
          async (key) => {
            const chat = entityChats.get(key);
            try {
              if (chat.entityType === "leadCompany") {
                const leadCompany = await strapiClient
                  .getLeadCompany(chat.entityId)
                  .catch(() => null);
                if (leadCompany) {
                  // Normalize the data structure
                  const entityData =
                    leadCompany.data?.attributes ||
                    leadCompany.data ||
                    leadCompany.attributes ||
                    leadCompany;
                  chat.entity = entityData;
                }
              } else if (chat.entityType === "clientAccount") {
                const clientAccount = await strapiClient
                  .getClientAccount(chat.entityId)
                  .catch(() => null);
                if (clientAccount) {
                  // Normalize the data structure
                  const entityData =
                    clientAccount.data?.attributes ||
                    clientAccount.data ||
                    clientAccount.attributes ||
                    clientAccount;
                  chat.entity = entityData;
                }
              } else if (chat.entityType === "contact") {
                const contact = await strapiClient
                  .getContact(chat.entityId, {
                    populate: ["clientAccount", "leadCompany"],
                  })
                  .catch(() => null);
                if (contact) {
                  // Normalize the data structure
                  const entityData =
                    contact.data?.attributes ||
                    contact.data ||
                    contact.attributes ||
                    contact;
                  chat.entity = entityData;
                  // Also normalize related entities
                  if (entityData.clientAccount) {
                    entityData.clientAccount =
                      entityData.clientAccount.data?.attributes ||
                      entityData.clientAccount.data ||
                      entityData.clientAccount.attributes ||
                      entityData.clientAccount;
                  }
                  if (entityData.leadCompany) {
                    entityData.leadCompany =
                      entityData.leadCompany.data?.attributes ||
                      entityData.leadCompany.data ||
                      entityData.leadCompany.attributes ||
                      entityData.leadCompany;
                  }
                }
              } else if (chat.entityType === "deal") {
                const deal = await strapiClient
                  .getDeal(chat.entityId, {
                    populate: ["clientAccount", "leadCompany"],
                  })
                  .catch(() => null);
                if (deal) {
                  // Normalize the data structure
                  const entityData =
                    deal.data?.attributes ||
                    deal.data ||
                    deal.attributes ||
                    deal;
                  chat.entity = entityData;
                  // Also normalize related entities
                  if (entityData.clientAccount) {
                    entityData.clientAccount =
                      entityData.clientAccount.data?.attributes ||
                      entityData.clientAccount.data ||
                      entityData.clientAccount.attributes ||
                      entityData.clientAccount;
                  }
                  if (entityData.leadCompany) {
                    entityData.leadCompany =
                      entityData.leadCompany.data?.attributes ||
                      entityData.leadCompany.data ||
                      entityData.leadCompany.attributes ||
                      entityData.leadCompany;
                  }
                }
              }
            } catch (error) {
              console.error(`Error fetching entity ${chat.entityId}:`, error);
            }
          },
        );
        await Promise.all(entityPromises);

        // Transform to thread format
        const transformed = Array.from(entityChats.values())
          .filter((chat) => chat.commentsCount > 0 && chat.entity)
          .map((chat) => ({
            id: `${chat.entityType}-${chat.entityId}`,
            type: "entityChat",
            entityType: chat.entityType,
            entityId: chat.entityId,
            message: chat.latestComment,
            createdAt: chat.latestActivity,
            leadCompany: chat.entityType === "leadCompany" ? chat.entity : null,
            clientAccount:
              chat.entityType === "clientAccount" ? chat.entity : null,
            contact: chat.entityType === "contact" ? chat.entity : null,
            deal: chat.entityType === "deal" ? chat.entity : null,
            commentsCount: chat.commentsCount,
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by most recent

        setThreads(transformed);
      } catch (error) {
        console.error("Error fetching conversations for sidebar:", error);
        setThreads([]);
      } finally {
        setLoadingThreads(false);
      }
    };

    fetchConversations();

    // Refresh conversations every 30 seconds
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  // Get threads to display (limited to top 3 conversations)
  const displayedThreads = showAllThreads ? threads : threads.slice(0, 3);

  const getThreadContext = (thread) => {
    // Helper to get company name from entity (handles different data structures)
    const getCompanyName = (entity) => {
      if (!entity) return null;
      // Try different possible paths for companyName
      return (
        entity.companyName ||
        entity.attributes?.companyName ||
        entity.data?.attributes?.companyName ||
        entity.data?.companyName ||
        null
      );
    };

    // Show company name for lead companies
    if (thread.leadCompany) {
      const companyName = getCompanyName(thread.leadCompany);
      if (companyName) return companyName;
      // Fallback: try to get name from nested structure
      const name =
        thread.leadCompany.name ||
        thread.leadCompany.attributes?.name ||
        thread.leadCompany.data?.attributes?.name;
      return name || "Lead Company";
    }

    // Show company name for client accounts
    if (thread.clientAccount) {
      const companyName = getCompanyName(thread.clientAccount);
      if (companyName) return companyName;
      // Fallback: try to get name from nested structure
      const name =
        thread.clientAccount.name ||
        thread.clientAccount.attributes?.name ||
        thread.clientAccount.data?.attributes?.name;
      return name || "Client Account";
    }

    // For contacts, show their company name if available, otherwise contact name
    if (thread.contact) {
      const contact = thread.contact;
      // Try to get company name from related entities
      const clientAccountName = getCompanyName(contact.clientAccount);
      if (clientAccountName) return clientAccountName;

      const leadCompanyName = getCompanyName(contact.leadCompany);
      if (leadCompanyName) return leadCompanyName;

      // Fallback to contact name
      const firstName =
        contact.firstName ||
        contact.attributes?.firstName ||
        contact.data?.attributes?.firstName ||
        "";
      const lastName =
        contact.lastName ||
        contact.attributes?.lastName ||
        contact.data?.attributes?.lastName ||
        "";
      const contactName = `${firstName} ${lastName}`.trim();
      return contactName || "Contact";
    }

    // For deals, show deal name or associated company name
    if (thread.deal) {
      const deal = thread.deal;
      // Try to get company name from related entities
      const clientAccountName = getCompanyName(deal.clientAccount);
      if (clientAccountName) return clientAccountName;

      const leadCompanyName = getCompanyName(deal.leadCompany);
      if (leadCompanyName) return leadCompanyName;

      // Fallback to deal name
      const dealName =
        deal.name ||
        deal.attributes?.name ||
        deal.data?.attributes?.name ||
        deal.data?.name;
      return dealName || "Deal";
    }

    return "Unknown";
  };

  const handleThreadNavigation = (thread) => {
    // Navigate to threads page with entity chat
    router.push(`/threads?thread=${thread.id}`);
  };

  const mainNavigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
      color: "bg-gray-800",
      hasSubNav: false,
      priority: "high",
    },
    {
      id: "sales",
      label: "Sales",
      icon: DollarSign,
      color: "bg-gray-100",
      hasSubNav: true,
      href: undefined,
      priority: "high",
    },
    {
      id: "delivery",
      label: "Delivery",
      icon: FolderOpen,
      color: "bg-gray-100",
      hasSubNav: true,
      href: undefined,
      priority: "high",
    },
    {
      id: "client-portal",
      label: "Client Portal",
      icon: UserCheck,
      color: "bg-gray-100",
      hasSubNav: true,
      href: undefined,
      priority: "high",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      color: "bg-gray-100",
      hasSubNav: true,
      href: undefined,
      priority: "low",
    },
  ];

  // Helper function to generate coming-soon URL with feature name
  const comingSoonUrl = (featureName) => {
    return `/coming-soon?feature=${encodeURIComponent(featureName)}`;
  };

  const favoriteItems = [
    { label: "Pipeline Overview", icon: Target, href: "/sales/deals/pipeline" },
    {
      label: "Key Metrics",
      icon: BarChart3,
      href: comingSoonUrl("Key Metrics"),
    },
    { label: "Recent Activities", icon: Clock, href: "/dashboard" },
  ];

  const crmTools = [
    {
      label: "Priority / Automation Rules",
      icon: Target,
      href: comingSoonUrl("Priority / Automation Rules"),
    },
    { label: "Documents", icon: FileText, href: comingSoonUrl("Documents") },
    {
      label: "Invoices & Payments",
      icon: Receipt,
      href: comingSoonUrl("Invoices & Payments"),
    },
    {
      label: "Meetings & Calls",
      icon: Phone,
      href: comingSoonUrl("Meetings & Calls"),
    },
    { label: "Calendar", icon: Calendar, href: comingSoonUrl("Calendar") },
    {
      label: "Integrations",
      icon: GitBranch,
      href: comingSoonUrl("Integrations"),
    },
  ];

  // Navigation data for sub-sidebar
  const navigationData = [
    {
      id: "sales",
      label: "Sales",
      children: [
        {
          id: "lead-companies",
          label: "Lead Companies",
          icon: Users,
          href: "/sales/lead-companies",
          children: [
            {
              id: "lead-companies-list",
              label: "All Leads",
              href: "/sales/lead-companies",
            },
            {
              id: "lead-companies-board",
              label: "Pipeline Board (Kanban)",
              href: "/sales/lead-companies/board",
            },
            {
              id: "lead-company-detail",
              label: "Lead Company Detail",
              href: "/sales/lead-companies/[id]",
            },
            {
              id: "lead-companies-import",
              label: "Import / Segmentation",
              href: "/sales/lead-companies/import",
            },
          ],
        },
        {
          id: "contacts",
          label: "Contacts",
          icon: UserCheck,
          href: "/sales/contacts",
          children: [
            {
              id: "contacts-list",
              label: "Contacts List",
              href: "/sales/contacts",
            },
            {
              id: "contact-detail",
              label: "Contact Detail (360° • Client Activity Timeline)",
              href: "/sales/contacts/[id]",
            },
          ],
        },
        {
          id: "opportunities",
          label: "Opportunities / Deals",
          icon: Briefcase,
          href: "/sales/deals",
          children: [
            {
              id: "pipeline-board",
              label: "Pipeline Board",
              href: "/sales/deals/pipeline",
            },
            { id: "deals-list", label: "Deals List", href: "/sales/deals" },
            {
              id: "deal-detail",
              label: "Deal Detail (Activity, Notes, Files)",
              href: "/sales/deals/[id]",
            },
          ],
        },

        {
          id: "campaigns",
          label: "Campaigns",
          icon: Mail,
          href: comingSoonUrl("Campaigns"),
          children: [
            {
              id: "campaigns-list",
              label: "Campaigns",
              href: comingSoonUrl("Campaigns"),
            },
            {
              id: "new-campaign",
              label: "New Campaign (Template • Segments)",
              href: comingSoonUrl("Campaigns"),
            },
            {
              id: "templates",
              label: "Templates",
              href: comingSoonUrl("Campaigns"),
            },
            {
              id: "performance",
              label: "Performance Analytics",
              href: comingSoonUrl("Campaigns"),
            },
          ],
        },
        {
          id: "meetings",
          label: "Meetings & Calls",
          icon: Phone,
          href: comingSoonUrl("Meetings & Calls"),
          children: [
            {
              id: "calendar",
              label: "Calendar",
              href: comingSoonUrl("Meetings & Calls"),
            },
            {
              id: "call-logs",
              label: "Call Logs",
              href: comingSoonUrl("Meetings & Calls"),
            },
            {
              id: "integrations",
              label: "Integrations",
              href: comingSoonUrl("Meetings & Calls"),
            },
          ],
        },
      ],
    },
    {
      id: "delivery",
      label: "Delivery",
      children: [
        {
          id: "tasks",
          label: "Tasks",
          icon: CheckSquare,
          href: "/delivery/tasks",
          children: [
            {
              id: "my-tasks",
              label: "My Tasks",
              href: "/delivery/tasks",
            },
            {
              id: "team-boards",
              label: "Team Boards",
              href: "/delivery/tasks/boards",
            },
            {
              id: "automation-rules",
              label: "Priority / Automation Rules",
              href: "/delivery/tasks/automation",
            },
          ],
        },
        {
          id: "documents",
          label: "Documents",
          icon: FileText,
          href: comingSoonUrl("Documents"),
          children: [
            {
              id: "repository",
              label: "Repository (Folders • Versioning)",
              href: comingSoonUrl("Documents"),
            },
            {
              id: "linked-records",
              label: "Linked Records",
              href: comingSoonUrl("Documents"),
            },
          ],
        },
        {
          id: "projects",
          label: "Projects",
          icon: FolderOpen,
          href: comingSoonUrl("Projects"),
          children: [
            {
              id: "all-projects",
              label: "All Projects",
              href: comingSoonUrl("Projects"),
            },
            {
              id: "project-detail",
              label: "Project Detail (Kanban • Gantt • Milestones)",
              href: comingSoonUrl("Projects"),
            },
            {
              id: "time-costs",
              label: "Time/Costs",
              href: comingSoonUrl("Projects"),
            },
          ],
        },
        {
          id: "support",
          label: "Support Tickets",
          icon: HeadphonesIcon,
          href: comingSoonUrl("Support Tickets"),
          children: [
            {
              id: "queues",
              label: "Queues / Inbox",
              href: comingSoonUrl("Support Tickets"),
            },
            {
              id: "ticket-detail",
              label: "Ticket Detail (SLA • Comments • Attachments)",
              href: comingSoonUrl("Support Tickets"),
            },
            {
              id: "chat-widget",
              label: "Chat Widget (Embed Reference)",
              href: comingSoonUrl("Support Tickets"),
            },
          ],
        },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      children: [
        {
          id: "reports",
          label: "Reports & Forecasts",
          icon: BarChart3,
          href: comingSoonUrl("Analytics"),
          children: [
            {
              id: "executive-dashboards",
              label: "Executive Dashboards (Funnel • Sales • CSAT)",
              href: comingSoonUrl("Analytics"),
            },
            {
              id: "drilldowns",
              label: "Drilldowns",
              href: comingSoonUrl("Analytics"),
            },
            {
              id: "exports",
              label: "Exports",
              href: comingSoonUrl("Analytics"),
            },
          ],
        },
      ],
    },
    {
      id: "client-portal",
      label: "Client Portal",
      children: [
        {
          id: "accounts",
          label: "Client Accounts",
          icon: Building2,
          href: "/clients/accounts",
          children: [
            {
              id: "accounts-list",
              label: "All Clients",
              href: "/clients/accounts",
            },
            {
              id: "account-detail",
              label: "Client Detail (Overview • Contacts • Activity • Docs)",
              href: "/clients/accounts/[id]",
            },
            {
              id: "account-deals",
              label: "Client Deals & Projects",
              href: "/clients/accounts/[id]/deals",
            },
            {
              id: "account-portals",
              label: "Client Portal Access",
              href: "/clients/accounts/[id]/portal",
            },
          ],
        },
        {
          id: "client-proposals",
          label: "Proposals",
          icon: FileText,
          href: "/clients/proposals",
          children: [
            {
              id: "view-proposals",
              label: "View Proposals",
              href: "/clients/proposals",
            },
          ],
        },
        {
          id: "client-invoices",
          label: "Invoices",
          icon: Receipt,
          href: "/clients/invoices",
          children: [
            {
              id: "view-invoices",
              label: "View Invoices",
              href: "/clients/invoices",
            },
          ],
        },
        {
          id: "client-documents",
          label: "Documents",
          icon: FolderOpen,
          href: comingSoonUrl("Client Portal Documents"),
          children: [
            {
              id: "shared-documents",
              label: "Shared Documents",
              href: comingSoonUrl("Client Portal Documents"),
            },
            {
              id: "document-downloads",
              label: "Document Downloads",
              href: comingSoonUrl("Client Portal Documents"),
            },
          ],
        },
        {
          id: "client-tickets",
          label: "Support Tickets",
          icon: HeadphonesIcon,
          href: comingSoonUrl("Client Portal Support Tickets"),
          children: [
            {
              id: "my-tickets",
              label: "My Tickets",
              href: comingSoonUrl("Client Portal Support Tickets"),
            },
            {
              id: "create-ticket",
              label: "Create New Ticket",
              href: comingSoonUrl("Client Portal Support Tickets"),
            },
          ],
        },
        {
          id: "client-meetings",
          label: "Meetings",
          icon: Calendar,
          href: comingSoonUrl("Client Portal Meetings"),
          children: [
            {
              id: "scheduled-meetings",
              label: "Scheduled Meetings",
              href: comingSoonUrl("Client Portal Meetings"),
            },
            {
              id: "meeting-history",
              label: "Meeting History",
              href: comingSoonUrl("Client Portal Meetings"),
            },
          ],
        },
      ],
    },
  ];

  return (
    <>
      <div
        className={`${
          collapsed ? "w-16" : "w-64"
        } h-full bg-white backdrop-blur-xl border-r border-white/30 flex flex-col shadow-xl overflow-y-auto transition-[width] duration-300 flex-shrink-0`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between mb-4">
            {!collapsed && (
              <span className="font-bold text-xl text-brand-foreground">
                Xtrawrkx CRM
              </span>
            )}
            <button onClick={onToggle} className="p-2 rounded-lg">
              {collapsed ? (
                <ChevronRight className="w-5 h-5 text-brand-foreground" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-brand-foreground" />
              )}
            </button>
          </div>

          {/* Search Bar */}
          {!collapsed && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-light" />
              <input
                type="text"
                placeholder="Search here..."
                className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary focus:bg-white/25 transition-[background-color,border-color,box-shadow] duration-300 text-sm placeholder:text-brand-text-light shadow-lg"
              />
            </div>
          )}

          {/* Quick Actions Button */}
          <div className="relative" ref={quickActionsRef}>
            <button
              onClick={toggleQuickActions}
              className={`w-full bg-gradient-to-r from-orange-500/20 to-orange-600/10 backdrop-blur-md border ${
                quickActionsOpen
                  ? "border-orange-300/60"
                  : "border-white/30 hover:border-orange-200/50"
              } text-brand-foreground rounded-xl py-3 px-4 flex items-center ${
                collapsed ? "justify-center" : "justify-between gap-2"
              } shadow-lg hover:shadow-xl transition-all duration-300 group`}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                {!collapsed && (
                  <span className="text-sm font-semibold text-gray-800">
                    Quick Actions
                  </span>
                )}
              </div>
              {!collapsed && (
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
                    quickActionsOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {/* Quick Actions Dropdown */}
            {quickActionsOpen && !collapsed && (
              <div className="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="p-2">
                  <div className="px-3 py-2 mb-1 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Quick Create
                    </p>
                  </div>
                  {quickActionItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuickActionClick(item.href)}
                        className="w-full flex items-center gap-3 p-3.5 text-sm text-gray-800 rounded-xl hover:bg-gray-50 transition-all duration-200 group/item"
                      >
                        <div
                          className={`w-10 h-10 ${item.bgColor} ${item.borderColor} border rounded-xl flex items-center justify-center shadow-sm group-hover/item:scale-110 group-hover/item:shadow-md transition-all duration-200`}
                        >
                          <Icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <span className="font-medium text-gray-900 flex-1 text-left">
                          {item.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity duration-200" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation Grid */}
        <div className="p-4 space-y-4">
          {/* Primary Navigation - Top 4 */}
          <div
            className={`grid gap-3 ${
              collapsed ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {mainNavigationItems
              .filter((item) => item.priority === "high")
              .map((item) => {
                const Icon = item.icon;
                const active = item.href ? isActive(item.href) : false;
                const isSalesSection = item.id === "sales" && isSalesActive();
                const isDeliverySection =
                  item.id === "delivery" && isDeliveryActive();
                const isClientPortalSection =
                  item.id === "client-portal" && isClientPortalActive();

                if (item.hasSubNav) {
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTopLevelClick(item.id, item.label)}
                      className={`${
                        isSalesSection ||
                        isDeliverySection ||
                        isClientPortalSection
                          ? "bg-gradient-to-br from-yellow-400/30 to-yellow-500/20 border-yellow-300/50 text-yellow-800"
                          : "bg-white/20 backdrop-blur-md border border-white/30 text-brand-foreground hover:bg-white/30 hover:border-white/40"
                      } rounded-xl p-4 flex flex-col items-center gap-3 transition-[background-color,border-color] duration-300 shadow-lg group`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                      {!collapsed && (
                        <span className="text-xs font-medium text-center">
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href || "/"}
                    className={`${
                      active
                        ? "bg-brand-primary text-white border-brand-primary/50"
                        : "bg-white/20 backdrop-blur-md border border-white/30 text-brand-foreground hover:bg-white/30 hover:border-white/40"
                    } 
                      rounded-xl p-4 flex flex-col items-center gap-3 transition-[background-color,border-color,color] duration-300 shadow-lg group`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                    {!collapsed && (
                      <span className="text-xs font-medium text-center">
                        {item.label}
                      </span>
                    )}
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Latest Threads Section */}
        {!collapsed && (
          <div className="flex-1">
            <div className="px-3 mb-2">
              <div
                className={`rounded-xl p-2.5 shadow-lg transition-all duration-200 backdrop-blur-md ${
                  pathname.startsWith("/threads")
                    ? "bg-orange-50/90 border border-orange-200"
                    : "bg-white/10 border border-white/30"
                }`}
              >
                <div className="flex items-center justify-between text-sm font-medium text-brand-foreground mb-2">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Latest Conversations
                  </span>
                  <Link
                    href="/threads"
                    className="w-5 h-5 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center hover:bg-white/30 transition-all duration-200 group shadow-sm border border-white/20"
                    title="View All Threads"
                  >
                    <ChevronRight className="w-2.5 h-2.5 text-gray-600 group-hover:text-gray-900 transition-colors" />
                  </Link>
                </div>

                <div className="space-y-1.5 max-h-80 overflow-y-auto">
                  {loadingThreads ? (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-orange-500"></div>
                    </div>
                  ) : displayedThreads.length === 0 ? (
                    <div className="text-center py-2 text-xs text-brand-text-light">
                      No conversations yet
                    </div>
                  ) : (
                    displayedThreads.map((thread) => {
                      const isThreadsPageOpen = pathname.startsWith("/threads");
                      const currentThreadId = searchParams.get("thread");
                      const isThisThreadActive =
                        isThreadsPageOpen &&
                        !!currentThreadId &&
                        (currentThreadId === thread.id ||
                          currentThreadId === thread.id?.toString() ||
                          (typeof thread.id === "string" &&
                            thread.id.includes(currentThreadId)));

                      const threadContext = getThreadContext(thread);
                      const messageText = thread.message || "";
                      const previewText =
                        messageText.length > 40
                          ? messageText.substring(0, 40) + "..."
                          : messageText;

                      // Determine icon and color based on entity type
                      let IconComponent = Building2;
                      let iconColor = "from-gray-400 to-gray-600";

                      if (thread.entityType === "leadCompany") {
                        IconComponent = Building2;
                        iconColor = "from-orange-400 to-orange-600";
                      } else if (thread.entityType === "clientAccount") {
                        IconComponent = UserCheck;
                        iconColor = "from-blue-400 to-blue-600";
                      } else if (thread.entityType === "contact") {
                        IconComponent = Users;
                        iconColor = "from-purple-400 to-purple-600";
                      } else if (thread.entityType === "deal") {
                        IconComponent = DollarSign;
                        iconColor = "from-green-400 to-green-600";
                      }

                      return (
                        <button
                          key={thread.id}
                          onClick={() => handleThreadNavigation(thread)}
                          className={`w-full flex items-start gap-2 p-2 rounded-lg text-xs transition-all duration-200 relative ${
                            isThisThreadActive
                              ? "bg-orange-50 text-orange-700 border border-orange-200"
                              : "text-gray-600 hover:bg-gray-100/80 border border-transparent"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-gradient-to-br ${iconColor} rounded flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5`}
                          >
                            <IconComponent className="w-3 h-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div
                              className={`font-medium truncate mb-0.5 flex items-center gap-1.5 ${
                                isThisThreadActive
                                  ? "text-orange-800"
                                  : "text-gray-900"
                              }`}
                            >
                              {threadContext}
                            </div>
                            {previewText && (
                              <div
                                className={`line-clamp-2 text-[11px] leading-tight ${
                                  isThisThreadActive
                                    ? "text-orange-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {previewText}
                              </div>
                            )}
                            {thread.commentsCount > 0 && (
                              <div
                                className={`text-[10px] mt-1 ${
                                  isThisThreadActive
                                    ? "text-orange-500"
                                    : "text-gray-500"
                                }`}
                              >
                                {thread.commentsCount}{" "}
                                {thread.commentsCount === 1
                                  ? "message"
                                  : "messages"}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}

                  {/* Load More Button - Navigate to Threads Page */}
                  {!showAllThreads && threads.length > 3 && (
                    <Link
                      href="/threads"
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200 group mt-1.5 rounded-lg"
                    >
                      <span className="font-medium">Load More</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CRM Tools Section */}
        {!collapsed && (
          <div className="flex-1">
            <div className="px-4 mb-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-xl p-4 shadow-lg">
                <button
                  onClick={() => setToolsCollapsed(!toolsCollapsed)}
                  className="flex items-center justify-between w-full text-sm font-medium text-brand-foreground mb-3 hover:opacity-80 transition-opacity"
                >
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Tools
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      toolsCollapsed ? "" : "rotate-180"
                    }`}
                  />
                </button>

                {!toolsCollapsed && (
                  <div className="space-y-2">
                    {crmTools.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={index}
                          href={item.href}
                          className="flex items-center gap-3 text-xs text-brand-text-light p-2 rounded-lg hover:bg-white/20 transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Navigation - Bottom Section */}
        <div className="mt-auto">
          <div className="px-4 mb-4">
            {/* Divider */}
            {!collapsed && (
              <div className="flex items-center gap-4 px-2 mb-4">
                <div className="flex-1 h-px bg-white/20"></div>
                <span className="text-xs text-brand-text-light font-medium">
                  System
                </span>
                <div className="flex-1 h-px bg-white/20"></div>
              </div>
            )}

            {/* System Navigation Grid */}
            <div className="flex flex-col gap-3">
              {mainNavigationItems
                .filter((item) => item.priority === "low")
                .map((item) => {
                  const Icon = item.icon;
                  const active = item.href ? isActive(item.href) : false;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTopLevelClick(item.id, item.label)}
                      className="w-full bg-white/15 backdrop-blur-md border border-white/25 text-brand-text-light rounded-xl p-3 flex flex-col items-center gap-2 shadow-md"
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5" />
                      {!collapsed && (
                        <span className="text-xs font-medium text-center">
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Footer - User Profile */}
          <div className="p-4 border-t border-white/20">
            <div
              className={`flex items-center gap-3 p-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-xl shadow-lg ${
                collapsed ? "justify-center" : ""
              }`}
            >
              <div className="w-8 h-8 bg-white/30 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-brand-primary text-sm font-medium">
                  {(() => {
                    if (!user) {
                      return "U";
                    }

                    // Handle different user data structures
                    const userData = user.attributes || user;
                    const firstName =
                      userData.firstName || userData.name?.split(" ")[0] || "";
                    const lastName =
                      userData.lastName || userData.name?.split(" ")[1] || "";

                    const initials = (
                      firstName.charAt(0) + lastName.charAt(0)
                    ).toUpperCase();
                    if (initials && initials !== " ") {
                      return initials;
                    }

                    return userData.email?.charAt(0).toUpperCase() || "U";
                  })()}
                </span>
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-foreground truncate">
                      {(() => {
                        if (!user) {
                          return "User";
                        }

                        // Handle different user data structures
                        const userData = user.attributes || user;

                        if (userData.firstName && userData.lastName) {
                          return `${userData.firstName} ${userData.lastName}`;
                        }

                        if (userData.name) {
                          return userData.name;
                        }

                        if (userData.email) {
                          return userData.email.split("@")[0];
                        }

                        return "User";
                      })()}
                    </p>
                    <p className="text-xs text-brand-text-light truncate">
                      {(() => {
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
                                userData.primaryRole.attributes?.name
                              : userData.primaryRole;
                          if (roleName) return roleName;
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
                              ? firstRole.name || firstRole.attributes?.name
                              : firstRole;
                          if (roleName) return roleName;
                        }

                        // Fallback to role field
                        if (userData.role) {
                          return typeof userData.role === "object"
                            ? userData.role.name ||
                                userData.role.attributes?.name ||
                                userData.role
                            : userData.role;
                        }

                        return "User";
                      })()}
                    </p>
                  </div>
                  <button className="text-brand-text-light">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub Sidebar */}
      <SubSidebar
        isOpen={subSidebarOpen}
        onClose={closeSubSidebar}
        currentSection={currentSection}
        navigationData={navigationData}
        onNavigate={handleNavigate}
      />
    </>
  );
}
