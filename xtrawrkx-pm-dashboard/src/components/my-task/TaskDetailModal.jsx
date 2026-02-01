"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Maximize2,
  ExternalLink,
  Calendar,
  Flag,
  ChevronDown,
  ChevronUp,
  Edit,
  CheckCircle2,
} from "lucide-react";
import confetti from "canvas-confetti";
import SubTasksSection from "../shared/SubTasksSection";
import CommentsSection from "../shared/CommentsSection";
import ProjectSelector from "./ProjectSelector";
import CollaboratorModal from "./CollaboratorModal";
import taskService from "../../lib/taskService";
import projectService from "../../lib/projectService";
import apiClient from "../../lib/apiClient";
import { transformProject, formatDate } from "../../lib/dataTransformers";

const TaskDetailModal = ({
  isOpen,
  onClose,
  task,
  onOpenProject,
  onOpenFullPage,
  onEditTask,
  onTaskRefresh,
  onSubtaskClick,
}) => {
  const [activeTab, setActiveTab] = useState("subtasks");
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [localTask, setLocalTask] = useState(task);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [collaboratorModal, setCollaboratorModal] = useState({
    isOpen: false,
  });
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true);

  // Update local task when prop changes (especially status and priority updates from parent)
  useEffect(() => {
    if (task) {
      setLocalTask((prev) => {
        // If task prop has a status or priority update, use it immediately
        if (
          (task.status && (!prev || prev.status !== task.status)) ||
          (task.priority && (!prev || prev.priority !== task.priority))
        ) {
          return { ...task };
        }
        // Otherwise merge to preserve any local optimistic updates
        return prev ? { ...prev, ...task } : task;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, task?.status, task?.priority, task?.scheduledDate]);

  // Load projects and users
  useEffect(() => {
    if (!isOpen) return;

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
          projectsResponse?.data?.map(transformProject) || [];
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
  }, [isOpen]);

  // Reset active tab when task changes
  useEffect(() => {
    if (task?.id) {
      setActiveTab("subtasks");
    }
  }, [task?.id]);

  if (!isOpen || !localTask) return null;

  // Ensure task has required properties with fallbacks
  const safeTask = {
    ...localTask,
    id: localTask.id,
    name: localTask.name || "Untitled Task",
    project: localTask.project || null,
    assignee: localTask.assignee || null,
    dueDate: localTask.dueDate || "No due date",
    status: localTask.status || "To Do",
    priority: localTask.priority || "Medium",
    progress: localTask.progress || 0,
    collaborators: localTask.collaborators || [],
    subtasks: localTask.subtasks || [],
    comments: localTask.comments || [],
    description: localTask.description || "",
  };

  // Helper functions
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

  // Update handlers
  const handleStatusUpdate = async (newStatus) => {
    if (!localTask?.id) return;
    const taskId = localTask.id;
    const oldStatus = localTask.status;

    // Update local state immediately for instant feedback (optimistic update)
    setLocalTask((prev) => ({ ...prev, status: newStatus }));

    try {
      // Transform frontend status to Strapi format before sending
      const { transformStatusToStrapi } =
        await import("../../lib/dataTransformers");
      const strapiStatus = transformStatusToStrapi(newStatus);

      // Update on server using the transformed status
      await taskService.updateTask(taskId, { status: strapiStatus });

      // Notify parent immediately to update the table (same pattern as due date)
      // This will update the task list in real-time
      if (onTaskRefresh) {
        try {
          await onTaskRefresh();
        } catch (refreshError) {
          console.warn("Could not refresh parent task list:", refreshError);
          // Don't throw - the update might have succeeded
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert optimistic update on error
      setLocalTask((prev) => ({ ...prev, status: oldStatus }));

      // Provide user-friendly error message
      const errorMessage = error.message || "Unknown error";
      if (
        errorMessage.includes("Network error") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Cannot connect")
      ) {
        console.error("Backend connection error. Please ensure:");
        console.error(
          "1. The Strapi backend is running on http://localhost:1337",
        );
        console.error("2. CORS is configured correctly in Strapi");
        console.error("3. Check the backend server logs for errors");
        // Don't show alert for network errors - just log to console
        // The user can check the console for details
      } else {
        // Show alert for other errors
        alert(`Failed to update status: ${errorMessage}`);
      }
    }
  };

  const handlePriorityUpdate = async (newPriority) => {
    if (!localTask?.id) return;
    const taskId = localTask.id;
    const oldPriority = localTask.priority;

    // Update local state immediately for instant feedback
    setLocalTask((prev) => ({ ...prev, priority: newPriority }));

    try {
      // Transform frontend priority to Strapi format before sending
      const { transformPriorityToStrapi } =
        await import("../../lib/dataTransformers");
      const strapiPriority = transformPriorityToStrapi(newPriority);

      // Update on server using the transformed priority
      await taskService.updateTask(taskId, { priority: strapiPriority });

      // Notify parent immediately to update the table (same pattern as status and due date)
      // This will update the task list in real-time
      if (onTaskRefresh) {
        try {
          await onTaskRefresh();
        } catch (refreshError) {
          console.warn("Could not refresh parent task list:", refreshError);
          // Don't throw - the update might have succeeded
        }
      }
    } catch (error) {
      console.error("Error updating priority:", error);
      // Revert optimistic update on error
      setLocalTask((prev) => ({ ...prev, priority: oldPriority }));

      // Provide user-friendly error message
      const errorMessage = error.message || "Unknown error";
      if (
        errorMessage.includes("Network error") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Cannot connect")
      ) {
        console.error("Backend connection error. Please ensure:");
        console.error(
          "1. The Strapi backend is running on http://localhost:1337",
        );
        console.error("2. CORS is configured correctly in Strapi");
        console.error("3. Check the backend server logs for errors");
        // Don't show alert for network errors - just log to console
        // The user can check the console for details
      } else {
        // Show alert for other errors
        alert(`Failed to update priority: ${errorMessage}`);
      }
    }
  };

  const handleAssigneeUpdate = async (newAssigneeId) => {
    if (!safeTask?.id) return;
    try {
      await taskService.updateTask(safeTask.id, {
        assignee: newAssigneeId || null,
      });
      if (onTaskRefresh) {
        await onTaskRefresh();
      }
    } catch (error) {
      console.error("Error updating assignee:", error);
    }
  };

  const handleDescriptionUpdate = async (newDescription) => {
    if (!safeTask?.id) return;
    const oldDescription = safeTask.description || task?.description || "";

    // Optimistic update
    setLocalTask((prev) => ({ ...prev, description: newDescription }));

    try {
      await taskService.updateTask(safeTask.id, {
        description: newDescription || "",
      });
      if (onTaskRefresh) {
        await onTaskRefresh();
      }
    } catch (error) {
      console.error("Error updating description:", error);
      // Revert optimistic update on error
      setLocalTask((prev) => ({ ...prev, description: oldDescription }));
    }
  };

  const handleDueDateUpdate = async (newDate) => {
    if (!safeTask?.id) return;
    try {
      const dateValue = newDate ? new Date(newDate).toISOString() : null;
      await taskService.updateTask(safeTask.id, { scheduledDate: dateValue });
      const formattedDate = newDate ? formatDate(dateValue) : "No due date";
      setLocalTask({
        ...safeTask,
        scheduledDate: dateValue,
        dueDate: formattedDate,
      });
      if (onTaskRefresh) onTaskRefresh();
    } catch (error) {
      console.error("Error updating due date:", error);
    }
  };

  const handleToggleComplete = async () => {
    if (!localTask?.id) return;
    const isCurrentlyComplete =
      localTask.status === "Done" ||
      localTask.status === "COMPLETED" ||
      localTask.status?.toLowerCase() === "done";
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

  const isComplete =
    safeTask.status === "Done" ||
    safeTask.status === "COMPLETED" ||
    safeTask.status?.toLowerCase() === "done";

  // const getStatusColor = (status) => {
  //   switch (status) {
  //     case "In Review":
  //       return "bg-green-100 text-green-700 border-green-200";
  //     case "In Progress":
  //       return "bg-blue-100 text-blue-700 border-blue-200";
  //     case "Done":
  //       return "bg-green-100 text-green-700 border-green-200";
  //     case "To Do":
  //       return "bg-orange-100 text-orange-700 border-orange-200";
  //     case "Backlog":
  //       return "bg-purple-100 text-purple-700 border-purple-200";
  //     default:
  //       return "bg-gray-100 text-gray-700 border-gray-200";
  //   }
  // };

  const modalClasses =
    "fixed inset-0 top-0 flex items-stretch justify-end z-[80] pointer-events-none !mt-0";
  const contentClasses =
    "bg-white shadow-2xl w-[600px] h-full border-l border-gray-200 flex flex-col pointer-events-auto";

  return (
    <div className={modalClasses}>
      <div className={contentClasses}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h1
              className={`text-xl font-semibold truncate pr-4 ${
                isComplete ? "text-gray-500 line-through" : "text-gray-900"
              }`}
            >
              {safeTask.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Task Button */}
            {onEditTask && (
              <button
                onClick={() => onEditTask(safeTask)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                title="Edit task"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            {/* Open Project Button */}
            <button
              onClick={() => onOpenProject?.(safeTask.project)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            >
              <ExternalLink className="w-4 h-4" />
              Open Project
            </button>

            {/* Full Page Button */}
            <button
              onClick={() => onOpenFullPage?.(safeTask)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            >
              <Maximize2 className="w-4 h-4" />
              Full
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content - Single scroll for whole modal body */}
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
          {/* Task Details Card - Matching lead-companies detail page */}
          <div className="px-4 py-4">
            <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-4">
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

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Task Details
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
                    {/* Assignee */}
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
                          <div className="flex items-center gap-2">
                            {(() => {
                              const assigneeAvatar = getAssigneeAvatar(
                                safeTask.assignee,
                              );
                              return (
                                <>
                                  <div
                                    className={`w-8 h-8 ${assigneeAvatar.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                                  >
                                    {assigneeAvatar.initials}
                                  </div>
                                  <span
                                    className="text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded flex-1"
                                    onClick={() => {
                                      setEditingValue(
                                        safeTask.assignee?.id?.toString() || "",
                                      );
                                      setEditingField("assignee");
                                    }}
                                  >
                                    {typeof safeTask.assignee === "object"
                                      ? safeTask.assignee?.name || "Unassigned"
                                      : safeTask.assignee || "Unassigned"}
                                  </span>
                                  {safeTask.assignee && (
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
                                        safeTask.assignee?.id?.toString() || "",
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

                    {/* Due Date */}
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
                              className="text-gray-900 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded flex-1"
                              onClick={() => {
                                const dateValue = safeTask.scheduledDate
                                  ? new Date(safeTask.scheduledDate)
                                      .toISOString()
                                      .split("T")[0]
                                  : "";
                                setEditingValue(dateValue);
                                setEditingField("dueDate");
                              }}
                            >
                              {safeTask.dueDate || "No due date"}
                            </p>
                            {safeTask.dueDate && (
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

                    {/* Status */}
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
                              setEditingValue(safeTask.status || "To Do");
                              setEditingField("status");
                            }}
                            className={`inline-block px-3 py-1.5 rounded-lg border-2 font-bold text-xs cursor-pointer hover:shadow-md transition-all ${getStatusColor(
                              safeTask.status,
                            )}`}
                          >
                            {safeTask.status || "To Do"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Priority */}
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
                              setEditingValue(safeTask.priority || "Medium");
                              setEditingField("priority");
                            }}
                            className={`inline-block px-3 py-1.5 rounded-lg border-2 font-bold text-xs cursor-pointer hover:shadow-md transition-all ${getPriorityColor(
                              safeTask.priority,
                            )}`}
                          >
                            {safeTask.priority || "Medium"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Project */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Project
                      </label>
                      <div className="mt-1">
                        <ProjectSelector
                          task={safeTask}
                          projects={projects}
                          onUpdate={(updatedTask) => {
                            setLocalTask(updatedTask);
                            if (onTaskRefresh) onTaskRefresh();
                          }}
                        />
                      </div>
                    </div>

                    {/* Collaborators */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Collaborators
                      </label>
                      <div className="mt-1">
                        {safeTask.collaborators &&
                        safeTask.collaborators.length > 0 ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            {safeTask.collaborators
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
                            {safeTask.collaborators.length > 3 && (
                              <div
                                className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-xs font-bold border-2 border-white"
                                title={`${
                                  safeTask.collaborators.length - 3
                                } more`}
                                style={{ marginLeft: "-4px", zIndex: 7 }}
                              >
                                +{safeTask.collaborators.length - 3}
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

                    {/* Progress */}
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Progress
                      </label>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${safeTask.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 min-w-[3rem]">
                          {safeTask.progress || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Description Section */}
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
                          setEditingValue(
                            task.description || safeTask.description || "",
                          );
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
                        setEditingValue(
                          task.description || safeTask.description || "",
                        );
                      }}
                      className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-gray-50 px-2 py-1 rounded transition-colors min-h-[60px]"
                    >
                      {task.description ||
                        safeTask.description ||
                        "No description provided. Click to add description."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs Section */}
          <div>
            {/* Tab Headers */}
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

            {/* Tab Content - Comments use fixed height (like lead companies) to avoid gap at bottom */}
            <div className="bg-gray-50 px-4 pb-6">
              {activeTab === "subtasks" ? (
                <SubTasksSection
                  task={safeTask}
                  onTaskUpdate={onTaskRefresh}
                  onSubtaskClick={onSubtaskClick}
                />
              ) : (
                <div className="flex flex-col h-[600px] min-h-0 rounded-2xl overflow-hidden bg-white border border-white/40 shadow-sm">
                  <CommentsSection task={safeTask} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collaborator Modal */}
      <CollaboratorModal
        isOpen={collaboratorModal.isOpen}
        onClose={() => setCollaboratorModal({ isOpen: false })}
        task={safeTask}
        onUpdate={async (updatedTask) => {
          setLocalTask(updatedTask);
          if (onTaskRefresh) {
            await onTaskRefresh();
          }
        }}
      />
    </div>
  );
};

export default TaskDetailModal;
