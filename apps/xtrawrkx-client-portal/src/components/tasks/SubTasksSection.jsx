"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Check,
  X,
  MoreHorizontal,
  User,
  Clock,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const SubTasksSection = ({ task, onSubtaskUpdate }) => {
  // Use subtasks from task prop, or fallback to empty array
  const taskSubtasks = task?.subtasks || [];

  // Convert task subtasks to local format
  const initialSubtasks = taskSubtasks.map((subtask) => ({
    id: subtask.id,
    name: subtask.name,
    completed: subtask.status === "completed" || subtask.completed,
    assignee: subtask.assignee || "Unassigned",
    dueDate: subtask.dueDate || null,
    status: subtask.status || "todo",
    priority: subtask.priority || "medium",
    subtasks: subtask.subtasks || [], // Nested subtasks
    createdAt: subtask.createdAt || new Date().toISOString(),
  }));

  const [subtasks, setSubtasks] = useState(initialSubtasks);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [expandedSubtasks, setExpandedSubtasks] = useState({});

  // Update subtasks when task changes
  useEffect(() => {
    const taskSubtasks = task?.subtasks || [];

    const updatedSubtasks = taskSubtasks.map((subtask) => ({
      id: subtask.id,
      name: subtask.name,
      completed: subtask.status === "completed" || subtask.completed,
      assignee: subtask.assignee || "Unassigned",
      dueDate: subtask.dueDate || null,
      status: subtask.status || "todo",
      priority: subtask.priority || "medium",
      subtasks: subtask.subtasks || [],
      createdAt: subtask.createdAt || new Date().toISOString(),
    }));

    setSubtasks(updatedSubtasks);
    setIsAddingSubtask(false);
    setNewSubtaskName("");
  }, [task?.id, task?.subtasks]);

  const handleAddSubtask = (parentId = null) => {
    if (newSubtaskName.trim()) {
      const newSubtask = {
        id: `subtask_${Date.now()}`,
        name: newSubtaskName,
        completed: false,
        assignee: "Unassigned",
        dueDate: null,
        status: "todo",
        priority: "medium",
        subtasks: [],
        createdAt: new Date().toISOString(),
        parentId: parentId,
      };

      if (parentId) {
        // Add as nested subtask
        setSubtasks((prevSubtasks) =>
          prevSubtasks.map((subtask) =>
            subtask.id === parentId
              ? { ...subtask, subtasks: [...subtask.subtasks, newSubtask] }
              : subtask
          )
        );
      } else {
        // Add as top-level subtask
        setSubtasks([...subtasks, newSubtask]);
      }

      setNewSubtaskName("");
      setIsAddingSubtask(false);

      // Notify parent component
      if (onSubtaskUpdate) {
        onSubtaskUpdate(task.id, [...subtasks, newSubtask]);
      }
    }
  };

  const toggleSubtaskComplete = (id, parentId = null) => {
    const updateSubtasks = (subtasksList) =>
      subtasksList.map((subtask) => {
        if (subtask.id === id) {
          return { ...subtask, completed: !subtask.completed };
        }
        if (subtask.subtasks && subtask.subtasks.length > 0) {
          return { ...subtask, subtasks: updateSubtasks(subtask.subtasks) };
        }
        return subtask;
      });

    setSubtasks(updateSubtasks(subtasks));
  };

  const deleteSubtask = (id, parentId = null) => {
    if (parentId) {
      setSubtasks((prevSubtasks) =>
        prevSubtasks.map((subtask) =>
          subtask.id === parentId
            ? {
                ...subtask,
                subtasks: subtask.subtasks.filter((sub) => sub.id !== id),
              }
            : subtask
        )
      );
    } else {
      setSubtasks(subtasks.filter((subtask) => subtask.id !== id));
    }
  };

  const toggleExpanded = (id) => {
    setExpandedSubtasks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderSubtask = (subtask, level = 0) => {
    const hasNestedSubtasks = subtask.subtasks && subtask.subtasks.length > 0;
    const isExpanded = expandedSubtasks[subtask.id];
    const indentClass = level > 0 ? `ml-${level * 6}` : "";

    return (
      <div key={subtask.id} className={`${indentClass}`}>
        <div className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group">
          {/* Expand/Collapse Button for nested subtasks */}
          {hasNestedSubtasks && (
            <button
              onClick={() => toggleExpanded(subtask.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors mt-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}

          {/* Checkbox */}
          <button
            onClick={() => toggleSubtaskComplete(subtask.id)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 ${
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
              <div className="flex items-center gap-2">
                <h4
                  className={`text-sm font-medium ${
                    subtask.completed
                      ? "text-gray-500 line-through"
                      : "text-gray-900"
                  }`}
                >
                  {subtask.name}
                </h4>

                {/* Priority Badge */}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(subtask.priority)}`}
                >
                  {subtask.priority}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Add Nested Subtask Button */}
                <button
                  onClick={() => {
                    setIsAddingSubtask(true);
                    setNewSubtaskName("");
                    // Store parent ID for nested subtask
                    setNewSubtaskName(`parent_${subtask.id}`);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-blue-500 hover:text-blue-700 rounded transition-all"
                  title="Add nested subtask"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* More Actions */}
                <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span>{subtask.assignee}</span>
              </div>
              {subtask.dueDate && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{subtask.dueDate}</span>
                </div>
              )}
              <span className="text-xs text-gray-400">
                {new Date(subtask.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Render nested subtasks */}
        {hasNestedSubtasks && isExpanded && (
          <div className="mt-2 space-y-2">
            {subtask.subtasks.map((nestedSubtask) =>
              renderSubtask(nestedSubtask, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex-1 overflow-y-auto">
        {/* Add Subtask Button */}
        <div className="mb-6">
          {!isAddingSubtask ? (
            <button
              onClick={() => setIsAddingSubtask(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-dashed border-blue-300 w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              Add sub-task
            </button>
          ) : (
            <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
              <input
                type="text"
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                placeholder="Enter subtask name..."
                className="flex-1 text-sm border-none outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const parentId = newSubtaskName.startsWith("parent_")
                      ? newSubtaskName.replace("parent_", "")
                      : null;
                    const cleanName = newSubtaskName.replace("parent_", "");
                    setNewSubtaskName(cleanName);
                    handleAddSubtask(parentId);
                  } else if (e.key === "Escape") {
                    setIsAddingSubtask(false);
                    setNewSubtaskName("");
                  }
                }}
              />
              <button
                onClick={() => {
                  const parentId = newSubtaskName.startsWith("parent_")
                    ? newSubtaskName.replace("parent_", "")
                    : null;
                  const cleanName = newSubtaskName.replace("parent_", "");
                  setNewSubtaskName(cleanName);
                  handleAddSubtask(parentId);
                }}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsAddingSubtask(false);
                  setNewSubtaskName("");
                }}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Subtasks List */}
        <div className="space-y-4">
          {subtasks.length > 0 ? (
            subtasks.map((subtask) => renderSubtask(subtask))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No subtasks available</p>
              <p className="text-xs mt-1">
                Create subtasks to break down this task
              </p>
            </div>
          )}
        </div>

        {/* Empty State */}
        {subtasks.length === 0 && !isAddingSubtask && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mb-4">No subtasks yet</p>
            <button
              onClick={() => setIsAddingSubtask(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Add your first subtask
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubTasksSection;
