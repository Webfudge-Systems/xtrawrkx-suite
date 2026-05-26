"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Table } from "../ui";
import { Check, Calendar, Clock, Eye, GitBranch } from "lucide-react";
import ProjectSelector from "../my-task/ProjectSelector";
import taskService from "../../lib/taskService";
import projectService from "../../lib/projectService";
import subtaskService from "../../lib/subtaskService";
import {
  transformStatus,
  transformStatusToStrapi,
  transformPriorityToStrapi,
  transformSubtask,
} from "../../lib/dataTransformers";
import {
  assertStatusChangeAllowed,
  getEditableStatusOptionsByLabel,
  STATUS_REVERT_TO_ASSIGNED_MESSAGE,
} from "../../lib/taskStatusConstants";

const AssignedTasksTable = ({
  data,
  onTaskComplete = () => {},
  onTaskUpdate = () => {},
  projects = [],
}) => {
  const router = useRouter();
  const [loadedSubtasks, setLoadedSubtasks] = useState({});
  const [allProjects, setAllProjects] = useState(projects);
  // Local state to track status updates for immediate UI feedback
  const [localStatusUpdates, setLocalStatusUpdates] = useState({});
  // Local state to track due date updates for immediate UI feedback
  const [localDueDateUpdates, setLocalDueDateUpdates] = useState({});

  // Load projects if not provided
  React.useEffect(() => {
    if (projects.length === 0) {
      projectService.getAllProjects({ pageSize: 50 }).then((response) => {
        setAllProjects(
          response.data?.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
          })) || []
        );
      });
    }
  }, [projects]);

  // Load subtasks for tasks
  useEffect(() => {
    if (!data || data.length === 0) return;

    const loadSubtaskCounts = async () => {
      // Get tasks that don't have subtasks loaded yet
      const tasksNeedingCounts = data.filter(
        (task) => !loadedSubtasks[task.id] && task.id
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
              }
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
  }, [data?.length]);

  // Handle status updates
  const handleStatusUpdate = async (taskId, newStatus) => {
    if (!taskId) return;

    const existingTask = data.find((t) => t.id === taskId);
    const currentStatus =
      localStatusUpdates[taskId] !== undefined
        ? localStatusUpdates[taskId]
        : transformStatus(existingTask?.status || "Assigned");
    const guard = assertStatusChangeAllowed(currentStatus, newStatus);
    if (!guard.ok) {
      alert(guard.message || STATUS_REVERT_TO_ASSIGNED_MESSAGE);
      return;
    }

    // Optimistically update local state immediately for instant UI feedback
    setLocalStatusUpdates((prev) => ({
      ...prev,
      [taskId]: newStatus,
    }));

    const strapiStatus = transformStatusToStrapi(newStatus);

    // Notify parent to update its state
    if (onTaskComplete) {
      onTaskComplete(taskId, newStatus);
    }

    try {
      await taskService.updateTaskStatus(taskId, strapiStatus);
    } catch (error) {
      console.error("Error updating task status:", error);
      // Revert optimistic update on error
      setLocalStatusUpdates((prev) => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
    }
  };

  // Merge local status and due date updates with data prop for immediate UI feedback
  const tasksWithLocalUpdates = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((task) => {
      // Use local update if available, otherwise transform the status from backend
      const status =
        localStatusUpdates[task.id] !== undefined
          ? localStatusUpdates[task.id]
          : transformStatus(task.status || "To Do");

      // ALWAYS use local due date update if available - it takes precedence
      // This ensures optimistic updates are never overwritten
      let scheduledDate = task.scheduledDate;
      if (localDueDateUpdates[task.id] !== undefined) {
        scheduledDate = localDueDateUpdates[task.id];
      }

      return {
        ...task,
        status: status,
        scheduledDate: scheduledDate,
      };
    });
  }, [data, localStatusUpdates, localDueDateUpdates]);

  // Handle priority updates
  const handlePriorityUpdate = async (taskId, newPriority) => {
    const strapiPriority = transformPriorityToStrapi(newPriority);
    try {
      await taskService.updateTask(taskId, { priority: strapiPriority });

      // Notify parent component to update the task
      if (onTaskUpdate) {
        onTaskUpdate(taskId, { priority: newPriority });
      } else if (onTaskComplete) {
        // Fallback to onTaskComplete if onTaskUpdate is not provided
        onTaskComplete(taskId, null);
      }
    } catch (error) {
      console.error("Error updating task priority:", error);
    }
  };

  // Handle due date updates - using same pattern as handleStatusUpdate
  const handleDueDateUpdate = async (taskId, newDate) => {
    if (!taskId) return;

    const scheduledDate = newDate
      ? new Date(newDate + "T00:00:00").toISOString()
      : null;

    // Find the original task to store for potential rollback
    const originalTask = data.find((task) => task.id === taskId);
    const originalScheduledDate = originalTask?.scheduledDate;

    // Optimistically update local state immediately for instant UI feedback - same as status
    setLocalDueDateUpdates((prev) => ({
      ...prev,
      [taskId]: scheduledDate,
    }));

    // Notify parent to update its state immediately - same as status
    if (onTaskUpdate) {
      onTaskUpdate(taskId, { scheduledDate });
    }

    try {
      await taskService.updateTask(taskId, { scheduledDate });
    } catch (error) {
      console.error("Error updating due date:", error);
      // Revert optimistic update on error - same as status
      setLocalDueDateUpdates((prev) => {
        const updated = { ...prev };
        if (originalScheduledDate !== undefined) {
          updated[taskId] = originalScheduledDate;
        } else {
          delete updated[taskId];
        }
        return updated;
      });
      // Revert parent state
      if (onTaskUpdate) {
        onTaskUpdate(taskId, { scheduledDate: originalScheduledDate });
      }
    }
  };

  const handleTimeAllottedUpdate = async (taskId, hours) => {
    if (!taskId) return;

    const originalTask = data.find((task) => task.id === taskId);
    const originalValue = originalTask?.timeAllotted;

    if (onTaskUpdate) {
      onTaskUpdate(taskId, { timeAllotted: hours });
    }

    try {
      await taskService.updateTask(taskId, { timeAllotted: hours });
    } catch (error) {
      console.error("Error updating time allotted:", error);
      if (onTaskUpdate) {
        onTaskUpdate(taskId, { timeAllotted: originalValue });
      }
    }
  };

  // Handle task click - navigate to task detail page
  const handleTaskClick = (task) => {
    if (task?.id) {
      router.push(`/my-task/${task.slug || task.id}`);
    }
  };

  const columns = [
    {
      key: "name",
      label: "TASK NAME",
      render: (_, task) => {
        const isDone =
          task.status?.toLowerCase() === "done" ||
          task.status?.toLowerCase() === "completed";

        // Check if task has subtasks
        const taskSubtasks = task.subtasks || [];
        const loadedTaskSubtasks = loadedSubtasks[task.id] || [];
        const allSubtasks =
          loadedTaskSubtasks.length > 0 ? loadedTaskSubtasks : taskSubtasks;
        const rootSubtasks = allSubtasks.filter((st) => {
          if (!st) return false;
          return (
            !st.parentSubtask ||
            st.parentSubtask === null ||
            (typeof st.parentSubtask === "object" && !st.parentSubtask.id)
          );
        });
        const hasSubtasks = rootSubtasks.length > 0;

        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isDone) {
                  handleStatusUpdate(task.id, "To Do");
                } else {
                  handleStatusUpdate(task.id, "Done");
                }
              }}
              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                isDone
                  ? "bg-green-500 border-green-500 text-white hover:bg-green-600"
                  : "border-gray-300 hover:border-green-500 hover:bg-green-50 cursor-pointer"
              }`}
              title={
                isDone ? "Click to mark as incomplete" : "Mark as complete"
              }
            >
              {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>
            <div className="min-w-0 flex-1 flex items-center gap-1.5">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskClick(task);
                }}
                className={`text-sm font-medium truncate cursor-pointer hover:bg-gray-50 px-1.5 py-0.5 rounded transition-colors flex-1 min-w-0 ${
                  isDone ? "line-through text-gray-500" : "text-gray-900"
                }`}
                title="Click to view task"
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
          projects={allProjects}
          onUpdate={() => {}}
        />
      ),
    },
    {
      key: "assignee",
      label: "ASSIGNEE",
      render: (_, task) => {
        const collaborators =
          task.collaborators || (task.assignee ? [task.assignee] : []);
        const hasCollaborators = collaborators.length > 0;

        return (
          <div className="flex items-center gap-1.5 min-w-[140px]">
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
                    className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 flex-shrink-0 border border-white"
                    title={`${collaborators.length - 3} more`}
                    style={{ marginLeft: "-4px", zIndex: 7 }}
                  >
                    +{collaborators.length - 3}
                  </div>
                )}
                <span className="text-xs text-gray-600 truncate ml-0.5">
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
                <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                  U
                </div>
                <span className="text-xs text-gray-600 truncate">
                  Unassigned
                </span>
              </>
            )}
          </div>
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
            className="flex items-center gap-1.5 min-w-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
            <input
              type="date"
              value={currentValue || ""}
              onChange={(e) => {
                const newValue = e.target.value;
                handleDueDateUpdate(task.id, newValue);
              }}
              className="flex-1 text-xs text-gray-700 px-1.5 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="dd-mm-yyyy"
            />
          </div>
        );
      },
    },
    {
      key: "timeAllotted",
      label: "TIME ALLOTTED",
      render: (_, task) => (
        <div
          className="flex items-center gap-1.5 min-w-[120px]"
          onClick={(e) => e.stopPropagation()}
        >
          <Clock className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
          <input
            type="number"
            min="0"
            step="0.5"
            value={
              task.timeAllotted != null && task.timeAllotted !== ""
                ? task.timeAllotted
                : ""
            }
            onChange={(e) => {
              const raw = e.target.value;
              handleTimeAllottedUpdate(
                task.id,
                raw === "" ? null : parseFloat(raw),
              );
            }}
            className="w-14 text-xs text-gray-700 px-1.5 py-0.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="—"
          />
          <span className="text-xs text-gray-500">hrs</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "STATUS",
      render: (_, task) => {
        let currentStatus =
          localStatusUpdates[task.id] !== undefined
            ? localStatusUpdates[task.id]
            : transformStatus(task.status || "Assigned");
        const statusOptions = getEditableStatusOptionsByLabel(currentStatus);

        const status = currentStatus?.toLowerCase().replace(/\s+/g, "-") || "";

        const statusColors = {
          assigned: {
            bg: "bg-blue-100",
            text: "text-blue-800",
            border: "border-blue-400",
          },
          accepted: {
            bg: "bg-teal-100",
            text: "text-teal-800",
            border: "border-teal-400",
          },
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
          "on-hold": {
            bg: "bg-orange-100",
            text: "text-orange-800",
            border: "border-orange-400",
          },
          "pending-review": {
            bg: "bg-purple-100",
            text: "text-purple-800",
            border: "border-purple-400",
          },
          "revision-required": {
            bg: "bg-amber-100",
            text: "text-amber-800",
            border: "border-amber-400",
          },
          "internal-review": {
            bg: "bg-purple-100",
            text: "text-purple-800",
            border: "border-purple-400",
          },
          "waiting-for-client": {
            bg: "bg-indigo-100",
            text: "text-indigo-800",
            border: "border-indigo-400",
          },
          "client-review": {
            bg: "bg-indigo-100",
            text: "text-indigo-800",
            border: "border-indigo-400",
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
                const selectedStatus = e.target.value;
                handleStatusUpdate(task.id, selectedStatus);
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

        const currentPriority = task.priority || "Medium";
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
          <div className="min-w-[100px]" onClick={(e) => e.stopPropagation()}>
            <select
              value={currentPriority}
              onChange={(e) => {
                e.stopPropagation();
                handlePriorityUpdate(task.id, e.target.value);
              }}
              className={`w-full ${colors.bg} ${colors.text} ${colors.border} border-2 rounded-lg px-2 py-1.5 font-bold text-xs text-center shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none`}
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.4rem center",
                paddingRight: "1.75rem",
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
      render: (_, task) => (
        <div className="min-w-[100px]">
          <div className="flex items-center gap-1.5">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${task.progress || 0}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-900">
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
        <div className="flex items-center gap-1 min-w-[80px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTaskClick(task);
            }}
            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="View Task"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">My Tasks</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tasks where you are a collaborator
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 overflow-x-auto">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-base mb-2">
              You don&apos;t have any tasks
            </p>
            <p className="text-gray-500 text-sm text-center max-w-xs">
              Tasks where you are a collaborator will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden">
            <Table
              columns={columns}
              data={tasksWithLocalUpdates}
              onRowClick={handleTaskClick}
              className="min-w-[1600px] text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedTasksTable;
