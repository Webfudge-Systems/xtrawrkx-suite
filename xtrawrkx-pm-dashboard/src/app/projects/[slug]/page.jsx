"use client";

import {
  Plus,
  Calendar,
  CheckSquare,
  User,
  Clock,
  Star,
  UserPlus,
  Share,
  MessageSquare,
  Users,
  Paperclip,
  Smile,
  Search,
  MoreVertical,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  DollarSign,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Check,
  GitBranch,
  ChevronRight,
  ChevronDown,
  Eye,
  Trash2,
  Building2,
  Globe,
  Edit,
  X,
} from "lucide-react";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  getChannelsByProjectId,
  getMessagesByChannelId,
  teamMembers,
} from "../../../data/centralData";
import { TaskContextMenuProject } from "../../../components/projects";
import {
  TaskDetailModal,
  TasksListView,
  TaskDeleteConfirmationModal,
} from "../../../components/my-task";
import AddTaskModal from "../../../components/my-task/AddTaskModal";
import ProjectSelector from "../../../components/my-task/ProjectSelector";
import PageHeader from "../../../components/shared/PageHeader";
import { useRouter } from "next/navigation";
import projectService from "../../../lib/projectService";
import {
  transformProject,
  transformTask,
  transformSubtask,
  transformStatusToStrapi,
  transformPriorityToStrapi,
  transformComment,
  formatDate,
} from "../../../lib/dataTransformers";
import taskService from "../../../lib/taskService";
import subtaskService from "../../../lib/subtaskService";
import commentService from "../../../lib/commentService";
import CollaboratorModal from "../../../components/my-task/CollaboratorModal";
import apiClient from "../../../lib/apiClient";
import { Button, SearchableSelect } from "../../../components/ui";
import InviteMemberModal from "../../../components/projects/InviteMemberModal";

export default function ProjectDetail({ params }) {
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskName, setEditingTaskName] = useState("");
  const [collaboratorModal, setCollaboratorModal] = useState({
    isOpen: false,
    task: null,
  });
  const [projectLeadModal, setProjectLeadModal] = useState({
    isOpen: false,
  });
  const [expandedSubtasks, setExpandedSubtasks] = useState({});
  const [loadedSubtasks, setLoadedSubtasks] = useState({});
  const [subtaskDropdownPositions, setSubtaskDropdownPositions] = useState({});
  const subtaskButtonRefs = useRef({});
  const [loadingStatusUpdate, setLoadingStatusUpdate] = useState(false);

  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  // Close subtask dropdowns on scroll
  useEffect(() => {
    const handleScroll = () => {
      setExpandedSubtasks({});
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);
  const [projects, setProjects] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    task: null,
  });

  // Row dropdown state
  const [rowDropdown, setRowDropdown] = useState({
    isOpen: false,
    taskId: null,
  });

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    task: null,
  });

  // Task detail modal state
  const [taskDetailModal, setTaskDetailModal] = useState({
    isOpen: false,
    task: null,
  });

  // Add task modal state
  const [addTaskModal, setAddTaskModal] = useState({
    isOpen: false,
    projectId: null,
  });
  const [inviteModal, setInviteModal] = useState({
    isOpen: false,
  });

  // Drag over state for kanban (unused but kept for future functionality)
  // const [draggedOver, setDraggedOver] = useState(null);

  // Calendar state - Initialize safely for SSR
  const [month, setMonth] = useState(() => {
    if (typeof window !== "undefined") {
      return new Date().getMonth();
    }
    return 0; // Default to January for SSR
  });
  const [year, setYear] = useState(() => {
    if (typeof window !== "undefined") {
      return new Date().getFullYear();
    }
    return 2024; // Default year for SSR
  });

  // Note: Drag and drop functionality can be added in the future

  // Load project data from API
  useEffect(() => {
    const loadProject = async () => {
      if (!params?.slug) return;

      try {
        setIsLoading(true);
        setError(null);

        // Handle both Promise-based and direct params (Next.js App Router compatibility)
        let slugParam;
        if (params.slug instanceof Promise) {
          const resolvedParams = await params;
          slugParam = resolvedParams.slug;
        } else {
          slugParam = params.slug;
        }

        if (!slugParam) {
          throw new Error("Project identifier is required");
        }

        let strapiProject = null;

        // Try to parse as ID first (if it's numeric)
        const parsedId = parseInt(slugParam, 10);
        if (!isNaN(parsedId)) {
          // It's a numeric ID, fetch by ID
          try {
            strapiProject = await projectService.getProjectById(parsedId, [
              "projectManager",
              "teamMembers",
              "tasks",
              "tasks.assignee",
              "tasks.collaborators",
              "tasks.project",
              "tasks.subtasks",
              "account",
              "deal",
              "deal.leadCompany",
              "deal.clientAccount",
              "clientAccount",
            ]);
          } catch (idError) {
          }
        }

        // If not found by ID or not numeric, try by slug
        if (!strapiProject) {
          try {
            strapiProject = await projectService.getProjectBySlug(slugParam, [
              "projectManager",
              "teamMembers",
              "tasks",
              "tasks.assignee",
              "tasks.collaborators",
              "tasks.project",
              "tasks.subtasks",
              "account",
              "deal",
              "deal.leadCompany",
              "deal.clientAccount",
              "clientAccount",
            ]);
          } catch (slugError) {
            console.error("Failed to fetch by slug:", slugError);
            throw new Error("Project not found");
          }
        }

        if (!strapiProject) {
          throw new Error("Project not found");
        }

        // Transform to frontend format
        const transformedProject = transformProject(strapiProject);

        // Load all projects for ProjectSelector
        try {
          const projectsResponse = await projectService.getAllProjects({
            pageSize: 50,
          });
          const transformedProjects =
            projectsResponse.data?.map((p) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              color: p.color,
              icon: p.icon,
            })) || [];
          setProjects(transformedProjects);
        } catch (error) {
          console.error("Error loading projects:", error);
        }

        // Calculate stats
        let stats = {
          totalTasks: transformedProject.tasks?.length || 0,
          completedTasks: 0,
          incompleteTasks: 0,
          assignedTasks: 0,
          overdueTasks: 0,
        };

        if (transformedProject.tasks && transformedProject.tasks.length > 0) {
          transformedProject.tasks.forEach((task) => {
            if (task.status === "Done" || task.status === "COMPLETED") {
              stats.completedTasks++;
            } else {
              stats.incompleteTasks++;
            }
            if (
              task.assignee ||
              (task.assigneeIds && task.assigneeIds.length > 0)
            ) {
              stats.assignedTasks++;
            }
            // Check if overdue
            if (task.dueDate) {
              const dueDate = new Date(task.dueDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (
                dueDate < today &&
                task.status !== "Done" &&
                task.status !== "COMPLETED"
              ) {
                stats.overdueTasks++;
              }
            }
          });
        }

        // Always fetch task details separately to ensure assignees are populated
        // This matches the approach used in my-task page which works correctly
        let enrichedTasks = transformedProject.tasks || [];
        if (transformedProject.tasks && transformedProject.tasks.length > 0) {
          try {
            // Fetch all tasks for this project with proper populate
            const projectTasksResponse = await taskService.getTasksByProject(
              transformedProject.id,
              {
                pageSize: 100,
                populate: [
                  "assignee",
                  "assignee.firstName",
                  "assignee.lastName",
                  "assignee.email",
                  "collaborators",
                  "collaborators.firstName",
                  "collaborators.lastName",
                  "collaborators.email",
                  "projects",
                  "subtasks",
                ],
              },
            );

            // Transform the fetched tasks
            const fetchedTasks = (projectTasksResponse.data || []).map(
              transformTask,
            );

            // Create a map of fetched tasks by ID for quick lookup
            const fetchedTasksMap = new Map(fetchedTasks.map((t) => [t.id, t]));

            // Merge fetched task data with project tasks (preserve project-specific data)
            enrichedTasks = transformedProject.tasks.map((projectTask) => {
              const fetchedTask = fetchedTasksMap.get(projectTask.id);
              if (fetchedTask) {
                // Use fetched task data but preserve project relation
                return {
                  ...fetchedTask,
                  project: projectTask.project || {
                    id: transformedProject.id,
                    name: transformedProject.name,
                    slug: transformedProject.slug,
                    color: transformedProject.color,
                    icon: transformedProject.icon,
                  },
                };
              }
              return projectTask;
            });
          } catch (error) {
            console.error("Error fetching task details:", error);
            // Fallback: try individual fetches
            try {
              const taskDetailsPromises = transformedProject.tasks.map((task) =>
                taskService
                  .getTaskById(task.id, [
                    "assignee",
                    "collaborators",
                    "projects",
                    "subtasks",
                  ])
                  .then((fullTask) => transformTask(fullTask))
                  .catch((err) => {
                    console.error(`Error fetching task ${task.id}:`, err);
                    return task;
                  }),
              );
              enrichedTasks = await Promise.all(taskDetailsPromises);
            } catch (fallbackError) {
              console.error("Fallback fetch also failed:", fallbackError);
              enrichedTasks = transformedProject.tasks;
            }
          }
        }

        // Ensure all tasks have the project relation set (since we're on project details page)
        // Also ensure assignee/collaborators are properly set
        const tasksWithProject =
          enrichedTasks?.map((task) => {
            // Ensure assignee is included in collaborators if not already there
            let collaborators = task.collaborators || [];

            // If assignee exists and is not in collaborators, add it
            if (task.assignee) {
              const assigneeInCollaborators = collaborators.find(
                (c) => c?.id === task.assignee?.id,
              );
              if (!assigneeInCollaborators) {
                collaborators = [task.assignee, ...collaborators];
              }
            }

            // Final collaborators array - ensure it's not empty if assignee exists
            const finalCollaborators =
              collaborators.length > 0
                ? collaborators
                : task.assignee
                  ? [task.assignee]
                  : [];

            return {
              ...task,
              project: task.project || {
                id: transformedProject.id,
                name: transformedProject.name,
                slug: transformedProject.slug,
                color: transformedProject.color,
                icon: transformedProject.icon,
              },
              // Ensure assignee is preserved
              assignee: task.assignee,
              // Ensure collaborators array is set
              collaborators: finalCollaborators,
            };
          }) || [];

        // Add stats and team to project
        // Store original dates for calculations (formatDate returns formatted strings)

        // Handle account data - can come in different Strapi formats
        let accountData = null;
        if (strapiProject.account) {
          // Handle different Strapi response structures
          const account = strapiProject.account.data || strapiProject.account;
          const accountAttributes = account?.attributes || account;

          accountData = {
            id: account?.id || account?.documentId,
            name:
              accountAttributes?.name ||
              accountAttributes?.companyName ||
              account?.name ||
              account?.companyName ||
              "N/A",
            industry: accountAttributes?.industry || account?.industry || "",
            website: accountAttributes?.website || account?.website || "",
            employees: accountAttributes?.employees || account?.employees || "",
            city: accountAttributes?.city || account?.city || "",
            state: accountAttributes?.state || account?.state || "",
            country: accountAttributes?.country || account?.country || "",
          };
        }

        const enrichedProject = {
          ...transformedProject,
          tasks: tasksWithProject,
          stats,
          team: transformedProject.teamMembers || [],
          client: accountData,
          deal: strapiProject.deal || null,
          // Store original ISO dates for calculations
          originalStartDate: strapiProject.startDate,
          originalEndDate: strapiProject.endDate,
        };

        // Debug logging

        setProject(enrichedProject);

        // Set first channel as selected when project loads
        if (enrichedProject.id) {
          const channels = getChannelsByProjectId(enrichedProject.id);
          if (channels.length > 0) {
            setSelectedChannel(channels[0]);
          }
        }
      } catch (err) {
        console.error("Error loading project:", err);
        setError(err.message || "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    loadProject();
  }, [params]);

  // Update to current date on client mount
  useEffect(() => {
    const now = new Date();
    setMonth(now.getMonth());
    setYear(now.getFullYear());
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close row dropdown when clicking outside
      if (rowDropdown.isOpen) {
        const dropdownElement = document.getElementById(
          `row-dropdown-${rowDropdown.taskId}`,
        );
        const triggerElement = document.getElementById(
          `row-trigger-${rowDropdown.taskId}`,
        );
        if (
          dropdownElement &&
          !dropdownElement.contains(event.target) &&
          triggerElement &&
          !triggerElement.contains(event.target)
        ) {
          setRowDropdown({ isOpen: false, taskId: null });
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [rowDropdown.isOpen, rowDropdown.taskId]);

  // Handle row dropdown toggle (unused but kept for future functionality)
  // const handleRowDropdownToggle = (taskId) => {
  //   setRowDropdown((prev) => ({
  //     isOpen: prev.taskId === taskId ? !prev.isOpen : true,
  //     taskId: taskId,
  //   }));
  // };

  const handleContextMenuClose = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      task: null,
    });
  };

  // Task detail handlers - matching my-task page
  const handleTaskClick = async (task) => {
    if (!task?.id) return;

    try {
      // Fetch full task details with all relations
      const fullTaskData = await taskService.getTaskById(task.id, [
        "project",
        "assignee",
        "createdBy",
        "subtasks",
        "subtasks.assignee",
        "subtasks.childSubtasks",
        "collaborators",
      ]);

      // Transform the task data
      const transformedTask = transformTask(fullTaskData);

      // Format due date for display
      const formattedDueDate = transformedTask.scheduledDate
        ? new Date(transformedTask.scheduledDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "No due date";

      // Enrich task with project data for the modal
      const enrichedTask = {
        ...transformedTask,
        id: task.id,
        project: {
          id: project.id,
          name: project.name,
          color: project.color,
          icon: project.icon,
          slug: project.slug,
        },
        dueDate: formattedDueDate,
        hasMultipleAssignees:
          transformedTask.collaborators &&
          transformedTask.collaborators.length > 1,
      };

      setTaskDetailModal({
        isOpen: true,
        task: enrichedTask,
      });
    } catch (error) {
      console.error("Error loading task details:", error);
    }
  };

  const handleTaskDetailClose = () => {
    setTaskDetailModal({
      isOpen: false,
      task: null,
    });
  };

  const handleOpenFullPage = (task) => {

    if (!task || !task.id) {
      console.error("Task or Task ID is undefined or null!", { task });
      alert("Error: Task ID is missing. Cannot open full page view.");
      return;
    }

    // Ensure ID is valid
    const taskId = task.id.toString();
    if (!taskId || taskId === "undefined" || taskId === "null") {
      console.error("Invalid task ID:", taskId);
      alert("Error: Invalid task ID. Cannot open full page view.");
      return;
    }

    router.push(`/my-task/${taskId}`);
  };

  const handleEditTask = (task) => {
    if (task?.id) {
      setTaskDetailModal({ isOpen: false, task: null });
      router.push(`/my-task/${task.id}/edit`);
    }
  };

  const handleOpenProject = (project) => {
    // Navigate to project page if needed
  };

  // Filter and sort tasks (moved before early returns to satisfy React hooks rules)
  // Load subtask counts for all tasks in the project
  useEffect(() => {
    if (!project?.tasks || project.tasks.length === 0 || isLoading) return;

    const loadSubtaskCounts = async () => {
      // Load subtask counts for tasks that don't have them loaded yet
      const tasksNeedingCounts = project.tasks.filter(
        (task) => task.id && !loadedSubtasks[task.id],
      );

      if (tasksNeedingCounts.length === 0) return;

      // Load subtask counts in parallel (limit to avoid too many requests)
      const tasksToLoad = tasksNeedingCounts.slice(0, 10);

      try {
        const subtaskCountPromises = tasksToLoad.map(async (task) => {
          try {
            const response = await subtaskService.getRootSubtasksByTask(
              task.id,
              {
                populate: ["assignee"],
              },
            );

            // Handle different response structures
            let subtasksData = [];
            if (Array.isArray(response.data)) {
              subtasksData = response.data;
            } else if (
              response.data?.data &&
              Array.isArray(response.data.data)
            ) {
              subtasksData = response.data.data;
            } else if (Array.isArray(response)) {
              subtasksData = response;
            }

            const transformedSubtasks = subtasksData
              .map(transformSubtask)
              .filter(Boolean);


            return { taskId: task.id, subtasks: transformedSubtasks };
          } catch (error) {
            console.error(`Error loading subtasks for task ${task.id}:`, error);
            return { taskId: task.id, subtasks: [] };
          }
        });

        const results = await Promise.all(subtaskCountPromises);

        // Update loaded subtasks state
        setLoadedSubtasks((prev) => {
          const updated = { ...prev };
          results.forEach(({ taskId, subtasks }) => {
            updated[taskId] = subtasks;
          });
          return updated;
        });
      } catch (error) {
        console.error("Error loading subtask counts:", error);
      }
    };

    loadSubtaskCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.tasks, isLoading]);

  const filteredAndSortedTasks = useMemo(() => {
    if (!project?.tasks) return [];

    let tasks = project.tasks;

    // Filter by search query
    if (searchQuery.trim()) {
      tasks = tasks.filter((task) =>
        task.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by status
    if (filterStatus !== "all") {
      tasks = tasks.filter((task) => {
        const taskStatus =
          task.status?.toLowerCase().replace(/\s+/g, "-") || "";
        return taskStatus === filterStatus.toLowerCase().replace(/\s+/g, "-");
      });
    }

    return tasks;
  }, [project?.tasks, searchQuery, filterStatus]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6">
          <PageHeader
            title="Project"
            subtitle="Loading project..."
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Projects", href: "/projects" },
            ]}
            showSearch={false}
            showActions={false}
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !project) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6">
          <PageHeader
            title="Project"
            subtitle="Error loading project"
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Projects", href: "/projects" },
            ]}
            showSearch={false}
            showActions={false}
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error ? "Error Loading Project" : "Project Not Found"}
            </h2>
            <p className="text-gray-600 mb-4">
              {error || "The requested project could not be found."}
            </p>
            <button
              onClick={() => router.push("/projects")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate project stats based on tasks
  const stats = [
    {
      title: "Total Tasks",
      value: (project?.stats?.totalTasks || 0).toString(),
      change: "+4",
      changeType: "increase",
      icon: CheckSquare,
    },
    {
      title: "Assigned Tasks",
      value: (project?.stats?.assignedTasks || 0).toString(),
      change: "+3",
      changeType: "increase",
      icon: User,
    },
    {
      title: "Incomplete Tasks",
      value: (project?.stats?.incompleteTasks || 0).toString(),
      change: "+2",
      changeType: "increase",
      icon: Clock,
    },
    {
      title: "Completed Tasks",
      value: (project?.stats?.completedTasks || 0).toString(),
      change: "+1",
      changeType: "increase",
      icon: CheckSquare,
    },
    {
      title: "Overdue Tasks",
      value: (project?.stats?.overdueTasks || 0).toString(),
      change: "0",
      changeType: "neutral",
      icon: Clock,
    },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "members", label: "Members", icon: Users },
    { id: "discussion", label: "Discussion", icon: MessageSquare },
  ];

  // Handle due date updates
  const handleDueDateUpdate = async (taskId, newDate) => {
    if (!taskId) return;

    try {
      const scheduledDate = newDate
        ? new Date(newDate + "T00:00:00").toISOString()
        : null;

      await taskService.updateTask(taskId, { scheduledDate });

      // Update project tasks in real-time
      setProject((prevProject) => ({
        ...prevProject,
        tasks: prevProject.tasks.map((task) =>
          task.id === taskId ? { ...task, scheduledDate } : task,
        ),
      }));

      // Update taskDetailModal if it's currently open
      if (taskDetailModal.isOpen && taskDetailModal.task?.id === taskId) {
        setTaskDetailModal((prev) => ({
          ...prev,
          task: {
            ...prev.task,
            scheduledDate,
          },
        }));
      }
    } catch (error) {
      console.error("Error updating due date:", error);
    }
  };

  // Handle project status updates
  const handleProjectStatusUpdate = async (newStatus) => {
    if (!project || loadingStatusUpdate) return;

    setLoadingStatusUpdate(true);
    try {
      // Transform frontend status to Strapi enum format
      const strapiStatus = transformStatusToStrapi(newStatus);

      // Optimistic update
      setProject((prevProject) => ({
        ...prevProject,
        status: newStatus,
      }));

      // Update via API
      await projectService.updateProject(project.id, { status: strapiStatus });
    } catch (error) {
      console.error("Error updating project status:", error);
      // Revert on error
      const updatedProject = await projectService.getProjectById(project.id, [
        "projectManager",
        "teamMembers",
        "tasks",
        "tasks.assignee",
        "tasks.collaborators",
        "tasks.project",
        "tasks.subtasks",
        "account",
        "deal",
        "deal.leadCompany",
        "deal.clientAccount",
        "clientAccount",
      ]);
      const transformedProject = transformProject(updatedProject);
      // Preserve stats when reverting
      setProject((prevProject) => ({
        ...transformedProject,
        stats: prevProject?.stats || {
          totalTasks: 0,
          completedTasks: 0,
          incompleteTasks: 0,
          assignedTasks: 0,
          overdueTasks: 0,
        },
      }));
      alert("Failed to update project status. Please try again.");
    } finally {
      setLoadingStatusUpdate(false);
    }
  };

  // Handle task status updates
  const handleStatusUpdate = async (taskId, newStatus) => {
    if (!taskId) return;

    const strapiStatus = transformStatusToStrapi(newStatus);

    // Update project tasks immediately (optimistic update)
    setProject((prevProject) => ({
      ...prevProject,
      tasks: prevProject.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    }));

    // Update taskDetailModal immediately if it's currently open
    if (taskDetailModal.isOpen && taskDetailModal.task?.id === taskId) {
      setTaskDetailModal((prev) => ({
        ...prev,
        task: {
          ...prev.task,
          status: newStatus,
        },
      }));
    }

    try {
      await taskService.updateTaskStatus(taskId, strapiStatus);
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert on error
      const updatedProject = await projectService.getProjectById(project.id, [
        "projectManager",
        "teamMembers",
        "tasks",
        "tasks.assignee",
        "tasks.collaborators",
        "tasks.project",
        "tasks.subtasks",
        "account",
        "deal",
        "deal.leadCompany",
        "deal.clientAccount",
        "clientAccount",
      ]);
      const transformedProject = transformProject(updatedProject);
      setProject({ ...project, tasks: transformedProject.tasks });
    }
  };

  // Handle priority updates
  const handlePriorityUpdate = async (taskId, newPriority) => {
    if (!taskId) return;

    const strapiPriority = transformPriorityToStrapi(newPriority);

    // Update project tasks immediately (optimistic update)
    setProject((prevProject) => ({
      ...prevProject,
      tasks: prevProject.tasks.map((task) =>
        task.id === taskId ? { ...task, priority: newPriority } : task,
      ),
    }));

    // Update taskDetailModal immediately if it's currently open
    if (taskDetailModal.isOpen && taskDetailModal.task?.id === taskId) {
      setTaskDetailModal((prev) => ({
        ...prev,
        task: {
          ...prev.task,
          priority: newPriority,
        },
      }));
    }

    try {
      await taskService.updateTask(taskId, { priority: strapiPriority });
    } catch (error) {
      console.error("Error updating task priority:", error);
      // Revert on error
      const updatedProject = await projectService.getProjectById(project.id, [
        "projectManager",
        "teamMembers",
        "tasks",
        "tasks.assignee",
        "tasks.collaborators",
        "tasks.project",
        "tasks.subtasks",
        "account",
        "deal",
        "deal.leadCompany",
        "deal.clientAccount",
        "clientAccount",
      ]);
      const transformedProject = transformProject(updatedProject);
      setProject({ ...project, tasks: transformedProject.tasks });
    }
  };

  // Bulk selection handlers
  const handleSelectTask = (taskId, isSelected) => {
    if (isSelected) {
      setSelectedTaskIds((prev) => [...prev, taskId]);
    } else {
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedTaskIds(filteredAndSortedTasks.map((task) => task.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  // Toggle bulk edit mode
  const handleToggleBulkEdit = () => {
    setIsBulkEditMode((prev) => !prev);
    // Clear selection when turning off bulk edit mode
    if (isBulkEditMode) {
      setSelectedTaskIds([]);
    }
  };

  // Bulk action handlers
  const handleBulkDelete = () => {
    if (selectedTaskIds.length === 0) return;

    // Find the first selected task for the delete modal
    const firstSelectedTask = filteredAndSortedTasks.find(
      (task) => task.id === selectedTaskIds[0],
    );

    if (firstSelectedTask) {
      setDeleteModal({
        isOpen: true,
        task: {
          ...firstSelectedTask,
          bulkDelete: true,
          taskIds: selectedTaskIds,
        },
      });
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedTaskIds.length === 0) return;

    try {
      const strapiStatus = transformStatusToStrapi(newStatus);

      // Update all selected tasks
      await Promise.all(
        selectedTaskIds.map((taskId) =>
          taskService.updateTaskStatus(taskId, strapiStatus),
        ),
      );

      // Update local state
      setProject((prevProject) => ({
        ...prevProject,
        tasks: prevProject.tasks.map((task) =>
          selectedTaskIds.includes(task.id)
            ? { ...task, status: newStatus }
            : task,
        ),
      }));

      // Clear selection
      setSelectedTaskIds([]);
    } catch (error) {
      console.error("Error updating task statuses:", error);
      // Revert on error - reload project
      try {
        const updatedProject = await projectService.getProjectById(project.id, [
          "projectManager",
          "teamMembers",
          "tasks",
          "tasks.assignee",
          "tasks.collaborators",
          "tasks.project",
          "tasks.subtasks",
          "account",
          "deal",
          "deal.leadCompany",
          "deal.clientAccount",
          "clientAccount",
        ]);
        const transformedProject = transformProject(updatedProject);
        setProject(transformedProject);
      } catch (reloadError) {
        console.error("Error reloading project:", reloadError);
      }
    }
  };

  // Task table columns - matching my-task page exactly
  const taskColumnsTable = [
    {
      key: "name",
      label: "TASK NAME",
      render: (_, task) => {
        const isDone =
          task.status?.toLowerCase() === "done" ||
          task.status?.toLowerCase() === "completed";
        const isEditing = editingTaskId === task.id;

        const handleNameClick = (e) => {
          e.stopPropagation();
          setEditingTaskId(task.id);
          setEditingTaskName(task.name || "");
        };

        const handleNameChange = (e) => {
          setEditingTaskName(e.target.value);
        };

        const handleNameBlur = async () => {
          if (editingTaskId === task.id) {
            const newName = editingTaskName.trim();
            if (newName && newName !== task.name) {
              try {
                await taskService.updateTask(task.id, { title: newName });
                setProject((prevProject) => ({
                  ...prevProject,
                  tasks: prevProject.tasks.map((t) =>
                    t.id === task.id ? { ...t, name: newName } : t,
                  ),
                }));
              } catch (error) {
                console.error("Error updating task name:", error);
              }
            }
            setEditingTaskId(null);
            setEditingTaskName("");
          }
        };

        const handleNameKeyDown = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleNameBlur();
          } else if (e.key === "Escape") {
            setEditingTaskId(null);
            setEditingTaskName("");
          }
        };

        // Check if task has subtasks
        const taskSubtasks = task.subtasks || [];
        const loadedTaskSubtasks = loadedSubtasks[task.id] || [];
        const allSubtasks =
          loadedTaskSubtasks.length > 0 ? loadedTaskSubtasks : taskSubtasks;
        const rootSubtasks = allSubtasks.filter((st) => {
          return (
            !st.parentSubtask ||
            st.parentSubtask === null ||
            (typeof st.parentSubtask === "object" && !st.parentSubtask.id)
          );
        });
        const hasSubtasks = rootSubtasks.length > 0;

        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isDone) {
                  handleStatusUpdate(task.id, "To Do");
                } else {
                  handleStatusUpdate(task.id, "Done");
                }
              }}
              className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                isDone
                  ? "bg-green-500 border-green-500 text-white hover:bg-green-600"
                  : "border-gray-300 hover:border-green-500 hover:bg-green-50 cursor-pointer"
              }`}
              title={
                isDone ? "Click to mark as incomplete" : "Mark as complete"
              }
            >
              {isDone && <Check className="w-4 h-4 stroke-[3]" />}
            </button>
            <div className="min-w-0 flex-1 flex items-center gap-2">
              {isEditing ? (
                <input
                  type="text"
                  value={editingTaskName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  onKeyDown={handleNameKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-full font-medium px-2 py-1 rounded border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDone ? "line-through text-gray-500" : "text-gray-900"
                  }`}
                  autoFocus
                />
              ) : (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    onClick={handleNameClick}
                    className={`font-medium truncate cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors flex-1 min-w-0 ${
                      isDone ? "line-through text-gray-500" : "text-gray-900"
                    }`}
                    title="Click to edit task name"
                  >
                    {task.name}
                  </div>
                  {hasSubtasks && (
                    <div
                      className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600"
                      title={`${rootSubtasks.length} ${
                        rootSubtasks.length === 1 ? "subtask" : "subtasks"
                      }`}
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">
                        {rootSubtasks.length}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "assignee",
      label: "ASSIGNEE",
      render: (_, task) => {
        // Get collaborators - prefer collaborators array, fallback to assignee
        let collaborators = [];

        // Check if task has valid collaborators
        if (
          task.collaborators &&
          Array.isArray(task.collaborators) &&
          task.collaborators.length > 0
        ) {
          // Filter out null/undefined collaborators and ensure they have valid data
          collaborators = task.collaborators.filter(
            (c) =>
              c &&
              (c.id || c._id || c.firstName || c.lastName || c.name || c.email),
          );
        }

        // If no valid collaborators, check for assignee
        if (collaborators.length === 0 && task.assignee) {
          // Check if assignee is a valid user object (not just an ID)
          const assigneeIsObject =
            typeof task.assignee === "object" && task.assignee !== null;
          const hasAssignee =
            assigneeIsObject &&
            (task.assignee.id ||
              task.assignee._id ||
              task.assignee.documentId ||
              task.assignee.firstName ||
              task.assignee.lastName ||
              task.assignee.name ||
              task.assignee.email);

          if (hasAssignee) {
            collaborators = [task.assignee];
          } else if (process.env.NODE_ENV === "development") {
            console.warn(
              "Task has assignee but it's not a valid user object:",
              {
                taskId: task.id,
                taskName: task.name,
                assignee: task.assignee,
                assigneeType: typeof task.assignee,
              },
            );
          }
        }

        const hasCollaborators = collaborators.length > 0;

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollaboratorModal({ isOpen: true, task });
            }}
            className="flex items-center gap-2 min-w-[140px] hover:bg-gray-50 rounded px-2 py-1 transition-colors text-left"
          >
            {hasCollaborators ? (
              <div className="flex items-center gap-1">
                {collaborators.slice(0, 3).map((person, index) => {
                  const name =
                    person?.name ||
                    (person?.firstName && person?.lastName
                      ? `${person.firstName} ${person.lastName}`
                      : person?.firstName || person?.lastName || "Unknown");
                  const initial = name?.charAt(0)?.toUpperCase() || "U";
                  return (
                    <div
                      key={person?.id || index}
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
                {collaborators.length > 3 && (
                  <div
                    className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0 border border-white"
                    title={`${collaborators.length - 3} more`}
                    style={{ marginLeft: "-4px", zIndex: 7 }}
                  >
                    +{collaborators.length - 3}
                  </div>
                )}
                <span className="text-sm text-gray-600 truncate ml-1">
                  {collaborators.length === 1
                    ? collaborators[0]?.name ||
                      (collaborators[0]?.firstName && collaborators[0]?.lastName
                        ? `${collaborators[0].firstName} ${collaborators[0].lastName}`
                        : collaborators[0]?.firstName ||
                          collaborators[0]?.lastName ||
                          "Unassigned")
                    : `${collaborators.length} people`}
                </span>
              </div>
            ) : (
              <>
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                  U
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
      key: "dueDate",
      label: "DUE DATE",
      render: (_, task) => {
        const getDateValue = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const currentValue = getDateValue(task.scheduledDate);

        return (
          <div
            className="flex items-center gap-2 min-w-[150px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar className="w-4 h-4 flex-shrink-0 text-gray-500" />
            <input
              type="date"
              value={currentValue}
              onChange={(e) => {
                handleDueDateUpdate(task.id, e.target.value);
              }}
              className="flex-1 text-sm text-gray-700 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="No due date"
            />
          </div>
        );
      },
    },
    {
      key: "status",
      label: "STATUS",
      render: (_, task) => {
        const statusOptions = [
          { value: "To Do", label: "To Do" },
          { value: "In Progress", label: "In Progress" },
          { value: "Internal Review", label: "Internal Review" },
          { value: "Client Review", label: "Client Review" },
          { value: "Approved", label: "Approved" },
          { value: "Done", label: "Done" },
          { value: "Cancelled", label: "Cancelled" },
        ];

        // Normalize status to match option values
        const normalizeStatus = (status) => {
          if (!status) return "To Do";
          const statusLower = status.toLowerCase();
          if (
            statusLower === "to do" ||
            statusLower === "todo" ||
            statusLower === "scheduled"
          )
            return "To Do";
          if (statusLower === "in progress" || statusLower === "in_progress")
            return "In Progress";
          if (
            statusLower === "internal review" ||
            statusLower === "in review" ||
            statusLower === "in_review"
          )
            return "Internal Review";
          if (
            statusLower === "client review" ||
            statusLower === "client_review"
          )
            return "Client Review";
          if (statusLower === "approved") return "Approved";
          if (statusLower === "done" || statusLower === "completed")
            return "Done";
          if (statusLower === "cancelled" || statusLower === "canceled")
            return "Cancelled";
          // Try to match by capitalizing first letter of each word
          return status
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ");
        };

        const currentStatus = normalizeStatus(task.status || "To Do");
        const status = currentStatus?.toLowerCase().replace(/\s+/g, "-") || "";

        const statusColors = {
          "to-do": {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-400",
          },
          "in-progress": {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-400",
          },
          "internal-review": {
            bg: "bg-purple-100",
            text: "text-purple-800",
            border: "border-purple-400",
          },
          done: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
          },
          completed: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
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
                handleStatusUpdate(task.id, e.target.value);
              }}
              className={`w-full ${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-3 py-2 font-bold text-xs uppercase text-center shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                paddingRight: "2rem",
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
      key: "priority",
      label: "PRIORITY",
      render: (_, task) => {
        const priorityOptions = [
          { value: "Low", label: "Low" },
          { value: "Medium", label: "Medium" },
          { value: "High", label: "High" },
        ];

        // Normalize priority to match option values (capitalize first letter)
        const normalizePriority = (priority) => {
          if (!priority) return "Medium";
          const priorityLower = priority.toLowerCase();
          if (priorityLower === "low") return "Low";
          if (priorityLower === "medium") return "Medium";
          if (priorityLower === "high") return "High";
          // Fallback: capitalize first letter
          return (
            priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()
          );
        };

        const currentPriority = normalizePriority(task.priority || "Medium");
        const priorityLower = currentPriority.toLowerCase();

        const priorityColors = {
          high: {
            bg: "bg-red-100",
            text: "text-red-800",
            border: "border-red-400",
          },
          medium: {
            bg: "bg-yellow-100",
            text: "text-yellow-800",
            border: "border-yellow-400",
          },
          low: {
            bg: "bg-green-100",
            text: "text-green-800",
            border: "border-green-400",
          },
        };

        const colors = priorityColors[priorityLower] || {
          bg: "bg-gray-100",
          text: "text-gray-800",
          border: "border-gray-400",
        };

        return (
          <div className="min-w-[120px]" onClick={(e) => e.stopPropagation()}>
            <select
              value={currentPriority}
              onChange={(e) => {
                e.stopPropagation();
                handlePriorityUpdate(task.id, e.target.value);
              }}
              className={`w-full ${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-3 py-2 font-bold text-xs uppercase text-center shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.5rem center",
                paddingRight: "2rem",
              }}
            >
              {priorityOptions.map((option) => (
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
      key: "subtasks",
      label: "SUBTASKS",
      render: (_, task) => {
        const taskId = task.id;
        const isExpanded = expandedSubtasks[taskId] || false;

        const loadedTaskSubtasks = loadedSubtasks[taskId] || [];
        const taskSubtasks = task.subtasks || [];
        const allSubtasks =
          loadedTaskSubtasks.length > 0 ? loadedTaskSubtasks : taskSubtasks;

        const rootSubtasks = allSubtasks.filter((st) => {
          return (
            !st.parentSubtask ||
            st.parentSubtask === null ||
            (typeof st.parentSubtask === "object" && !st.parentSubtask.id)
          );
        });
        const subtaskCount = rootSubtasks.length;

        const handleToggleExpand = async (e) => {
          e.stopPropagation();

          const newExpandedState = !isExpanded;

          // Update position when expanding
          if (newExpandedState && subtaskButtonRefs.current[taskId]) {
            const rect =
              subtaskButtonRefs.current[taskId].getBoundingClientRect();
            setSubtaskDropdownPositions((prev) => ({
              ...prev,
              [taskId]: {
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width,
              },
            }));
          }

          if (newExpandedState) {
            try {
              const response = await subtaskService.getRootSubtasksByTask(
                taskId,
                {
                  populate: ["assignee", "childSubtasks"],
                },
              );

              let subtasksData = [];
              if (Array.isArray(response.data)) {
                subtasksData = response.data;
              } else if (
                response.data?.data &&
                Array.isArray(response.data.data)
              ) {
                subtasksData = response.data.data;
              } else if (Array.isArray(response)) {
                subtasksData = response;
              }

              const transformedSubtasks = subtasksData
                .map(transformSubtask)
                .filter(Boolean);

              setLoadedSubtasks((prev) => ({
                ...prev,
                [taskId]: transformedSubtasks,
              }));
            } catch (error) {
              console.error("Error loading subtasks:", error);
            }
          }

          setExpandedSubtasks((prev) => ({
            ...prev,
            [taskId]: newExpandedState,
          }));
        };

        const handleSubtaskClick = (e) => {
          e.stopPropagation();
          router.push(`/my-task/${task.slug || task.id}`);
        };

        const hasSubtasks = subtaskCount > 0;
        const dropdownPosition = subtaskDropdownPositions[taskId];
        const dropdownContent =
          isExpanded && rootSubtasks.length > 0 && dropdownPosition ? (
            <div
              className="fixed z-[9999] border border-gray-200 rounded-lg bg-white shadow-lg max-h-60 overflow-y-auto"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 space-y-1">
                {rootSubtasks.map((subtask) => {
                  const isSubtaskDone =
                    subtask.status?.toLowerCase() === "done" ||
                    subtask.status?.toLowerCase() === "completed";
                  const childCount =
                    subtask.childSubtasks?.length ||
                    subtask.subtasks?.length ||
                    0;
                  return (
                    <button
                      key={subtask.id}
                      onClick={handleSubtaskClick}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 ${
                        isSubtaskDone ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-sm font-medium truncate ${
                              isSubtaskDone
                                ? "line-through text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {subtask.name || subtask.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {subtask.assignee && (
                              <div className="text-xs text-gray-500 truncate">
                                {typeof subtask.assignee === "object"
                                  ? subtask.assignee?.name || "Unassigned"
                                  : subtask.assignee || "Unassigned"}
                              </div>
                            )}
                            {childCount > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <GitBranch className="w-3 h-3" />
                                <span>{childCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null;

        return (
          <>
            <div className="min-w-[180px]" onClick={(e) => e.stopPropagation()}>
              {hasSubtasks ? (
                <div className="relative">
                  <button
                    ref={(el) => {
                      if (el) subtaskButtonRefs.current[taskId] = el;
                    }}
                    onClick={handleToggleExpand}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 w-full"
                  >
                    <GitBranch className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">
                      {subtaskCount}{" "}
                      {subtaskCount === 1 ? "subtask" : "subtasks"}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                    )}
                  </button>
                </div>
              ) : (
                <span className="text-sm text-gray-500">No subtasks</span>
              )}
            </div>
            {typeof window !== "undefined" &&
              isExpanded &&
              rootSubtasks.length > 0 &&
              dropdownPosition &&
              createPortal(dropdownContent, document.body)}
          </>
        );
      },
    },
    {
      key: "project",
      label: "PROJECT",
      render: (_, task) => (
        <ProjectSelector
          task={task}
          projects={projects}
          onUpdate={(updatedTask) => {
            setProject((prevProject) => ({
              ...prevProject,
              tasks: prevProject.tasks.map((t) =>
                t.id === updatedTask.id ? updatedTask : t,
              ),
            }));
            if (taskDetailModal.task?.id === updatedTask.id) {
              setTaskDetailModal((prev) => ({
                ...prev,
                task: updatedTask,
              }));
            }
          }}
        />
      ),
    },
    {
      key: "progress",
      label: "PROGRESS",
      render: (_, task) => (
        <div className="min-w-[120px]">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {task.progress || 0}%
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_, task) => (
        <div className="flex items-center gap-1 min-w-[120px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTaskClick(task);
            }}
            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="View Task"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteModal({ isOpen: true, task: task });
            }}
            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Function to get status badge colors matching my-task page (unused but kept for future functionality)
  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case "In Review":
  //       return "bg-green-100 text-green-700 border-green-200";
  //     case "In Progress":
  //       return "bg-blue-100 text-blue-700 border-blue-200";
  //     case "Done":
  //     case "Completed":
  //       return "bg-green-100 text-green-700 border-green-200";
  //     case "To Do":
  //       return "bg-orange-100 text-orange-700 border-orange-200";
  //     case "Backlog":
  //       return "bg-purple-100 text-purple-700 border-purple-200";
  //     case "Overdue":
  //       return "bg-red-100 text-red-700 border-red-200";
  //     default:
  //       return "bg-gray-100 text-gray-700 border-gray-200";
  //   }
  // };

  // Navigate between months (for calendar components)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigateMonth = (direction) => {
    if (direction === "next") {
      if (month === 11) {
        setMonth(0);
        setYear(year + 1);
      } else {
        setMonth(month + 1);
      }
    } else {
      if (month === 0) {
        setMonth(11);
        setYear(year - 1);
      } else {
        setMonth(month - 1);
      }
    }
  };

  if (!project) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="p-6">
          <PageHeader
            title="Project"
            subtitle="Loading project..."
            breadcrumb={[
              { label: "Dashboard", href: "/" },
              { label: "Projects", href: "/projects" },
            ]}
            showSearch={false}
            showActions={false}
          />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-4">
        <PageHeader
          title={project.name}
          subtitle={`${project.status || "No Status"} • ${
            project.client?.name || "No Client"
          }`}
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Projects", href: "/projects" },
            {
              label: project.name,
              href: `/projects/${project.slug || project.id}`,
            },
          ]}
          showProfile={true}
          showSearch={true}
          showActions={true}
          onAddClick={() => {
            setAddTaskModal({ isOpen: true, projectId: project.id });
          }}
          actions={[
            {
              label: "Edit",
              icon: Edit,
              onClick: () =>
                router.push(`/projects/${project.slug || project.id}/edit`),
              variant: "primary",
            },
            {
              icon: Star,
              onClick: () => console.log("Star project"),
              title: "Star Project",
            },
            {
              icon: UserPlus,
              onClick: () => console.log("Invite team member"),
              className: "hidden lg:flex",
              title: "Invite Member",
            },
            {
              icon: Share,
              onClick: () => console.log("Share project"),
              className: "hidden lg:flex",
              title: "Share Project",
            },
          ]}
        />
        {/* Project Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6 hover:shadow-2xl transition-all duration-200"
            >
              <div className="space-y-3">
                {/* Header with title and trend */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-medium">
                    {stat.title}
                  </p>
                  <div
                    className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                      stat.changeType === "increase"
                        ? "bg-green-50 text-green-600"
                        : stat.changeType === "decrease"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    {stat.changeType === "increase" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : stat.changeType === "decrease" ? (
                      <ArrowDown className="h-3 w-3" />
                    ) : null}
                    <span>{stat.change}</span>
                  </div>
                </div>

                {/* Main value */}
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-2 shadow-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-transparent text-gray-700 hover:bg-white/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Project Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Project Details Card */}
                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Project Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Start Date
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {project.startDate || "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">End Date</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {project.endDate || "Not set"}
                      </span>
                    </div>
                    {project.budget && project.budget !== null && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Budget</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          ${project.budget.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {project.spent !== undefined && project.spent !== null && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Spent</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          ${project.spent.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Status</span>
                      </div>
                      <div
                        className="min-w-[120px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={project.status || "Planning"}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleProjectStatusUpdate(e.target.value);
                          }}
                          disabled={loadingStatusUpdate}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none ${
                            project.status === "In Progress" ||
                            project.status === "Active" ||
                            project.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700 border-blue-200"
                              : project.status === "Completed" ||
                                  project.status === "COMPLETED"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : project.status === "On Hold" ||
                                    project.status === "ON_HOLD"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : project.status === "Planning" ||
                                      project.status === "PLANNING"
                                    ? "bg-gray-100 text-gray-700 border-gray-200"
                                    : project.status === "Cancelled" ||
                                        project.status === "CANCELLED"
                                      ? "bg-gray-100 text-gray-700 border-gray-200"
                                      : "bg-gray-100 text-gray-700 border-gray-200"
                          } ${
                            loadingStatusUpdate
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 0.5rem center",
                            backgroundSize: "0.75rem 0.75rem",
                            paddingRight: "2rem",
                          }}
                        >
                          <option value="Planning">Planning</option>
                          <option value="Active">Active</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    {project.client && (
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">Client</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {project.client.name || "N/A"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Card */}
                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Project Progress
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">
                          Completion
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          {project.progress || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    {project.budget &&
                      project.budget !== null &&
                      project.spent !== undefined &&
                      project.spent !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Budget Usage
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              ${project.spent.toLocaleString()} / $
                              {project.budget.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full transition-all duration-500 ${
                                (project.spent / project.budget) * 100 > 90
                                  ? "bg-gradient-to-r from-red-500 to-red-600"
                                  : (project.spent / project.budget) * 100 > 75
                                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                    : "bg-gradient-to-r from-green-500 to-green-600"
                              }`}
                              style={{
                                width: `${Math.min(
                                  (project.spent / project.budget) * 100,
                                  100,
                                )}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {(
                              ((project.budget - project.spent) /
                                project.budget) *
                              100
                            ).toFixed(1)}
                            % remaining
                          </p>
                        </div>
                      )}
                    {project.originalStartDate &&
                      project.originalEndDate &&
                      (() => {
                        // Use original ISO dates for calculations
                        const startDateObj = new Date(
                          project.originalStartDate,
                        );
                        const endDateObj = new Date(project.originalEndDate);
                        const isValidStart = !isNaN(startDateObj.getTime());
                        const isValidEnd = !isNaN(endDateObj.getTime());

                        if (isValidStart && isValidEnd) {
                          const daysDiff = Math.ceil(
                            (endDateObj - startDateObj) / (1000 * 60 * 60 * 24),
                          );
                          return (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                  Timeline
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {daysDiff} days
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {project.startDate} - {project.endDate}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                  </div>
                </div>

                {/* Description Card */}
                {project.description && (
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Description
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column - Key Metrics */}
              <div className="space-y-6">
                {/* Client Account Section */}
                {project.clientAccount && (
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Client Account
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {project.clientAccount?.companyName ||
                                project.clientAccount?.name ||
                                "Unknown Company"}
                            </h4>
                            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800">
                              Client
                            </span>
                          </div>

                          <div className="space-y-3 text-sm">
                            {project.clientAccount?.companyType && (
                              <div>
                                <span className="text-gray-500">
                                  Company Type
                                </span>
                                <p className="font-medium text-gray-900">
                                  {project.clientAccount.companyType ===
                                  "startup-corporate"
                                    ? "Startup and Corporates"
                                    : project.clientAccount.companyType ===
                                        "investor"
                                      ? "Investors"
                                      : project.clientAccount.companyType ===
                                          "enablers-academia"
                                        ? "Enablers & Academia"
                                        : project.clientAccount.companyType}
                                </p>
                              </div>
                            )}

                            {project.clientAccount?.email && (
                              <div>
                                <span className="text-gray-500">Email</span>
                                <p className="font-medium text-gray-900">
                                  {project.clientAccount.email}
                                </p>
                              </div>
                            )}

                            {project.clientAccount?.website && (
                              <div>
                                <span className="text-gray-500">Website</span>
                                <a
                                  href={
                                    project.clientAccount.website.startsWith(
                                      "http",
                                    )
                                      ? project.clientAccount.website
                                      : `https://${project.clientAccount.website}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <Globe className="w-3 h-3" />
                                  {project.clientAccount.website.replace(
                                    /^https?:\/\//,
                                    "",
                                  )}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="mt-4">
                            <button
                              onClick={() => {
                                const isProduction =
                                  window.location.hostname !== "localhost" &&
                                  window.location.hostname !== "127.0.0.1";
                                const crmBaseUrl = isProduction
                                  ? "https://crm.xtrawrkx.com"
                                  : "http://localhost:3000";
                                window.open(
                                  `${crmBaseUrl}/clients/accounts/${project.clientAccount.id}`,
                                  "_blank",
                                );
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors w-full justify-center"
                            >
                              <Eye className="w-4 h-4" />
                              View Client Account
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Lead/Owner */}
                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Project Lead
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-semibold text-gray-700">
                        {(() => {
                          const manager = project.projectManager;
                          if (!manager) return "?";
                          const firstName =
                            manager?.firstName ||
                            manager?.name?.split(" ")[0] ||
                            "";
                          const lastName =
                            manager?.lastName ||
                            manager?.name?.split(" ")[1] ||
                            "";
                          return (
                            (firstName?.[0] || "").toUpperCase() +
                              (lastName?.[0] || "").toUpperCase() || "?"
                          );
                        })()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {(() => {
                          const manager = project.projectManager;
                          if (!manager) return "Unassigned";
                          if (manager?.firstName || manager?.lastName) {
                            return `${manager.firstName || ""} ${
                              manager.lastName || ""
                            }`.trim();
                          }
                          return (
                            manager?.name || manager?.username || "Unassigned"
                          );
                        })()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {(() => {
                          const manager = project.projectManager;
                          if (!manager) return "Project Manager";

                          const roleName =
                            manager.primaryRole?.name ||
                            manager.primaryRole?.data?.attributes?.name ||
                            manager.primaryRole?.attributes?.name ||
                            manager.role ||
                            null;

                          return roleName || "Project Manager";
                        })()}
                      </p>
                      {project.projectManager && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">
                            4.9 rating
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setProjectLeadModal({ isOpen: true });
                      }}
                    >
                      <User className="w-4 h-4" />
                      Change Assignee
                    </button>
                  </div>
                </div>

                {/* Company Information */}
                {(() => {
                  // Check if we have any company data
                  const hasClient =
                    project.client &&
                    (project.client.id || project.client.name);
                  const hasDealCompany =
                    project.deal &&
                    (project.deal.leadCompany || project.deal.clientAccount);

                  if (!hasClient && !hasDealCompany) return null;

                  return (() => {
                    // Get company data from account, deal's leadCompany, or deal's clientAccount
                    let companyData = null;
                    let companyType = "Client";

                    if (project.client) {
                      companyData = project.client;
                      companyType = "Client";
                    } else if (project.deal?.leadCompany) {
                      const leadCompany =
                        project.deal.leadCompany.data ||
                        project.deal.leadCompany;
                      const leadCompanyAttrs =
                        leadCompany?.attributes || leadCompany;
                      companyData = {
                        ...leadCompanyAttrs,
                        id: leadCompany?.id || leadCompany?.documentId,
                      };
                      companyType = "Lead";
                    } else if (project.deal?.clientAccount) {
                      const clientAccount =
                        project.deal.clientAccount.data ||
                        project.deal.clientAccount;
                      const clientAccountAttrs =
                        clientAccount?.attributes || clientAccount;
                      companyData = {
                        ...clientAccountAttrs,
                        id: clientAccount?.id || clientAccount?.documentId,
                      };
                      companyType = "Client";
                    }

                    if (!companyData) return null;

                    const companyId = companyData.id;

                    const companyName =
                      companyData.name ||
                      companyData.companyName ||
                      "Unknown Company";

                    const industry = companyData.industry || "";
                    const website = companyData.website || "";
                    const employees = companyData.employees || "";
                    const city = companyData.city || "";
                    const state = companyData.state || "";
                    const country = companyData.country || "";

                    return (
                      <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Company Information
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {companyName}
                                </h4>
                                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                  {companyType}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {industry && (
                                  <div>
                                    <span className="text-gray-500">
                                      Industry
                                    </span>
                                    <p className="font-medium text-gray-900">
                                      {industry}
                                    </p>
                                  </div>
                                )}

                                {website && (
                                  <div>
                                    <span className="text-gray-500">
                                      Website
                                    </span>
                                    <a
                                      href={
                                        website.startsWith("http")
                                          ? website
                                          : `https://${website}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                                    >
                                      <Globe className="w-3 h-3" />
                                      {website.replace(/^https?:\/\//, "")}
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}

                                {employees && (
                                  <div>
                                    <span className="text-gray-500">
                                      Employees
                                    </span>
                                    <p className="font-medium text-gray-900">
                                      {employees}
                                    </p>
                                  </div>
                                )}

                                {(city || state) && (
                                  <div>
                                    <span className="text-gray-500">
                                      Location
                                    </span>
                                    <p className="font-medium text-gray-900">
                                      {city && state
                                        ? `${city}, ${state}`
                                        : city || state || ""}
                                      {country && `, ${country}`}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {companyId && (
                                <div className="mt-4 flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (companyType === "Lead") {
                                        router.push(
                                          `/sales/lead-companies/${companyId}`,
                                        );
                                      } else {
                                        router.push(
                                          `/sales/accounts/${companyId}`,
                                        );
                                      }
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View{" "}
                                    {companyType === "Lead"
                                      ? "Lead Company"
                                      : "Client Account"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })();
                })()}

                {/* Quick Stats */}
                <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Total Tasks</p>
                        <p className="text-lg font-bold text-gray-900">
                          {project.stats?.totalTasks || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Completed</p>
                        <p className="text-lg font-bold text-gray-900">
                          {project.stats?.completedTasks || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">In Progress</p>
                        <p className="text-lg font-bold text-gray-900">
                          {project.stats?.incompleteTasks || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Overdue</p>
                        <p className="text-lg font-bold text-gray-900">
                          {project.stats?.overdueTasks || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Members Preview */}
                {project.team && project.team.length > 0 && (
                  <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Team Members
                      </h3>
                      <button
                        onClick={() => setActiveTab("members")}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {project.team.slice(0, 6).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2 px-3 py-2 bg-white/50 rounded-lg"
                        >
                          <div
                            className={`w-8 h-8 ${
                              member.color || "bg-gray-500"
                            } rounded-full flex items-center justify-center text-white text-xs font-bold`}
                          >
                            {member.avatar ||
                              member.name?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {member.name}
                          </span>
                        </div>
                      ))}
                      {project.team.length > 6 && (
                        <div className="flex items-center px-3 py-2 bg-white/50 rounded-lg">
                          <span className="text-sm text-gray-600">
                            +{project.team.length - 6} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="space-y-6">
              {/* Header with Search and Actions */}
              <div className="flex items-center justify-between gap-4">
                {/* Search */}
                <div className="flex-1 max-w-md relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Filter and Actions */}
                <div className="flex items-center gap-3">
                  {/* Status Filter */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="to-do">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="internal-review">Internal Review</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* Bulk Edit Toggle Button */}
                  <button
                    onClick={handleToggleBulkEdit}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 shadow-md ${
                      isBulkEditMode
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "bg-white/70 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-white/90"
                    }`}
                    title="Bulk Edit"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden lg:inline">
                      {isBulkEditMode ? "Exit Bulk Edit" : "Bulk Edit"}
                    </span>
                  </button>

                  {/* New Task Button */}
                  <button
                    onClick={() => {
                      setAddTaskModal({ isOpen: true, projectId: project.id });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4" />
                    New Task
                  </button>
                </div>
              </div>

              {/* Tasks Table - Using TasksListView component */}
              <TasksListView
                filteredTasks={filteredAndSortedTasks}
                taskColumnsTable={taskColumnsTable}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                setIsModalOpen={() => {
                  setAddTaskModal({ isOpen: true, projectId: project.id });
                }}
                onRowClick={handleTaskClick}
                selectable={isBulkEditMode}
                selectedTaskIds={selectedTaskIds}
                onSelectTask={handleSelectTask}
                onSelectAll={handleSelectAll}
                bulkActions={
                  isBulkEditMode && selectedTaskIds.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleBulkStatusUpdate(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue=""
                      >
                        <option value="">Change Status...</option>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Internal Review">Internal Review</option>
                        <option value="Done">Done</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={handleBulkDelete}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button
                        onClick={() => setSelectedTaskIds([])}
                        className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  ) : null
                }
              />
            </div>
          )}

          {/* Members Tab */}
          {activeTab === "members" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-brand-foreground">
                  Member Assigned
                </h3>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="text-sm font-medium">A-Z</span>
                  </button>
                  <button
                    onClick={() => setInviteModal({ isOpen: true })}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/80 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="text-sm font-medium">Invite</span>
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Members Table */}
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invited
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            Task Assigned
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            Task Completed
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            Task Incompleted
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <div className="flex items-center gap-1">
                            Task Overdue
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    {/* Prepare members list including project manager */}
                    {(() => {
                      const team = project?.team || [];
                      const manager = project?.projectManager;
                      const managerId =
                        manager?.id || (typeof manager === "number" ? manager : null);
                      const hasManagerInTeam =
                        managerId != null &&
                        team.some((t) => String(t?.id) === String(managerId));
                      const membersList = hasManagerInTeam
                        ? team
                        : manager
                        ? [manager, ...team]
                        : team;

                      return (
                        <tbody className="bg-white divide-y divide-gray-200">
                          {membersList.map((member) => {
                        // Compute task stats for this project and member
                        const memberId =
                          member?.id || (typeof member === "number" ? member : null);
                        const tasks = project?.tasks || [];

                        const assignedTasksArr = tasks.filter((t) => {
                          // Check assignee fields (support different shapes)
                          const assigneeId = t?.assignee?.id || t?.assignee;
                          if (assigneeId && String(assigneeId) === String(memberId)) {
                            return true;
                          }
                          if (Array.isArray(t?.assigneeIds)) {
                            if (t.assigneeIds.map(String).includes(String(memberId)))
                              return true;
                          }
                          // Also consider collaborators
                          if (Array.isArray(t?.collaborators)) {
                            if (
                              t.collaborators.some(
                                (c) =>
                                  String(c?.id || c) === String(memberId),
                              )
                            )
                              return true;
                          }
                          return false;
                        });

                        const taskStats = {
                          assigned: assignedTasksArr.length,
                          completed: assignedTasksArr.filter(
                            (t) =>
                              t?.status === "COMPLETED" ||
                              t?.status === "Done",
                          ).length,
                          incompleted:
                            assignedTasksArr.filter(
                              (t) =>
                                !(t?.status === "COMPLETED" || t?.status === "Done"),
                            ).length,
                          overdue: assignedTasksArr.filter((t) => {
                            if (!t?.scheduledDate) return false;
                            const due = new Date(t.scheduledDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return (
                              due < today &&
                              !(t?.status === "COMPLETED" || t?.status === "Done")
                            );
                          }).length,
                        };

                        const invitedDateRaw =
                          member?.invitedAt ||
                          member?.joinedAt ||
                          member?.createdAt ||
                          member?.addedAt ||
                          null;
                        const invitedDate = invitedDateRaw
                          ? new Date(invitedDateRaw)
                          : null;
                        const initials = (() => {
                          const name =
                            member?.name ||
                            `${member?.firstName || ""} ${member?.lastName || ""}`.trim() ||
                            member?.email ||
                            "";
                          const parts = name.split(/\s+/).filter(Boolean);
                          if (parts.length >= 2) {
                            return (
                              (parts[0][0] || "").toUpperCase() +
                              (parts[1][0] || "").toUpperCase()
                            );
                          }
                          if (parts.length === 1) {
                            return parts[0].slice(0, 2).toUpperCase();
                          }
                          return "?";
                        })();

                        return (
                          <tr
                            key={member.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 ${member.color} rounded-full flex items-center justify-center text-white font-bold text-sm`}
                                >
                                  {initials}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    {member.name}
                                    {String(member?.id) === String(managerId) && (
                                      <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                        Project Lead
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {member.email ||
                                      `${member.name
                                        .toLowerCase()
                                        .replace(/\s+/g, "")}@example.com`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {invitedDate
                                ? invitedDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })
                                : "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {taskStats.assigned}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {taskStats.completed}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {taskStats.incompleted}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                              {taskStats.overdue}
                            </td>
                            <td className="px-6 py-4">
                              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                          })}
                        </tbody>
                      );
                    })()}
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>
                  {(() => {
                    const team = project?.team || [];
                    const manager = project?.projectManager;
                    const managerId =
                      manager?.id || (typeof manager === "number" ? manager : null);
                    const hasManagerInTeam =
                      managerId != null &&
                      team.some((t) => String(t?.id) === String(managerId));
                    const membersCount = hasManagerInTeam
                      ? team.length
                      : manager
                      ? team.length + 1
                      : team.length;

                    return `${membersCount} Members`;
                  })()}
                </span>
              </div>
            </div>
          )}

          {/* Invite Member Modal */}
          <InviteMemberModal
            isOpen={inviteModal.isOpen}
            onClose={() => setInviteModal({ isOpen: false })}
            projectId={project?.id}
            existingTeam={project?.team || []}
            onMemberAdded={(user) => {
              // Update project state in-place so page does not reload
              setProject((prev) => {
                if (!prev) return prev;
                const existing = prev.team || [];
                // Avoid duplicates
                if (existing.some((m) => String(m?.id) === String(user.id))) {
                  return prev;
                }
                return {
                  ...prev,
                  team: [user, ...existing],
                };
              });
            }}
          />

          {/* Discussion Tab */}
          {activeTab === "discussion" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Channels List */}
              <div className="lg:col-span-1 rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-4">
                <div className="space-y-4 h-full flex flex-col">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Channel
                    </h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search channel or message"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto">
                    {project &&
                      getChannelsByProjectId(project.id).map((channel) => (
                        <div
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedChannel?.id === channel.id
                              ? "bg-gray-100"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {channel.name}
                              </h4>
                              {channel.unreadCount > 0 && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {channel.lastActivity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 truncate">
                            {channel.lastMessage}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Discussion Area */}
              <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl flex flex-col">
                {selectedChannel ? (
                  <>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedChannel.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                          <Plus className="w-4 h-4" />
                          <span className="text-sm">Attach Task</span>
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      {getMessagesByChannelId(selectedChannel.id).map(
                        (message) => {
                          const sender = teamMembers[message.senderId];
                          const isCurrentUser = message.senderId === 1; // Assuming current user is ID 1
                          const messageDate = new Date(message.timestamp);

                          return (
                            <div
                              key={message.id}
                              className={`flex ${
                                isCurrentUser ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`flex gap-3 max-w-[70%] ${
                                  isCurrentUser
                                    ? "flex-row-reverse"
                                    : "flex-row"
                                }`}
                              >
                                {!isCurrentUser && (
                                  <div
                                    className={`w-8 h-8 ${
                                      sender?.color || "bg-gray-500"
                                    } rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                                  >
                                    {sender?.avatar || "U"}
                                  </div>
                                )}
                                <div
                                  className={`flex flex-col ${
                                    isCurrentUser ? "items-end" : "items-start"
                                  }`}
                                >
                                  <div
                                    className={`px-4 py-2 rounded-lg ${
                                      isCurrentUser
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-gray-900"
                                    }`}
                                  >
                                    <p className="text-sm">{message.content}</p>
                                  </div>
                                  <div
                                    className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                                      isCurrentUser
                                        ? "flex-row-reverse"
                                        : "flex-row"
                                    }`}
                                  >
                                    <span>
                                      {messageDate.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                    <span>
                                      {sender?.name || "Unknown User"}
                                    </span>
                                  </div>
                                </div>
                                {isCurrentUser && (
                                  <div
                                    className={`w-8 h-8 ${
                                      sender?.color || "bg-gray-500"
                                    } rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                                  >
                                    {sender?.avatar || "U"}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex items-end gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          JB
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Write a message"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3">
                              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Plus className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Paperclip className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                <Smile className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                // Handle send message
                                setNewMessage("");
                              }}
                              disabled={!newMessage.trim()}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                              Send Message
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Select a channel to start the discussion
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <TaskContextMenuProject
        isOpen={contextMenu.isOpen}
        onClose={handleContextMenuClose}
        position={contextMenu.position}
        task={contextMenu.task}
        onDelete={(task) => {
          handleContextMenuClose();
        }}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={taskDetailModal.isOpen}
        onClose={handleTaskDetailClose}
        task={taskDetailModal.task}
        onOpenFullPage={handleOpenFullPage}
        onEditTask={handleEditTask}
        onOpenProject={handleOpenProject}
        onTaskRefresh={async () => {
          // Refresh task data in modal AND update the task list in real-time
          if (taskDetailModal.task?.id) {
            const taskId = taskDetailModal.task.id;
            try {
              // Get the updated task first to update the table immediately
              const fullTaskData = await taskService.getTaskById(taskId, [
                "project",
                "assignee",
                "createdBy",
                "subtasks",
                "subtasks.assignee",
                "subtasks.childSubtasks",
                "collaborators",
              ]);

              const transformedTask = transformTask(fullTaskData);

              // Update project tasks immediately with the updated task (real-time update)
              setProject((prevProject) => ({
                ...prevProject,
                tasks: prevProject.tasks.map((task) =>
                  task.id === taskId ? transformedTask : task,
                ),
              }));

              // Refresh subtask count for this task
              try {
                const response = await subtaskService.getRootSubtasksByTask(
                  taskId,
                  {
                    populate: ["assignee"],
                  },
                );

                let subtasksData = [];
                if (Array.isArray(response.data)) {
                  subtasksData = response.data;
                } else if (
                  response.data?.data &&
                  Array.isArray(response.data.data)
                ) {
                  subtasksData = response.data.data;
                } else if (Array.isArray(response)) {
                  subtasksData = response;
                }

                const transformedSubtasks = subtasksData
                  .map(transformSubtask)
                  .filter(Boolean);

                // Update loaded subtasks state to refresh the count
                setLoadedSubtasks((prev) => ({
                  ...prev,
                  [taskId]: transformedSubtasks,
                }));
              } catch (subtaskError) {
                console.error(
                  `Error refreshing subtasks for task ${taskId}:`,
                  subtaskError,
                );
              }

              // Update modal task
              const formattedDueDate = transformedTask.scheduledDate
                ? formatDate(transformedTask.scheduledDate)
                : "No due date";

              let comments = [];
              try {
                const commentsResponse =
                  await commentService.getTaskComments(taskId);
                comments = commentsResponse.data?.map(transformComment) || [];
              } catch (commentError) {
                console.error("Error fetching comments:", commentError);
              }

              const taskForModal = {
                ...transformedTask,
                dueDate: formattedDueDate,
                description: transformedTask.description || "",
                subtasks:
                  transformedTask.subtasks || fullTaskData.subtasks || [],
                comments: comments,
              };

              setTaskDetailModal((prev) => ({
                ...prev,
                task: taskForModal,
              }));
            } catch (error) {
              console.error("Error refreshing task:", error);
            }
          }
        }}
      />

      {/* Collaborator Modal */}
      <CollaboratorModal
        isOpen={collaboratorModal.isOpen}
        task={collaboratorModal.task}
        onClose={() => setCollaboratorModal({ isOpen: false, task: null })}
        onUpdate={async (updatedTask) => {
          // Refresh task from server to ensure we have latest data with all relations
          try {
            const refreshedTask = await taskService.getTaskById(
              updatedTask.id,
              ["assignee", "collaborators", "projects", "subtasks"],
            );
            const transformedTask = transformTask(refreshedTask);

            setProject((prevProject) => ({
              ...prevProject,
              tasks: prevProject.tasks.map((t) =>
                t.id === transformedTask.id ? transformedTask : t,
              ),
            }));

            if (taskDetailModal.task?.id === transformedTask.id) {
              setTaskDetailModal((prev) => ({
                ...prev,
                task: transformedTask,
              }));
            }
          } catch (error) {
            console.error(
              "Error refreshing task after assignee update:",
              error,
            );
            // Fallback to optimistic update if refresh fails
            setProject((prevProject) => ({
              ...prevProject,
              tasks: prevProject.tasks.map((t) =>
                t.id === updatedTask.id ? updatedTask : t,
              ),
            }));
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <TaskDeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        task={deleteModal.task}
        onClose={() => setDeleteModal({ isOpen: false, task: null })}
        onConfirm={async (taskToDelete) => {
          try {
            if (taskToDelete?.bulkDelete && taskToDelete?.taskIds) {
              // Bulk delete
              const taskIds = taskToDelete.taskIds;
              await Promise.all(
                taskIds.map((taskId) => taskService.deleteTask(taskId)),
              );
              // Remove tasks from project
              setProject((prevProject) => ({
                ...prevProject,
                tasks: prevProject.tasks.filter((t) => !taskIds.includes(t.id)),
              }));
              // Clear selection
              setSelectedTaskIds([]);
            } else if (taskToDelete?.id) {
              // Single task delete
              await taskService.deleteTask(taskToDelete.id);
              // Remove task from project
              setProject((prevProject) => ({
                ...prevProject,
                tasks: prevProject.tasks.filter(
                  (t) => t.id !== taskToDelete.id,
                ),
              }));
              // Close modal if it's open for this task
              if (taskDetailModal.task?.id === taskToDelete.id) {
                setTaskDetailModal({ isOpen: false, task: null });
              }
            }
            setDeleteModal({ isOpen: false, task: null });
          } catch (error) {
            console.error("Error deleting task(s):", error);
          }
        }}
      />

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={addTaskModal.isOpen}
        onClose={() => setAddTaskModal({ isOpen: false, projectId: null })}
        initialProjectId={addTaskModal.projectId}
        onTaskCreated={async () => {
          // Reload project to get updated tasks list
          if (params?.slug) {
            try {
              let slugParam;
              if (params.slug instanceof Promise) {
                const resolvedParams = await params;
                slugParam = resolvedParams.slug;
              } else {
                slugParam = params.slug;
              }

              let strapiProject = null;
              const parsedId = parseInt(slugParam, 10);
              if (!isNaN(parsedId)) {
                try {
                  strapiProject = await projectService.getProjectById(
                    parsedId,
                    [
                      "projectManager",
                      "teamMembers",
                      "tasks",
                      "tasks.assignee",
                      "tasks.collaborators",
                      "tasks.project",
                      "tasks.subtasks",
                      "account",
                      "deal",
                      "deal.leadCompany",
                      "deal.clientAccount",
                    ],
                  );
                } catch (idError) {
                }
              }

              if (!strapiProject) {
                try {
                  strapiProject = await projectService.getProjectBySlug(
                    slugParam,
                    [
                      "projectManager",
                      "teamMembers",
                      "tasks",
                      "tasks.assignee",
                      "tasks.collaborators",
                      "tasks.project",
                      "tasks.subtasks",
                      "account",
                      "deal",
                      "deal.leadCompany",
                      "deal.clientAccount",
                    ],
                  );
                } catch (slugError) {
                  console.error("Failed to fetch by slug:", slugError);
                }
              }

              if (strapiProject) {
                const transformedProject = transformProject(strapiProject);

                // Recalculate stats
                let recalculatedStats = {
                  totalTasks: transformedProject.tasks?.length || 0,
                  completedTasks: 0,
                  incompleteTasks: 0,
                  assignedTasks: 0,
                  overdueTasks: 0,
                };

                if (
                  transformedProject.tasks &&
                  transformedProject.tasks.length > 0
                ) {
                  transformedProject.tasks.forEach((task) => {
                    if (task.status === "Done" || task.status === "COMPLETED") {
                      recalculatedStats.completedTasks++;
                    } else {
                      recalculatedStats.incompleteTasks++;
                    }
                    if (
                      task.assignee ||
                      (task.assigneeIds && task.assigneeIds.length > 0)
                    ) {
                      recalculatedStats.assignedTasks++;
                    }
                    // Check if overdue
                    if (task.dueDate) {
                      const dueDate = new Date(task.dueDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (
                        dueDate < today &&
                        task.status !== "Done" &&
                        task.status !== "COMPLETED"
                      ) {
                        recalculatedStats.overdueTasks++;
                      }
                    }
                  });
                }

                // Ensure all tasks have the project relation set
                const tasksWithProject =
                  transformedProject.tasks?.map((task) => {
                    let collaborators = task.collaborators || [];
                    if (task.assignee) {
                      const assigneeInCollaborators = collaborators.find(
                        (c) => c?.id === task.assignee?.id,
                      );
                      if (!assigneeInCollaborators) {
                        collaborators = [task.assignee, ...collaborators];
                      }
                    }
                    const finalCollaborators =
                      collaborators.length > 0
                        ? collaborators
                        : task.assignee
                          ? [task.assignee]
                          : [];

                    return {
                      ...task,
                      project: task.project || {
                        id: transformedProject.id,
                        name: transformedProject.name,
                        slug: transformedProject.slug,
                        color: transformedProject.color,
                        icon: transformedProject.icon,
                      },
                      // Ensure assignee is preserved
                      assignee: task.assignee,
                      collaborators: finalCollaborators,
                    };
                  }) || [];

                // Handle account data
                let accountData = null;
                if (strapiProject.account) {
                  const account =
                    strapiProject.account.data || strapiProject.account;
                  const accountAttributes = account?.attributes || account;
                  accountData = {
                    id: account?.id || account?.documentId,
                    name:
                      accountAttributes?.name ||
                      accountAttributes?.companyName ||
                      account?.name ||
                      account?.companyName ||
                      "N/A",
                    industry:
                      accountAttributes?.industry || account?.industry || "",
                    website:
                      accountAttributes?.website || account?.website || "",
                    employees:
                      accountAttributes?.employees || account?.employees || "",
                    city: accountAttributes?.city || account?.city || "",
                    state: accountAttributes?.state || account?.state || "",
                    country:
                      accountAttributes?.country || account?.country || "",
                  };
                }

                const enrichedProject = {
                  ...transformedProject,
                  tasks: tasksWithProject,
                  stats: recalculatedStats,
                  team: transformedProject.teamMembers || [],
                  client: accountData,
                  deal: strapiProject.deal || null,
                  originalStartDate: strapiProject.startDate,
                  originalEndDate: strapiProject.endDate,
                };

                setProject(enrichedProject);
              }
            } catch (error) {
              console.error(
                "Error reloading project after task creation:",
                error,
              );
            }
          }
        }}
      />

      {/* Project Lead Selection Modal */}
      {projectLeadModal.isOpen && (
        <ProjectLeadModal
          isOpen={projectLeadModal.isOpen}
          onClose={() => setProjectLeadModal({ isOpen: false })}
          project={project}
          onUpdate={(updatedProject) => {
            // Update project state
            setProject(updatedProject);
            // Close modal
            setProjectLeadModal({ isOpen: false });
          }}
        />
      )}
    </div>
  );
}

// Project Lead Selection Modal Component
function ProjectLeadModal({ isOpen, onClose, project, onUpdate }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);

  // Update local project state when prop changes
  useEffect(() => {
    if (project) {
      setCurrentProject(project);
      // Set selected user ID from current project manager
      const projectManagerId =
        project?.projectManager?.id || project?.projectManager;
      setSelectedUserId(projectManagerId ? projectManagerId.toString() : "");
    }
  }, [project]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      // Reset selected user when modal opens
      if (project) {
        setCurrentProject(project);
        const projectManagerId =
          project?.projectManager?.id || project?.projectManager;
        setSelectedUserId(projectManagerId ? projectManagerId.toString() : "");
      }
    }
  }, [isOpen, project]);

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

  const handleUpdateAssignee = async () => {
    if (!currentProject) return;

    setSaving(true);
    try {
      await projectService.updateProject(currentProject.id, {
        projectManager: selectedUserId || null,
      });

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

      // Close the modal after update
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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Change Assignee
                </h3>
                <p className="text-sm text-gray-500">
                  Assign project to a team member
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Select a user to assign <strong>{currentProject.name}</strong> to:
            </p>
            <SearchableSelect
              label="Assign To"
              value={selectedUserId}
              onChange={setSelectedUserId}
              options={[
                { value: "", label: "Unassigned" },
                ...users.map((u) => ({
                  value: u.id.toString(),
                  label:
                    u.name ||
                    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
                    u.email ||
                    "Unknown User",
                })),
              ]}
              disabled={loading}
              placeholder="Select a user"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateAssignee}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
            >
              {saving ? "Updating..." : "Update Assignee"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
