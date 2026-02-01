"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle,
  Clock,
  Calendar,
  CheckSquare,
  AlertCircle,
  Check,
  Eye,
  Trash2,
  GitBranch,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useRouter } from "next/navigation";
import {
  TasksHeader,
  TasksKPIs,
  TasksTabs,
  TasksListView,
  TaskKanban,
  TaskDetailModal,
  TaskDeleteConfirmationModal,
  AddTaskModal,
  CollaboratorModal,
  TasksFilterModal,
} from "../../components/my-task";
import ProjectSelector from "../../components/my-task/ProjectSelector";
import SubtaskDetailModal from "../../components/shared/SubtaskDetailModal";
import { Card, Pagination } from "../../components/ui";
import taskService from "../../lib/taskService";
import subtaskService from "../../lib/subtaskService";
import projectService from "../../lib/projectService";
import commentService from "../../lib/commentService";
import {
  transformTask,
  transformSubtask,
  transformStatusToStrapi,
  transformPriorityToStrapi,
  transformComment,
} from "../../lib/dataTransformers";
import { useAuth } from "../../contexts/AuthContext";
import apiClient from "../../lib/apiClient";

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

export default function MyTasks() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State management
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [allTasks, setAllTasks] = useState([]); // Store all tasks for "All Tasks" tab
  const [activeView, setActiveView] = useState("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [collaboratorModal, setCollaboratorModal] = useState({
    isOpen: false,
    task: null,
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskName, setEditingTaskName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Task detail modal state
  const [taskDetailModal, setTaskDetailModal] = useState({
    isOpen: false,
    task: null,
  });

  // Subtask detail modal state (replaces task modal when opening a subtask on My Tasks)
  const [subtaskDetailModal, setSubtaskDetailModal] = useState({
    isOpen: false,
    subtaskId: null,
    task: null,
  });

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    task: null,
  });

  // Add task modal state
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  // Subtask expansion state
  const [expandedSubtasks, setExpandedSubtasks] = useState({});
  const [loadedSubtasks, setLoadedSubtasks] = useState({});
  const [subtaskDropdownPositions, setSubtaskDropdownPositions] = useState({});
  const subtaskButtonRefs = useRef({});
  const subtaskDropdownRefs = useRef({});

  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);

  // Users for filter modal
  const [users, setUsers] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Close subtask dropdowns on scroll
  useEffect(() => {
    const handleScroll = () => {
      setExpandedSubtasks({});
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const exportDropdownRef = useRef(null);

  // Load users for filter modal
  useEffect(() => {
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
              documentId: user.id,
              firstName,
              lastName,
              email,
              name,
              ...userData,
            };
          });

        setUsers(transformedUsers);
      } catch (error) {
        console.error("Error loading users:", error);
        setUsers([]);
      }
    };

    loadUsers();
  }, []);

  // Load tasks and projects from API
  useEffect(() => {
    // Don't load if auth is still loading
    if (authLoading) {
      return;
    }

    const loadMyTasks = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user ID - check multiple possible properties
        const currentUserId =
          user?.id || user?._id || user?.xtrawrkxUserId || 1;

        if (!currentUserId || currentUserId === 1) {
          console.warn("No valid user ID found, using default ID 1");
        }

        // Load both user's tasks and all PM tasks in parallel
        const [myTasksResponse, allTasksResponse, projectsResponse] =
          await Promise.all([
            // User's assigned tasks
            taskService
              .getPMTasksByAssignee(currentUserId, {
                pageSize: 100,
                populate: [
                  "projects",
                  "assignee",
                  "assignee.firstName",
                  "assignee.lastName",
                  "assignee.email",
                  "createdBy",
                  "subtasks",
                  "collaborators",
                  "collaborators.firstName",
                  "collaborators.lastName",
                  "collaborators.email",
                ],
              })
              .catch((err) => {
                console.error("Error fetching user PM tasks:", err);
                return { data: [] };
              }),
            // All PM tasks (for "All Tasks" tab)
            taskService
              .getAllTasks({
                pageSize: 100,
                populate: [
                  "projects",
                  "assignee",
                  "assignee.firstName",
                  "assignee.lastName",
                  "assignee.email",
                  "createdBy",
                  "subtasks",
                  "collaborators",
                  "collaborators.firstName",
                  "collaborators.lastName",
                  "collaborators.email",
                ],
                filters: {
                  // Filter out CRM tasks - only PM tasks
                  // This will be filtered client-side
                },
              })
              .catch((err) => {
                console.error("Error fetching all PM tasks:", err);
                return { data: [] };
              }),
            projectService.getAllProjects({ pageSize: 50 }).catch((err) => {
              console.error("Error fetching projects:", err);
              return { data: [] };
            }),
          ]);

        // Transform all tasks
        const allTransformedTasks =
          allTasksResponse.data?.map(transformTask) || [];

        // Filter out CRM tasks from all tasks (PM tasks only)
        const allPMTasks = allTransformedTasks.filter((task) => {
          // PM tasks should NOT have CRM entity relations
          const hasCRMRelation = !!(
            task.leadCompany ||
            task.clientAccount ||
            task.contact ||
            task.deal
          );
          return !hasCRMRelation;
        });

        // Transform user's tasks
        const transformedMyTasks =
          myTasksResponse.data?.map(transformTask) || [];

        // Normalize IDs for comparison (handle both string and number IDs)
        const normalizedCurrentUserId =
          typeof currentUserId === "string"
            ? parseInt(currentUserId)
            : currentUserId;

        // Filter tasks where user is assignee OR collaborator
        // Use allPMTasks to include tasks where user might be collaborator but not assignee
        const userAssignedTasks = allPMTasks.filter((task) => {
          // Check if task is assigned to current user
          const taskAssigneeId =
            task.assignee?.id || task.assignee?._id || task.assignee;
          const normalizedTaskAssigneeId =
            typeof taskAssigneeId === "string"
              ? parseInt(taskAssigneeId)
              : taskAssigneeId;
          const isAssignee =
            normalizedTaskAssigneeId === normalizedCurrentUserId;

          // Check if user is a collaborator
          const collaborators = task.collaborators || [];
          const isCollaborator = collaborators.some((collab) => {
            const collabId = collab?.id || collab?._id || collab;
            const normalizedCollabId =
              typeof collabId === "string" ? parseInt(collabId) : collabId;
            return normalizedCollabId === normalizedCurrentUserId;
          });

          return isAssignee || isCollaborator;
        });

        const transformedProjects =
          projectsResponse.data?.map((project) => ({
            id: project.id,
            name: project.name,
            slug: project.slug,
          })) || [];

        setTasks(userAssignedTasks);
        setAllTasks(allPMTasks);
        setProjects(transformedProjects);
      } catch (error) {
        console.error("Error loading my tasks:", error);
        // Provide more user-friendly error message
        const errorMessage =
          error?.response?.data?.error?.message ||
          error?.message ||
          "Failed to load tasks. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadMyTasks();
  }, [user, authLoading]);

  // Load subtask counts for all visible tasks (only once per task)
  useEffect(() => {
    const loadSubtaskCounts = async () => {
      const tasksToCheck = activeTab === "my-tasks" ? tasks : allTasks;

      // Load subtask counts for tasks that don't have them loaded yet
      const tasksNeedingCounts = tasksToCheck.filter(
        (task) => task.id && !loadedSubtasks[task.id],
      );

      if (tasksNeedingCounts.length === 0) return;

      // Load subtask counts in parallel (limit to avoid too many requests)
      const tasksToLoad = tasksNeedingCounts.slice(0, 10); // Load first 10 to avoid overwhelming

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

    // Only load if we have tasks
    if ((tasks.length > 0 || allTasks.length > 0) && !loading) {
      loadSubtaskCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length, allTasks.length, activeTab, loading]); // Only depend on lengths and activeTab to avoid infinite loops

  // Determine which tasks to use based on active tab
  const tasksToUse = activeTab === "my-tasks" ? tasks : allTasks;

  // Calculate task statistics based on current tab
  const getTaskStats = () => {
    const tasksForStats = tasksToUse;
    const stats = {
      all: tasksForStats.length,
      "to-do": 0,
      "in-progress": 0,
      "internal-review": 0,
      done: 0,
      overdue: 0,
    };

    const now = new Date();
    tasksForStats.forEach((task) => {
      const status = task.status?.toLowerCase().replace(/\s+/g, "-") || "";
      if (status === "to-do" || status === "todo") stats["to-do"]++;
      else if (status === "in-progress") stats["in-progress"]++;
      else if (status === "internal-review" || status === "in-review")
        stats["internal-review"]++;
      else if (status === "done" || status === "completed") stats.done++;

      // Check for overdue
      if (
        task.scheduledDate &&
        new Date(task.scheduledDate) < now &&
        status !== "done" &&
        status !== "completed"
      ) {
        stats.overdue++;
      }
    });

    return stats;
  };

  const taskStats = getTaskStats();

  // Status statistics for KPIs
  const statusStats = [
    {
      label: "To Do",
      count: taskStats["to-do"],
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      icon: CheckSquare,
    },
    {
      label: "In Progress",
      count: taskStats["in-progress"],
      color: "bg-yellow-50",
      borderColor: "border-yellow-200",
      iconColor: "text-yellow-600",
      icon: Clock,
    },
    {
      label: "Done",
      count: taskStats.done,
      color: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      icon: CheckCircle,
    },
    {
      label: "Overdue",
      count: taskStats.overdue,
      color: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-600",
      icon: AlertCircle,
    },
  ];

  // Tab items for navigation
  const tabItems = [
    { key: "my-tasks", label: "My Tasks", badge: tasks.length.toString() },
    { key: "all", label: "All Tasks", badge: allTasks.length.toString() },
    { key: "to-do", label: "To Do", badge: taskStats["to-do"].toString() },
    {
      key: "in-progress",
      label: "In Progress",
      badge: taskStats["in-progress"].toString(),
    },
    {
      key: "internal-review",
      label: "Internal Review",
      badge: taskStats["internal-review"].toString(),
    },
    { key: "done", label: "Done", badge: taskStats.done.toString() },
    { key: "overdue", label: "Overdue", badge: taskStats.overdue.toString() },
  ];

  // Filter tasks based on search, active tab, and applied filters
  const filteredTasks = tasksToUse.filter((task) => {
    if (!task) return false;

    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      (task.name &&
        task.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.project?.name &&
        task.project.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Handle tab filtering - "my-tasks" and "all" show all tasks (filtered by search only)
    // Other tabs filter by status
    const taskStatus = task.status?.toLowerCase().replace(/\s+/g, "-") || "";
    const matchesTab =
      activeTab === "my-tasks" ||
      activeTab === "all" ||
      taskStatus === activeTab ||
      (activeTab === "overdue" &&
        task.scheduledDate &&
        new Date(task.scheduledDate) < new Date() &&
        taskStatus !== "done" &&
        taskStatus !== "completed");

    // Applied filters
    let matchesFilters = true;

    if (Object.keys(appliedFilters).length > 0) {
      // Status filter
      if (appliedFilters.status) {
        const filterStatus = appliedFilters.status.toLowerCase();
        const taskStatusLower = task.status?.toLowerCase() || "";
        if (filterStatus !== taskStatusLower) {
          matchesFilters = false;
        }
      }

      // Priority filter
      if (appliedFilters.priority) {
        const filterPriority = appliedFilters.priority.toLowerCase();
        const taskPriority = task.priority?.toLowerCase() || "";
        if (filterPriority !== taskPriority) {
          matchesFilters = false;
        }
      }

      // Assigned to filter - match by user ID
      if (appliedFilters.assignedTo) {
        const assignedUser = task.assignee;
        const assignedUserId = assignedUser
          ? (
              assignedUser.id ||
              assignedUser._id ||
              assignedUser.documentId
            )?.toString()
          : "";
        const filterUserId = appliedFilters.assignedTo.toString();
        if (assignedUserId !== filterUserId) {
          matchesFilters = false;
        }
      }

      // Project filter
      if (appliedFilters.project) {
        const taskProjectId = task.project
          ? (task.project.id || task.project._id)?.toString()
          : "";
        const filterProjectId = appliedFilters.project.toString();
        if (taskProjectId !== filterProjectId) {
          matchesFilters = false;
        }
      }

      // Date range filter (created date)
      if (appliedFilters.dateRange && task.createdAt) {
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
          const taskCreatedDate = new Date(task.createdAt);
          if (taskCreatedDate < startDate) {
            matchesFilters = false;
          }
        }
      }

      // Due date range filter
      if (appliedFilters.dueDateFrom || appliedFilters.dueDateTo) {
        if (!task.scheduledDate) {
          matchesFilters = false;
        } else {
          const taskDueDate = new Date(task.scheduledDate);
          if (appliedFilters.dueDateFrom) {
            const fromDate = new Date(appliedFilters.dueDateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (taskDueDate < fromDate) {
              matchesFilters = false;
            }
          }
          if (appliedFilters.dueDateTo) {
            const toDate = new Date(appliedFilters.dueDateTo);
            toDate.setHours(23, 59, 59, 999);
            if (taskDueDate > toDate) {
              matchesFilters = false;
            }
          }
        }
      }
    }

    return matchesSearch && matchesTab && matchesFilters;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = filteredTasks.slice(startIndex, endIndex);

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
      filteredTasks.length !== prevFilteredCountRef.current
    ) {
      prevFilteredCountRef.current = filteredTasks.length;
      setToastMessage(
        `Filters applied. Showing ${filteredTasks.length} result${
          filteredTasks.length !== 1 ? "s" : ""
        }`,
      );
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setToastMessage("");
      }, 3000);
    }
  }, [filteredTasks.length, appliedFilters, loading]);

  // Handle due date updates - MUST be defined before taskColumnsTable
  const handleDueDateUpdate = async (taskId, newDate) => {
    if (!taskId) return;

    // Convert date to ISO string (date only, no time) if provided, or null if empty
    const scheduledDate = newDate
      ? new Date(newDate + "T00:00:00").toISOString()
      : null;

    // Find the original task to store for potential rollback
    const originalTask =
      tasks.find((t) => t.id === taskId) ||
      allTasks.find((t) => t.id === taskId);
    const originalScheduledDate = originalTask?.scheduledDate;

    // Update both task lists immediately (optimistic update) - same as status
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, scheduledDate: scheduledDate } : task,
      ),
    );

    setAllTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, scheduledDate: scheduledDate } : task,
      ),
    );

    // Update task in modal if it's currently open and showing this task
    if (taskDetailModal.isOpen && taskDetailModal.task?.id === taskId) {
      const formattedDueDate = scheduledDate
        ? formatDate(scheduledDate)
        : "No due date";
      setTaskDetailModal((prev) => ({
        ...prev,
        task: {
          ...prev.task,
          scheduledDate: scheduledDate,
          dueDate: formattedDueDate,
        },
      }));
    }

    try {
      await taskService.updateTask(taskId, { scheduledDate });
    } catch (error) {
      console.error("Error updating due date:", error);

      // Revert optimistic update on error
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, scheduledDate: originalScheduledDate }
            : task,
        ),
      );

      setAllTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId
            ? { ...task, scheduledDate: originalScheduledDate }
            : task,
        ),
      );

      // Revert modal update if it's currently open
      if (taskDetailModal.isOpen && taskDetailModal.task?.id === taskId) {
        const originalFormattedDueDate = originalScheduledDate
          ? formatDate(originalScheduledDate)
          : "No due date";
        setTaskDetailModal((prev) => ({
          ...prev,
          task: {
            ...prev.task,
            scheduledDate: originalScheduledDate,
            dueDate: originalFormattedDueDate,
          },
        }));
      }
    }
  };

  // Table columns configuration
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
                // Update both task lists
                setTasks((prevTasks) =>
                  prevTasks.map((t) =>
                    t.id === task.id ? { ...t, name: newName } : t,
                  ),
                );
                setAllTasks((prevTasks) =>
                  prevTasks.map((t) =>
                    t.id === task.id ? { ...t, name: newName } : t,
                  ),
                );
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
                // Toggle between Done and To Do
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
                    className={`font-medium truncate cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors flex-1 min-w-0 ${
                      isDone ? "line-through text-gray-500" : "text-gray-900"
                    }`}
                    title="Click to edit task name"
                  >
                    {task.name}
                  </div>
                  {hasSubtasks && (
                    <div
                      className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
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
      key: "project",
      label: "PROJECT",
      render: (_, task) => (
        <ProjectSelector
          task={task}
          projects={projects}
          onUpdate={(updatedTask) => {
            // Update both tasks and allTasks states
            setTasks((prevTasks) =>
              prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
            );
            setAllTasks((prevTasks) =>
              prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
            );

            // Update taskDetailModal if it's showing this task
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
      key: "assignee",
      label: "ASSIGNEE",
      render: (_, task) => {
        // Support both single assignee and multiple collaborators
        const assignee = task.assignee;

        // Check if assignee is a valid user object (not null and has identifying properties)
        const hasAssignee =
          assignee &&
          (assignee.id ||
            assignee._id ||
            assignee.firstName ||
            assignee.lastName ||
            assignee.name ||
            assignee.email);

        // Get collaborators - prefer task.collaborators array, fallback to assignee if no collaborators
        let collaborators = [];
        if (
          task.collaborators &&
          Array.isArray(task.collaborators) &&
          task.collaborators.length > 0
        ) {
          // Filter out null/undefined collaborators
          collaborators = task.collaborators.filter(
            (c) =>
              c &&
              (c.id || c._id || c.firstName || c.lastName || c.name || c.email),
          );
        } else if (hasAssignee) {
          collaborators = [assignee];
        }

        const hasCollaborators = collaborators.length > 0;

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollaboratorModal({ isOpen: true, task });
            }}
            className="flex items-center gap-2 min-w-[140px] hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors text-left"
          >
            {hasCollaborators ? (
              <div className="flex items-center gap-1">
                {/* Show up to 3 avatars, then show count */}
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
        // Convert scheduledDate to date format (YYYY-MM-DD)
        const getDateValue = (dateString) => {
          if (!dateString) return "";
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          } catch (e) {
            return "";
          }
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
              value={currentValue || ""}
              onChange={(e) => {
                const newValue = e.target.value;
                handleDueDateUpdate(task.id, newValue);
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

        const currentStatus = task.status || "To Do";
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
          "client-review": {
            bg: "bg-purple-100",
            text: "text-purple-800",
            border: "border-purple-400",
          },
          approved: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-400",
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
              className={`w-full ${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-3 py-2 font-bold text-xs text-center shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none`}
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

        // Normalize priority to match option values (API returns lowercase)
        const normalizePriority = (priority) => {
          if (!priority) return "Medium";
          const p = String(priority).toLowerCase();
          if (p === "low") return "Low";
          if (p === "medium") return "Medium";
          if (p === "high") return "High";
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
              className={`w-full ${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-3 py-2 font-bold text-xs text-center shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none`}
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

        // Use loaded subtasks from state (most reliable)
        const loadedTaskSubtasks = loadedSubtasks[taskId] || [];

        // Also check task.subtasks as fallback (might be populated from initial load)
        const taskSubtasks = task.subtasks || [];

        // Prefer loaded subtasks, fallback to task subtasks
        const allSubtasks =
          loadedTaskSubtasks.length > 0 ? loadedTaskSubtasks : taskSubtasks;

        // Count only root-level subtasks (those without parentSubtask or with null parentSubtask)
        const rootSubtasks = allSubtasks.filter((st) => {
          // Root subtask: no parentSubtask property, or it's null/undefined, or it's an empty object
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

          // Always load subtasks when expanding (to ensure fresh data)
          if (newExpandedState) {
            try {
              const response = await subtaskService.getRootSubtasksByTask(
                taskId,
                {
                  populate: ["assignee", "childSubtasks"],
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


              setLoadedSubtasks((prev) => ({
                ...prev,
                [taskId]: transformedSubtasks,
              }));
            } catch (error) {
              console.error("Error loading subtasks:", error);
              // If error, still allow expansion with existing data
            }
          }

          setExpandedSubtasks((prev) => ({
            ...prev,
            [taskId]: newExpandedState,
          }));
        };

        const handleSubtaskClick = (e, subtask) => {
          e.stopPropagation();
          // Navigate to task detail page - the detail page will handle opening subtask modal
          router.push(`/my-task/${task.slug || task.id}`);
        };

        // Show button if we have subtasks OR if we haven't checked yet (to allow loading)
        const hasSubtasks = subtaskCount > 0;
        const shouldShowButton =
          hasSubtasks ||
          (!loadedTaskSubtasks.length && taskSubtasks.length === 0);

        const dropdownPosition = subtaskDropdownPositions[taskId];
        const dropdownContent =
          isExpanded && rootSubtasks.length > 0 && dropdownPosition ? (
            <div
              ref={(el) => {
                if (el) subtaskDropdownRefs.current[taskId] = el;
              }}
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
                      onClick={(e) => handleSubtaskClick(e, subtask)}
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
                <button
                  onClick={handleToggleExpand}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 w-full text-gray-400"
                >
                  <GitBranch className="w-4 h-4" />
                  <span className="text-sm">No subtasks</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                </button>
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
      key: "createdAt",
      label: "CREATED AT",
      render: (_, task) => (
        <div className="flex items-center gap-2 text-sm text-gray-700 min-w-[140px]">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {task.createdAt ? formatDate(task.createdAt) : "N/A"}
          </span>
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

  // Handle status updates
  const handleStatusUpdate = async (taskId, newStatus) => {
    if (!taskId) return;

    // Transform frontend status to Strapi format
    const strapiStatus = transformStatusToStrapi(newStatus);

    // Check if marking as done/completed - check in both task lists
    const isCompleting = strapiStatus === "COMPLETED";
    const task =
      tasks.find((t) => t.id === taskId) ||
      allTasks.find((t) => t.id === taskId);
    const wasAlreadyDone =
      task?.status?.toLowerCase() === "done" ||
      task?.status?.toLowerCase() === "completed";

    // Update both task lists immediately (optimistic update)
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    );

    setAllTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task,
      ),
    );

    // Update taskDetailModal immediately if it's currently open and showing this task
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

      // Trigger confetti animation only when completing a task (not when uncompleting)
      const isUncompleting = !isCompleting && wasAlreadyDone;
      if (isCompleting && !wasAlreadyDone && !isUncompleting) {
        // Trigger confetti animation from both sides
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 9999,
        };

        function randomInRange(min, max) {
          return Math.random() * (max - min) + min;
        }

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
        }, 250);
      }

      setToastMessage("Task status updated successfully!");
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setToastMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Handle priority updates
  const handlePriorityUpdate = async (taskId, newPriority) => {
    if (!taskId) return;

    // Transform frontend priority to Strapi format
    const strapiPriority = transformPriorityToStrapi(newPriority);

    // Update both task lists immediately (optimistic update - like status)
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, priority: newPriority } : task,
      ),
    );

    setAllTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, priority: newPriority } : task,
      ),
    );

    // Update taskDetailModal immediately if it's currently open and showing this task (like status)
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
    }
  };

  // Handle task click - fetch full task details
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
        ? formatDate(transformedTask.scheduledDate)
        : "No due date";

      // Fetch comments for this task
      let comments = [];
      try {
        const commentsResponse = await commentService.getTaskComments(task.id);
        // Transform comments to frontend format
        comments = commentsResponse.data?.map(transformComment) || [];
      } catch (commentError) {
        console.error("Error fetching comments:", commentError);
      }

      // Prepare task for modal with all necessary data
      const taskForModal = {
        ...transformedTask,
        dueDate: formattedDueDate,
        description: transformedTask.description || task.description || "",
        // Ensure subtasks are included
        subtasks: transformedTask.subtasks || fullTaskData.subtasks || [],
        // Include fetched comments
        comments: comments,
      };

      setTaskDetailModal({
        isOpen: true,
        task: taskForModal,
      });
    } catch (error) {
      console.error("Error fetching task details:", error);
      // Fallback to using the task from the table if fetch fails
      setTaskDetailModal({
        isOpen: true,
        task: task,
      });
    }
  };

  const handleTaskDetailClose = () => {
    setTaskDetailModal({
      isOpen: false,
      task: null,
    });
  };

  const handleOpenProject = (project) => {
    if (project?.slug) {
      router.push(`/projects/${project.slug}`);
    } else if (project?.name) {
      router.push(
        `/projects/${project.name.toLowerCase().replace(/\s+/g, "-")}`,
      );
    }
  };

  const handleOpenFullPage = (task) => {
    if (task?.id) {
      router.push(`/my-task/${task.id}`);
    }
  };

  const handleEditTask = (task) => {
    if (task?.id) {
      setTaskDetailModal({ isOpen: false, task: null });
      router.push(`/my-task/${task.id}/edit`);
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
      setSelectedTaskIds(filteredTasks.map((task) => task.id));
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
    const firstSelectedTask = filteredTasks.find(
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
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          selectedTaskIds.includes(task.id)
            ? { ...task, status: newStatus }
            : task,
        ),
      );
      setAllTasks((prevTasks) =>
        prevTasks.map((task) =>
          selectedTaskIds.includes(task.id)
            ? { ...task, status: newStatus }
            : task,
        ),
      );

      // Clear selection
      setSelectedTaskIds([]);

      // Show success message
      setToastMessage(
        `Updated ${selectedTaskIds.length} task${
          selectedTaskIds.length !== 1 ? "s" : ""
        } successfully!`,
      );
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setToastMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error updating task statuses:", error);
      setError("Failed to update task statuses");
    }
  };

  // Handle task creation
  const handleTaskCreated = async () => {
    // Reload tasks to include the newly created task
    try {
      setLoading(true);
      const currentUserId = user?.id || user?._id || user?.xtrawrkxUserId || 1;

      // Small delay to ensure backend has processed the creation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Reload both user tasks and all tasks
      const [myTasksResponse, allTasksResponse] = await Promise.all([
        taskService.getPMTasksByAssignee(currentUserId, {
          pageSize: 100,
          populate: [
            "projects",
            "assignee",
            "assignee.firstName",
            "assignee.lastName",
            "assignee.email",
            "createdBy",
            "subtasks",
            "collaborators",
            "collaborators.firstName",
            "collaborators.lastName",
            "collaborators.email",
          ],
        }),
        taskService.getAllTasks({
          pageSize: 100,
          populate: [
            "projects",
            "assignee",
            "assignee.firstName",
            "assignee.lastName",
            "assignee.email",
            "createdBy",
            "subtasks",
            "collaborators",
            "collaborators.firstName",
            "collaborators.lastName",
            "collaborators.email",
          ],
        }),
      ]);

      // Transform all tasks
      const allTransformedTasks =
        allTasksResponse.data?.map(transformTask) || [];
      const allPMTasks = allTransformedTasks.filter((task) => {
        const hasCRMRelation = !!(
          task.leadCompany ||
          task.clientAccount ||
          task.contact ||
          task.deal
        );
        return !hasCRMRelation;
      });

      // Transform user's tasks
      const transformedMyTasks = myTasksResponse.data?.map(transformTask) || [];

      // Normalize IDs for comparison (handle both string and number IDs)
      const normalizedCurrentUserId =
        typeof currentUserId === "string"
          ? parseInt(currentUserId)
          : currentUserId;

      // Filter tasks where user is assignee OR collaborator
      // Use allPMTasks to include tasks where user might be collaborator but not assignee
      const userAssignedTasks = allPMTasks.filter((task) => {
        // Check if task is assigned to current user
        const taskAssigneeId =
          task.assignee?.id || task.assignee?._id || task.assignee;
        const normalizedTaskAssigneeId =
          typeof taskAssigneeId === "string"
            ? parseInt(taskAssigneeId)
            : taskAssigneeId;
        const isAssignee = normalizedTaskAssigneeId === normalizedCurrentUserId;

        // Check if user is a collaborator
        const collaborators = task.collaborators || [];
        const isCollaborator = collaborators.some((collab) => {
          const collabId = collab?.id || collab?._id || collab;
          const normalizedCollabId =
            typeof collabId === "string" ? parseInt(collabId) : collabId;
          return normalizedCollabId === normalizedCurrentUserId;
        });

        return isAssignee || isCollaborator;
      });

      setTasks(userAssignedTasks);
      setAllTasks(allPMTasks);
      setLoading(false);

      // Show success message
      setToastMessage("Task created successfully!");
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setToastMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error refreshing tasks after creation:", error);
      setLoading(false);
      setError("Failed to refresh tasks. Please reload the page.");
    }
  };

  // Handle export
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


      const exportData = filteredTasks.map((task) => {
        const assignee = task.assignee;
        const assigneeName = assignee
          ? `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim() ||
            assignee.name ||
            assignee.email ||
            "Unassigned"
          : "Unassigned";

        const project =
          task.projects && task.projects.length > 0 ? task.projects[0] : null;
        const projectName = project?.name || "No Project";

        const collaborators = task.collaborators || [];
        const collaboratorNames = collaborators
          .map(
            (collab) =>
              `${collab.firstName || ""} ${collab.lastName || ""}`.trim() ||
              collab.name ||
              collab.email ||
              "",
          )
          .filter((name) => name)
          .join("; ");

        return {
          "Task Name": task.name || "",
          Status: task.status || "",
          Priority: task.priority || "",
          Assignee: assigneeName,
          Project: projectName,
          Collaborators: collaboratorNames || "None",
          "Due Date": task.scheduledDate
            ? new Date(task.scheduledDate).toLocaleDateString()
            : "",
          "Created Date": task.createdAt
            ? new Date(task.createdAt).toLocaleDateString()
            : "",
          Progress: task.progress ? `${task.progress}%` : "0%",
          Description: task.description || "",
          Notes: task.notes || "",
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
          `tasks_${new Date().toISOString().split("T")[0]}.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setToastMessage(
          `Exported ${exportData.length} task${
            exportData.length !== 1 ? "s" : ""
          } successfully!`,
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
      console.error("Error exporting tasks:", error);
      alert("Failed to export tasks");
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

  // Close subtask dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check each open dropdown individually
      const dropdownsToClose = [];
      Object.keys(expandedSubtasks).forEach((taskId) => {
        const buttonRef = subtaskButtonRefs.current[taskId];
        const dropdownRef = subtaskDropdownRefs.current[taskId];
        const isClickInsideButton =
          buttonRef && buttonRef.contains(event.target);
        const isClickInsideDropdown =
          dropdownRef && dropdownRef.contains(event.target);

        // If click is outside both button and dropdown, mark for closing
        if (!isClickInsideButton && !isClickInsideDropdown) {
          dropdownsToClose.push(taskId);
        }
      });

      // Close dropdowns that were clicked outside of
      if (dropdownsToClose.length > 0) {
        setExpandedSubtasks((prev) => {
          const updated = { ...prev };
          dropdownsToClose.forEach((taskId) => {
            delete updated[taskId];
            delete subtaskDropdownRefs.current[taskId];
          });
          return updated;
        });
      }
    };

    // Only add listener if there are open dropdowns
    if (Object.keys(expandedSubtasks).length > 0) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [expandedSubtasks]);

  // Loading state (including auth loading)
  if (loading || authLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-4 space-y-4">
          <TasksHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setIsFilterModalOpen={setIsFilterModalOpen}
            showExportDropdown={showExportDropdown}
            setShowExportDropdown={setShowExportDropdown}
            exportDropdownRef={exportDropdownRef}
            handleExport={handleExport}
            setIsModalOpen={() => setIsAddTaskModalOpen(true)}
          />
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">
                {authLoading
                  ? "Loading user information..."
                  : "Loading your tasks..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - but still show the page structure
  if (error && tasks.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <div className="p-4 space-y-4">
          <TasksHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setIsFilterModalOpen={setIsFilterModalOpen}
            showExportDropdown={showExportDropdown}
            setShowExportDropdown={setShowExportDropdown}
            exportDropdownRef={exportDropdownRef}
            handleExport={handleExport}
            setIsModalOpen={() => setIsAddTaskModalOpen(true)}
          />
          <div className="space-y-4">
            {/* Stats Overview - show empty stats */}
            <TasksKPIs statusStats={statusStats} />

            {/* Error message */}
            <Card glass={true} className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Error Loading Tasks
                </h2>
                <p className="text-gray-600 mb-4">
                  {error === "Resource not found."
                    ? "No tasks found for your account. You may not have any tasks assigned yet, or there might be an issue with the API connection."
                    : error}
                </p>
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
                    onClick={() => setIsAddTaskModalOpen(true)}
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Create Your First Task
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toast Messages - Outside main flow to prevent layout shifts */}
      {showSuccessMessage && toastMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999] pointer-events-none animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      <div className="space-y-4">
        <div className="p-4 space-y-4 bg-white min-h-screen">
          {/* Page Header */}
          <TasksHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setIsFilterModalOpen={setIsFilterModalOpen}
            showExportDropdown={showExportDropdown}
            setShowExportDropdown={setShowExportDropdown}
            exportDropdownRef={exportDropdownRef}
            handleExport={handleExport}
            setIsModalOpen={() => setIsAddTaskModalOpen(true)}
          />

          <div className="space-y-4">
            {/* Stats Overview */}
            <TasksKPIs statusStats={statusStats} />

            {/* View Toggle */}
            <TasksTabs
              tabItems={tabItems}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeView={activeView}
              setActiveView={setActiveView}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAddClick={() => setIsAddTaskModalOpen(true)}
              onExportClick={handleExport}
              isBulkEditMode={isBulkEditMode}
              onToggleBulkEdit={handleToggleBulkEdit}
            />

            {/* Results Count */}
            <div className="text-sm text-gray-600 px-1">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredTasks.length}
              </span>{" "}
              result{filteredTasks.length !== 1 ? "s" : ""}
            </div>

            {/* Single Horizontal Scroll Container */}
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              {/* Tasks Table/Board */}
              {activeView === "list" && (
                <TasksListView
                  filteredTasks={paginatedTasks}
                  taskColumnsTable={taskColumnsTable}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  setIsModalOpen={() => setIsAddTaskModalOpen(true)}
                  onRowClick={handleTaskClick}
                  selectable={isBulkEditMode}
                  selectedTaskIds={selectedTaskIds}
                  onSelectTask={handleSelectTask}
                  onSelectAll={handleSelectAll}
                  pagination={
                    totalPages > 1 ? (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredTasks.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                      />
                    ) : null
                  }
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
                          <option value="Internal Review">
                            Internal Review
                          </option>
                          <option value="Client Review">Client Review</option>
                          <option value="Approved">Approved</option>
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
              )}
              {activeView === "board" && (
                <Card glass={true}>
                  <TaskKanban
                    tasks={filteredTasks}
                    project={null}
                    onTaskClick={handleTaskClick}
                    onContextMenuOpen={() => {}}
                    onTaskStatusChange={(task, newStatus) => {
                      handleStatusUpdate(task.id, newStatus);
                    }}
                  />
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Task Detail Modal */}
        <TaskDetailModal
          isOpen={taskDetailModal.isOpen}
          onClose={handleTaskDetailClose}
          task={taskDetailModal.task}
          onOpenProject={handleOpenProject}
          onOpenFullPage={handleOpenFullPage}
          onEditTask={handleEditTask}
          onSubtaskClick={(subtaskId) => {
            setTaskDetailModal((prev) => {
              setSubtaskDetailModal({
                isOpen: true,
                subtaskId,
                task: prev.task,
              });
              return { ...prev, isOpen: false };
            });
          }}
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

                // Update task lists immediately with the updated task (real-time update)
                setTasks((prevTasks) =>
                  prevTasks.map((task) =>
                    task.id === taskId ? transformedTask : task,
                  ),
                );

                setAllTasks((prevTasks) =>
                  prevTasks.map((task) =>
                    task.id === taskId ? transformedTask : task,
                  ),
                );

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

        {/* Subtask Detail Modal - replaces task modal when opening a subtask from My Tasks */}
        <SubtaskDetailModal
          isOpen={subtaskDetailModal.isOpen}
          onClose={() =>
            setSubtaskDetailModal({
              isOpen: false,
              subtaskId: null,
              task: null,
            })
          }
          subtaskId={subtaskDetailModal.subtaskId}
          task={subtaskDetailModal.task}
          onTaskRefresh={async () => {
            if (subtaskDetailModal.task?.id) {
              const taskId = subtaskDetailModal.task.id;
              try {
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
                setTasks((prev) =>
                  prev.map((t) => (t.id === taskId ? transformedTask : t)),
                );
                setAllTasks((prev) =>
                  prev.map((t) => (t.id === taskId ? transformedTask : t)),
                );
                setSubtaskDetailModal((prev) =>
                  prev.task?.id === taskId
                    ? { ...prev, task: transformedTask }
                    : prev,
                );
              } catch (err) {
                console.error("Error refreshing after subtask update:", err);
              }
            }
          }}
          onNavigateToSubtask={(subtaskId) =>
            setSubtaskDetailModal((prev) => ({ ...prev, subtaskId }))
          }
          onNavigateToTask={() => {
            setSubtaskDetailModal((prev) => {
              setTaskDetailModal({ isOpen: true, task: prev.task });
              return { isOpen: false, subtaskId: null, task: null };
            });
          }}
        />

        {/* Collaborator Modal */}
        <CollaboratorModal
          isOpen={collaboratorModal.isOpen}
          onClose={() => setCollaboratorModal({ isOpen: false, task: null })}
          task={collaboratorModal.task}
          onUpdate={async (updatedTask) => {
            // Update both tasks and allTasks states
            setTasks((prevTasks) =>
              prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
            );
            setAllTasks((prevTasks) =>
              prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
            );

            // Also update taskDetailModal if it's showing the same task
            if (taskDetailModal.task?.id === updatedTask.id) {
              setTaskDetailModal((prev) => ({
                ...prev,
                task: updatedTask,
              }));
            }
          }}
        />

        {/* Delete Confirmation Modal */}
        <TaskDeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, task: null })}
          onConfirm={async () => {
            if (deleteModal.task) {
              try {
                // Handle bulk delete
                if (deleteModal.task.bulkDelete && deleteModal.task.taskIds) {
                  const taskIds = deleteModal.task.taskIds;
                  await Promise.all(
                    taskIds.map((taskId) => taskService.deleteTask(taskId)),
                  );
                  setTasks((prevTasks) =>
                    prevTasks.filter((task) => !taskIds.includes(task.id)),
                  );
                  setAllTasks((prevTasks) =>
                    prevTasks.filter((task) => !taskIds.includes(task.id)),
                  );
                  setSelectedTaskIds([]);
                } else if (deleteModal.task.id) {
                  // Single task delete
                  await taskService.deleteTask(deleteModal.task.id);
                  setTasks((prevTasks) =>
                    prevTasks.filter((task) => task.id !== deleteModal.task.id),
                  );
                  setAllTasks((prevTasks) =>
                    prevTasks.filter((task) => task.id !== deleteModal.task.id),
                  );
                }
                setDeleteModal({ isOpen: false, task: null });
              } catch (error) {
                console.error("Error deleting task:", error);
              }
            }
          }}
          taskName={
            deleteModal.task?.bulkDelete
              ? `${deleteModal.task.taskIds?.length || 0} tasks`
              : deleteModal.task?.name || ""
          }
        />

        {/* Add Task Modal */}
        <AddTaskModal
          isOpen={isAddTaskModalOpen}
          onClose={() => setIsAddTaskModalOpen(false)}
          onTaskCreated={handleTaskCreated}
        />

        {/* Filter Modal */}
        <TasksFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilters={(filters) => setAppliedFilters(filters)}
          users={users}
          projects={projects}
          appliedFilters={appliedFilters}
        />
      </div>
    </>
  );
}
