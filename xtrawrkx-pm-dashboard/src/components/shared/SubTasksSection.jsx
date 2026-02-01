"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Check,
  X,
  User,
  Clock,
  GitBranch,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import subtaskService from "../../lib/subtaskService";
import { transformSubtask } from "../../lib/dataTransformers";
import apiClient from "../../lib/apiClient";
import SubtaskDetailModal from "./SubtaskDetailModal";

const SubTasksSection = ({
  task,
  parentSubtask,
  onTaskUpdate,
  onSubtaskClick,
}) => {
  const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use subtasks from task prop, or fallback to empty array
  // If parentSubtask is provided, use its childSubtasks
  const taskSubtasks = parentSubtask
    ? parentSubtask.childSubtasks || parentSubtask.subtasks || []
    : task?.subtasks || task?.childSubtasks || [];

  // Convert task subtasks to local format
  const initialSubtasks = taskSubtasks.map((subtask) => ({
    id: subtask.id,
    name: subtask.name || subtask.title,
    completed: subtask.status === "Done" || subtask.status === "COMPLETED",
    assignee:
      typeof subtask.assignee === "object"
        ? subtask.assignee?.name
        : subtask.assignee || "Unassigned",
    dueDate: subtask.dueDate || null,
    status: subtask.status,
    priority: subtask.priority || "medium",
  }));

  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [expandedSubtasks, setExpandedSubtasks] = useState({});
  const [nestedSubtasks, setNestedSubtasks] = useState({});

  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState("");
  const [newSubtaskDueDate, setNewSubtaskDueDate] = useState("");
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load users when component mounts
  useEffect(() => {
    loadUsers();
  }, []);

  // Update subtasks when task or parentSubtask changes
  useEffect(() => {
    const loadSubtasks = async () => {
      let taskSubtasks = [];

      if (parentSubtask?.id) {
        // If parentSubtask is provided, fetch only direct children from API
        try {
          const childSubtasksResponse = await subtaskService.getChildSubtasks(
            parentSubtask.id,
            {
              populate: ["assignee", "childSubtasks"],
            },
          );
          taskSubtasks = childSubtasksResponse.data || [];
        } catch (error) {
          console.error("Error loading child subtasks:", error);
          // Fallback to using populated data if API fails
          taskSubtasks =
            parentSubtask.childSubtasks || parentSubtask.subtasks || [];
        }
      } else if (task?.id) {
        // When showing task subtasks, fetch only root-level subtasks (no parent)
        try {
          const rootSubtasksResponse =
            await subtaskService.getRootSubtasksByTask(task.id, {
              populate: ["assignee", "childSubtasks"],
            });
          taskSubtasks = rootSubtasksResponse.data || [];
        } catch (error) {
          console.error("Error loading root subtasks:", error);
          // Fallback to filtering existing subtasks
          const allSubtasks = task?.subtasks || task?.childSubtasks || [];
          taskSubtasks = allSubtasks.filter((subtask) => {
            const hasNoParent =
              !subtask.parentSubtask ||
              subtask.parentSubtask === null ||
              subtask.parentSubtask === undefined ||
              (typeof subtask.parentSubtask === "object" &&
                !subtask.parentSubtask.id);
            return hasNoParent;
          });
        }
      }


      // Convert task subtasks to local format
      const updatedSubtasks = taskSubtasks.map((subtask) => {
        const transformed = transformSubtask(subtask);
        return {
          id: transformed.id,
          name: transformed.name || transformed.title,
          completed:
            transformed.status === "Done" || transformed.status === "COMPLETED",
          assignee:
            typeof transformed.assignee === "object"
              ? transformed.assignee?.name
              : transformed.assignee || "Unassigned",
          dueDate: transformed.dueDate || null,
          status: transformed.status,
          priority: transformed.priority || "medium",
          childSubtasks:
            transformed.childSubtasks || transformed.subtasks || [],
          childSubtasksCount: (
            transformed.childSubtasks ||
            transformed.subtasks ||
            []
          ).length,
        };
      });

      setSubtasks(updatedSubtasks);

      // Reset adding subtask state when task changes
      setIsAddingSubtask(false);
      setNewSubtaskName("");
      setNewSubtaskAssignee("");
      setNewSubtaskDueDate("");
    };

    loadSubtasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, parentSubtask?.id]);

  const loadUsers = async () => {
    setLoadingUsers(true);
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
      setLoadingUsers(false);
    }
  };

  const handleSubtaskClick = (subtaskId) => {
    if (onSubtaskClick) {
      onSubtaskClick(subtaskId);
    } else {
      setSelectedSubtaskId(subtaskId);
      setIsModalOpen(true);
    }
  };

  const toggleNestedSubtasks = async (subtaskId) => {
    const isExpanded = expandedSubtasks[subtaskId];

    if (isExpanded) {
      // Collapse
      setExpandedSubtasks((prev) => {
        const newState = { ...prev };
        delete newState[subtaskId];
        return newState;
      });
    } else {
      // Expand - load nested subtasks
      setExpandedSubtasks((prev) => ({ ...prev, [subtaskId]: true }));

      // Load nested subtasks if not already loaded
      if (!nestedSubtasks[subtaskId]) {
        try {
          const childSubtasks = await subtaskService.getChildSubtasks(
            subtaskId,
            {
              populate: ["assignee", "childSubtasks"],
            },
          );

          const transformed = (childSubtasks.data || []).map((st) => {
            const transformedSt = transformSubtask(st);
            return {
              id: transformedSt.id,
              name: transformedSt.name || transformedSt.title,
              completed:
                transformedSt.status === "Done" ||
                transformedSt.status === "COMPLETED",
              assignee:
                typeof transformedSt.assignee === "object"
                  ? transformedSt.assignee?.name
                  : transformedSt.assignee || "Unassigned",
              dueDate: transformedSt.dueDate || null,
              status: transformedSt.status,
              priority: transformedSt.priority || "medium",
              childSubtasks:
                transformedSt.childSubtasks || transformedSt.subtasks || [],
              childSubtasksCount: (
                transformedSt.childSubtasks ||
                transformedSt.subtasks ||
                []
              ).length,
            };
          });

          setNestedSubtasks((prev) => ({ ...prev, [subtaskId]: transformed }));
        } catch (error) {
          console.error("Error loading nested subtasks:", error);
        }
      }
    }
  };

  const handleAddSubtask = async () => {
    // Determine the parent task ID
    // If parentSubtask is provided, use its task reference
    // Otherwise use the task prop directly
    let parentTaskId;
    if (parentSubtask) {
      // For nested subtasks, get the task from the parent subtask
      parentTaskId = parentSubtask.task?.id || parentSubtask.task || task?.id;
    } else {
      // For root-level subtasks, use the task prop
      parentTaskId = task?.id;
    }

    if (!newSubtaskName.trim() || !parentTaskId) {
      console.warn("Cannot add subtask: missing name or task ID", {
        name: newSubtaskName,
        taskId: parentTaskId,
        hasTask: !!task,
        hasParentSubtask: !!parentSubtask,
      });
      return;
    }

    try {
      // Ensure task ID is an integer (Strapi requires integer IDs for relations)
      const taskId =
        typeof parentTaskId === "string"
          ? parseInt(parentTaskId, 10)
          : parentTaskId;

      if (!taskId || isNaN(taskId)) {
        throw new Error("Invalid task ID");
      }

      const newSubtaskData = {
        title: newSubtaskName.trim(),
        task: taskId,
        status: "SCHEDULED",
        priority: "MEDIUM",
        progress: 0,
        depth: parentSubtask ? (parentSubtask.depth || 0) + 1 : 0,
        order: subtasks.length + 1,
      };

      // If this is a nested subtask (parentSubtask provided), set the parent
      if (parentSubtask?.id) {
        const parentId =
          typeof parentSubtask.id === "string"
            ? parseInt(parentSubtask.id, 10)
            : parentSubtask.id;
        newSubtaskData.parentSubtask = parentId;
      }

      // Add assignee if provided
      if (newSubtaskAssignee) {
        const assigneeId =
          typeof newSubtaskAssignee === "string"
            ? parseInt(newSubtaskAssignee, 10)
            : newSubtaskAssignee;
        if (assigneeId && !isNaN(assigneeId)) {
          newSubtaskData.assignee = assigneeId;
        }
      }

      // Add due date if provided (format as date-only, no time)
      if (newSubtaskDueDate) {
        // Format as date-only string (YYYY-MM-DD) and convert to ISO datetime at midnight
        newSubtaskData.dueDate = new Date(
          newSubtaskDueDate + "T00:00:00",
        ).toISOString();
      }

      const createdSubtask = await subtaskService.createSubtask(newSubtaskData);

      // Handle different response formats
      const subtaskData = createdSubtask?.data || createdSubtask;
      if (!subtaskData) {
        throw new Error("Invalid response from subtask creation");
      }

      const transformedSubtask = transformSubtask(subtaskData);

      if (!transformedSubtask || !transformedSubtask.id) {
        throw new Error("Failed to transform subtask data");
      }

      // Update local state
      const newSubtask = {
        id: transformedSubtask.id,
        name: transformedSubtask.name || transformedSubtask.title,
        completed:
          transformedSubtask.status === "Done" ||
          transformedSubtask.status === "COMPLETED",
        assignee:
          typeof transformedSubtask.assignee === "object"
            ? transformedSubtask.assignee?.name || "Unassigned"
            : transformedSubtask.assignee || "Unassigned",
        dueDate: transformedSubtask.dueDate || null,
        status: transformedSubtask.status,
        priority: transformedSubtask.priority || "medium",
      };

      // Update local state immediately for better UX
      setSubtasks((prev) => [...prev, newSubtask]);
      setNewSubtaskName("");
      setNewSubtaskAssignee("");
      setNewSubtaskDueDate("");
      setIsAddingSubtask(false);

      // Clear nested subtasks cache if we added to a parent
      if (parentSubtask?.id) {
        setNestedSubtasks((prev) => {
          const newState = { ...prev };
          delete newState[parentSubtask.id];
          return newState;
        });
      }

      // Notify parent to refresh task data
      if (onTaskUpdate) {
        // Use setTimeout to ensure state update completes first
        setTimeout(() => {
          onTaskUpdate();
        }, 100);
      }
    } catch (error) {
      console.error("Error creating subtask:", error);
      alert(`Failed to create subtask: ${error.message || "Unknown error"}`);
    }
  };

  const toggleSubtaskComplete = async (id) => {
    const subtask = subtasks.find((s) => s.id === id);
    if (!subtask) return;

    const newCompleted = !subtask.completed;
    const newStatus = newCompleted ? "COMPLETED" : "SCHEDULED";

    try {
      // Update in backend
      await subtaskService.updateSubtaskStatus(id, newStatus);

      // Update local state
      setSubtasks(
        subtasks.map((s) =>
          s.id === id
            ? {
                ...s,
                completed: newCompleted,
                status: newCompleted ? "Done" : "To Do",
              }
            : s,
        ),
      );

      // Update nested subtasks if this subtask is in a nested list
      Object.keys(nestedSubtasks).forEach((parentId) => {
        const nested = nestedSubtasks[parentId];
        const updatedNested = nested.map((s) =>
          s.id === id
            ? {
                ...s,
                completed: newCompleted,
                status: newCompleted ? "Done" : "To Do",
              }
            : s,
        );
        if (JSON.stringify(nested) !== JSON.stringify(updatedNested)) {
          setNestedSubtasks((prev) => ({ ...prev, [parentId]: updatedNested }));
        }
      });

      // Notify parent to refresh task data
      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error("Error updating subtask status:", error);
    }
  };

  const deleteSubtask = async (id) => {
    if (!confirm("Are you sure you want to delete this subtask?")) return;

    try {
      await subtaskService.deleteSubtask(id);

      // Update local state
      setSubtasks(subtasks.filter((subtask) => subtask.id !== id));

      // Notify parent to refresh task data
      if (onTaskUpdate) {
        onTaskUpdate();
      }
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 flex-1 overflow-y-auto">
        {/* Add Subtask Button */}
        <div className="mb-6">
          {!isAddingSubtask ? (
            <button
              onClick={() => setIsAddingSubtask(true)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-2 border-dashed border-blue-300 w-full justify-center bg-blue-50/30"
            >
              <Plus className="w-4 h-4" />
              Add sub-task
            </button>
          ) : (
            <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
              {/* Task Name Input */}
              <input
                type="text"
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                placeholder="Enter subtask name..."
                className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleAddSubtask();
                  } else if (e.key === "Escape") {
                    setIsAddingSubtask(false);
                    setNewSubtaskName("");
                    setNewSubtaskAssignee("");
                    setNewSubtaskDueDate("");
                  }
                }}
              />

              {/* Assignee and Due Date Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Assignee Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Assign To
                  </label>
                  <select
                    value={newSubtaskAssignee}
                    onChange={(e) => setNewSubtaskAssignee(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    disabled={loadingUsers}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due Date Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newSubtaskDueDate}
                    onChange={(e) => setNewSubtaskDueDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsAddingSubtask(false);
                    setNewSubtaskName("");
                    setNewSubtaskAssignee("");
                    setNewSubtaskDueDate("");
                  }}
                  className="px-3 py-1.5 text-sm font-medium border-2 border-gray-400 bg-white text-gray-800 rounded hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubtask}
                  disabled={!newSubtaskName.trim()}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Subtasks List */}
        {subtasks.length > 0 ? (
          <div className="space-y-4">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
                onClick={(e) => {
                  // Don't open modal if clicking on checkbox or delete button
                  if (e.target.closest("button")) return;
                  handleSubtaskClick(subtask.id);
                }}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubtaskComplete(subtask.id);
                  }}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    subtask.completed
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-gray-300 hover:border-green-400"
                  }`}
                >
                  {subtask.completed && <Check className="w-3 h-3" />}
                </button>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <h4
                        className={`text-sm font-medium ${
                          subtask.completed
                            ? "text-gray-500 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {subtask.name}
                      </h4>

                      {/* Nested Subtasks Icon with Count */}
                      {(subtask.childSubtasksCount > 0 ||
                        nestedSubtasks[subtask.id]?.length > 0) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNestedSubtasks(subtask.id);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title={`${
                            subtask.childSubtasksCount ||
                            nestedSubtasks[subtask.id]?.length ||
                            0
                          } nested subtasks`}
                        >
                          {expandedSubtasks[subtask.id] ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                          <GitBranch className="w-3 h-3" />
                          <span className="font-medium">
                            {subtask.childSubtasksCount ||
                              nestedSubtasks[subtask.id]?.length ||
                              0}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubtask(subtask.id);
                        }}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete subtask"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 mt-2">
                    {subtask.assignee && subtask.assignee !== "Unassigned" && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{subtask.assignee}</span>
                      </div>
                    )}
                    {subtask.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>Due: {subtask.dueDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Nested Subtasks Dropdown */}
                  {expandedSubtasks[subtask.id] &&
                    nestedSubtasks[subtask.id] &&
                    nestedSubtasks[subtask.id].length > 0 && (
                      <div className="mt-3 ml-8 pl-4 border-l-2 border-blue-200 space-y-2">
                        {nestedSubtasks[subtask.id].map((nestedSubtask) => (
                          <div
                            key={nestedSubtask.id}
                            className="flex items-start gap-2 p-2 bg-blue-50/50 rounded border border-blue-100 hover:bg-blue-50 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSubtaskClick(nestedSubtask.id);
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSubtaskComplete(nestedSubtask.id);
                              }}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
                                nestedSubtask.completed
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-gray-300 hover:border-green-400"
                              }`}
                            >
                              {nestedSubtask.completed && (
                                <Check className="w-2.5 h-2.5" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-medium ${
                                    nestedSubtask.completed
                                      ? "text-gray-500 line-through"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {nestedSubtask.name}
                                </span>
                                {nestedSubtask.childSubtasksCount > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-blue-600">
                                    <GitBranch className="w-3 h-3" />
                                    <span>
                                      {nestedSubtask.childSubtasksCount}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                {nestedSubtask.assignee &&
                                  nestedSubtask.assignee !== "Unassigned" && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <User className="w-2.5 h-2.5" />
                                      <span>{nestedSubtask.assignee}</span>
                                    </div>
                                  )}
                                {nestedSubtask.dueDate && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-2.5 h-2.5" />
                                    <span>{nestedSubtask.dueDate}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="space-y-6">
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm font-medium">No subtasks available</p>
              <p className="text-xs mt-1 text-gray-400">
                Create subtasks to break down this task
              </p>
            </div>

            {!isAddingSubtask && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-4">No subtasks yet</p>
                <button
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first subtask
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subtask Detail Modal */}
      {isModalOpen && (
        <SubtaskDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubtaskId(null);
          }}
          subtaskId={selectedSubtaskId}
          task={task}
          onNavigateToSubtask={(subtaskId) => {
            setSelectedSubtaskId(subtaskId);
            // Modal will reload with new subtaskId
          }}
          onNavigateToTask={(taskId) => {
            // Close subtask modal and could open task modal if needed
            setIsModalOpen(false);
            setSelectedSubtaskId(null);
            // Could trigger task modal here if onTaskClick is available
          }}
        />
      )}
    </div>
  );
};

export default SubTasksSection;
