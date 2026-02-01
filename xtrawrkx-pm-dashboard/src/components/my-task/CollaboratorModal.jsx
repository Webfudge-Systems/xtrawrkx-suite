"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, UserPlus, UserMinus, Search } from "lucide-react";
import apiClient from "../../lib/apiClient";
import taskService from "../../lib/taskService";
import subtaskService from "../../lib/subtaskService";

const CollaboratorModal = ({ isOpen, onClose, task, subtask, onUpdate }) => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [localTask, setLocalTask] = useState(task);
  const [localSubtask, setLocalSubtask] = useState(subtask);

  // Update local task/subtask when props change
  useEffect(() => {
    setLocalTask(task);
    setLocalSubtask(subtask);
  }, [task, subtask]);

  // Determine if we're managing a subtask or a task
  const isSubtaskMode = !!subtask;
  const targetEntity = isSubtaskMode ? localSubtask : localTask;

  // Get current collaborators from the target entity (subtask or task)
  // For subtasks: include both assignee and collaborators (avoid duplicates)
  // For tasks: include both assignee and collaborators
  const currentCollaborators = useMemo(() => {
    if (isSubtaskMode) {
      const collaborators = localSubtask?.collaborators || [];
      const assignee = localSubtask?.assignee;
      
      // Combine assignee and collaborators, avoiding duplicates
      const allCollaborators = [];
      const seenIds = new Set();
      
      // Add assignee first if it exists
      if (assignee) {
        const assigneeId = assignee?.id || assignee?._id || assignee;
        if (assigneeId && !seenIds.has(assigneeId)) {
          allCollaborators.push(typeof assignee === 'object' ? assignee : { id: assigneeId });
          seenIds.add(assigneeId);
        }
      }
      
      // Add other collaborators
      if (Array.isArray(collaborators)) {
        collaborators.forEach((collab) => {
          if (collab) {
            const collabId = collab?.id || collab?._id || collab;
            if (collabId && !seenIds.has(collabId)) {
              allCollaborators.push(typeof collab === 'object' ? collab : { id: collabId });
              seenIds.add(collabId);
            }
          }
        });
      }
      
      return allCollaborators;
    } else {
      // For tasks: include both assignee and collaborators
      const collaborators = localTask?.collaborators || [];
      const assignee = localTask?.assignee;
      
      const allCollaborators = [];
      const seenIds = new Set();
      
      // Add assignee first if it exists
      if (assignee) {
        const assigneeId = assignee?.id || assignee?._id || assignee;
        if (assigneeId && !seenIds.has(assigneeId)) {
          allCollaborators.push(typeof assignee === 'object' ? assignee : { id: assigneeId });
          seenIds.add(assigneeId);
        }
      }
      
      // Add other collaborators
      if (Array.isArray(collaborators)) {
        collaborators.forEach((collab) => {
          if (collab) {
            const collabId = collab?.id || collab?._id || collab;
            if (collabId && !seenIds.has(collabId)) {
              allCollaborators.push(typeof collab === 'object' ? collab : { id: collabId });
              seenIds.add(collabId);
            }
          }
        });
      }
      
      return allCollaborators;
    }
  }, [isSubtaskMode, localSubtask, localTask]);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
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

  const isCollaborator = (userId) => {
    if (!userId) return false;
    return currentCollaborators.some((collab) => {
      const collabId = collab?.id || collab?._id;
      return collabId && (collabId === userId || collabId.toString() === userId.toString());
    });
  };

  const handleToggleCollaborator = async (user) => {
    if (!targetEntity) return;

    setSaving(true);
    try {
      const isCurrentlyCollaborator = isCollaborator(user.id);
      let updatedCollaborators;

      if (isCurrentlyCollaborator) {
        // Remove collaborator
        updatedCollaborators = currentCollaborators.filter(
          (collab) => collab?.id !== user.id
        );
      } else {
        // Add collaborator
        updatedCollaborators = [...currentCollaborators, user];
      }

      if (isSubtaskMode) {
        // Update SUBTASK, not the parent task
        // Set primary assignee (first one) and collaborators (rest)
        const updateData = {
          assignee:
            updatedCollaborators.length > 0 ? updatedCollaborators[0].id : null,
          collaborators: updatedCollaborators.length > 1 
            ? updatedCollaborators.slice(1).map((c) => c.id)
            : [],
        };

        await subtaskService.updateSubtask(localSubtask.id, updateData);

        // Create updated subtask object
        const subtaskToUpdate = {
          ...localSubtask,
          assignee: updatedCollaborators[0] || null,
          collaborators: updatedCollaborators.length > 1 
            ? updatedCollaborators.slice(1)
            : [],
        };

        // Update local state immediately for instant UI feedback
        setLocalSubtask(subtaskToUpdate);
      } else {
        // Update TASK
        // Keep the assignee as the first collaborator if there are any
        const updateData = {
          assignee:
            updatedCollaborators.length > 0 ? updatedCollaborators[0].id : null,
          collaborators: updatedCollaborators.map((c) => c.id),
        };

        await taskService.updateTask(localTask.id, updateData);

        // Create updated task object
        const taskToUpdate = {
          ...localTask,
          assignee: updatedCollaborators[0] || null,
          collaborators: updatedCollaborators,
        };

        // Update local state immediately for instant UI feedback
        setLocalTask(taskToUpdate);
      }

      // Update parent component state
      if (onUpdate) {
        if (isSubtaskMode) {
          await onUpdate(null, localSubtask); // Pass subtask as second param
        } else {
          await onUpdate(localTask);
        }
      }

      setError(null);
      // Small delay to ensure state updates propagate
      setTimeout(() => {
        onClose();
      }, 150);
    } catch (error) {
      console.error("Error updating collaborators:", error);
      setError(
        error.message || "Failed to update collaborators. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !targetEntity) return null;

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
              Manage Collaborators
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isSubtaskMode ? subtask?.title || subtask?.name : task?.name}
            </p>
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
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}
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
                const isCollab = isCollaborator(user.id);
                const initial = user.name?.charAt(0)?.toUpperCase() || "U";

                return (
                  <button
                    key={user.id}
                    onClick={() => handleToggleCollaborator(user)}
                    disabled={saving}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isCollab
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                        isCollab
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
                    {isCollab ? (
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
};

export default CollaboratorModal;
