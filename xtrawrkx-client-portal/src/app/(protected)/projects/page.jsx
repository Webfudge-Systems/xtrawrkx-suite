"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Calendar,
  Users,
  DollarSign,
  Search,
  Filter,
  Eye,
  List,
  Grid3X3,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Loader2,
  Activity,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
import { useSession } from "@/lib/auth";
import strapiClient from "@/lib/strapiClient";
import { buildProjectSlug } from "@/lib/projectUtils";

export default function ProjectsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeView, setActiveView] = useState("list");
  const [activeFilters, setActiveFilters] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);

  const resolveAccountId = async () => {
    let accountId =
      session?.account?.id ||
      session?.account?.documentId ||
      session?.user?.id ||
      session?.user?.profile?.id ||
      session?.id ||
      session?.documentId;

    if (!accountId && typeof window !== "undefined") {
      const accountData = localStorage.getItem("client_account");
      if (accountData) {
        try {
          const account = JSON.parse(accountData);
          accountId = account.id || account.documentId;
        } catch (error) {
          console.error("Error parsing client account data:", error);
        }
      }
    }

    if (!accountId) {
      accountId = strapiClient.getCurrentAccountId();
    }

    if (!accountId) {
      try {
        const currentUser = await strapiClient.getCurrentUser();
        if (currentUser?.account) {
          accountId =
            currentUser.account.id || currentUser.account.documentId;
        }
      } catch (error) {
        console.warn("Could not get current user:", error);
      }
    }

    return accountId;
  };

  // Fetch projects from API
  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    try {
      setLoading(true);

      const accountId = await resolveAccountId();

      if (!accountId) {
        console.warn("No account ID found in session or localStorage");
        setProjects([]);
        setLoading(false);
        return;
      }


      // Fetch all projects and filter by clientAccount client-side
      // This is more reliable than server-side filtering until the relation is fully set up
      const queryParams = strapiClient.buildQueryString({
        populate: ["projectManager", "teamMembers", "account", "clientAccount"],
        pagination: {
          pageSize: 100,
        },
      });

      // Build full URL using buildURL method
      const fullUrl = strapiClient.buildURL("/projects", {});
      const urlWithParams = `${fullUrl}?${queryParams}`;


      let response;
      try {
        response = await strapiClient.request(urlWithParams, {
          method: "GET",
        });
      } catch (error) {
        console.error("Error fetching projects - request failed:", error);
        console.error("Error details:", {
          message: error.message,
          url: urlWithParams,
        });

        // If it's a JSON parse error (HTML response), log the actual response
        if (
          error.message?.includes("JSON") ||
          error.message?.includes("DOCTYPE")
        ) {
          try {
            const errorResponse = await fetch(urlWithParams, {
              method: "GET",
              headers: strapiClient.getHeaders(),
            });
            const errorText = await errorResponse.text();
            console.error(
              "Server returned HTML instead of JSON. Status:",
              errorResponse.status
            );
            console.error("Response preview:", errorText.substring(0, 500));
            console.error("Full URL attempted:", urlWithParams);
          } catch (fetchError) {
            console.error("Could not fetch error details:", fetchError);
          }
        }

        // Set empty projects and stop loading
        setProjects([]);
        setLoading(false);
        return;
      }


      // Handle different response structures
      let allProjects = [];
      if (Array.isArray(response?.data)) {
        allProjects = response.data;
      } else if (Array.isArray(response)) {
        allProjects = response;
      } else if (response?.data?.data) {
        allProjects = response.data.data;
      }


      // Log the first project's full structure to debug
      if (allProjects.length > 0) {
      }

      // Filter projects by clientAccount ID with comprehensive matching
      const projectsData = allProjects.filter((project) => {
        const projectData = project.attributes || project;

        // Check direct clientAccount relation - handle multiple possible structures
        let projectClientAccount = null;
        let projectClientAccountId = null;

        // Try different ways to access clientAccount
        if (projectData.clientAccount) {
          if (projectData.clientAccount.attributes) {
            projectClientAccount = projectData.clientAccount.attributes;
            projectClientAccountId =
              projectClientAccount.id || projectClientAccount.documentId;
          } else if (
            projectData.clientAccount.id ||
            projectData.clientAccount.documentId
          ) {
            projectClientAccount = projectData.clientAccount;
            projectClientAccountId =
              projectClientAccount.id || projectClientAccount.documentId;
          } else if (
            typeof projectData.clientAccount === "number" ||
            typeof projectData.clientAccount === "string"
          ) {
            // clientAccount might be just an ID
            projectClientAccountId = projectData.clientAccount;
          }
        }

        // Debug logging for each project

        // If clientAccount is null or undefined, log it but don't skip yet
        // Sometimes projects might not have clientAccount set but still belong to the account
        if (!projectClientAccountId) {
          // Don't return false immediately - check if account matches
          // Some projects might use 'account' instead of 'clientAccount'
          const projectAccount =
            projectData.account?.attributes || projectData.account;
          if (projectAccount) {
            const projectAccountId =
              projectAccount.id || projectAccount.documentId;
            if (projectAccountId) {
              projectClientAccountId = projectAccountId;
            }
          }

          // If still no ID, skip
          if (!projectClientAccountId) {
            return false;
          }
        }

        // Normalize IDs for comparison
        const accountIdNum =
          typeof accountId === "string" ? parseInt(accountId, 10) : accountId;
        const projectClientAccountIdNum =
          typeof projectClientAccountId === "string"
            ? parseInt(projectClientAccountId, 10)
            : projectClientAccountId;

        // Try multiple comparison methods
        const matches =
          projectClientAccountIdNum === accountIdNum ||
          projectClientAccountId?.toString() === accountId?.toString() ||
          projectClientAccountId == accountId ||
          projectClientAccountId === parseInt(accountId) ||
          parseInt(projectClientAccountId) === parseInt(accountId);

        if (matches) {
        } else {
        }

        return matches;
      });


      // TEMPORARY DEBUG: If no projects found, show all projects for debugging
      if (projectsData.length === 0 && allProjects.length > 0) {
        console.warn(
          "⚠️ No projects matched the filter. Showing all projects for debugging:"
        );
        allProjects.forEach((project, index) => {
          const projectData = project.attributes || project;
        });
      }

      // Transform projects to match UI format
      const transformedProjects = projectsData.map((project) => {
        const projectData = project.attributes || project;
        const projectManager =
          projectData.projectManager?.attributes || projectData.projectManager;

        return {
          id: project.id || project.documentId,
          slug: projectData.slug || null,
          name: projectData.name || "Unnamed Project",
          status: projectData.status || "PLANNING",
          progress: projectData.progress || 0,
          startDate: projectData.startDate || null,
          endDate: projectData.endDate || null,
          manager: projectManager
            ? `${projectManager.firstName || ""} ${
                projectManager.lastName || ""
              }`.trim() ||
              projectManager.username ||
              "Unassigned"
            : "Unassigned",
          description: projectData.description || "",
          budget: projectData.budget || 0,
          spent: projectData.spent || 0,
        };
      });

      setProjects(transformedProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectInput) => {
    const accountId = await resolveAccountId();
    if (!accountId) {
      throw new Error("Could not determine your account. Please sign in again.");
    }

    const numericAccountId = Number(accountId);
    const slug = buildProjectSlug(projectInput.name);
    const icon = projectInput.name.charAt(0).toUpperCase() || "P";

    const payload = {
      name: projectInput.name,
      slug,
      description: projectInput.description || "",
      status: projectInput.status || "PLANNING",
      icon,
      color: "from-blue-400 to-blue-600",
      clientAccount: !isNaN(numericAccountId) ? numericAccountId : accountId,
    };

    if (projectInput.startDate) {
      payload.startDate = new Date(
        `${projectInput.startDate}T00:00:00`
      ).toISOString();
    }
    if (projectInput.endDate) {
      payload.endDate = new Date(
        `${projectInput.endDate}T00:00:00`
      ).toISOString();
    }

    const projectsUrl = strapiClient.buildURL("/projects", {});
    const response = await fetch(projectsUrl, {
      method: "POST",
      headers: strapiClient.getHeaders(),
      body: JSON.stringify({ data: payload }),
    });

    if (!response.ok) {
      const errPayload = await response.json().catch(() => ({}));
      throw new Error(
        errPayload?.error?.message || "Failed to create project"
      );
    }

    await fetchProjects();
  };

  // Calculate project statistics
  const projectStats = {
    all: projects.length,
    active: projects.filter(
      (p) =>
        p.status === "IN_PROGRESS" ||
        p.status === "ACTIVE" ||
        p.status === "in-progress" ||
        p.status === "active"
    ).length,
    planning: projects.filter(
      (p) =>
        p.status === "PLANNING" ||
        p.status === "PLANNED" ||
        p.status === "planning" ||
        p.status === "planned"
    ).length,
    completed: projects.filter(
      (p) => p.status === "COMPLETED" || p.status === "completed"
    ).length,
    onHold: projects.filter(
      (p) =>
        p.status === "ON_HOLD" ||
        p.status === "ONHOLD" ||
        p.status === "on-hold" ||
        p.status === "on_hold"
    ).length,
  };

  // Status stats for KPI cards
  const statusStats = [
    {
      label: "Active",
      count: projectStats.active,
      color: "bg-xtrawrkx-50",
      borderColor: "border-xtrawrkx-200",
      iconColor: "text-xtrawrkx-600",
      icon: Activity,
    },
    {
      label: "Planning",
      count: projectStats.planning,
      color: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconColor: "text-yellow-600",
      icon: Clock,
    },
    {
      label: "Completed",
      count: projectStats.completed,
      color: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      icon: CheckCircle,
    },
    {
      label: "On Hold",
      count: projectStats.onHold,
      color: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
      icon: XCircle,
    },
  ];

  // Tab items
  const tabItems = [
    { key: "all", label: "All Projects", badge: projectStats.all.toString() },
    {
      key: "active",
      label: "Active",
      badge: projectStats.active.toString(),
    },
    {
      key: "planning",
      label: "Planning",
      badge: projectStats.planning.toString(),
    },
    {
      key: "completed",
      label: "Completed",
      badge: projectStats.completed.toString(),
    },
    {
      key: "on-hold",
      label: "On Hold",
      badge: projectStats.onHold.toString(),
    },
  ];

  // Filter projects based on active tab and search
  const getFilteredProjects = () => {
    let filtered = projects;

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((project) => {
        const status = project.status?.toUpperCase() || "";
        switch (activeTab) {
          case "active":
            return (
              status === "IN_PROGRESS" ||
              status === "ACTIVE" ||
              status === "IN-PROGRESS"
            );
          case "planning":
            return status === "PLANNING" || status === "PLANNED";
          case "completed":
            return status === "COMPLETED";
          case "on-hold":
            return status === "ON_HOLD" || status === "ONHOLD";
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (project) =>
          project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          project.manager?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredProjects = getFilteredProjects();

  const getStatusColor = (status) => {
    const statusUpper = status?.toUpperCase() || "";
    switch (statusUpper) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-400";
      case "IN_PROGRESS":
      case "ACTIVE":
      case "IN-PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "PLANNING":
      case "PLANNED":
        return "bg-blue-100 text-blue-800 border-blue-400";
      case "ON_HOLD":
      case "ONHOLD":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-400";
    }
  };

  const formatStatus = (status) => {
    const statusMap = {
      PLANNING: "Planning",
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      ON_HOLD: "On Hold",
      CANCELLED: "Cancelled",
      PLANNED: "Planned",
      ACTIVE: "Active",
    };
    return (
      statusMap[status?.toUpperCase()] ||
      status?.replace("_", " ") ||
      "Planning"
    );
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="px-4 pt-4">
          <PageHeader
            title="Projects"
            subtitle="Manage and track all your projects"
          />
        </div>
        <div className="p-4">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-xtrawrkx-500" />
              <span className="text-gray-600">Loading projects...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Page Header */}
      <div className="px-4 pt-4">
        <PageHeader
          title="Projects"
          subtitle="Manage and track all your projects"
          showActions={true}
          onAddClick={() => setIsCreateProjectModalOpen(true)}
          onFilterClick={() => setShowFilterModal(true)}
          hasActiveFilters={activeFilters.length > 0 || searchQuery.length > 0}
        />
      </div>

      <div className="px-3 mt-6">
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statusStats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        {stat.label} Projects
                      </p>
                      <p className="text-3xl font-black text-gray-800">
                        {stat.count}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${stat.color.replace(
                            "-50",
                            "-500"
                          )}`}
                        ></span>
                        {stat.count === 0
                          ? "No projects"
                          : `${stat.count} ${
                              stat.count === 1 ? "project" : "projects"
                            }`}
                      </div>
                    </div>
                    <div
                      className={`w-16 h-16 ${stat.color} backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border ${stat.borderColor}`}
                    >
                      <IconComponent className={`w-8 h-8 ${stat.iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs and View Toggle */}
          <div className="flex items-center justify-between gap-3 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl shadow-xl p-3">
            {/* Left: Tabs */}
            <div className="flex items-center gap-2 flex-1 overflow-x-auto">
              {tabItems.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.key
                      ? "bg-xtrawrkx-500 text-white shadow-lg"
                      : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 border border-white/40"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${
                      activeTab === tab.key
                        ? "bg-white/30 text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Center: Search Bar */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-white/80 backdrop-blur-sm border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500/30 focus:border-xtrawrkx-500 focus:bg-white/90 transition-all duration-300 placeholder:text-gray-500 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Create + View Toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsCreateProjectModalOpen(true)}
                className="w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center bg-xtrawrkx-500 text-white border-xtrawrkx-500/50 hover:bg-xtrawrkx-600"
                title="Create Project"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveView("list")}
                className={`w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center ${
                  activeView === "list"
                    ? "bg-xtrawrkx-500 text-white border-xtrawrkx-500/50"
                    : "bg-white/80 text-gray-700 border-white/40 hover:bg-white/90"
                }`}
                title="List View"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveView("grid")}
                className={`w-10 h-10 rounded-full backdrop-blur-sm border transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center ${
                  activeView === "grid"
                    ? "bg-xtrawrkx-500 text-white border-xtrawrkx-500/50"
                    : "bg-white/80 text-gray-700 border-white/40 hover:bg-white/90"
                }`}
                title="Grid View"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Projects List/Grid */}
          {activeView === "list" ? (
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 transition-shadow duration-300">
              <table className="w-full rounded-3xl overflow-hidden min-w-[1600px]">
                <thead className="bg-white/90 backdrop-blur-lg border-b border-xtrawrkx-200/50 shadow-sm">
                  <tr>
                    <th className="px-6 py-5 text-left text-xs font-black text-gray-800 uppercase tracking-wider first:rounded-tl-3xl last:rounded-tr-3xl shadow-sm">
                      PROJECT NAME
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black text-gray-800 uppercase tracking-wider first:rounded-tl-3xl last:rounded-tr-3xl shadow-sm">
                      STATUS
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black text-gray-800 uppercase tracking-wider first:rounded-tl-3xl last:rounded-tr-3xl shadow-sm">
                      MANAGER
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black text-gray-800 uppercase tracking-wider first:rounded-tl-3xl last:rounded-tr-3xl shadow-sm">
                      PROGRESS
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black text-gray-800 uppercase tracking-wider first:rounded-tl-3xl last:rounded-tr-3xl shadow-sm">
                      BUDGET
                    </th>
                    <th className="px-6 py-5 text-left text-xs font-black text-gray-800 uppercase tracking-wider first:rounded-tl-3xl last:rounded-tr-3xl shadow-sm">
                      ACTIONS
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-white/20">
                  {filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <FolderOpen className="w-12 h-12 text-gray-400 mb-4" />
                          <p className="text-gray-600 font-medium">
                            No projects found
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {searchQuery || activeTab !== "all"
                              ? "Try adjusting your filters"
                              : "Get started by creating your first project"}
                          </p>
                          {!searchQuery && activeTab === "all" && (
                            <button
                              type="button"
                              onClick={() => setIsCreateProjectModalOpen(true)}
                              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-xtrawrkx-500 text-white text-sm font-semibold rounded-xl hover:bg-xtrawrkx-600 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              Create Project
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr
                        key={project.id}
                        className="hover:bg-xtrawrkx-50/50 hover:shadow-lg transition-all duration-300 group bg-white/40 shadow-sm hover:shadow-xtrawrkx-100/50 cursor-pointer"
                        onClick={() => {
                          if (project.slug || project.id) {
                            router.push(
                              `/projects/${project.slug || project.id}`
                            );
                          }
                        }}
                      >
                        <td className="px-6 py-4 text-sm text-gray-800 group-hover:text-gray-900 transition-colors duration-300">
                          <div className="min-w-[200px]">
                            <div className="font-medium text-gray-900 truncate">
                              {project.name}
                            </div>
                            {project.description && (
                              <div className="text-sm text-gray-500 truncate mt-1">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 group-hover:text-gray-900 transition-colors duration-300 whitespace-nowrap">
                          <div className="min-w-[100px]">
                            <span
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${getStatusColor(
                                project.status
                              )}`}
                            >
                              {formatStatus(project.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 group-hover:text-gray-900 transition-colors duration-300 whitespace-nowrap">
                          <div className="flex items-center gap-2 min-w-[140px]">
                            {project.manager ? (
                              <div className="flex items-center gap-1">
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0 border border-white">
                                  {project.manager?.charAt(0)?.toUpperCase() ||
                                    "U"}
                                </div>
                                <span className="text-sm text-gray-600 truncate ml-1">
                                  {project.manager}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 group-hover:text-gray-900 transition-colors duration-300 whitespace-nowrap">
                          <div className="min-w-[120px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-xtrawrkx-500 h-2 rounded-full transition-all"
                                  style={{ width: `${project.progress || 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {project.progress || 0}%
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 group-hover:text-gray-900 transition-colors duration-300 whitespace-nowrap">
                          {project.budget > 0 ? (
                            <div className="min-w-[120px]">
                              <span className="font-semibold text-gray-900 whitespace-nowrap">
                                ₹{(project.budget || 0).toLocaleString()}
                              </span>
                              {project.spent > 0 && (
                                <div className="text-xs text-gray-500">
                                  Spent: ₹
                                  {(project.spent || 0).toLocaleString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              Not set
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800 group-hover:text-gray-900 transition-colors duration-300 whitespace-nowrap">
                          <div
                            className="flex items-center gap-1 min-w-[120px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              className="p-1.5 text-xtrawrkx-600 hover:text-xtrawrkx-700 hover:bg-xtrawrkx-50 rounded transition-colors"
                              title="View Project"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (project.slug || project.id) {
                                  router.push(
                                    `/projects/${project.slug || project.id}`
                                  );
                                }
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.length === 0 ? (
                <div className="col-span-full rounded-3xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-12 text-center">
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">No projects found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchQuery || activeTab !== "all"
                      ? "Try adjusting your filters"
                      : "Get started by creating your first project"}
                  </p>
                  {!searchQuery && activeTab === "all" && (
                    <button
                      type="button"
                      onClick={() => setIsCreateProjectModalOpen(true)}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-xtrawrkx-500 text-white text-sm font-semibold rounded-xl hover:bg-xtrawrkx-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Project
                    </button>
                  )}
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                    onClick={() => {
                      if (project.slug || project.id) {
                        router.push(`/projects/${project.slug || project.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-lg">
                          {project.name}
                        </h3>
                        {project.description && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(
                          project.status
                        )}`}
                      >
                        {formatStatus(project.status)}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">
                          {project.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-xtrawrkx-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      {project.manager && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{project.manager}</span>
                        </div>
                      )}
                      {project.endDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(project.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {project.budget > 0 && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            ₹{(project.spent || 0).toLocaleString()} / ₹
                            {(project.budget || 0).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onProjectCreate={handleCreateProject}
      />
    </div>
  );
}
