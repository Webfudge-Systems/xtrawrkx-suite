"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  X,
  ExternalLink,
  Maximize2,
  Calendar,
  Flag,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit,
  GitBranch,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";
import subtaskService from "../../lib/subtaskService";
import { transformSubtask, formatDate } from "../../lib/dataTransformers";
import apiClient from "../../lib/apiClient";
import SubTasksSection from "./SubTasksSection";
import CommentsSection from "./CommentsSection";
import CollaboratorModal from "../my-task/CollaboratorModal";

export default function SubtaskDetailModal({
  isOpen,
  onClose,
  subtaskId,
  task,
  onTaskRefresh,
  onNavigateToTask,
  onNavigateToSubtask,
}) {
  const router = useRouter();
  const [subtask, setSubtask] = useState(null);
  const [activeTab, setActiveTab] = useState("subtasks");
  const [users, setUsers] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [localSubtask, setLocalSubtask] = useState(null);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);
  const [collaboratorModal, setCollaboratorModal] = useState({ isOpen: false });

  // Load subtask data
  const loadSubtask = useCallback(async () => {
    if (!subtaskId) return;

    try {
      const subtaskData = await subtaskService.getSubtaskById(subtaskId, [
        "task",
        "assignee",
        "collaborators",
        "parentSubtask",
        "childSubtasks",
        "childSubtasks.assignee",
        "childSubtasks.childSubtasks",
      ]);

      const transformedSubtask = transformSubtask(subtaskData);
      setSubtask(transformedSubtask);
      setLocalSubtask(transformedSubtask);
    } catch (error) {
      console.error("Error loading subtask:", error);
    }
  }, [subtaskId]);

  useEffect(() => {
    if (isOpen && subtaskId) {
      loadSubtask();
    } else {
      setSubtask(null);
      setLocalSubtask(null);
    }
  }, [isOpen, subtaskId, loadSubtask]);

  // Load users
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // Reset active tab when subtask changes
  useEffect(() => {
    if (subtask?.id) {
      setActiveTab("subtasks");
    }
  }, [subtask?.id]);

  const loadUsers = async () => {
    try {
      const usersResponse = await apiClient.get("/api/xtrawrkx-users", {
        "pagination[pageSize]": 100,
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
    }
  };

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
      "in-review": {
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

  const handleStatusUpdate = async (newStatus) => {
    if (!localSubtask?.id) return;
    const subtaskId = localSubtask.id;
    const oldStatus = localSubtask.status;

    // Update local state immediately for instant feedback
    setLocalSubtask((prev) => ({ ...prev, status: newStatus }));

    try {
      // Transform frontend status to Strapi format
      const statusMap = {
        "To Do": "SCHEDULED",
        "In Progress": "IN_PROGRESS",
        "In Review": "IN_REVIEW",
        Done: "COMPLETED",
        Cancelled: "CANCELLED",
      };
      const strapiStatus = statusMap[newStatus] || newStatus;

      await subtaskService.updateSubtask(subtaskId, { status: strapiStatus });

      if (onTaskRefresh) {
        try {
          await onTaskRefresh();
        } catch (refreshError) {
          console.warn("Could not refresh parent:", refreshError);
        }
      }

      await loadSubtask();
    } catch (error) {
      console.error("Error updating status:", error);
      setLocalSubtask((prev) => ({ ...prev, status: oldStatus }));
    }
  };

  const handlePriorityUpdate = async (newPriority) => {
    if (!localSubtask?.id) return;
    const subtaskId = localSubtask.id;
    const oldPriority = localSubtask.priority;

    // Update local state immediately
    setLocalSubtask((prev) => ({ ...prev, priority: newPriority }));

    try {
      // Transform frontend priority to Strapi format
      const priorityMap = {
        Low: "LOW",
        Medium: "MEDIUM",
        High: "HIGH",
      };
      const strapiPriority = priorityMap[newPriority] || newPriority;

      await subtaskService.updateSubtask(subtaskId, {
        priority: strapiPriority,
      });

      if (onTaskRefresh) {
        try {
          await onTaskRefresh();
        } catch (refreshError) {
          console.warn("Could not refresh parent:", refreshError);
        }
      }

      await loadSubtask();
    } catch (error) {
      console.error("Error updating priority:", error);
      setLocalSubtask((prev) => ({ ...prev, priority: oldPriority }));
    }
  };

  const handleAssigneeUpdate = async (newAssigneeId) => {
    if (!localSubtask?.id) return;
    try {
      await subtaskService.updateSubtask(localSubtask.id, {
        assignee: newAssigneeId || null,
      });
      await loadSubtask();
      if (onTaskRefresh) {
        await onTaskRefresh();
      }
    } catch (error) {
      console.error("Error updating assignee:", error);
    }
  };

  const handleDueDateUpdate = async (newDate) => {
    if (!localSubtask?.id) return;
    try {
      const dateValue = newDate ? new Date(newDate).toISOString() : null;
      await subtaskService.updateSubtask(localSubtask.id, {
        dueDate: dateValue,
      });
      await loadSubtask();
      if (onTaskRefresh) {
        await onTaskRefresh();
      }
    } catch (error) {
      console.error("Error updating due date:", error);
    }
  };

  const handleDescriptionUpdate = async (newDescription) => {
    if (!localSubtask?.id) return;
    const oldDescription = localSubtask.description || "";

    // Optimistic update
    setLocalSubtask((prev) => ({ ...prev, description: newDescription }));

    try {
      await subtaskService.updateSubtask(localSubtask.id, {
        description: newDescription || "",
      });
      await loadSubtask();
      if (onTaskRefresh) {
        await onTaskRefresh();
      }
    } catch (error) {
      console.error("Error updating description:", error);
      // Revert optimistic update on error
      setLocalSubtask((prev) => ({ ...prev, description: oldDescription }));
    }
  };

  const handleToggleComplete = async () => {
    if (!localSubtask?.id) return;
    const isCurrentlyComplete =
      localSubtask.status === "Done" ||
      localSubtask.status === "COMPLETED" ||
      localSubtask.status?.toLowerCase() === "done";
    const newStatus = isCurrentlyComplete ? "To Do" : "Done";

    // Trigger confetti animation only when completing (not uncompleting)
    if (!isCurrentlyComplete) {
      triggerConfetti();
    }

    await handleStatusUpdate(newStatus);
  };

  const triggerConfetti = () => {
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
        colors: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"],
      });

      // Confetti from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"],
      });
    }, 250);
  };

  if (!isOpen || !localSubtask) return null;

  // Ensure subtask has required properties with fallbacks
  const safeSubtask = {
    ...localSubtask,
    id: localSubtask.id,
    name: localSubtask.name || localSubtask.title || "Untitled Subtask",
    task: localSubtask.task || task,
    assignee: localSubtask.assignee || null,
    collaborators: localSubtask.collaborators || [],
    dueDate: localSubtask.dueDate || "No due date",
    status: localSubtask.status || "To Do",
    priority: localSubtask.priority || "Medium",
    progress: localSubtask.progress || 0,
    childSubtasks: localSubtask.childSubtasks || localSubtask.subtasks || [],
    description: localSubtask.description || "",
  };

  const isComplete =
    safeSubtask.status === "Done" ||
    safeSubtask.status === "COMPLETED" ||
    safeSubtask.status?.toLowerCase() === "done";

  const modalClasses =
    "fixed inset-0 top-0 flex items-stretch justify-end z-[81] pointer-events-none !mt-0";
  const contentClasses =
    "bg-white shadow-2xl w-[600px] h-full border-l border-gray-200 flex flex-col pointer-events-auto";

  if (!isOpen) return null;

  // Build breadcrumb path: Task → Parent Subtask (if any) → Current Subtask
  const breadcrumbs = [];
  if (safeSubtask.task?.id) {
    breadcrumbs.push({
      label: safeSubtask.task.name || safeSubtask.task.title || "Task",
      type: "task",
      id: safeSubtask.task.id,
    });
  }
  if (safeSubtask.parentSubtask?.id) {
    breadcrumbs.push({
      label:
        safeSubtask.parentSubtask.name ||
        safeSubtask.parentSubtask.title ||
        "Parent Subtask",
      type: "subtask",
      id: safeSubtask.parentSubtask.id,
    });
  }
  breadcrumbs.push({
    label: safeSubtask.name,
    type: "subtask",
    id: safeSubtask.id,
    current: true,
  });

  const handleBreadcrumbClick = (crumb) => {
    if (crumb.current) return;
    if (crumb.type === "task" && onNavigateToTask) {
      onNavigateToTask(crumb.id);
    } else if (crumb.type === "subtask" && onNavigateToSubtask) {
      onNavigateToSubtask(crumb.id);
    }
  };

  const modalContent = (
    <div className={modalClasses}>
      <div className={contentClasses}>
        {/* Header - match TaskDetailModal, with breadcrumbs */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            {breadcrumbs.length > 1 && (
              <nav
                className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap"
                aria-label="Breadcrumb"
              >
                {breadcrumbs.map((crumb, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1.5 min-w-0"
                  >
                    {index > 0 && (
                      <ChevronRight
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        aria-hidden
                      />
                    )}
                    {crumb.current ? (
                      <span className="text-gray-900 font-medium truncate max-w-[240px]">
                        {crumb.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleBreadcrumbClick(crumb)}
                        className="text-gray-500 hover:text-blue-600 hover:underline truncate max-w-[240px] text-left"
                      >
                        {crumb.label}
                      </button>
                    )}
                  </span>
                ))}
              </nav>
            )}
            <h1
              className={`text-xl font-semibold truncate pr-4 ${
                isComplete ? "text-gray-500 line-through" : "text-gray-900"
              }`}
            >
              {safeSubtask.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Subtask - navigate to edit page */}
            {safeSubtask.id && (
              <button
                onClick={() => {
                  onClose?.();
                  router.push(`/subtasks/${safeSubtask.id}/edit`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                title="Edit subtask"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {/* Open Task - navigate to parent task */}
            {safeSubtask.task?.id && onNavigateToTask && (
              <button
                onClick={() => onNavigateToTask(safeSubtask.task.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
              >
                <ExternalLink className="w-4 h-4" />
                Open Task
              </button>
            )}
            {/* Full Page */}
            {safeSubtask.id && (
              <button
                onClick={() => {
                  onClose?.();
                  router.push(`/subtasks/${safeSubtask.id}`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                title="Open full subtask page"
              >
                <Maximize2 className="w-4 h-4" />
                Full
              </button>
            )}
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content - Single scroll for whole modal body (match TaskDetailModal) */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
          {/* Subtask Details Card - match TaskDetailModal */}
          <div className="px-4 py-4">
            <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-4">
              {/* Mark Complete Bar - match TaskDetailModal */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <button
                  onClick={handleToggleComplete}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                    isComplete
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 hover:border-green-500"
                  }`}
                >
                  {isComplete && <CheckCircle2 className="w-4 h-4" />}
                </button>
                <span className="text-sm text-gray-700 font-medium">
                  {isComplete ? "Subtask completed" : "Mark as complete"}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Subtask Details
                </h3>
                <button
                  onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isDetailsExpanded ? "Collapse" : "Expand"}
                >
                  {isDetailsExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
              {isDetailsExpanded && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Task / Parent Subtask - match TaskDetailModal Project block */}
                    {(safeSubtask.parentSubtask ||
                      (safeSubtask.task && !safeSubtask.parentSubtask)) && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          {safeSubtask.parentSubtask
                            ? "Parent Subtask"
                            : "Task"}
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 text-sm">
                            {safeSubtask.parentSubtask
                              ? safeSubtask.parentSubtask.name ||
                                safeSubtask.parentSubtask.title ||
                                "Unknown"
                              : safeSubtask.task?.name ||
                                safeSubtask.task?.title ||
                                "Unknown"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Assignee - match TaskDetailModal */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Assignee
                      </label>
                      <div className="mt-1">
                        {editingField === "assignee" ? (
                          <select
                            value={editingValue || ""}
                            onChange={(e) => {
                              handleAssigneeUpdate(e.target.value);
                              setEditingField(null);
                            }}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            className="w-full px-3 py-2 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                          >
                            <option value="">Unassigned</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const assignee =
                                safeSubtask.assignee || localSubtask?.assignee;
                              let assigneeName = "Unassigned";
                              let assigneeId = null;
                              if (assignee) {
                                if (typeof assignee === "object") {
                                  assigneeName =
                                    assignee?.name ||
                                    (assignee?.firstName && assignee?.lastName
                                      ? `${assignee.firstName} ${assignee.lastName}`.trim()
                                      : assignee?.firstName ||
                                        assignee?.lastName ||
                                        assignee?.email ||
                                        "Unassigned");
                                  assigneeId =
                                    assignee?.id || assignee?.documentId;
                                } else if (
                                  typeof assignee === "string" &&
                                  assignee !== "Unassigned"
                                ) {
                                  assigneeName = assignee;
                                }
                              }
                              const assigneeAvatar =
                                getAssigneeAvatar(assignee);
                              const hasAssignee =
                                assignee && assigneeName !== "Unassigned";
                              return (
                                <>
                                  <div
                                    className={`w-8 h-8 ${assigneeAvatar.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                                  >
                                    {assigneeAvatar.initials}
                                  </div>
                                  <span
                                    className="text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded flex-1 text-sm"
                                    onClick={() => {
                                      setEditingValue(
                                        assigneeId?.toString() || "",
                                      );
                                      setEditingField("assignee");
                                    }}
                                  >
                                    {assigneeName}
                                  </span>
                                  {hasAssignee && (
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
                                        assigneeId?.toString() || "",
                                      );
                                      setEditingField("assignee");
                                    }}
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Due date - match TaskDetailModal */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Due date
                      </label>
                      <div className="mt-1 flex items-center gap-2">
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
                            className="flex-1 text-sm text-gray-900 px-2 py-1 rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <div className="flex items-center gap-2 flex-1">
                            <p
                              className="text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded flex-1 text-sm"
                              onClick={() => {
                                const dateValue =
                                  safeSubtask.dueDate &&
                                  safeSubtask.dueDate !== "No due date"
                                    ? new Date(safeSubtask.dueDate)
                                        .toISOString()
                                        .split("T")[0]
                                    : "";
                                setEditingValue(dateValue);
                                setEditingField("dueDate");
                              }}
                            >
                              {safeSubtask.dueDate &&
                              safeSubtask.dueDate !== "No due date"
                                ? formatDate(safeSubtask.dueDate)
                                : "No due date"}
                            </p>
                            {safeSubtask.dueDate &&
                              safeSubtask.dueDate !== "No due date" && (
                                <button
                                  onClick={() => handleDueDateUpdate(null)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <X className="w-4 h-4 text-gray-400" />
                                </button>
                              )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status - match TaskDetailModal */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Status
                      </label>
                      <div className="mt-1">
                        {editingField === "status" ? (
                          <select
                            value={editingValue}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              setEditingValue(newStatus);
                              await handleStatusUpdate(newStatus);
                              setEditingField(null);
                            }}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            className={`w-full px-3 py-1.5 rounded-lg border-2 font-bold text-xs text-center shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(
                              editingValue,
                            )}`}
                          >
                            <option value="To Do">To Do</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Internal Review">
                              Internal Review
                            </option>
                            <option value="Done">Done</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span
                            onClick={() => {
                              setEditingValue(safeSubtask.status || "To Do");
                              setEditingField("status");
                            }}
                            className={`inline-block px-3 py-1.5 rounded-lg border-2 font-bold text-xs cursor-pointer hover:shadow-md transition-all ${getStatusColor(
                              safeSubtask.status,
                            )}`}
                          >
                            {safeSubtask.status || "To Do"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Priority - match TaskDetailModal */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Priority
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Flag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        {editingField === "priority" ? (
                          <select
                            value={editingValue}
                            onChange={async (e) => {
                              const newPriority = e.target.value;
                              setEditingValue(newPriority);
                              await handlePriorityUpdate(newPriority);
                              setEditingField(null);
                            }}
                            onBlur={() => setEditingField(null)}
                            autoFocus
                            className={`flex-1 px-3 py-1.5 rounded-lg border-2 font-bold text-xs text-center shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${getPriorityColor(
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
                              setEditingValue(safeSubtask.priority || "Medium");
                              setEditingField("priority");
                            }}
                            className={`inline-block px-3 py-1.5 rounded-lg border-2 font-bold text-xs cursor-pointer hover:shadow-md transition-all ${getPriorityColor(
                              safeSubtask.priority,
                            )}`}
                          >
                            {safeSubtask.priority || "Medium"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Collaborators - match TaskDetailModal */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Collaborators
                      </label>
                      <div className="mt-1">
                        {safeSubtask.collaborators &&
                        safeSubtask.collaborators.length > 0 ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {safeSubtask.collaborators
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
                            {safeSubtask.collaborators.length > 3 && (
                              <div
                                className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white"
                                title={`${
                                  safeSubtask.collaborators.length - 3
                                } more`}
                                style={{ marginLeft: "-4px", zIndex: 7 }}
                              >
                                +{safeSubtask.collaborators.length - 3}
                              </div>
                            )}
                            <button
                              onClick={() =>
                                setCollaboratorModal({ isOpen: true })
                              }
                              className="ml-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Manage
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              setCollaboratorModal({ isOpen: true })
                            }
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Add collaborators
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress - match TaskDetailModal */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Progress
                      </label>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${safeSubtask.progress || 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 min-w-[3rem]">
                          {safeSubtask.progress || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description Section - match TaskDetailModal */}
              {isDetailsExpanded && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-500">
                      Description
                    </label>
                    {editingField !== "description" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingField("description");
                          setEditingValue(safeSubtask.description || "");
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit description"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {editingField === "description" ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={async () => {
                          await handleDescriptionUpdate(editingValue);
                          setEditingField(null);
                          setEditingValue("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setEditingField(null);
                            setEditingValue("");
                          } else if (
                            e.key === "Enter" &&
                            (e.metaKey || e.ctrlKey)
                          ) {
                            e.preventDefault();
                            handleDescriptionUpdate(editingValue);
                            setEditingField(null);
                            setEditingValue("");
                          }
                        }}
                        className="w-full text-sm text-gray-700 px-3 py-2 rounded-lg border-2 border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={4}
                        placeholder="Enter description..."
                        autoFocus
                      />
                      <div className="text-xs text-gray-400">
                        Press Ctrl+Enter or click outside to save, Esc to cancel
                      </div>
                    </div>
                  ) : (
                    <p
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField("description");
                        setEditingValue(safeSubtask.description || "");
                      }}
                      className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors min-h-[60px]"
                    >
                      {safeSubtask.description ||
                        "No description provided. Click to add description."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs Section - match TaskDetailModal */}
          <div>
            <div className="mb-4 px-4">
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-xl border border-white/40 rounded-2xl p-2 shadow-lg">
                <button
                  onClick={() => setActiveTab("subtasks")}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === "subtasks"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-transparent text-gray-700 hover:bg-white/50"
                  }`}
                >
                  Sub-Tasks
                </button>
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === "comments"
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-transparent text-gray-700 hover:bg-white/50"
                  }`}
                >
                  Comment
                </button>
              </div>
            </div>

            <div className="bg-gray-50 px-4 pb-6">
              {activeTab === "subtasks" ? (
                <SubTasksSection
                  task={
                    safeSubtask.task
                      ? typeof safeSubtask.task === "object"
                        ? safeSubtask.task
                        : { id: safeSubtask.task }
                      : task
                  }
                  parentSubtask={safeSubtask}
                  onTaskUpdate={async () => {
                    await loadSubtask();
                    if (onTaskRefresh) {
                      await onTaskRefresh();
                    }
                  }}
                  onSubtaskClick={onNavigateToSubtask}
                />
              ) : (
                <div className="flex flex-col h-[600px] min-h-0 rounded-2xl overflow-hidden bg-white border border-white/40 shadow-sm">
                  <CommentsSection subtask={safeSubtask} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}
      <CollaboratorModal
        isOpen={collaboratorModal.isOpen}
        onClose={() => setCollaboratorModal({ isOpen: false })}
        subtask={localSubtask}
        onUpdate={async (task, updatedSubtask) => {
          if (updatedSubtask) {
            setLocalSubtask(updatedSubtask);
            await loadSubtask();
            if (onTaskRefresh) {
              await onTaskRefresh();
            }
          }
        }}
      />
    </>
  );
}
