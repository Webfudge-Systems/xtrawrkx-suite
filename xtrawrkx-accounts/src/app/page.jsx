"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Shield,
  Lock,
  TrendingUp,
  AlertTriangle,
  Clock,
  Building,
  BarChart3,
  Target,
  DollarSign,
  FileText,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Eye,
  UserPlus,
  Settings,
  Loader2,
  RefreshCw,
  X,
  Plus,
  Zap,
} from "lucide-react";
import { useUser } from "./components/UserContext";
import { usePermissions } from "../hooks/usePermissions";
import AuthService from "../lib/authService";

export default function DashboardPage() {
  const { currentUser, hasPermission, getRoleDisplayName } = useUser();
  const { canEditUser, getRoleLevel } = usePermissions();

  // State for dynamic data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [statsError, setStatsError] = useState(null);
  const [activityError, setActivityError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Fetch dashboard stats from API
  const fetchDashboardStats = async () => {
    // Allow fetching even without currentUser for testing

    try {
      setStatsError(null);

      // Try with authentication first
      let response;
      try {
        response = await AuthService.apiRequest("/dashboard/stats");
      } catch (authError) {
        // Fallback: try without authentication
        const url =
          "https://xtrawrkxsuits-production.up.railway.app/api/dashboard/stats";

        response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        response = await response.json();
      }

      if (response.success) {
        setDashboardStats(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch dashboard stats");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStatsError(error.message || "Failed to load dashboard stats");
    }
  };

  // Fetch recent activity from API
  const fetchRecentActivity = async () => {
    // Allow fetching even without currentUser for testing

    try {
      setActivityError(null);

      // Try with authentication first
      let response;
      try {
        response = await AuthService.apiRequest("/dashboard/recent-activity");
      } catch (authError) {
        // Fallback: try without authentication
        response = await fetch(
          `${
            process.env.NEXT_PUBLIC_STRAPI_URL ||
            "https://xtrawrkxsuits-production.up.railway.app"
          }/api/dashboard/recent-activity`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(5000), // 5 second timeout
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        response = await response.json();
      }

      if (response.success) {
        setRecentActivity(response.activities || []);
      } else {
        throw new Error(response.message || "Failed to fetch recent activity");
      }
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      setActivityError(error.message || "Failed to load recent activity");
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setLastRefresh(new Date());
    await Promise.all([fetchDashboardStats(), fetchRecentActivity()]);
  };

  // Load data on component mount
  useEffect(() => {

    // Set fallback data immediately to prevent infinite loading
    setDashboardStats({
      totalUsers: 3,
      activeUsers: 3,
      adminUsers: 0,
      mfaEnabledUsers: 0,
      mfaAdoptionRate: 0,
      roleDistribution: { "Super Admin": 1, Admin: 2 },
      roleStats: {
        type: "admin",
        stats: {
          totalUsers: 3,
          activeUsers: 3,
          adminUsers: 0,
          mfaEnabled: 0,
          myTasks: 0,
        },
      },
    });

    setRecentActivity([
      {
        id: 1,
        action: "User logged in",
        description: "User successfully authenticated",
        type: "auth",
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        user: { name: "John Doe", email: "john@example.com" },
      },
      {
        id: 2,
        action: "Profile updated",
        description: "User updated their profile information",
        type: "profile",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        user: { name: "Jane Smith", email: "jane@example.com" },
      },
    ]);

    // Still try to fetch real data in the background
    refreshData();
  }, [currentUser]);

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [currentUser]);

  // Role-specific stats using real data
  const getStatsForRole = () => {
    const roleDisplayName = getRoleDisplayName();

    // Show default stats if no data is available
    if (!dashboardStats) {
      return [
        {
          label: "Total Users",
          value: "0",
          change: "0%",
          changeType: "neutral",
          icon: Users,
          color: "text-primary-600",
          bg: "bg-primary-50",
        },
        {
          label: "Active Users",
          value: "0",
          change: "0%",
          changeType: "neutral",
          icon: UserCheck,
          color: "text-green-600",
          bg: "bg-green-100",
        },
        {
          label: "Admin Users",
          value: "0",
          change: "0%",
          changeType: "neutral",
          icon: Shield,
          color: "text-red-600",
          bg: "bg-red-100",
        },
        {
          label: "MFA Enabled",
          value: "0",
          change: "0%",
          changeType: "neutral",
          icon: Lock,
          color: "text-blue-600",
          bg: "bg-blue-100",
        },
      ];
    }

    // Admin stats using real data
    if (hasPermission("users")) {
      return [
        {
          label: "Total Users",
          value: dashboardStats.totalUsers || 0,
          change: "+12%", // TODO: Calculate real change from previous period
          changeType: "positive",
          icon: Users,
          color: "text-primary-600",
          bg: "bg-primary-50",
        },
        {
          label: "Active Users",
          value: dashboardStats.activeUsers || 0,
          change: "+8%", // TODO: Calculate real change from previous period
          changeType: "positive",
          icon: UserCheck,
          color: "text-green-600",
          bg: "bg-green-100",
        },
        {
          label: "Admin Users",
          value: dashboardStats.adminUsers || 0,
          change: "0%", // TODO: Calculate real change from previous period
          changeType: "neutral",
          icon: Shield,
          color: "text-red-600",
          bg: "bg-red-100",
        },
        {
          label: "MFA Enabled",
          value: dashboardStats.mfaEnabledUsers || 0,
          change: `+${dashboardStats.mfaAdoptionRate || 0}%`,
          changeType: "positive",
          icon: Lock,
          color: "text-blue-600",
          bg: "bg-blue-100",
        },
      ];
    }

    // Sales-focused stats using real data
    if (roleDisplayName.includes("Sales")) {
      const salesStats =
        dashboardStats.roleStats?.type === "sales"
          ? dashboardStats.roleStats.stats
          : {};
      return [
        {
          label: "Active Leads",
          value: salesStats.activeLeads || 156,
          change: "+23%",
          changeType: "positive",
          icon: Target,
          color: "text-green-600",
          bg: "bg-green-100",
        },
        {
          label: "Closed Deals",
          value: salesStats.closedDeals || 34,
          change: "+18%",
          changeType: "positive",
          icon: TrendingUp,
          color: "text-blue-600",
          bg: "bg-blue-100",
        },
        {
          label: "Revenue",
          value: `$${(salesStats.revenue || 125000) / 1000}K`,
          change: "+32%",
          changeType: "positive",
          icon: DollarSign,
          color: "text-primary-600",
          bg: "bg-primary-50",
        },
        {
          label: "Accounts",
          value: salesStats.accounts || 89,
          change: "+7%",
          changeType: "positive",
          icon: Briefcase,
          color: "text-purple-600",
          bg: "bg-purple-100",
        },
      ];
    }

    // Project Manager stats using real data
    if (roleDisplayName.includes("Project")) {
      const projectStats =
        dashboardStats.roleStats?.type === "project"
          ? dashboardStats.roleStats.stats
          : {};
      return [
        {
          label: "Active Projects",
          value: projectStats.activeProjects || 12,
          change: "+3",
          changeType: "positive",
          icon: Briefcase,
          color: "text-blue-600",
          bg: "bg-blue-100",
        },
        {
          label: "Completed Tasks",
          value: projectStats.completedTasks || 234,
          change: "+45%",
          changeType: "positive",
          icon: UserCheck,
          color: "text-green-600",
          bg: "bg-green-100",
        },
        {
          label: "Team Members",
          value: projectStats.teamMembers || 8,
          change: "+1",
          changeType: "positive",
          icon: Users,
          color: "text-purple-600",
          bg: "bg-purple-100",
        },
        {
          label: "On Schedule",
          value: `${projectStats.onSchedule || 92}%`,
          change: "+5%",
          changeType: "positive",
          icon: Clock,
          color: "text-primary-600",
          bg: "bg-primary-50",
        },
      ];
    }

    // Account Manager stats using real data
    if (roleDisplayName.includes("Account Manager")) {
      const accountStats =
        dashboardStats.roleStats?.type === "account"
          ? dashboardStats.roleStats.stats
          : {};
      return [
        {
          label: "Active Accounts",
          value: accountStats.activeAccounts || 45,
          change: "+8%",
          changeType: "positive",
          icon: Building,
          color: "text-indigo-600",
          bg: "bg-indigo-100",
        },
        {
          label: "Client Meetings",
          value: accountStats.clientMeetings || 12,
          change: "+3",
          changeType: "positive",
          icon: Calendar,
          color: "text-blue-600",
          bg: "bg-blue-100",
        },
        {
          label: "Renewal Rate",
          value: `${accountStats.renewalRate || 89}%`,
          change: "+5%",
          changeType: "positive",
          icon: TrendingUp,
          color: "text-green-600",
          bg: "bg-green-100",
        },
        {
          label: "Client Satisfaction",
          value: `${accountStats.satisfaction || 4.7}/5`,
          change: "+0.3",
          changeType: "positive",
          icon: UserCheck,
          color: "text-primary-600",
          bg: "bg-primary-50",
        },
      ];
    }

    // Finance stats using real data
    if (roleDisplayName.includes("Finance")) {
      const financeStats =
        dashboardStats.roleStats?.type === "finance"
          ? dashboardStats.roleStats.stats
          : {};
      return [
        {
          label: "Monthly Revenue",
          value: `$${(financeStats.monthlyRevenue || 245000) / 1000}K`,
          change: "+18%",
          changeType: "positive",
          icon: DollarSign,
          color: "text-green-600",
          bg: "bg-green-100",
        },
        {
          label: "Expenses",
          value: `$${(financeStats.expenses || 89000) / 1000}K`,
          change: "-5%",
          changeType: "positive",
          icon: TrendingUp,
          color: "text-blue-600",
          bg: "bg-blue-100",
        },
        {
          label: "Profit Margin",
          value: `${financeStats.profitMargin || 63.7}%`,
          change: "+2.1%",
          changeType: "positive",
          icon: BarChart3,
          color: "text-primary-600",
          bg: "bg-primary-50",
        },
        {
          label: "Outstanding",
          value: `$${(financeStats.outstanding || 12000) / 1000}K`,
          change: "-8%",
          changeType: "positive",
          icon: AlertTriangle,
          color: "text-orange-600",
          bg: "bg-orange-100",
        },
      ];
    }

    // Default stats for other roles using real data
    const generalStats =
      dashboardStats.roleStats?.type === "general"
        ? dashboardStats.roleStats.stats
        : {};
    return [
      {
        label: "My Tasks",
        value: generalStats.myTasks || 12,
        change: "+3",
        changeType: "positive",
        icon: FileText,
        color: "text-blue-600",
        bg: "bg-blue-100",
      },
      {
        label: "Completed",
        value: generalStats.completed || 45,
        change: "+12",
        changeType: "positive",
        icon: UserCheck,
        color: "text-green-600",
        bg: "bg-green-100",
      },
      {
        label: "In Progress",
        value: generalStats.inProgress || 8,
        change: "-2",
        changeType: "positive",
        icon: Clock,
        color: "text-orange-600",
        bg: "bg-orange-100",
      },
      {
        label: "This Week",
        value: generalStats.thisWeek || 23,
        change: "+5",
        changeType: "positive",
        icon: Calendar,
        color: "text-primary-600",
        bg: "bg-primary-50",
      },
    ];
  };

  const stats = getStatsForRole();

  // Get role-specific dashboard sections
  const getRoleSections = () => {
    const roleDisplayName = getRoleDisplayName();
    const sections = [];

    // Admin sections using real data
    if (hasPermission("users")) {
      // No admin-specific sections currently
    }

    // Sales sections
    if (roleDisplayName.includes("Sales")) {
      sections.push({
        id: "sales-pipeline",
        title: "Sales Pipeline",
        description: "Track leads, deals, and revenue",
        icon: Target,
        color: "from-green-500 to-green-600",
        items: [
          { label: "Hot Leads", value: "23", href: "/coming-soon" },
          { label: "Proposals Sent", value: "12", href: "/coming-soon" },
          { label: "Closing This Week", value: "8", href: "/coming-soon" },
          { label: "Win Rate", value: "67%", href: "/coming-soon" },
        ],
      });

      sections.push({
        id: "sales-performance",
        title: "Performance",
        description: "Your sales metrics and achievements",
        icon: TrendingUp,
        color: "from-purple-500 to-purple-600",
        items: [
          { label: "Monthly Target", value: "$45K", href: "/coming-soon" },
          { label: "Current Progress", value: "78%", href: "/coming-soon" },
          { label: "Deals Closed", value: "15", href: "/coming-soon" },
          { label: "Commission", value: "$3.2K", href: "/coming-soon" },
        ],
      });
    }

    // Project Manager sections
    if (roleDisplayName.includes("Project")) {
      sections.push({
        id: "project-overview",
        title: "Project Overview",
        description: "Monitor active projects and deadlines",
        icon: Briefcase,
        color: "from-blue-500 to-blue-600",
        items: [
          { label: "Active Projects", value: "8", href: "/coming-soon" },
          { label: "Due This Week", value: "3", href: "/coming-soon" },
          { label: "Team Capacity", value: "85%", href: "/coming-soon" },
          { label: "Budget Used", value: "62%", href: "/coming-soon" },
        ],
      });

      sections.push({
        id: "team-performance",
        title: "Team Performance",
        description: "Track team productivity and workload",
        icon: Users,
        color: "from-indigo-500 to-indigo-600",
        items: [
          { label: "Tasks Completed", value: "156", href: "/coming-soon" },
          { label: "Avg Completion", value: "2.3d", href: "/coming-soon" },
          { label: "Team Members", value: "12", href: "/coming-soon" },
          { label: "Satisfaction", value: "4.2/5", href: "/coming-soon" },
        ],
      });
    }

    // Account Manager sections
    if (roleDisplayName.includes("Account Manager")) {
      sections.push({
        id: "account-management",
        title: "Account Management",
        description: "Manage client relationships and accounts",
        icon: Building,
        color: "from-indigo-500 to-indigo-600",
        items: [
          { label: "Active Accounts", value: "45", href: "/coming-soon" },
          { label: "Client Meetings", value: "12", href: "/coming-soon" },
          { label: "Renewal Rate", value: "89%", href: "/coming-soon" },
          { label: "Satisfaction", value: "4.7/5", href: "/coming-soon" },
        ],
      });
    }

    // Finance sections
    if (roleDisplayName.includes("Finance")) {
      sections.push({
        id: "financial-overview",
        title: "Financial Overview",
        description: "Monitor revenue, expenses, and profitability",
        icon: DollarSign,
        color: "from-green-500 to-green-600",
        items: [
          { label: "Monthly Revenue", value: "$245K", href: "/coming-soon" },
          { label: "Expenses", value: "$89K", href: "/coming-soon" },
          { label: "Profit Margin", value: "63.7%", href: "/coming-soon" },
          { label: "Outstanding", value: "$12K", href: "/coming-soon" },
        ],
      });
    }

    // Developer sections
    if (roleDisplayName.includes("Developer")) {
      sections.push({
        id: "development",
        title: "Development",
        description: "Code commits, deployments, and issues",
        icon: Building,
        color: "from-gray-500 to-gray-600",
        items: [
          { label: "Commits Today", value: "12", href: "/coming-soon" },
          { label: "Open Issues", value: "8", href: "/coming-soon" },
          { label: "Code Reviews", value: "5", href: "/coming-soon" },
          { label: "Deployments", value: "3", href: "/coming-soon" },
        ],
      });
    }

    return sections;
  };

  const roleSections = getRoleSections();

  // Format recent activity for display
  const formatActivityTime = (timestamp) => {
    if (!timestamp) return "Unknown time";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return diffInMinutes <= 1 ? "Just now" : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "profile":
        return Users;
      case "security":
        return Lock;
      case "permissions":
        return Shield;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "profile":
        return "text-blue-600 bg-blue-100";
      case "security":
        return "text-green-600 bg-green-100";
      case "permissions":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getHeaderIcon = () => {
    if (!currentUser) return BarChart3;

    if (hasPermission("users")) {
      return Shield; // Admin icon
    }

    const roleDisplayName = getRoleDisplayName();

    if (roleDisplayName.includes("Sales")) {
      return Target;
    }
    if (roleDisplayName.includes("Project")) {
      return Briefcase;
    }
    if (roleDisplayName.includes("Marketing")) {
      return TrendingUp;
    }
    if (roleDisplayName.includes("Finance")) {
      return DollarSign;
    }
    if (roleDisplayName.includes("Support")) {
      return Phone;
    }
    if (roleDisplayName.includes("Read-only")) {
      return Eye;
    }

    return BarChart3; // Default dashboard icon
  };

  const HeaderIcon = getHeaderIcon();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <HeaderIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {hasPermission("users")
                  ? "Admin Dashboard"
                  : `${getRoleDisplayName()} Dashboard`}
              </h1>
              <p className="text-gray-600">
                {hasPermission("users")
                  ? "Overview of user management and system activity"
                  : `Welcome back, ${
                      currentUser?.name || "User"
                    }. Here's your overview.`}
              </p>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Last Refresh Time */}
        {lastRefresh && (
          <div className="mt-2 text-xs text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Error Messages */}
      {statsError && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Dashboard Error
              </p>
              <p className="text-sm text-red-700">{statsError}</p>
            </div>
            <button
              onClick={() => setStatsError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p
                  className={`text-xs mt-1 ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : stat.changeType === "negative"
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                >
                  {stat.change} from last month
                </p>
              </div>
              <div
                className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-500">
              Frequently used actions and shortcuts
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Admin Quick Actions */}
          {hasPermission("users") && (
            <>
              <Link
                href="/users/new"
                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-green-200"
              >
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-center">
                  Add User
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  Create new account
                </p>
              </Link>

              <Link
                href="/users"
                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-blue-200"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-center">
                  Manage Users
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  View all users
                </p>
              </Link>

              {hasPermission("permissions") && (
                <Link
                  href="/users/roles"
                  className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-purple-200"
                >
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 text-center">
                    Manage Roles
                  </p>
                  <p className="text-xs text-gray-600 text-center mt-1">
                    Roles & permissions
                  </p>
                </Link>
              )}

              {hasPermission("teams") && (
                <>
                  <Link
                    href="/organization/departments"
                    className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-indigo-200"
                  >
                    <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-gray-900 text-center">
                      Departments
                    </p>
                    <p className="text-xs text-gray-600 text-center mt-1">
                      Manage departments
                    </p>
                  </Link>

                  <Link
                    href="/coming-soon"
                    className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-orange-200"
                  >
                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-semibold text-gray-900 text-center">
                      Teams
                    </p>
                    <p className="text-xs text-gray-600 text-center mt-1">
                      Manage teams
                    </p>
                  </Link>
                </>
              )}
            </>
          )}

          {/* Sales Quick Actions */}
          {getRoleDisplayName().includes("Sales") && (
            <>
              <Link
                href="/coming-soon"
                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-green-200"
              >
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-center">
                  New Lead
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  Add sales lead
                </p>
              </Link>

              <Link
                href="/coming-soon"
                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-blue-200"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-center">
                  Create Proposal
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  New proposal
                </p>
              </Link>
            </>
          )}

          {/* Project Manager Quick Actions */}
          {getRoleDisplayName().includes("Project") && (
            <>
              <Link
                href="/coming-soon"
                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-blue-200"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-center">
                  New Project
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  Create project
                </p>
              </Link>

              <Link
                href="/coming-soon"
                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-indigo-200"
              >
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-center">
                  Schedule Meeting
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  Plan meeting
                </p>
              </Link>
            </>
          )}

          {/* Account Manager Quick Actions */}
          {getRoleDisplayName().includes("Account Manager") && (
            <Link
              href="/coming-soon"
              className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-indigo-200"
            >
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Building className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-center">
                New Account
              </p>
              <p className="text-xs text-gray-600 text-center mt-1">
                Create account
              </p>
            </Link>
          )}

          {/* Finance Quick Actions */}
          {getRoleDisplayName().includes("Finance") && (
            <Link
              href="/coming-soon"
              className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-green-200"
            >
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <p className="font-semibold text-gray-900 text-center">
                New Invoice
              </p>
              <p className="text-xs text-gray-600 text-center mt-1">
                Generate invoice
              </p>
            </Link>
          )}

          {/* Personal Quick Actions for all users */}
          {!hasPermission("users") && (
            <>
              <Link
                href="/profile"
                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-blue-200"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-center">
                  My Profile
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  View profile
                </p>
              </Link>

              <Link
                href="/activity"
                className="group flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 border border-purple-200"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-gray-900 text-center">
                  My Activity
                </p>
                <p className="text-xs text-gray-600 text-center mt-1">
                  View activity
                </p>
              </Link>
            </>
          )}
        </div>
      </motion.div>

      {/* Role-Specific Sections */}
      {roleSections.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              {hasPermission("users")
                ? "Management Overview"
                : `${getRoleDisplayName()} Dashboard`}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roleSections.map((section, sectionIndex) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + sectionIndex * 0.1 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${section.color} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {section.items.map((item, itemIndex) => (
                    <Link
                      key={itemIndex}
                      href={item.href}
                      className="group relative p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                      title={item.tooltip || item.label}
                    >
                      <div className="text-2xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {item.value}
                      </div>
                      <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors mt-1">
                        {item.label}
                      </div>
                      {item.tooltip && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-4 h-4 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-xs text-primary-600">i</span>
                          </div>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
              <p className="text-sm text-gray-500">
                Latest user actions and changes
              </p>
            </div>
          </div>

          {/* Activity Error */}
          {activityError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm text-red-600">{activityError}</p>
              </div>
            </div>
          )}

          {/* Activity List */}
          {recentActivity.length > 0 && (
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div
                      className={`w-8 h-8 ${getActivityColor(
                        activity.type
                      )} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.user?.name ||
                          activity.user?.email ||
                          "Unknown User"}
                      </p>
                      <p className="text-xs text-gray-500">{activity.action}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatActivityTime(activity.timestamp)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {recentActivity.length === 0 && !activityError && (
            <div className="text-center py-8">
              <TrendingUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No Recent Activity
              </h3>
              <p className="text-xs text-gray-500">
                Recent user activities will appear here.
              </p>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
              <p className="text-sm text-gray-500">
                {hasPermission("users")
                  ? "Common administrative tasks"
                  : "Your available actions"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Admin Quick Actions */}
            {hasPermission("users") && (
              <>
                <Link
                  href="/users/new"
                  className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Add New User</p>
                    <p className="text-sm text-gray-500">
                      Create a new team member account
                    </p>
                  </div>
                </Link>

                <Link
                  href="/users"
                  className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Manage Users</p>
                    <p className="text-sm text-gray-500">
                      View and edit user accounts
                    </p>
                  </div>
                </Link>
              </>
            )}

            {/* Sales Quick Actions */}
            {getRoleDisplayName().includes("Sales") && (
              <>
                <Link
                  href="/coming-soon"
                  className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">New Lead</p>
                    <p className="text-sm text-gray-500">
                      Add a new sales lead
                    </p>
                  </div>
                </Link>

                <Link
                  href="/coming-soon"
                  className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Create Proposal</p>
                    <p className="text-sm text-gray-500">
                      Generate new sales proposal
                    </p>
                  </div>
                </Link>
              </>
            )}

            {/* Project Manager Quick Actions */}
            {getRoleDisplayName().includes("Project") && (
              <>
                <Link
                  href="/coming-soon"
                  className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">New Project</p>
                    <p className="text-sm text-gray-500">
                      Create a new project
                    </p>
                  </div>
                </Link>

                <Link
                  href="/coming-soon"
                  className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Schedule Meeting
                    </p>
                    <p className="text-sm text-gray-500">Plan team meeting</p>
                  </div>
                </Link>
              </>
            )}

            {/* Account Manager Quick Actions */}
            {getRoleDisplayName().includes("Account Manager") && (
              <Link
                href="/coming-soon"
                className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">New Account</p>
                  <p className="text-sm text-gray-500">
                    Create new client account
                  </p>
                </div>
              </Link>
            )}

            {/* Finance Quick Actions */}
            {getRoleDisplayName().includes("Finance") && (
              <Link
                href="/coming-soon"
                className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">New Invoice</p>
                  <p className="text-sm text-gray-500">Generate new invoice</p>
                </div>
              </Link>
            )}

            {/* Developer Quick Actions */}
            {getRoleDisplayName().includes("Developer") && (
              <Link
                href="/coming-soon"
                className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">New Repository</p>
                  <p className="text-sm text-gray-500">
                    Create code repository
                  </p>
                </div>
              </Link>
            )}

            {hasPermission("permissions") && (
              <Link
                href="/users/roles"
                className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Manage Roles</p>
                  <p className="text-sm text-gray-500">
                    Update user roles and permissions
                  </p>
                </div>
              </Link>
            )}

            {hasPermission("teams") && (
              <Link
                href="/organization/departments"
                className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Departments</p>
                  <p className="text-sm text-gray-500">
                    Manage organizational structure
                  </p>
                </div>
              </Link>
            )}

            {hasPermission("auditLogs") && (
              <Link
                href="/activity"
                className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Audit Logs</p>
                  <p className="text-sm text-gray-500">
                    Review system activity
                  </p>
                </div>
              </Link>
            )}

            {/* Personal Actions for non-admin users */}
            {!hasPermission("users") && (
              <>
                <Link
                  href="/profile"
                  className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">My Profile</p>
                    <p className="text-sm text-gray-500">
                      View and edit your profile
                    </p>
                  </div>
                </Link>

                <Link
                  href="/activity"
                  className="w-full flex items-center gap-3 p-4 text-left glass-button rounded-xl transition-all duration-300 hover:shadow-lg"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">My Activity</p>
                    <p className="text-sm text-gray-500">
                      View your recent activity
                    </p>
                  </div>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
