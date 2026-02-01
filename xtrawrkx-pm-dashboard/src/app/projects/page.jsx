"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  Clock,
  Calendar,
  CheckSquare,
  AlertCircle,
  Eye,
  FolderOpen,
  TrendingUp,
  Users,
  User,
  X,
  Search,
  UserPlus,
  UserMinus,
  FileText,
  FileSpreadsheet,
  Edit,
  Trash2,
  Archive,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ProjectsKPIs,
  ProjectsTabs,
  ProjectsListView,
  ProjectsFilterModal,
} from "../../components/projects";
import PageHeader from "../../components/shared/PageHeader";
import { Card, Pagination } from "../../components/ui";
import projectService from "../../lib/projectService";
import {
  transformProject,
  transformStatusToStrapi,
} from "../../lib/dataTransformers";
import { useAuth } from "../../contexts/AuthContext";
import apiClient from "../../lib/apiClient";
import confetti from "canvas-confetti";

// Local utility function to format dates
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State management
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [activeView, setActiveView] = useState("list");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamModal, setTeamModal] = useState({ isOpen: false, project: null });
  const [projectLeadModal, setProjectLeadModal] = useState({
    isOpen: false,
    project: null,
  });
  const [allUsers, setAllUsers] = useState([]);
  const [toastMessage, setToastMessage] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [loadingActions, setLoadingActions] = useState({});

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const exportDropdownRef = useRef(null);

  // Load users for team management
  const loadUsers = async () => {
    try {
      const usersResponse = await apiClient.get("/api/xtrawrkx-users", {
        "pagination[pageSize]": 100,
        populate: "primaryRole,userRoles,department",
        "filters[isActive][$eq]": "true",
      });

      let usersData = [];
      if (usersResponse?.data && Array.isArray(usersResponse.data)) {
        usersData = usersResponse.data;
      } else if (Array.isArray(usersResponse)) {
        usersData = usersResponse;
      }

      const transformedUsers = usersData
        .filter((user) => user && user.id)
        .map((user) => {
          const userData = user.attributes || user;
          const firstName = userData.firstName || "";
          const lastName = userData.lastName || "";
          const email = userData.email || "";
          const name =
            `${firstName} ${lastName}`.trim() || email || "Unknown User";

          return {
            id: user.id,
            firstName,
            lastName,
            email,
            name,
          };
        });

      setAllUsers(transformedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      setAllUsers([]);
    }
  };

  // Load projects from API
  useEffect(() => {
    // Don't load if auth is still loading
    if (authLoading) {
      return;
    }

    const loadProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load projects
        const projectsResponse = await projectService
          .getAllProjects({
            pageSize: 100,
            populate: ["projectManager", "teamMembers", "tasks"],
          })
          .catch((err) => {
            console.error("Error fetching projects:", err);
            return { data: [] };
          });

        // Transform projects
        const transformedProjects =
          projectsResponse.data?.map(transformProject) || [];

        setProjects(transformedProjects);
      } catch (error) {
        console.error("Error loading projects:", error);
        const errorMessage =
          error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to load projects. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
    loadUsers();
  }, [authLoading]);

  // Calculate project statistics
  const getProjectStats = () => {
    const stats = {
      all: projects.length,
      planning: 0,
      active: 0,
      "in-progress": 0,
      completed: 0,
      "on-hold": 0,
      overdue: 0,
    };

    const now = new Date();
    projects.forEach((project) => {
      const status = project.status?.toLowerCase().replace(/\s+/g, "-") || "";
      if (status === "planning") stats.planning++;
      else if (status === "active") stats.active++;
      else if (status === "in-progress") stats["in-progress"]++;
      else if (status === "completed") stats.completed++;
      else if (status === "on-hold") stats["on-hold"]++;

      // Check for overdue
      if (
        project.endDate &&
        new Date(project.endDate) < now &&
        status !== "completed"
      ) {
        stats.overdue++;
      }
    });

    return stats;
  };

  const projectStats = getProjectStats();

  // Status statistics for KPIs
  const statusStats = [
    {
      label: "Active",
      count: projectStats.active + projectStats["in-progress"],
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      icon: TrendingUp,
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
      label: "Overdue",
      count: projectStats.overdue,
      color: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
      icon: AlertCircle,
    },
  ];

  // Tab items for navigation
  const tabItems = [
    { key: "all", label: "All Projects", badge: projectStats.all.toString() },
    {
      key: "active",
      label: "Active",
      badge: (projectStats.active + projectStats["in-progress"]).toString(),
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
      badge: projectStats["on-hold"].toString(),
    },
    {
      key: "overdue",
      label: "Overdue",
      badge: projectStats.overdue.toString(),
    },
  ];

  // Filter projects based on search, active tab, and applied filters
  const filteredProjects = projects.filter((project) => {
    if (!project) return false;

    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      (project.name &&
        project.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.description &&
        project.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Handle tab filtering
    const projectStatus =
      project.status?.toLowerCase().replace(/\s+/g, "-") || "";
    const matchesTab =
      activeTab === "all" ||
      projectStatus === activeTab ||
      (activeTab === "active" &&
        (projectStatus === "active" || projectStatus === "in-progress")) ||
      (activeTab === "overdue" &&
        project.endDate &&
        new Date(project.endDate) < new Date() &&
        projectStatus !== "completed");

    // Applied filters
    let matchesFilters = true;

    if (Object.keys(appliedFilters).length > 0) {
      // Status filter
      if (appliedFilters.status) {
        const filterStatus = appliedFilters.status.toLowerCase();
        const projectStatusLower = projectStatus || "";
        if (filterStatus !== projectStatusLower) {
          matchesFilters = false;
        }
      }

      // Project Manager filter
      if (appliedFilters.projectManager) {
        const projectManager = project.projectManager;
        const managerId = projectManager
          ? (
              projectManager.id ||
              projectManager._id ||
              projectManager.documentId
            )?.toString()
          : "";
        const filterManagerId = appliedFilters.projectManager.toString();
        if (managerId !== filterManagerId) {
          matchesFilters = false;
        }
      }

      // Date range filter (created date)
      if (appliedFilters.dateRange && project.createdAt) {
        const now = new Date();
        let startDate;

        switch (appliedFilters.dateRange) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "quarter":
            const quarterStart = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStart, 1);
            break;
        }

        if (startDate) {
          const projectCreatedDate = new Date(project.createdAt);
          if (projectCreatedDate < startDate) {
            matchesFilters = false;
          }
        }
      }

      // Start date range filter
      if (appliedFilters.startDateFrom || appliedFilters.startDateTo) {
        if (!project.startDate) {
          matchesFilters = false;
        } else {
          const projectStartDate = new Date(project.startDate);
          if (appliedFilters.startDateFrom) {
            const fromDate = new Date(appliedFilters.startDateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (projectStartDate < fromDate) {
              matchesFilters = false;
            }
          }
          if (appliedFilters.startDateTo) {
            const toDate = new Date(appliedFilters.startDateTo);
            toDate.setHours(23, 59, 59, 999);
            if (projectStartDate > toDate) {
              matchesFilters = false;
            }
          }
        }
      }

      // End date range filter
      if (appliedFilters.endDateFrom || appliedFilters.endDateTo) {
        if (!project.endDate) {
          matchesFilters = false;
        } else {
          const projectEndDate = new Date(project.endDate);
          if (appliedFilters.endDateFrom) {
            const fromDate = new Date(appliedFilters.endDateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (projectEndDate < fromDate) {
              matchesFilters = false;
            }
          }
          if (appliedFilters.endDateTo) {
            const toDate = new Date(appliedFilters.endDateTo);
            toDate.setHours(23, 59, 59, 999);
            if (projectEndDate > toDate) {
              matchesFilters = false;
            }
          }
        }
      }
    }

    return matchesSearch && matchesTab && matchesFilters;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedFilters, searchQuery, activeTab]);

  // Show filtered count after data is loaded (toast notification)
  const prevFilteredCountRef = useRef(null);
  useEffect(() => {
    const hasActiveFilters = Object.values(appliedFilters).some(
      (value) => value && value.toString().trim() !== "",
    );

    if (
      hasActiveFilters &&
      !loading &&
      filteredProjects.length !== prevFilteredCountRef.current
    ) {
      prevFilteredCountRef.current = filteredProjects.length;
      setToastMessage(
        `Filters applied. Showing ${filteredProjects.length} result${filteredProjects.length !== 1 ? "s" : ""}`,
      );
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setToastMessage("");
      }, 3000);
    }
  }, [filteredProjects.length, appliedFilters, loading]);

  // Table columns configuration
  const projectColumnsTable = [
    {
      key: "name",
      label: "PROJECT NAME",
      render: (_, project) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <div
            className={`w-10 h-10 bg-gradient-to-br ${project.color || "from-blue-400 to-blue-600"} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
          >
            <span className="text-white font-bold text-sm">
              {project.icon || project.name?.charAt(0)?.toUpperCase() || "P"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate">
              {project.name}
            </div>
            {project.description && (
              <div className="text-xs text-gray-500 truncate">
                {project.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      render: (_, project) => {
        const statusOptions = [
          { value: "Planning", label: "Planning" },
          { value: "Active", label: "Active" },
          { value: "In Progress", label: "In Progress" },
          { value: "Completed", label: "Completed" },
          { value: "On Hold", label: "On Hold" },
          { value: "Cancelled", label: "Cancelled" },
        ];

        const currentStatus = project.status || "Planning";
        const status = currentStatus?.toLowerCase().replace(/\s+/g, "-") || "";

        const statusColors = {
          planning: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-400",
          },
          active: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-400",
          },
          "in-progress": {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-400",
          },
          completed: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
          },
          "on-hold": {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-400",
          },
          cancelled: {
            bg: "bg-gray-100",
            text: "text-gray-800",
            border: "border-gray-400",
          },
        };

        const colors = statusColors[status] || {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-400",
        };

        return (
          <div className="min-w-[140px]" onClick={(e) => e.stopPropagation()}>
            <select
              value={currentStatus}
              onChange={(e) => {
                e.stopPropagation();
                handleStatusUpdate(project.id, e.target.value);
              }}
              className={`w-full ${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-3 py-2 font-bold text-xs text-center shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "0.75rem 0.75rem",
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      },
    },
    {
      key: "projectLead",
      label: "PROJECT LEAD",
      render: (_, project) => {
        const projectManager = project.projectManager;
        const name =
          projectManager?.name ||
          (projectManager?.firstName && projectManager?.lastName
            ? `${projectManager.firstName} ${projectManager.lastName}`
            : projectManager?.firstName ||
              projectManager?.lastName ||
              "Unassigned");
        const initial = name?.charAt(0)?.toUpperCase() || "U";

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProjectLeadModal({ isOpen: true, project });
            }}
            className="flex items-center gap-2 min-w-[180px] hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors text-left"
          >
            {projectManager ? (
              <>
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                  {initial}
                </div>
                <span className="text-sm text-gray-600 truncate">{name}</span>
              </>
            ) : (
              <>
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                  <User className="w-3 h-3" />
                </div>
                <span className="text-sm text-gray-600 truncate">
                  Click to assign
                </span>
              </>
            )}
          </button>
        );
      },
    },
    {
      key: "progress",
      label: "PROGRESS",
      render: (_, project) => (
        <div className="min-w-[150px]">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {project.progress || 0}%
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "team",
      label: "TEAM",
      render: (_, project) => {
        const teamMembers = project.teamMembers || [];
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setTeamModal({ isOpen: true, project });
            }}
            className="flex items-center gap-2 min-w-[140px] hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors text-left"
          >
            {teamMembers.length > 0 ? (
              <div className="flex items-center gap-1">
                {teamMembers.slice(0, 3).map((member, index) => {
                  const name =
                    member?.name ||
                    (member?.firstName && member?.lastName
                      ? `${member.firstName} ${member.lastName}`
                      : member?.firstName || member?.lastName || "Unknown");
                  const initial = name?.charAt(0)?.toUpperCase() || "U";
                  return (
                    <div
                      key={member?.id || index}
                      className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0 border border-white"
                      title={name}
                      style={{
                        marginLeft: index > 0 ? "-4px" : "0",
                        zIndex: 10 - index,
                      }}
                    >
                      {initial}
                    </div>
                  );
                })}
                {teamMembers.length > 3 && (
                  <div
                    className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0 border border-white"
                    title={`${teamMembers.length - 3} more`}
                    style={{ marginLeft: "-4px", zIndex: 7 }}
                  >
                    +{teamMembers.length - 3}
                  </div>
                )}
                <span className="text-sm text-gray-600 truncate ml-1">
                  {teamMembers.length === 1
                    ? teamMembers[0]?.name ||
                      (teamMembers[0]?.firstName && teamMembers[0]?.lastName
                        ? `${teamMembers[0].firstName} ${teamMembers[0].lastName}`
                        : teamMembers[0]?.firstName ||
                          teamMembers[0]?.lastName ||
                          "Unassigned")
                    : `${teamMembers.length} members`}
                </span>
              </div>
            ) : (
              <>
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                  <Users className="w-3 h-3" />
                </div>
                <span className="text-sm text-gray-600 truncate">
                  Click to add team
                </span>
              </>
            )}
          </button>
        );
      },
    },
    {
      key: "dates",
      label: "DATES",
      render: (_, project) => {
        // Convert dates to date format (YYYY-MM-DD)
        const getDateValue = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const startDateValue = getDateValue(project.startDate);
        const endDateValue = getDateValue(project.endDate);

        return (
          <div
            className="flex items-center gap-2 min-w-[200px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar className="w-4 h-4 flex-shrink-0 text-gray-500" />
            <div className="flex items-center gap-1 flex-1">
              <input
                type="date"
                value={startDateValue}
                onChange={(e) => {
                  handleDateUpdate(project.id, "startDate", e.target.value);
                }}
                className="flex-1 text-xs text-gray-700 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Start date"
                title="Start date"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={endDateValue}
                onChange={(e) => {
                  handleDateUpdate(project.id, "endDate", e.target.value);
                }}
                className="flex-1 text-xs text-gray-700 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="End date"
                title="End date"
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "tasks",
      label: "TASKS",
      render: (_, project) => (
        <div className="min-w-[100px]">
          <span className="text-sm text-gray-600">
            {project.tasksCount || project.tasks?.length || 0}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_, project) => (
        <div className="flex items-center gap-1 min-w-[180px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleProjectClick(project);
            }}
            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="View Project"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditProject(project);
            }}
            className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
            title="Edit Project"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleArchiveProject(project);
            }}
            className="p-1.5 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded transition-colors"
            title="Archive Project"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(project);
            }}
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleProjectClick = (project) => {
    if (project?.slug) {
      router.push(`/projects/${project.slug}`);
    } else if (project?.id) {
      router.push(`/projects/${project.id}`);
    }
  };

  // Handle edit project
  const handleEditProject = (project) => {
    if (project?.slug) {
      router.push(`/projects/${project.slug}/edit`);
    } else if (project?.id) {
      router.push(`/projects/${project.id}/edit`);
    }
  };

  // Handle archive project
  const handleArchiveProject = async (project) => {
    try {
      // Update project status to archived
      await projectService.updateProject(project.id, {
        status: "ARCHIVED",
      });

      // Update local state
      setProjects((prev) =>
        prev.map((p) =>
          p.id === project.id ? { ...p, status: "ARCHIVED" } : p,
        ),
      );

      setToastMessage("Project archived successfully");
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setToastMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error archiving project:", error);
      setToastMessage("Failed to archive project. Please try again.");
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setToastMessage("");
      }, 3000);
    }
  };

  // Handle delete click - open confirmation modal
  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  // Handle delete project
  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    const loadingKey = `${projectToDelete.id}-delete`;
    setLoadingActions((prev) => ({ ...prev, [loadingKey]: true }));

    try {

      // Delete the project via API
      await projectService.deleteProject(projectToDelete.id);

      // Remove from local state
      setProjects((prev) =>
        prev.filter((project) => project.id !== projectToDelete.id),
      );

      // Close modal and reset state
      setShowDeleteModal(false);
      setProjectToDelete(null);

      // Show success message
      setToastMessage("Project deleted successfully");
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setToastMessage("");
      }, 3000);

    } catch (error) {
      console.error("Error deleting project:", error);
      setToastMessage("Failed to delete project. Please try again.");
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setToastMessage("");
      }, 3000);
    } finally {
      setLoadingActions((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  // Handle status update
  const handleStatusUpdate = async (projectId, newStatus) => {
    try {
      // Check if project is being marked as completed
      const isCompleting = newStatus === "Completed";

      // Get current project to check previous status
      const currentProject = projects.find((p) => p.id === projectId);
      const wasAlreadyCompleted = currentProject?.status === "Completed";

      // Transform frontend status to Strapi enum format
      const strapiStatus = transformStatusToStrapi(newStatus);


      await projectService.updateProject(projectId, { status: strapiStatus });

      // Trigger confetti animation only when completing a project (not when uncompleting)
      if (isCompleting && !wasAlreadyCompleted) {
        triggerProjectCompletionAnimation();
      }

      // Reload projects to get updated data from server
      const projectsResponse = await projectService.getAllProjects({
        pageSize: 100,
        populate: ["projectManager", "teamMembers", "tasks"],
      });

      const transformedProjects =
        projectsResponse.data?.map(transformProject) || [];

      setProjects(transformedProjects);
    } catch (error) {
      console.error("Error updating project status:", error);
      alert("Failed to update project status. Please try again.");
    }
  };

  // Fancy confetti animation for project completion
  const triggerProjectCompletionAnimation = () => {
    const duration = 4000; // 4 seconds of celebration
    const animationEnd = Date.now() + duration;
    const defaults = {
      startVelocity: 40,
      spread: 360,
      ticks: 100,
      zIndex: 99999,
      colors: [
        "#10B981",
        "#3B82F6",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#EC4899",
        "#14B8A6",
        "#F97316",
      ],
    };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    // Initial burst from center
    confetti({
      ...defaults,
      particleCount: 100,
      origin: { x: 0.5, y: 0.5 },
      angle: randomInRange(55, 125),
    });

    // Burst from left
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 80,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        angle: randomInRange(45, 75),
      });
    }, 200);

    // Burst from right
    setTimeout(() => {
      confetti({
        ...defaults,
        particleCount: 80,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        angle: randomInRange(105, 135),
      });
    }, 400);

    // Continuous confetti shower
    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      // Confetti from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });

      // Confetti from top center
      confetti({
        ...defaults,
        particleCount: particleCount * 0.5,
        origin: { x: 0.5, y: 0 },
        angle: randomInRange(80, 100),
      });
    }, 250);

    // Update canvas z-index to ensure it's on top
    const updateCanvasZIndex = () => {
      const canvases = document.querySelectorAll("canvas");
      canvases.forEach((canvas) => {
        if (canvas.width > 0 && canvas.height > 0) {
          canvas.style.zIndex = "99999";
          canvas.style.position = "fixed";
          canvas.style.top = "0";
          canvas.style.left = "0";
          canvas.style.pointerEvents = "none";
        }
      });
    };

    // Continuously update z-index
    const zIndexInterval = setInterval(() => {
      updateCanvasZIndex();
    }, 50);

    // Clear z-index update interval when confetti ends
    setTimeout(() => {
      clearInterval(zIndexInterval);
    }, duration + 100);
  };

  // Handle project lead update
  const handleProjectLeadUpdate = async (projectId, userId) => {
    try {
      const updateData = userId
        ? { projectManager: parseInt(userId, 10) }
        : { projectManager: null };

      await projectService.updateProject(projectId, updateData);

      // Reload projects to get updated projectManager with full data
      const projectsResponse = await projectService.getAllProjects({
        pageSize: 100,
        populate: ["projectManager", "teamMembers", "tasks"],
      });

      const transformedProjects =
        projectsResponse.data?.map(transformProject) || [];

      setProjects(transformedProjects);
    } catch (error) {
      console.error("Error updating project lead:", error);
      alert("Failed to update project lead. Please try again.");
    }
  };

  // Handle date update
  const handleDateUpdate = async (projectId, field, dateValue) => {
    try {
      const updateData = {};
      if (field === "startDate") {
        updateData.startDate = dateValue
          ? new Date(dateValue + "T00:00:00").toISOString()
          : null;
      } else if (field === "endDate") {
        updateData.endDate = dateValue
          ? new Date(dateValue + "T00:00:00").toISOString()
          : null;
      }

      await projectService.updateProject(projectId, updateData);
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId ? { ...p, ...updateData } : p,
        ),
      );
    } catch (error) {
      console.error("Error updating project date:", error);
    }
  };

  // Handle team update
  const handleTeamUpdate = async (projectId, teamMemberIds) => {
    try {
      // Ensure all IDs are integers
      const parsedIds = teamMemberIds
        .map((id) => (typeof id === "string" ? parseInt(id, 10) : id))
        .filter((id) => !isNaN(id));


      const updatedProject = await projectService.updateProject(projectId, {
        teamMembers: parsedIds,
      });


      // Reload all projects to get updated team members with full populate
      const projectsResponse = await projectService.getAllProjects({
        pageSize: 100,
        populate: ["projectManager", "teamMembers", "tasks"],
      });
      const transformedProjects =
        projectsResponse.data?.map(transformProject) || [];
      setProjects(transformedProjects);

    } catch (error) {
      console.error("Error updating project team:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      alert(`Failed to update team: ${error.message || "Unknown error"}`);
      throw error; // Re-throw so the modal can handle it
    }
  };

  const handleExport = (format) => {
    try {
      let exportFormat = format;
      if (format && typeof format === "object" && format.target) {
        exportFormat = "csv";
      } else if (!format || typeof format !== "string") {
        exportFormat = "csv";
      } else {
        // Normalize to lowercase
        exportFormat = format.toLowerCase();
        // Handle "export" as CSV (default export format)
        if (exportFormat === "export") {
          exportFormat = "csv";
        }
        // If it's not a recognized format, default to CSV
        if (!["csv", "pdf", "excel"].includes(exportFormat)) {
          exportFormat = "csv";
        }
      }


      const exportData = filteredProjects.map((project) => {
        const projectManager = project.projectManager;
        const managerName = projectManager
          ? `${projectManager.firstName || ""} ${projectManager.lastName || ""}`.trim() ||
            projectManager.name ||
            projectManager.email ||
            "Unassigned"
          : "Unassigned";

        const teamMembers = project.teamMembers || [];
        const teamSize = teamMembers.length;

        return {
          "Project Name": project.name || "",
          Status: project.status || "",
          "Project Lead": managerName,
          Progress: project.progress ? `${project.progress}%` : "0%",
          "Team Size": teamSize.toString(),
          "Start Date": project.startDate
            ? new Date(project.startDate).toLocaleDateString()
            : "",
          "End Date": project.endDate
            ? new Date(project.endDate).toLocaleDateString()
            : "",
          "Created Date": project.createdAt
            ? new Date(project.createdAt).toLocaleDateString()
            : "",
          Description: project.description || "",
          Budget: project.budget ? `₹${project.budget.toLocaleString()}` : "",
          Health: project.health || "",
          Priority: project.priority || "",
          Notes: project.notes || "",
        };
      });

      if (exportData.length === 0) {
        alert("No data to export.");
        return;
      }

      if (exportFormat === "csv") {
        const headers = Object.keys(exportData[0] || {});
        const csvContent = [
          headers.join(","),
          ...exportData.map((row) =>
            headers
              .map(
                (header) =>
                  `"${(row[header] || "").toString().replace(/"/g, '""')}"`,
              )
              .join(","),
          ),
        ].join("\n");

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute(
          "download",
          `projects_${new Date().toISOString().split("T")[0]}.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setToastMessage(
          `Exported ${exportData.length} project${exportData.length !== 1 ? "s" : ""} successfully!`,
        );
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
          setToastMessage("");
        }, 3000);
      } else {
        alert(`${exportFormat.toUpperCase()} export coming soon!`);
      }
    } catch (error) {
      console.error("Error exporting projects:", error);
      alert("Failed to export projects");
    } finally {
      setShowExportDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target)
      ) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Loading state (including auth loading)
  if (loading || authLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-4 space-y-4">
          <PageHeader
            title="Projects"
            subtitle="Manage and track all of your projects here"
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Projects", href: "/projects" },
            ]}
            showSearch={true}
            showActions={true}
            showProfile={true}
            searchPlaceholder="Search projects..."
            onSearchChange={setSearchQuery}
            onAddClick={() => router.push("/projects/add")}
            onFilterClick={() => setIsFilterModalOpen(true)}
            onExportClick={() => setShowExportDropdown(!showExportDropdown)}
          />
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {authLoading
                  ? "Loading user information..."
                  : "Loading projects..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - but still show the page structure
  if (error && projects.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-4 space-y-4">
          <PageHeader
            title="Projects"
            subtitle="Manage and track all of your projects here"
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Projects", href: "/projects" },
            ]}
            showSearch={true}
            showActions={true}
            showProfile={true}
            searchPlaceholder="Search projects..."
            onSearchChange={setSearchQuery}
            onAddClick={() => router.push("/projects/add")}
            onFilterClick={() => setIsFilterModalOpen(true)}
            onExportClick={() => setShowExportDropdown(!showExportDropdown)}
          />
          <div className="space-y-4">
            {/* Stats Overview - show empty stats */}
            <ProjectsKPIs statusStats={statusStats} />

            {/* Error message */}
            <Card glass={true} className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Error Loading Projects
                </h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => router.push("/projects/add")}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Create Your First Project
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Grid view render function
  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProjects.map((project) => (
        <div
          key={project.id}
          className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl cursor-pointer hover:scale-105 transition-all duration-300"
          onClick={() => handleProjectClick(project)}
        >
          <div className="p-6">
            {/* Project Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${project.color || "from-blue-400 to-blue-600"} rounded-xl flex items-center justify-center shadow-lg`}
                >
                  <span className="text-white font-bold text-lg">
                    {project.icon ||
                      project.name?.charAt(0)?.toUpperCase() ||
                      "P"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-foreground text-lg">
                    {project.name}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${
                      project.status === "Active" ||
                      project.status === "In Progress"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : project.status === "Planning"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                          : project.status === "Completed"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : project.status === "On Hold"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Project Description */}
            {project.description && (
              <p className="text-sm text-brand-text-light mb-4 line-clamp-2">
                {project.description}
              </p>
            )}

            {/* Project Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-brand-foreground">
                  {project.tasksCount || project.tasks?.length || 0}
                </div>
                <div className="text-xs text-brand-text-light">Total Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {project.tasks?.filter(
                    (t) =>
                      t.status?.toLowerCase() === "done" ||
                      t.status?.toLowerCase() === "completed",
                  ).length || 0}
                </div>
                <div className="text-xs text-brand-text-light">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {project.tasks?.filter((t) => {
                    if (!t.scheduledDate) return false;
                    const dueDate = new Date(t.scheduledDate);
                    const now = new Date();
                    return (
                      dueDate < now &&
                      t.status?.toLowerCase() !== "done" &&
                      t.status?.toLowerCase() !== "completed"
                    );
                  }).length || 0}
                </div>
                <div className="text-xs text-brand-text-light">Overdue</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-brand-text-light">Progress</span>
                <span className="font-medium text-brand-foreground">
                  {project.progress || 0}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-brand-primary to-brand-secondary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress || 0}%` }}
                ></div>
              </div>
            </div>

            {/* Team Members */}
            <div className="flex items-center justify-between">
              <div className="flex -space-x-2">
                {(project.teamMembers || [])
                  .slice(0, 3)
                  .map((member, index) => {
                    const name =
                      member?.name ||
                      (member?.firstName && member?.lastName
                        ? `${member.firstName} ${member.lastName}`
                        : member?.firstName || member?.lastName || "Unknown");
                    const initial = name?.charAt(0)?.toUpperCase() || "U";
                    return (
                      <div
                        key={member?.id || index}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white"
                        title={name}
                      >
                        {initial}
                      </div>
                    );
                  })}
                {(project.teamMembers || []).length > 3 && (
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white/50">
                    +{(project.teamMembers || []).length - 3}
                  </div>
                )}
              </div>
              <div className="text-xs text-brand-text-light">
                {project.startDate ? formatDate(project.startDate) : "N/A"} -{" "}
                {project.endDate ? formatDate(project.endDate) : "N/A"}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="min-h-screen bg-white">
        <div className="p-4 space-y-4">
          {/* Page Header */}
          <div className="relative">
            <PageHeader
              title="Projects"
              subtitle="Manage and track all of your projects here"
              breadcrumb={[
                { label: "Dashboard", href: "/" },
                { label: "Projects", href: "/projects" },
              ]}
              showSearch={true}
              showActions={true}
              showProfile={true}
              searchPlaceholder="Search projects..."
              onSearchChange={setSearchQuery}
              onAddClick={() => router.push("/projects/add")}
              onFilterClick={() => setIsFilterModalOpen(true)}
              onExportClick={() => setShowExportDropdown(!showExportDropdown)}
            />

            {/* Export Dropdown */}
            {showExportDropdown && (
              <div
                className="absolute right-4 top-20 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 z-50"
                ref={exportDropdownRef}
              >
                <div className="py-1">
                  <button
                    onClick={() => handleExport("pdf")}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-3 text-red-500" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("excel")}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-3 text-green-500" />
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-3 text-blue-500" />
                    CSV
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Stats Overview */}
            <ProjectsKPIs statusStats={statusStats} />

            {/* View Toggle */}
            <ProjectsTabs
              tabItems={tabItems}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeView={activeView}
              setActiveView={setActiveView}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAddClick={() => router.push("/projects/add")}
              onExportClick={handleExport}
            />

            {/* Results Count */}
            <div className="text-sm text-gray-600 px-1">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredProjects.length}
              </span>{" "}
              result{filteredProjects.length !== 1 ? "s" : ""}
            </div>

            {/* Single Horizontal Scroll Container */}
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Projects Table/Grid */}
              {activeView === "list" && (
                <ProjectsListView
                  filteredProjects={paginatedProjects}
                  projectColumnsTable={projectColumnsTable}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  setIsModalOpen={() => router.push("/projects/add")}
                  onRowClick={handleProjectClick}
                  pagination={
                    totalPages > 1 ? (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredProjects.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                      />
                    ) : null
                  }
                />
              )}
              {activeView === "grid" && (
                <div className="rounded-3xl overflow-hidden">
                  {renderGridView()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <ProjectsFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={(filters) => setAppliedFilters(filters)}
        users={allUsers}
        appliedFilters={appliedFilters}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Project
                </h3>
                <p className="text-sm text-gray-500">
                  This action cannot be undone
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete{" "}
                <strong>{projectToDelete.name || projectToDelete.title}</strong>
                ?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium mb-2">
                  ⚠️ This will permanently delete:
                </p>
                <ul className="text-sm text-red-600 space-y-1">
                  <li>• Project information and details</li>
                  <li>• All associated tasks and subtasks</li>
                  <li>• Team member assignments</li>
                  <li>• Project timeline and milestones</li>
                  <li>• All project-related data</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectToDelete(null);
                }}
                className="flex-1 px-4 py-2 border-2 border-gray-400 rounded-lg text-gray-800 bg-white hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                disabled={loadingActions[`${projectToDelete.id}-delete`]}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 rounded-lg font-medium flex items-center justify-center gap-2"
              >
                {loadingActions[`${projectToDelete.id}-delete`] ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Messages */}
      {showSuccessMessage && toastMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999] pointer-events-none animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Team Management Modal */}
      {teamModal.isOpen && (
        <TeamManagementModal
          isOpen={teamModal.isOpen}
          onClose={() => setTeamModal({ isOpen: false, project: null })}
          project={teamModal.project}
          onUpdate={(updatedProject) => {
            // Update projects list
            setProjects((prevProjects) =>
              prevProjects.map((p) =>
                p.id === updatedProject.id ? updatedProject : p,
              ),
            );
            // Update the project in the modal state so UI reflects changes
            setTeamModal((prev) => ({
              ...prev,
              project: updatedProject,
            }));
          }}
        />
      )}

      {/* Project Lead Selection Modal */}
      {projectLeadModal.isOpen && (
        <ProjectLeadModal
          isOpen={projectLeadModal.isOpen}
          onClose={() => setProjectLeadModal({ isOpen: false, project: null })}
          project={projectLeadModal.project}
          onUpdate={(updatedProject) => {
            // Update projects list
            setProjects((prevProjects) =>
              prevProjects.map((p) =>
                p.id === updatedProject.id ? updatedProject : p,
              ),
            );
            // Update the project in the modal state so UI reflects changes
            setProjectLeadModal((prev) => ({
              ...prev,
              project: updatedProject,
            }));
          }}
        />
      )}
    </div>
  );
}

// Team Management Modal Component
function TeamManagementModal({ isOpen, onClose, project, onUpdate }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);

  // Update local project state when prop changes
  useEffect(() => {
    if (project) {
      setCurrentProject(project);
    }
  }, [project]);

  // Get current team members from local state
  const currentTeamMembers = currentProject?.teamMembers || [];

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Reset to current project when modal opens
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersResponse = await apiClient.get("/api/xtrawrkx-users", {
        "pagination[pageSize]": 100,
        populate: "primaryRole,userRoles,department",
        "filters[isActive][$eq]": "true",
      });

      let usersData = [];
      if (usersResponse?.data && Array.isArray(usersResponse.data)) {
        usersData = usersResponse.data;
      } else if (Array.isArray(usersResponse)) {
        usersData = usersResponse;
      }

      const transformedUsers = usersData
        .filter((user) => user && user.id)
        .map((user) => {
          const userData = user.attributes || user;
          const firstName = userData.firstName || "";
          const lastName = userData.lastName || "";
          const email = userData.email || "";
          const name =
            `${firstName} ${lastName}`.trim() || email || "Unknown User";

          return {
            id: user.id,
            firstName,
            lastName,
            email,
            name,
          };
        });

      setUsers(transformedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower)
    );
  });

  const isTeamMember = (userId) => {
    return currentTeamMembers.some((member) => {
      const memberId = typeof member === "object" ? member.id : member;
      return memberId === userId;
    });
  };

  const handleToggleTeamMember = async (user) => {
    if (!currentProject) return;

    setSaving(true);
    try {
      const isCurrentlyMember = isTeamMember(user.id);
      let updatedTeamMembers;

      if (isCurrentlyMember) {
        // Remove team member
        updatedTeamMembers = currentTeamMembers.filter((member) => {
          const memberId = typeof member === "object" ? member.id : member;
          return memberId !== user.id;
        });
      } else {
        // Add team member
        updatedTeamMembers = [...currentTeamMembers, user];
      }

      // Get team member IDs
      const teamMemberIds = updatedTeamMembers
        .map((m) => {
          return typeof m === "object" ? m.id || m : m;
        })
        .filter((id) => id != null);


      // Update project with new team members
      await projectService.updateProject(currentProject.id, {
        teamMembers: teamMemberIds,
      });

      // Reload project to get updated team members
      const updatedProject = await projectService.getProjectById(
        currentProject.id,
        ["projectManager", "teamMembers", "tasks"],
      );

      const transformedProject = transformProject(updatedProject);


      // Update local project state immediately for UI update
      setCurrentProject(transformedProject);

      // Update parent state
      if (onUpdate) {
        onUpdate(transformedProject);
      }

      // Don't close the modal - allow multiple toggles
    } catch (error) {
      console.error("Error updating team members:", error);
      alert(`Failed to update team: ${error.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !currentProject) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Team</h2>
            <p className="text-sm text-gray-500 mt-1">{currentProject.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const isMember = isTeamMember(user.id);
                const initial = user.name?.charAt(0)?.toUpperCase() || "U";

                return (
                  <button
                    key={user.id}
                    onClick={() => handleToggleTeamMember(user)}
                    disabled={saving}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isMember
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                        isMember
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    {isMember ? (
                      <UserMinus className="w-5 h-5 text-blue-600" />
                    ) : (
                      <UserPlus className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Project Lead Selection Modal Component
function ProjectLeadModal({ isOpen, onClose, project, onUpdate }) {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);

  // Update local project state when prop changes
  useEffect(() => {
    if (project) {
      setCurrentProject(project);
    }
  }, [project]);

  // Get current project lead from local state
  const currentProjectLead = currentProject?.projectManager;

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Reset to current project when modal opens
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersResponse = await apiClient.get("/api/xtrawrkx-users", {
        "pagination[pageSize]": 100,
        populate: "primaryRole,userRoles,department",
        "filters[isActive][$eq]": "true",
      });

      let usersData = [];
      if (usersResponse?.data && Array.isArray(usersResponse.data)) {
        usersData = usersResponse.data;
      } else if (Array.isArray(usersResponse)) {
        usersData = usersResponse;
      }

      const transformedUsers = usersData
        .filter((user) => user && user.id)
        .map((user) => {
          const userData = user.attributes || user;
          const firstName = userData.firstName || "";
          const lastName = userData.lastName || "";
          const email = userData.email || "";
          const name =
            `${firstName} ${lastName}`.trim() || email || "Unknown User";

          return {
            id: user.id,
            firstName,
            lastName,
            email,
            name,
          };
        });

      setUsers(transformedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.firstName.toLowerCase().includes(searchLower) ||
      user.lastName.toLowerCase().includes(searchLower)
    );
  });

  const isProjectLead = (userId) => {
    if (!currentProjectLead) return false;
    const leadId =
      typeof currentProjectLead === "object"
        ? currentProjectLead.id
        : currentProjectLead;
    return leadId === userId;
  };

  const handleSelectProjectLead = async (user) => {
    if (!currentProject) return;

    setSaving(true);
    try {
      if (!user) {
        // Remove project lead (set to null)
        await projectService.updateProject(currentProject.id, {
          projectManager: null,
        });
      } else {
        const isCurrentlyLead = isProjectLead(user.id);

        if (isCurrentlyLead) {
          // Already selected, do nothing or close modal
          onClose();
          return;
        } else {
          // Set new project lead
          await projectService.updateProject(currentProject.id, {
            projectManager: user.id,
          });
        }
      }

      // Reload project to get updated project manager
      const updatedProject = await projectService.getProjectById(
        currentProject.id,
        ["projectManager", "teamMembers", "tasks"],
      );

      const transformedProject = transformProject(updatedProject);

      // Update local project state immediately for UI update
      setCurrentProject(transformedProject);

      // Update parent state
      if (onUpdate) {
        onUpdate(transformedProject);
      }

      // Close the modal after selection
      onClose();
    } catch (error) {
      console.error("Error updating project lead:", error);
      alert(
        `Failed to update project lead: ${error.message || "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !currentProject) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[90] p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Select Project Lead
            </h2>
            <p className="text-sm text-gray-500 mt-1">{currentProject.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Unassign option */}
          <button
            onClick={() => handleSelectProjectLead(null)}
            disabled={saving || !currentProjectLead}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 ${
              !currentProjectLead
                ? "bg-gray-100 border border-gray-300 cursor-not-allowed"
                : "hover:bg-gray-50 border border-transparent"
            } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 bg-gray-200 text-gray-600">
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium text-gray-900">Unassigned</div>
              <div className="text-sm text-gray-500">Remove project lead</div>
            </div>
            {!currentProjectLead && (
              <CheckCircle className="w-5 h-5 text-blue-600" />
            )}
          </button>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No users found</div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => {
                const isLead = isProjectLead(user.id);
                const initial = user.name?.charAt(0)?.toUpperCase() || "U";

                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectProjectLead(user)}
                    disabled={saving}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isLead
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                        isLead
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    {isLead && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
