"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Share2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquare,
  Activity,
  GitBranch,
  Flag,
  Tag,
  Plus,
  X,
  ChevronDown,
  Paperclip,
  Link as LinkIcon,
  Check,
  Eye,
  Trash2,
  Search,
  Filter,
} from "lucide-react";
import confetti from "canvas-confetti";
import PageHeader from "../../../components/shared/PageHeader";
import taskService from "../../../lib/taskService";
import commentService from "../../../lib/commentService";
import projectService from "../../../lib/projectService";
import apiClient from "../../../lib/apiClient";
import {
  transformTask,
  transformComment,
  transformProject,
  formatDate,
} from "../../../lib/dataTransformers";
import CommentsSection from "../../../components/shared/CommentsSection";
import CollaboratorModal from "../../../components/my-task/CollaboratorModal";
import ProjectSelector from "../../../components/my-task/ProjectSelector";
import SubtasksFilterModal from "../../../components/my-task/SubtasksFilterModal";
import { Table, Button } from "../../../components/ui";
import subtaskService from "../../../lib/subtaskService";
import {
  transformSubtask,
  transformStatusToStrapi,
  transformPriorityToStrapi,
} from "../../../lib/dataTransformers";
import SubtaskDetailModal from "../../../components/shared/SubtaskDetailModal";

export default function TaskDetailPage({ params: paramsProp }) {
  const router = useRouter();
  const paramsFromHook = useParams();
  const [params, setParams] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [task, setTask] = useState(null);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [collaboratorModal, setCollaboratorModal] = useState({
    isOpen: false,
    task: null,
    subtask: null, // Track if this is for a subtask
  });
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [linkCopied, setLinkCopied] = useState(false);

  // Subtask table state
  const [subtaskSearchQuery, setSubtaskSearchQuery] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskName, setEditingSubtaskName] = useState("");
  const [subtaskDetailModal, setSubtaskDetailModal] = useState({
    isOpen: false,
    subtaskId: null,
  });
  const [showAddSubtaskModal, setShowAddSubtaskModal] = useState(false);
  const [showSubtasksFilterModal, setShowSubtasksFilterModal] = useState(false);
  const [subtaskFilters, setSubtaskFilters] = useState({
    sortBy: "",
    sortOrder: "asc",
    assignee: "",
    createdDateFrom: "",
    createdDateTo: "",
    dueDateFrom: "",
    dueDateTo: "",
  });
  const [newSubtaskData, setNewSubtaskData] = useState({
    title: "",
    assignee: null, // Single assignee
    collaborators: [], // Multiple collaborators
    dueDate: "",
    status: "SCHEDULED",
    priority: "MEDIUM",
  });

  // Handle params (can be Promise in Next.js 15+)
  useEffect(() => {
    const resolveParams = async () => {
      if (paramsProp instanceof Promise) {
        const resolved = await paramsProp;
        setParams(resolved);
      } else if (paramsProp) {
        setParams(paramsProp);
      } else if (paramsFromHook) {
        setParams(paramsFromHook);
      }
    };
    resolveParams();
  }, [paramsProp, paramsFromHook]);

  // Load task data
  useEffect(() => {
    const loadTask = async () => {
      if (!params?.slug && !params?.id) return;

      // Try to parse as ID first (numeric slug)
      const taskId = params?.id || params?.slug;
      let parsedId;

      try {
        setIsLoading(true);
        setError(null);

        parsedId = parseInt(taskId, 10);

        if (isNaN(parsedId)) {
          throw new Error("Invalid task ID");
        }

        // Fetch task with essential relations only (simplified)
        // Use "projects" (plural) to match the schema
        const fullTaskData = await taskService.getTaskById(parsedId, [
          "projects",
          "assignee",
          "createdBy",
          "collaborators",
        ]);

        // Transform to frontend format
        const transformedTask = transformTask(fullTaskData);

        // Format due date for display
        const formattedDueDate = transformedTask.scheduledDate
          ? formatDate(transformedTask.scheduledDate)
          : "No due date";

        // Fetch comments for this task
        let commentsData = [];
        try {
          const commentsResponse =
            await commentService.getTaskComments(parsedId);
          commentsData = commentsResponse.data?.map(transformComment) || [];
        } catch (commentError) {
          console.error("Error fetching comments:", commentError);
        }

        // Load subtasks separately to avoid nested populate issues
        // IMPORTANT: Include both assignee and collaborators
        let subtasksData = [];
        try {
          const subtasksResponse = await subtaskService.getRootSubtasksByTask(
            parsedId,
            {
              populate: ["assignee", "collaborators", "childSubtasks"],
            },
          );
          let rawSubtasks = [];
          if (Array.isArray(subtasksResponse.data)) {
            rawSubtasks = subtasksResponse.data;
          } else if (
            subtasksResponse.data?.data &&
            Array.isArray(subtasksResponse.data.data)
          ) {
            rawSubtasks = subtasksResponse.data.data;
          } else if (Array.isArray(subtasksResponse)) {
            rawSubtasks = subtasksResponse;
          }
          subtasksData = rawSubtasks.map(transformSubtask).filter(Boolean);
        } catch (subtaskError) {
          console.error("Error fetching subtasks:", subtaskError);
        }

        const taskForPage = {
          ...transformedTask,
          dueDate: formattedDueDate,
          description: transformedTask.description || "",
          subtasks: subtasksData,
          comments: commentsData,
        };

        setTask(taskForPage);
        setIsComplete(
          taskForPage.status === "Done" ||
            taskForPage.status === "COMPLETED" ||
            taskForPage.status?.toLowerCase() === "done",
        );
        setEditedDescription(taskForPage.description || "");

        // TODO: Fetch activities when available
        setActivities([]);
      } catch (error) {
        console.error("Error loading task:", error);
        console.error("Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack,
          taskId: parsedId || taskId || "unknown",
          params: params,
        });

        // Provide more helpful error messages
        let errorMessage =
          error.message || "Failed to load task. Please try again.";

        if (
          error.message?.includes("Network error") ||
          error.message?.includes("Failed to fetch") ||
          error.message?.includes("Cannot connect")
        ) {
          errorMessage =
            "Cannot connect to backend server. Please check: 1. The Strapi backend is running on http://localhost:1337 2. CORS is configured correctly 3. Check browser console for more details";
        } else if (
          error.message?.includes("Invalid key") ||
          error.message?.includes("Cannot create property")
        ) {
          errorMessage =
            "Backend configuration error. Please ensure Strapi backend has been restarted after recent changes.";
        } else if (error.message?.includes("Invalid task ID")) {
          errorMessage = "Invalid task ID. Please check the URL and try again.";
        } else if (
          error.message?.includes("not found") ||
          error.message?.includes("404")
        ) {
          errorMessage =
            "Task not found. The task you're looking for doesn't exist.";
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (params?.slug || params?.id) {
      loadTask();
    }
  }, [params]);

  // Load projects and users
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsResponse, usersResponse] = await Promise.all([
          projectService.getAllProjects({ pageSize: 100 }),
          apiClient.get("/api/xtrawrkx-users", {
            "pagination[pageSize]": 100,
            "filters[isActive][$eq]": "true",
          }),
        ]);

        const transformedProjects =
          projectsResponse.data?.map(transformProject) || [];
        setProjects(transformedProjects);

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
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  const getStatusColor = (status) => {
    const statusLower = (status || "To Do")?.toLowerCase().replace(/\s+/g, "-");

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

    const colors = statusColors[statusLower] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-400",
    };

    return `${colors.bg} ${colors.text} ${colors.border}`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
      case "High":
        return "bg-red-100 text-red-700 border-red-200";
      case "MEDIUM":
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "LOW":
      case "Low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getAssigneeAvatar = (assignee) => {
    if (assignee) {
      const name = typeof assignee === "object" ? assignee?.name : assignee;
      const initials = name
        ? name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "??";
      return {
        initials,
        color: "bg-blue-500",
      };
    }
    return {
      initials: "??",
      color: "bg-gray-500",
    };
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    const newStatus = isComplete ? "To Do" : "Done";
    const isMarkingComplete = !isComplete;

    try {
      await taskService.updateTask(task.id, {
        status: newStatus,
      });
      setIsComplete(!isComplete);

      // Show confetti when marking as complete
      if (isMarkingComplete) {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 99999,
        };

        function randomInRange(min, max) {
          return Math.random() * (max - min) + min;
        }

        // Update all canvas elements to have high z-index
        const updateCanvasZIndex = () => {
          const canvases = document.querySelectorAll("canvas");
          canvases.forEach((canvas) => {
            // Check if it's a confetti canvas (usually has specific dimensions)
            if (canvas.width > 0 && canvas.height > 0) {
              canvas.style.zIndex = "99999";
              canvas.style.position = "fixed";
              canvas.style.top = "0";
              canvas.style.left = "0";
              canvas.style.pointerEvents = "none";
            }
          });
        };

        const interval = setInterval(function () {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);

          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          });
          confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          });

          // Update z-index after confetti is created
          requestAnimationFrame(updateCanvasZIndex);
        }, 250);

        // Update z-index immediately and continuously
        const zIndexInterval = setInterval(() => {
          updateCanvasZIndex();
        }, 50);

        // Clear z-index update interval when confetti ends
        setTimeout(() => {
          clearInterval(zIndexInterval);
        }, duration + 100);
      }

      // Reload task to get updated status
      const fullTaskData = await taskService.getTaskById(task.id, [
        "projects",
        "assignee",
        "createdBy",
        "collaborators",
      ]);
      const transformedTask = transformTask(fullTaskData);
      setTask({ ...task, ...transformedTask, status: newStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleDescriptionSave = async () => {
    if (!task) return;
    try {
      await taskService.updateTask(task.id, {
        description: editedDescription,
      });
      setIsEditingDescription(false);
      setTask({ ...task, description: editedDescription });
    } catch (error) {
      console.error("Error updating description:", error);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!task) return;
    try {
      const strapiStatus = transformStatusToStrapi(newStatus);
      await taskService.updateTask(task.id, {
        status: strapiStatus,
      });
      setTask({ ...task, status: newStatus });
      setIsComplete(
        newStatus === "Done" ||
          newStatus === "COMPLETED" ||
          newStatus?.toLowerCase() === "done",
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handlePriorityUpdate = async (newPriority) => {
    if (!task) return;
    try {
      await taskService.updateTask(task.id, {
        priority: newPriority,
      });
      setTask({ ...task, priority: newPriority });
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const handleDueDateUpdate = async (newDate) => {
    if (!task) return;
    try {
      const dateValue = newDate ? new Date(newDate).toISOString() : null;
      await taskService.updateTask(task.id, {
        scheduledDate: dateValue,
      });
      const formattedDate = newDate ? formatDate(dateValue) : "No due date";
      setTask({ ...task, scheduledDate: dateValue, dueDate: formattedDate });
    } catch (error) {
      console.error("Error updating due date:", error);
    }
  };

  const handleAssigneeUpdate = async (newAssigneeId) => {
    if (!task) return;
    try {
      await taskService.updateTask(task.id, {
        assignee: newAssigneeId || null,
      });

      // Reload task to get updated assignee with full data
      const fullTaskData = await taskService.getTaskById(task.id, [
        "projects",
        "assignee",
        "createdBy",
        "collaborators",
      ]);
      const transformedTask = transformTask(fullTaskData);
      setTask({ ...task, ...transformedTask });
    } catch (error) {
      console.error("Error updating assignee:", error);
    }
  };

  const handleEditTask = () => {
    router.push(`/my-task/${task.id}/edit`);
  };

  const handleShareTask = () => {
    setCollaboratorModal({ isOpen: true });
  };

  const handleCopyTaskLink = async () => {
    try {
      const taskUrl = `${window.location.origin}/my-task/${task.id}`;
      await navigator.clipboard.writeText(taskUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      alert("Failed to copy link. Please try again.");
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setAttachedFiles((prev) => [...prev, ...files]);
    // TODO: Upload files to backend
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Subtask handlers
  const handleSubtaskStatusUpdate = async (subtaskId, newStatus) => {
    if (!task) return;
    try {
      await subtaskService.updateSubtaskStatus(
        subtaskId,
        transformStatusToStrapi(newStatus),
      );
      // Reload task to get updated subtasks
      const fullTaskData = await taskService.getTaskById(task.id, [
        "projects",
        "assignee",
        "createdBy",
        "subtasks",
        "subtasks.assignee",
        "subtasks.childSubtasks",
        "collaborators",
      ]);
      const transformedTask = transformTask(fullTaskData);
      setTask({
        ...task,
        ...transformedTask,
        subtasks: transformedTask.subtasks || [],
      });
    } catch (error) {
      console.error("Error updating subtask status:", error);
    }
  };

  const handleSubtaskPriorityUpdate = async (subtaskId, newPriority) => {
    if (!task) return;
    try {
      await subtaskService.updateSubtask(subtaskId, {
        priority: transformPriorityToStrapi(newPriority),
      });
      // Reload task to get updated subtasks
      const fullTaskData = await taskService.getTaskById(task.id, [
        "projects",
        "assignee",
        "createdBy",
        "subtasks",
        "subtasks.assignee",
        "subtasks.childSubtasks",
        "collaborators",
      ]);
      const transformedTask = transformTask(fullTaskData);
      setTask({
        ...task,
        ...transformedTask,
        subtasks: transformedTask.subtasks || [],
      });
    } catch (error) {
      console.error("Error updating subtask priority:", error);
    }
  };

  const handleSubtaskDueDateUpdate = async (subtaskId, newDate) => {
    if (!task) return;
    try {
      const dueDate = newDate
        ? new Date(newDate + "T00:00:00").toISOString()
        : null;
      await subtaskService.updateSubtask(subtaskId, {
        dueDate: dueDate,
      });
      // Reload task to get updated subtasks
      const fullTaskData = await taskService.getTaskById(task.id, [
        "projects",
        "assignee",
        "createdBy",
        "subtasks",
        "subtasks.assignee",
        "subtasks.childSubtasks",
        "collaborators",
      ]);
      const transformedTask = transformTask(fullTaskData);
      setTask({
        ...task,
        ...transformedTask,
        subtasks: transformedTask.subtasks || [],
      });
    } catch (error) {
      console.error("Error updating subtask due date:", error);
    }
  };

  const handleSubtaskClick = (subtask) => {
    setSubtaskDetailModal({
      isOpen: true,
      subtaskId: subtask.id,
    });
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!task) return;
    if (!confirm("Are you sure you want to delete this subtask?")) return;
    try {
      await subtaskService.deleteSubtask(subtaskId);
      // Reload task to get updated subtasks
      const fullTaskData = await taskService.getTaskById(task.id, [
        "projects",
        "assignee",
        "createdBy",
        "subtasks",
        "subtasks.assignee",
        "subtasks.childSubtasks",
        "collaborators",
      ]);
      const transformedTask = transformTask(fullTaskData);
      setTask({
        ...task,
        ...transformedTask,
        subtasks: transformedTask.subtasks || [],
      });
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  };

  // Get root subtasks (no parent)
  const rootSubtasks = (task?.subtasks || []).filter((st) => {
    return (
      !st.parentSubtask ||
      st.parentSubtask === null ||
      (typeof st.parentSubtask === "object" && !st.parentSubtask.id)
    );
  });

  // Check if any filters are active
  const hasActiveFilters = () => {
    return !!(
      subtaskFilters.sortBy ||
      subtaskFilters.assignee ||
      subtaskFilters.createdDateFrom ||
      subtaskFilters.createdDateTo ||
      subtaskFilters.dueDateFrom ||
      subtaskFilters.dueDateTo
    );
  };

  // Get active filter labels for display
  const getActiveFilterLabels = () => {
    const labels = [];

    if (subtaskFilters.sortBy) {
      const sortLabels = {
        assignee: "Assignee",
        createdAt: "Created Date",
        dueDate: "Deadline",
        name: "Name",
        status: "Status",
        priority: "Priority",
      };
      const orderLabel =
        subtaskFilters.sortOrder === "desc" ? " (Desc)" : " (Asc)";
      labels.push(
        `Sort: ${sortLabels[subtaskFilters.sortBy] || subtaskFilters.sortBy}${orderLabel}`,
      );
    }

    if (subtaskFilters.assignee) {
      const assignee = users.find(
        (u) =>
          String(u.id || u._id || u.documentId) === subtaskFilters.assignee,
      );
      const assigneeName = assignee
        ? `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim() ||
          assignee.name ||
          assignee.email
        : "Unknown";
      labels.push(`Assignee: ${assigneeName}`);
    }

    if (subtaskFilters.createdDateFrom || subtaskFilters.createdDateTo) {
      const from = subtaskFilters.createdDateFrom || "Any";
      const to = subtaskFilters.createdDateTo || "Any";
      labels.push(`Created: ${from} to ${to}`);
    }

    if (subtaskFilters.dueDateFrom || subtaskFilters.dueDateTo) {
      const from = subtaskFilters.dueDateFrom || "Any";
      const to = subtaskFilters.dueDateTo || "Any";
      labels.push(`Deadline: ${from} to ${to}`);
    }

    return labels;
  };

  // Clear a specific filter
  const clearFilter = (filterKey) => {
    setSubtaskFilters((prev) => {
      const newFilters = { ...prev };
      if (filterKey === "sortBy") {
        newFilters.sortBy = "";
        newFilters.sortOrder = "asc";
      } else {
        newFilters[filterKey] = "";
      }
      return newFilters;
    });
  };

  // Filter and sort subtasks
  const filteredAndSortedSubtasks = rootSubtasks
    .filter((subtask) => {
      // Search filter
      if (subtaskSearchQuery.trim()) {
        const query = subtaskSearchQuery.toLowerCase();
        const name = (subtask.name || subtask.title || "").toLowerCase();
        const assigneeName =
          typeof subtask.assignee === "object"
            ? (subtask.assignee?.name || "").toLowerCase()
            : (subtask.assignee || "").toLowerCase();
        if (!name.includes(query) && !assigneeName.includes(query)) {
          return false;
        }
      }

      // Assignee filter
      if (subtaskFilters.assignee) {
        const assigneeId =
          typeof subtask.assignee === "object"
            ? (
                subtask.assignee?.id ||
                subtask.assignee?._id ||
                subtask.assignee?.documentId
              )?.toString()
            : subtask.assignee?.toString();
        if (assigneeId !== subtaskFilters.assignee) {
          return false;
        }
      }

      // Created date filter
      if (subtaskFilters.createdDateFrom || subtaskFilters.createdDateTo) {
        const createdAt = subtask.createdAt
          ? new Date(subtask.createdAt)
          : null;
        if (!createdAt) return false;

        if (subtaskFilters.createdDateFrom) {
          const fromDate = new Date(subtaskFilters.createdDateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (createdAt < fromDate) return false;
        }

        if (subtaskFilters.createdDateTo) {
          const toDate = new Date(subtaskFilters.createdDateTo);
          toDate.setHours(23, 59, 59, 999);
          if (createdAt > toDate) return false;
        }
      }

      // Due date filter
      if (subtaskFilters.dueDateFrom || subtaskFilters.dueDateTo) {
        const dueDate = subtask.dueDate ? new Date(subtask.dueDate) : null;
        if (!dueDate) return false;

        if (subtaskFilters.dueDateFrom) {
          const fromDate = new Date(subtaskFilters.dueDateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (dueDate < fromDate) return false;
        }

        if (subtaskFilters.dueDateTo) {
          const toDate = new Date(subtaskFilters.dueDateTo);
          toDate.setHours(23, 59, 59, 999);
          if (dueDate > toDate) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (!subtaskFilters.sortBy) return 0;

      const sortOrder = subtaskFilters.sortOrder === "desc" ? -1 : 1;

      switch (subtaskFilters.sortBy) {
        case "assignee": {
          const assigneeA =
            typeof a.assignee === "object"
              ? (
                  a.assignee?.name ||
                  `${a.assignee?.firstName || ""} ${a.assignee?.lastName || ""}`.trim() ||
                  ""
                ).toLowerCase()
              : (a.assignee || "").toString().toLowerCase();
          const assigneeB =
            typeof b.assignee === "object"
              ? (
                  b.assignee?.name ||
                  `${b.assignee?.firstName || ""} ${b.assignee?.lastName || ""}`.trim() ||
                  ""
                ).toLowerCase()
              : (b.assignee || "").toString().toLowerCase();
          return assigneeA.localeCompare(assigneeB) * sortOrder;
        }
        case "createdAt": {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return (dateA - dateB) * sortOrder;
        }
        case "dueDate": {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return (dateA - dateB) * sortOrder;
        }
        case "name": {
          const nameA = (a.name || a.title || "").toLowerCase();
          const nameB = (b.name || b.title || "").toLowerCase();
          return nameA.localeCompare(nameB) * sortOrder;
        }
        case "status": {
          const statusA = (a.status || "").toLowerCase();
          const statusB = (b.status || "").toLowerCase();
          return statusA.localeCompare(statusB) * sortOrder;
        }
        case "priority": {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityA =
            priorityOrder[(a.priority || "").toLowerCase()] || 0;
          const priorityB =
            priorityOrder[(b.priority || "").toLowerCase()] || 0;
          return (priorityB - priorityA) * sortOrder;
        }
        default:
          return 0;
      }
    });

  // Transform subtasks for table
  const transformedSubtasks = filteredAndSortedSubtasks
    .map((st) => transformSubtask(st))
    .filter(Boolean);

  const tabItems = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "subtasks", label: "Subtasks", icon: GitBranch },
    { key: "comments", label: "Comments", icon: MessageSquare },
    { key: "activity", label: "Activity", icon: Activity },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error ? "Error Loading Task" : "Task not found"}
          </h2>
          <div className="text-gray-600 mb-4 max-w-md mx-auto">
            {error ? (
              <div className="space-y-1 text-sm text-left">
                {error.includes("1. The Strapi") ? (
                  <>
                    <p className="font-medium mb-2">
                      Cannot connect to backend server. Please check:
                    </p>
                    <ul className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        The Strapi backend is running on http://localhost:1337
                      </li>
                      <li>CORS is configured correctly</li>
                      <li>Check browser console for more details</li>
                    </ul>
                  </>
                ) : (
                  <p>{error}</p>
                )}
              </div>
            ) : (
              <p>The task you&apos;re looking for doesn&apos;t exist.</p>
            )}
          </div>
          <button
            onClick={() => router.push("/my-task")}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  const assigneeAvatar = getAssigneeAvatar(task.assignee);

  // Subtask columns configuration
  const subtaskColumnsTable = [
    {
      key: "name",
      label: "SUBTASK NAME",
      render: (_, subtask) => {
        const isDone =
          subtask.status?.toLowerCase() === "done" ||
          subtask.status?.toLowerCase() === "completed";
        const isEditing = editingSubtaskId === subtask.id;

        const handleNameClick = (e) => {
          e.stopPropagation();
          setEditingSubtaskId(subtask.id);
          setEditingSubtaskName(subtask.name || subtask.title || "");
        };

        const handleNameBlur = async () => {
          if (editingSubtaskId === subtask.id) {
            const newName = editingSubtaskName.trim();
            if (newName && newName !== (subtask.name || subtask.title)) {
              try {
                await subtaskService.updateSubtask(subtask.id, {
                  title: newName,
                });
                // Reload task
                const fullTaskData = await taskService.getTaskById(task.id, [
                  "projects",
                  "assignee",
                  "createdBy",
                  "subtasks",
                  "subtasks.assignee",
                  "subtasks.collaborators",
                  "subtasks.childSubtasks",
                  "collaborators",
                ]);
                const transformedTask = transformTask(fullTaskData);
                setTask({
                  ...task,
                  ...transformedTask,
                  subtasks: transformedTask.subtasks || [],
                });
              } catch (error) {
                console.error("Error updating subtask name:", error);
              }
            }
            setEditingSubtaskId(null);
            setEditingSubtaskName("");
          }
        };

        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubtaskStatusUpdate(
                  subtask.id,
                  isDone ? "To Do" : "Done",
                );
              }}
              className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                isDone
                  ? "bg-green-500 border-green-500 text-white hover:bg-green-600"
                  : "border-gray-300 hover:border-green-500 hover:bg-green-50 cursor-pointer"
              }`}
            >
              {isDone && <Check className="w-4 h-4 stroke-[3]" />}
            </button>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editingSubtaskName}
                  onChange={(e) => setEditingSubtaskName(e.target.value)}
                  onBlur={handleNameBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleNameBlur();
                    } else if (e.key === "Escape") {
                      setEditingSubtaskId(null);
                      setEditingSubtaskName("");
                    }
                  }}
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
                    title="Click to edit subtask name"
                  >
                    {subtask.name || subtask.title}
                  </div>
                  {(() => {
                    const childCount =
                      subtask.childSubtasks?.length ||
                      subtask.subtasks?.length ||
                      0;
                    if (childCount > 0) {
                      return (
                        <div
                          className="flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                          title={`${childCount} ${
                            childCount === 1 ? "subtask" : "subtasks"
                          }`}
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">
                            {childCount}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
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
      render: (_, subtask) => {
        // Support both single assignee and multiple collaborators (similar to my-task page)
        const assignee = subtask.assignee;

        // Check if assignee is a valid user object (not null and has identifying properties)
        const hasAssignee =
          assignee &&
          (assignee.id ||
            assignee._id ||
            assignee.firstName ||
            assignee.lastName ||
            assignee.name ||
            assignee.email);

        // Get collaborators - prefer subtask.collaborators array, include assignee if not already in collaborators
        let collaborators = [];
        if (
          subtask.collaborators &&
          Array.isArray(subtask.collaborators) &&
          subtask.collaborators.length > 0
        ) {
          // Filter out null/undefined collaborators and ensure they have valid data
          collaborators = subtask.collaborators.filter(
            (c) =>
              c &&
              (c.id || c._id || c.firstName || c.lastName || c.name || c.email),
          );
        }

        // If we have an assignee, add it to collaborators if not already there
        if (hasAssignee) {
          const assigneeInCollaborators = collaborators.find(
            (c) => c?.id === assignee?.id || c?._id === assignee?._id,
          );
          if (!assigneeInCollaborators) {
            // Add assignee at the beginning
            collaborators = [assignee, ...collaborators];
          }
        }

        // If no collaborators but we have assignee, use assignee
        if (collaborators.length === 0 && hasAssignee) {
          collaborators = [assignee];
        }

        const hasCollaborators = collaborators.length > 0;

        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // For subtasks, we need to manage subtask collaborators, not task collaborators
              setCollaboratorModal({
                isOpen: true,
                task: task, // Keep parent task reference for context
                subtask: subtask, // Mark this as a subtask operation
              });
            }}
            className="flex items-center gap-2 min-w-[140px] hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors text-left"
          >
            {hasCollaborators ? (
              <div className="flex items-center gap-1">
                {/* Show up to 3 avatars, then show count (exactly like my-task page) */}
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
                          "Unknown")
                    : `${collaborators.length} people`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                  U
                </div>
                <span className="text-sm text-gray-600 truncate">
                  Click to assign
                </span>
              </div>
            )}
          </button>
        );
      },
    },
    {
      key: "dueDate",
      label: "DUE DATE",
      render: (_, subtask) => {
        const getDateValue = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const currentValue = getDateValue(
          subtask.dueDate || subtask.scheduledDate,
        );

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
                handleSubtaskDueDateUpdate(subtask.id, e.target.value);
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
      render: (_, subtask) => {
        const statusOptions = [
          { value: "To Do", label: "To Do" },
          { value: "In Progress", label: "In Progress" },
          { value: "Internal Review", label: "Internal Review" },
          { value: "Client Review", label: "Client Review" },
          { value: "Approved", label: "Approved" },
          { value: "Done", label: "Done" },
          { value: "Cancelled", label: "Cancelled" },
        ];

        const currentStatus = subtask.status || "To Do";
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
                handleSubtaskStatusUpdate(subtask.id, e.target.value);
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
      render: (_, subtask) => {
        const priorityOptions = [
          { value: "Low", label: "Low" },
          { value: "Medium", label: "Medium" },
          { value: "High", label: "High" },
        ];

        const currentPriority = subtask.priority || "Medium";
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
                handleSubtaskPriorityUpdate(subtask.id, e.target.value);
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
      key: "progress",
      label: "PROGRESS",
      render: (_, subtask) => {
        const progress = subtask.progress || 0;
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-700 min-w-[3rem]">
              {progress}%
            </span>
          </div>
        );
      },
    },
    {
      key: "createdAt",
      label: "CREATED AT",
      render: (_, subtask) => (
        <div className="flex items-center gap-2 text-sm text-gray-700 min-w-[140px]">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {subtask.createdAt ? formatDate(subtask.createdAt) : "N/A"}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      label: "ACTIONS",
      render: (_, subtask) => {
        return (
          <div className="flex items-center gap-2 min-w-[100px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubtaskClick(subtask);
              }}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSubtask(subtask.id);
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete subtask"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 space-y-4">
        <PageHeader
          title={task.name}
          subtitle={`${
            task.projects && task.projects.length > 0
              ? task.projects.map((p) => p.name).join(", ")
              : task.project?.name || "No Project"
          } • ${task.status || "Unknown Status"}`}
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "My Tasks", href: "/my-task" },
            {
              label: task.name,
              href: `/my-task/${task.id}`,
            },
          ]}
          showProfile={true}
          actions={[
            {
              icon: Edit,
              onClick: handleEditTask,
              className: "",
              title: "Edit Task",
            },
            {
              icon: linkCopied ? Check : LinkIcon,
              onClick: handleCopyTaskLink,
              className: linkCopied ? "text-green-600" : "",
              title: linkCopied ? "Link Copied!" : "Copy Task Link",
            },
            {
              icon: Share2,
              onClick: handleShareTask,
              className: "",
              title: "Share Task",
            },
          ]}
        />

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-2 shadow-lg">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  activeTab === tab.key
                    ? "bg-orange-500 text-white shadow-lg"
                    : "bg-transparent text-gray-700 hover:bg-white/50"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Task Details, Description, Attachments */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Details Card */}
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                {/* Mark Complete Bar */}
                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <button
                    onClick={handleToggleComplete}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isComplete
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-green-500"
                    }`}
                  >
                    {isComplete && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <span className="text-sm text-gray-700 font-medium">
                    {isComplete ? "Task completed" : "Mark as complete"}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Task Details
                </h3>
                <div className="space-y-3">
                  {/* Assignee */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <label className="text-sm font-medium text-gray-700 w-28 flex-shrink-0">
                      Assignee
                    </label>
                    <div className="flex-1 flex items-center gap-2 justify-end">
                      {editingField === "assignee" ? (
                        <select
                          value={editingValue || ""}
                          onChange={(e) => {
                            handleAssigneeUpdate(e.target.value);
                            setEditingField(null);
                          }}
                          onBlur={() => setEditingField(null)}
                          autoFocus
                          className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Unassigned</option>
                          {users.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <>
                          <div
                            className={`w-8 h-8 ${assigneeAvatar.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                          >
                            {assigneeAvatar.initials}
                          </div>
                          <span
                            className="text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                            onClick={() => {
                              setEditingValue(
                                task.assignee?.id?.toString() || "",
                              );
                              setEditingField("assignee");
                            }}
                          >
                            {typeof task.assignee === "object"
                              ? task.assignee?.name || "Unassigned"
                              : task.assignee || "Unassigned"}
                          </span>
                          {task.assignee && (
                            <button
                              onClick={() => handleAssigneeUpdate(null)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingValue(
                                task.assignee?.id?.toString() || "",
                              );
                              setEditingField("assignee");
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <label className="text-sm font-medium text-gray-700 w-28 flex-shrink-0">
                      Due date
                    </label>
                    <div className="flex-1 flex items-center gap-2 justify-end">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {editingField === "dueDate" ? (
                        <input
                          type="date"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => {
                            handleDueDateUpdate(editingValue);
                            setEditingField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleDueDateUpdate(editingValue);
                              setEditingField(null);
                            } else if (e.key === "Escape") {
                              setEditingField(null);
                            }
                          }}
                          autoFocus
                          className="text-sm text-gray-900 px-2 py-1 rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <>
                          <span
                            className="text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded"
                            onClick={() => {
                              const dateValue = task.scheduledDate
                                ? new Date(task.scheduledDate)
                                    .toISOString()
                                    .split("T")[0]
                                : "";
                              setEditingValue(dateValue);
                              setEditingField("dueDate");
                            }}
                          >
                            {task.dueDate || "No due date"}
                          </span>
                          {task.dueDate && (
                            <button
                              onClick={() => handleDueDateUpdate(null)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <X className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <label className="text-sm font-medium text-gray-700 w-28 flex-shrink-0">
                      Status
                    </label>
                    <div className="flex-1 flex justify-end">
                      {editingField === "status" ? (
                        <select
                          value={editingValue}
                          onChange={(e) => {
                            handleStatusUpdate(e.target.value);
                            setEditingField(null);
                          }}
                          onBlur={() => setEditingField(null)}
                          autoFocus
                          className={`px-3 py-1.5 rounded-lg border-2 font-bold text-xs text-center shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                            editingValue,
                          )}`}
                        >
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
                      ) : (
                        <span
                          onClick={() => {
                            setEditingValue(task.status || "To Do");
                            setEditingField("status");
                          }}
                          className={`inline-block px-3 py-1.5 rounded-lg border-2 font-bold text-xs uppercase cursor-pointer hover:shadow-md transition-all ${getStatusColor(
                            task.status,
                          )}`}
                        >
                          {task.status || "To Do"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <label className="text-sm font-medium text-gray-700 w-28 flex-shrink-0">
                      Priority
                    </label>
                    <div className="flex-1 flex items-center gap-2 justify-end">
                      <Flag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      {editingField === "priority" ? (
                        <select
                          value={editingValue}
                          onChange={(e) => {
                            handlePriorityUpdate(e.target.value);
                            setEditingField(null);
                          }}
                          onBlur={() => setEditingField(null)}
                          autoFocus
                          className={`px-3 py-1.5 rounded-lg border-2 font-bold text-xs text-center shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(
                            editingValue,
                          )}`}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingValue(task.priority || "Medium");
                            setEditingField("priority");
                          }}
                          className={`inline-block px-3 py-1.5 rounded-lg border-2 font-bold text-xs uppercase cursor-pointer hover:shadow-md transition-all ${getPriorityColor(
                            task.priority,
                          )}`}
                        >
                          {task.priority || "Medium"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Project */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <label className="text-sm font-medium text-gray-700 w-28 flex-shrink-0">
                      Project
                    </label>
                    <div className="flex-1 flex items-center justify-end">
                      <ProjectSelector
                        task={task}
                        projects={projects}
                        onUpdate={(updatedTask) => {
                          setTask(updatedTask);
                        }}
                      />
                    </div>
                  </div>

                  {/* Collaborators */}
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <label className="text-sm font-medium text-gray-700 w-28 flex-shrink-0">
                      Collaborators
                    </label>
                    <div className="flex-1 flex items-center gap-2 justify-end flex-wrap">
                      {task.collaborators && task.collaborators.length > 0 ? (
                        <>
                          {task.collaborators
                            .slice(0, 3)
                            .map((collab, index) => {
                              const name =
                                collab?.name ||
                                (collab?.firstName && collab?.lastName
                                  ? `${collab.firstName} ${collab.lastName}`
                                  : collab?.firstName ||
                                    collab?.lastName ||
                                    "Unknown");
                              const initial =
                                name?.charAt(0)?.toUpperCase() || "U";
                              return (
                                <div
                                  key={collab?.id || index}
                                  className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
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
                          {task.collaborators.length > 3 && (
                            <div
                              className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white"
                              title={`${task.collaborators.length - 3} more`}
                              style={{ marginLeft: "-4px", zIndex: 7 }}
                            >
                              +{task.collaborators.length - 3}
                            </div>
                          )}
                          <button
                            onClick={() =>
                              setCollaboratorModal({ isOpen: true })
                            }
                            className="ml-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Manage
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setCollaboratorModal({ isOpen: true })}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Add collaborators
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Section */}
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Description
                </h3>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="What is this task about?"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={6}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDescriptionSave}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingDescription(false);
                          setEditedDescription(task.description || "");
                        }}
                        className="px-3 py-1.5 border-2 border-gray-400 bg-white text-gray-800 rounded-lg hover:bg-gray-100 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDescription(true)}
                    className="w-full px-3 py-2 border border-transparent rounded-lg hover:border-gray-300 cursor-text min-h-[120px]"
                  >
                    {task.description ? (
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {task.description}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">
                        What is this task about? Click to add description.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Attachments
                </h3>
                <div className="space-y-2">
                  {attachedFiles.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {attachedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Paperclip className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-700 block truncate">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="p-1.5 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Paperclip className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {attachedFiles.length > 0
                        ? "Add more files"
                        : "Attach files"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Quick Actions and Information */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleEditTask}
                    className="w-full flex items-center justify-start px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Task
                  </button>
                  <button
                    onClick={() => setActiveTab("subtasks")}
                    className="w-full flex items-center justify-start px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subtask
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className="w-full flex items-center justify-start px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Add Comment
                  </button>
                  <button
                    onClick={handleCopyTaskLink}
                    className="w-full flex items-center justify-start px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        <span className="text-green-600">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Copy Task Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Task Info */}
              <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Created
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {task.createdAt
                          ? formatDate(task.createdAt, {
                              includeTime: true,
                              format: "long",
                            })
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Last Updated
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">
                        {task.updatedAt
                          ? formatDate(task.updatedAt, {
                              includeTime: true,
                              format: "long",
                            })
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                  {task.tags && task.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "subtasks" && (
          <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Subtasks
                </h3>
                {hasActiveFilters() && (
                  <span className="text-sm text-gray-600 font-medium">
                    ({transformedSubtasks.length} of {rootSubtasks.length})
                  </span>
                )}
                {!hasActiveFilters() && rootSubtasks.length > 0 && (
                  <span className="text-sm text-gray-500">
                    ({rootSubtasks.length})
                  </span>
                )}
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddSubtaskModal(true)}
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subtask
              </Button>
            </div>

            {/* Search Bar and Filter */}
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search subtasks..."
                    value={subtaskSearchQuery}
                    onChange={(e) => setSubtaskSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/50 backdrop-blur-md border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 focus:bg-white/70 transition-all duration-300 placeholder:text-gray-500"
                  />
                </div>
                <button
                  onClick={() => setShowSubtasksFilterModal(true)}
                  className={`px-4 py-2 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
                    hasActiveFilters()
                      ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      : "bg-white/50 backdrop-blur-md border-white/20 text-gray-700 hover:bg-white/70 hover:border-orange-300"
                  }`}
                  title="Filter & Sort Subtasks"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filter</span>
                  {hasActiveFilters() && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">
                      {getActiveFilterLabels().length}
                    </span>
                  )}
                </button>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters() && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-600">
                    Active filters:
                  </span>
                  {getActiveFilterLabels().map((label, index) => {
                    // Extract filter key from label
                    let filterKey = "";
                    if (label.startsWith("Sort:")) {
                      filterKey = "sortBy";
                    } else if (label.startsWith("Assignee:")) {
                      filterKey = "assignee";
                    } else if (label.startsWith("Created:")) {
                      filterKey = "createdDateFrom";
                    } else if (label.startsWith("Deadline:")) {
                      filterKey = "dueDateFrom";
                    }

                    return (
                      <div
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg border border-orange-200 text-xs font-medium"
                      >
                        <span>{label}</span>
                        <button
                          onClick={() => {
                            if (filterKey === "sortBy") {
                              setSubtaskFilters((prev) => ({
                                ...prev,
                                sortBy: "",
                                sortOrder: "asc",
                              }));
                            } else if (filterKey === "createdDateFrom") {
                              setSubtaskFilters((prev) => ({
                                ...prev,
                                createdDateFrom: "",
                                createdDateTo: "",
                              }));
                            } else if (filterKey === "dueDateFrom") {
                              setSubtaskFilters((prev) => ({
                                ...prev,
                                dueDateFrom: "",
                                dueDateTo: "",
                              }));
                            } else if (filterKey) {
                              clearFilter(filterKey);
                            }
                          }}
                          className="ml-1 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
                          title="Remove filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={() => {
                      setSubtaskFilters({
                        sortBy: "",
                        sortOrder: "asc",
                        assignee: "",
                        createdDateFrom: "",
                        createdDateTo: "",
                        dueDateFrom: "",
                        dueDateTo: "",
                      });
                    }}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Subtasks Table - Full Width */}
            {transformedSubtasks.length > 0 ? (
              <div className="rounded-3xl overflow-hidden w-full">
                <div className="overflow-x-auto">
                  <Table
                    columns={subtaskColumnsTable}
                    data={transformedSubtasks}
                    onRowClick={handleSubtaskClick}
                    className="min-w-[1200px] w-full"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📋</div>
                <p className="text-gray-600">
                  {subtaskSearchQuery.trim()
                    ? `No subtasks match your search "${subtaskSearchQuery}"`
                    : "No subtasks found for this task"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {subtaskSearchQuery.trim()
                    ? "Try a different search term"
                    : "Add subtasks to break down this task"}
                </p>
                {!subtaskSearchQuery.trim() && (
                  <Button
                    onClick={() => setShowAddSubtaskModal(true)}
                    className="mt-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subtask
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6 h-[calc(100vh-300px)] flex flex-col min-h-0">
            <CommentsSection task={task} />
          </div>
        )}

        {activeTab === "activity" && (
          <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Activity Log
              </h3>
            </div>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-3 p-4 bg-white/50 rounded-lg border border-white/30"
                  >
                    <Activity className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-gray-900">{activity.description}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No activity yet</p>
                <p className="text-sm">
                  Activity will appear here as the task progresses
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subtasks Filter Modal */}
      <SubtasksFilterModal
        isOpen={showSubtasksFilterModal}
        onClose={() => setShowSubtasksFilterModal(false)}
        onApplyFilters={(filters) => {
          setSubtaskFilters(filters);
        }}
        users={users}
        appliedFilters={subtaskFilters}
      />

      {/* Collaborator Modal */}
      <CollaboratorModal
        isOpen={collaboratorModal.isOpen}
        onClose={() =>
          setCollaboratorModal({ isOpen: false, task: null, subtask: null })
        }
        task={collaboratorModal.task || task}
        subtask={collaboratorModal.subtask}
        onUpdate={async (updatedTask, updatedSubtask) => {
          if (updatedSubtask) {
            // Update was for a subtask - reload task to get updated subtasks
            if (task?.id) {
              try {
                const fullTaskData = await taskService.getTaskById(task.id, [
                  "projects",
                  "assignee",
                  "createdBy",
                  "subtasks",
                  "subtasks.assignee",
                  "subtasks.collaborators",
                  "subtasks.childSubtasks",
                  "collaborators",
                ]);
                const transformedTask = transformTask(fullTaskData);
                const formattedDueDate = transformedTask.scheduledDate
                  ? formatDate(transformedTask.scheduledDate)
                  : "No due date";

                // Ensure subtasks are properly transformed with isolated assignees
                let rawSubtasks = [];
                if (
                  fullTaskData.subtasks &&
                  Array.isArray(fullTaskData.subtasks)
                ) {
                  rawSubtasks = fullTaskData.subtasks;
                } else if (
                  fullTaskData.data?.subtasks &&
                  Array.isArray(fullTaskData.data.subtasks)
                ) {
                  rawSubtasks = fullTaskData.data.subtasks;
                } else if (
                  fullTaskData.attributes?.subtasks &&
                  Array.isArray(fullTaskData.attributes.subtasks)
                ) {
                  rawSubtasks = fullTaskData.attributes.subtasks;
                }

                let transformedSubtasks =
                  rawSubtasks.length > 0
                    ? rawSubtasks
                        .map((rawSubtask) => {
                          const transformed = transformSubtask(rawSubtask);
                          if (transformed) {
                            return {
                              ...transformed,
                              assignee: transformed.assignee
                                ? { ...transformed.assignee }
                                : null,
                              collaborators: transformed.collaborators
                                ? transformed.collaborators.map((c) => ({
                                    ...c,
                                  }))
                                : [],
                            };
                          }
                          return null;
                        })
                        .filter(Boolean)
                    : [];

                let commentsData = [];
                try {
                  const commentsResponse = await commentService.getTaskComments(
                    task.id,
                  );
                  commentsData =
                    commentsResponse.data?.map(transformComment) || [];
                } catch (commentError) {
                  console.error("Error fetching comments:", commentError);
                }

                const taskCollaborators = (transformedTask.collaborators || [])
                  .map((c) => ({ ...c }))
                  .filter((c) => c && (c.id || c._id || c.name || c.email));

                const taskForPage = {
                  ...transformedTask,
                  dueDate: formattedDueDate,
                  description: transformedTask.description || "",
                  subtasks: transformedSubtasks,
                  comments: commentsData,
                  collaborators: taskCollaborators,
                };

                setTask(taskForPage);
                setComments(commentsData);
              } catch (error) {
                console.error(
                  "Error reloading task after subtask update:",
                  error,
                );
              }
            }
          } else if (updatedTask) {
            // Update was for the task itself - reload task data
            if (task?.id) {
              try {
                const fullTaskData = await taskService.getTaskById(task.id, [
                  "projects",
                  "assignee",
                  "createdBy",
                  "subtasks",
                  "subtasks.assignee",
                  "subtasks.collaborators",
                  "subtasks.childSubtasks",
                  "collaborators",
                ]);
                const transformedTask = transformTask(fullTaskData);
                const formattedDueDate = transformedTask.scheduledDate
                  ? formatDate(transformedTask.scheduledDate)
                  : "No due date";

                let commentsData = [];
                try {
                  const commentsResponse = await commentService.getTaskComments(
                    task.id,
                  );
                  commentsData =
                    commentsResponse.data?.map(transformComment) || [];
                } catch (commentError) {
                  console.error("Error fetching comments:", commentError);
                }

                const taskCollaborators = (transformedTask.collaborators || [])
                  .map((c) => ({ ...c }))
                  .filter((c) => c && (c.id || c._id || c.name || c.email));

                const taskForPage = {
                  ...transformedTask,
                  dueDate: formattedDueDate,
                  description: transformedTask.description || "",
                  subtasks: transformedTask.subtasks || [],
                  comments: commentsData,
                  collaborators: taskCollaborators,
                };

                setTask(taskForPage);
                setComments(commentsData);
              } catch (error) {
                console.error(
                  "Error reloading task after collaborator update:",
                  error,
                );
              }
            }
          }
        }}
      />

      {/* Subtask Detail Modal */}
      <SubtaskDetailModal
        isOpen={subtaskDetailModal.isOpen}
        onClose={() =>
          setSubtaskDetailModal({ isOpen: false, subtaskId: null })
        }
        subtaskId={subtaskDetailModal.subtaskId}
        task={task}
        onTaskRefresh={async () => {
          // Reload task data
          if (task?.id) {
            const fullTaskData = await taskService.getTaskById(task.id, [
              "project",
              "assignee",
              "createdBy",
              "subtasks",
              "subtasks.assignee",
              "subtasks.childSubtasks",
              "subtasks.childSubtasks.assignee",
              "collaborators",
            ]);
            const transformedTask = transformTask(fullTaskData);
            const formattedDueDate = transformedTask.scheduledDate
              ? formatDate(transformedTask.scheduledDate)
              : "No due date";

            let commentsData = [];
            try {
              const commentsResponse = await commentService.getTaskComments(
                task.id,
              );
              commentsData = commentsResponse.data?.map(transformComment) || [];
            } catch (commentError) {
              console.error("Error fetching comments:", commentError);
            }

            const taskForPage = {
              ...transformedTask,
              dueDate: formattedDueDate,
              description: transformedTask.description || "",
              subtasks: transformedTask.subtasks || fullTaskData.subtasks || [],
              comments: commentsData,
            };

            setTask(taskForPage);
          }
        }}
        onNavigateToSubtask={(subtaskId) => {
          setSubtaskDetailModal({
            isOpen: true,
            subtaskId: subtaskId,
          });
        }}
        onNavigateToTask={(taskId) => {
          router.push(`/my-task/${taskId}`);
        }}
      />

      {/* Add Subtask Modal */}
      {showAddSubtaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Add Subtask
                </h2>
                <button
                  onClick={() => {
                    setShowAddSubtaskModal(false);
                    setNewSubtaskData({
                      title: "",
                      assignee: null,
                      collaborators: [],
                      dueDate: "",
                      status: "SCHEDULED",
                      priority: "MEDIUM",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!task?.id || !newSubtaskData.title.trim()) return;

                  try {
                    const subtaskData = {
                      title: newSubtaskData.title.trim(),
                      task: task.id,
                      status: newSubtaskData.status,
                      priority: newSubtaskData.priority,
                      progress: 0,
                      depth: 0,
                    };

                    // Set assignee (single) and collaborators (multiple)
                    // IMPORTANT: Only use assignee/collaborators from newSubtaskData, NOT from task or other subtasks
                    if (newSubtaskData.assignee) {
                      const assigneeId =
                        typeof newSubtaskData.assignee === "string"
                          ? parseInt(newSubtaskData.assignee, 10)
                          : newSubtaskData.assignee;
                      if (assigneeId && !isNaN(assigneeId)) {
                        subtaskData.assignee = assigneeId;
                      } else {
                        subtaskData.assignee = null;
                      }
                    } else {
                      subtaskData.assignee = null;
                    }

                    // Set collaborators (array of user IDs)
                    if (
                      newSubtaskData.collaborators &&
                      newSubtaskData.collaborators.length > 0
                    ) {
                      const collaboratorIds = [...newSubtaskData.collaborators]
                        .map((id) =>
                          typeof id === "string" ? parseInt(id, 10) : id,
                        )
                        .filter((id) => id && !isNaN(id));
                      subtaskData.collaborators = collaboratorIds;
                    } else {
                      subtaskData.collaborators = [];
                    }

                    if (newSubtaskData.dueDate) {
                      subtaskData.dueDate = new Date(
                        newSubtaskData.dueDate + "T00:00:00",
                      ).toISOString();
                    }

                    const createdSubtaskResponse =
                      await subtaskService.createSubtask(subtaskData);

                    // Get the created subtask ID
                    const createdSubtaskId =
                      createdSubtaskResponse?.id ||
                      createdSubtaskResponse?.data?.id;

                    // Fetch the newly created subtask with full assignee and collaborators data if we have an ID
                    let newTransformedSubtask = null;
                    if (createdSubtaskId) {
                      try {
                        const newSubtaskData =
                          await subtaskService.getSubtaskById(
                            createdSubtaskId,
                            ["assignee", "collaborators"],
                          );
                        if (newSubtaskData) {
                          newTransformedSubtask =
                            transformSubtask(newSubtaskData);
                        }
                      } catch (err) {
                        console.warn(
                          "Could not fetch new subtask with assignee/collaborators:",
                          err,
                        );
                      }
                    }

                    // Reload task to get updated subtasks with full assignee data
                    // IMPORTANT: Only populate task's own collaborators, NOT subtask assignees
                    const fullTaskData = await taskService.getTaskById(
                      task.id,
                      [
                        "projects",
                        "assignee",
                        "createdBy",
                        "subtasks",
                        "subtasks.assignee",
                        "subtasks.collaborators",
                        "subtasks.childSubtasks",
                        "collaborators",
                      ],
                    );
                    const transformedTask = transformTask(fullTaskData);
                    const formattedDueDate = transformedTask.scheduledDate
                      ? formatDate(transformedTask.scheduledDate)
                      : "No due date";

                    // Ensure subtasks are properly transformed with assignees
                    // Handle different possible response structures
                    let rawSubtasks = [];
                    if (
                      fullTaskData.subtasks &&
                      Array.isArray(fullTaskData.subtasks)
                    ) {
                      rawSubtasks = fullTaskData.subtasks;
                    } else if (
                      fullTaskData.data?.subtasks &&
                      Array.isArray(fullTaskData.data.subtasks)
                    ) {
                      rawSubtasks = fullTaskData.data.subtasks;
                    } else if (
                      fullTaskData.attributes?.subtasks &&
                      Array.isArray(fullTaskData.attributes.subtasks)
                    ) {
                      rawSubtasks = fullTaskData.attributes.subtasks;
                    }

                    // Explicitly transform each subtask to ensure assignees are included
                    // IMPORTANT: Each subtask's assignees/collaborators must be isolated
                    let transformedSubtasks =
                      rawSubtasks.length > 0
                        ? rawSubtasks
                            .map((rawSubtask) => {
                              // Ensure each subtask is transformed independently
                              const transformed = transformSubtask(rawSubtask);
                              if (transformed) {
                                // Ensure assignees/collaborators are isolated (not shared references)
                                return {
                                  ...transformed,
                                  assignee: transformed.assignee
                                    ? { ...transformed.assignee }
                                    : null,
                                  collaborators: transformed.collaborators
                                    ? transformed.collaborators.map((c) => ({
                                        ...c,
                                      }))
                                    : [],
                                };
                              }
                              return null;
                            })
                            .filter(Boolean)
                        : transformedTask.subtasks &&
                            Array.isArray(transformedTask.subtasks)
                          ? transformedTask.subtasks.map((st) => ({
                              ...st,
                              assignee: st.assignee ? { ...st.assignee } : null,
                              collaborators: st.collaborators
                                ? st.collaborators.map((c) => ({ ...c }))
                                : [],
                            }))
                          : [];

                    // If we have a newly transformed subtask and it's not in the list, add it
                    // This ensures immediate visibility even if the reload hasn't picked it up yet
                    if (
                      newTransformedSubtask &&
                      !transformedSubtasks.find(
                        (st) => st.id === newTransformedSubtask.id,
                      )
                    ) {
                      // Ensure the new subtask's assignees are also isolated
                      transformedSubtasks = [
                        ...transformedSubtasks,
                        {
                          ...newTransformedSubtask,
                          assignee: newTransformedSubtask.assignee
                            ? { ...newTransformedSubtask.assignee }
                            : null,
                          collaborators: newTransformedSubtask.collaborators
                            ? newTransformedSubtask.collaborators.map((c) => ({
                                ...c,
                              }))
                            : [],
                        },
                      ];
                    }

                    let commentsData = [];
                    try {
                      const commentsResponse =
                        await commentService.getTaskComments(task.id);
                      commentsData =
                        commentsResponse.data?.map(transformComment) || [];
                    } catch (commentError) {
                      console.error("Error fetching comments:", commentError);
                    }

                    // Ensure task's collaborators are isolated from subtask assignees
                    // Only use the task's own collaborators, NOT subtask assignees
                    const taskCollaborators = (
                      transformedTask.collaborators || []
                    )
                      .map((c) => ({ ...c }))
                      .filter((c) => c && (c.id || c._id || c.name || c.email));

                    const taskForPage = {
                      ...transformedTask,
                      dueDate: formattedDueDate,
                      description: transformedTask.description || "",
                      subtasks: transformedSubtasks,
                      comments: commentsData,
                      // Ensure collaborators are only from the task itself, not aggregated from subtasks
                      collaborators: taskCollaborators,
                    };

                    setTask(taskForPage);
                    setShowAddSubtaskModal(false);
                    setNewSubtaskData({
                      title: "",
                      assignee: null,
                      collaborators: [],
                      dueDate: "",
                      status: "SCHEDULED",
                      priority: "MEDIUM",
                    });
                  } catch (error) {
                    console.error("Error creating subtask:", error);
                    alert("Failed to create subtask. Please try again.");
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtask Name *
                  </label>
                  <input
                    type="text"
                    value={newSubtaskData.title}
                    onChange={(e) =>
                      setNewSubtaskData({
                        ...newSubtaskData,
                        title: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter subtask name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={newSubtaskData.assignee || ""}
                    onChange={(e) => {
                      setNewSubtaskData({
                        ...newSubtaskData,
                        assignee: e.target.value ? e.target.value : null,
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select assignee...</option>
                    {users.map((user) => {
                      const userName =
                        user.name ||
                        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                        user.email ||
                        "Unknown User";
                      return (
                        <option key={user.id} value={user.id}>
                          {userName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collaborators
                  </label>
                  <div className="space-y-2">
                    {/* Selected Collaborators */}
                    {newSubtaskData.collaborators.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {newSubtaskData.collaborators.map((collaboratorId) => {
                          const selectedUser = users.find(
                            (u) => String(u.id) === String(collaboratorId),
                          );
                          if (!selectedUser) return null;
                          const userName =
                            selectedUser.name ||
                            `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() ||
                            selectedUser.email ||
                            "Unknown User";
                          return (
                            <span
                              key={collaboratorId}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                            >
                              {userName}
                              <button
                                type="button"
                                onClick={() => {
                                  setNewSubtaskData((prev) => ({
                                    ...prev,
                                    collaborators: prev.collaborators.filter(
                                      (id) => id !== collaboratorId,
                                    ),
                                  }));
                                }}
                                className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {/* Collaborator Select Dropdown */}
                    <select
                      value=""
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        if (
                          selectedId &&
                          !newSubtaskData.collaborators.includes(selectedId) &&
                          selectedId !== newSubtaskData.assignee
                        ) {
                          setNewSubtaskData((prev) => ({
                            ...prev,
                            collaborators: [...prev.collaborators, selectedId],
                          }));
                        }
                        e.target.value = ""; // Reset select
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">
                        {newSubtaskData.collaborators.length === 0
                          ? "Select collaborators..."
                          : "Add another collaborator..."}
                      </option>
                      {users
                        .filter(
                          (user) =>
                            !newSubtaskData.collaborators.includes(
                              String(user.id),
                            ) &&
                            String(user.id) !== String(newSubtaskData.assignee),
                        )
                        .map((user) => {
                          const userName =
                            user.name ||
                            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                            user.email ||
                            "Unknown User";
                          return (
                            <option key={user.id} value={user.id}>
                              {userName}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newSubtaskData.dueDate}
                    onChange={(e) =>
                      setNewSubtaskData({
                        ...newSubtaskData,
                        dueDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={newSubtaskData.status}
                      onChange={(e) =>
                        setNewSubtaskData({
                          ...newSubtaskData,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="SCHEDULED">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">Internal Review</option>
                      <option value="CLIENT_REVIEW">Client Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="COMPLETED">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={newSubtaskData.priority}
                      onChange={(e) =>
                        setNewSubtaskData({
                          ...newSubtaskData,
                          priority: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddSubtaskModal(false);
                      setNewSubtaskData({
                        title: "",
                        assignees: [],
                        dueDate: "",
                        status: "SCHEDULED",
                        priority: "MEDIUM",
                      });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg"
                  >
                    Add Subtask
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
