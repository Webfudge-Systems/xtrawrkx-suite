"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Calendar, Target, Tag, Plus } from "lucide-react";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import taskService from "../../lib/taskService";
import projectService from "../../lib/projectService";
import apiClient from "../../lib/apiClient";
import { useAuth } from "../../contexts/AuthContext";

const AddTaskModal = ({
  isOpen,
  onClose,
  onTaskCreated,
  initialProjectId = null,
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projects: [], // Changed to array for multiple projects
    assignees: [], // Changed to array for multiple assignees
    scheduledDate: "",
    priority: "MEDIUM",
    status: "SCHEDULED",
    progress: 0,
  });

  // Debug: Log form data changes
  useEffect(() => {
    if (isOpen) {
    }
  }, [formData, isOpen]);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});

  // Load projects and users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFormData();
      // Set initial project if provided
      if (initialProjectId) {
        setFormData((prev) => ({
          ...prev,
          projects: [String(initialProjectId)],
        }));
      }
    } else {
      // Reset form when modal closes
      setFormData({
        title: "",
        description: "",
        projects: [], // Changed to array
        assignees: [], // Changed to array
        scheduledDate: "",
        priority: "MEDIUM",
        status: "SCHEDULED",
        progress: 0,
      });
      setTags([]);
      setNewTag("");
      setErrors({});
    }
  }, [isOpen, initialProjectId]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const loadFormData = async () => {
    setLoadingData(true);

    // Load projects and users independently so one failure doesn't break the other
    let projectsData = [];
    let usersData = [];

    // Try to load projects (but don't fail if it errors)
    try {
      const projectsResponse = await projectService.getAllProjects({
        pageSize: 100,
        populate: ["projectManager", "teamMembers"],
      });
      projectsData = projectsResponse.data || [];
      setProjects(projectsData);
    } catch (projectError) {
      console.error("Error fetching projects:", projectError);
      setProjects([]); // Set empty array but continue
    }

    // Always try to fetch users from API (independent of projects)
    try {
      const usersResponse = await apiClient.get("/api/xtrawrkx-users", {
        "pagination[pageSize]": 100,
        populate: "primaryRole,userRoles,department",
        "filters[isActive][$eq]": "true", // Strapi might expect string
      });

      // Process users from API response
      // Strapi v4 can return: { data: [{ id, attributes: {...} }], meta: {...} } or just an array
      if (usersResponse) {
        // Check if response has data property (Strapi v4 format)
        if (usersResponse.data && Array.isArray(usersResponse.data)) {
          usersData = usersResponse.data;
        }
        // Check if response is directly an array
        else if (Array.isArray(usersResponse)) {
          usersData = usersResponse;
        }
        // Check if response has a different structure
        else if (usersResponse.users && Array.isArray(usersResponse.users)) {
          usersData = usersResponse.users;
        }
      }
    } catch (userError) {
      console.error("Error fetching users from API:", userError);
      console.error("Error details:", userError.message);
      // Fallback: Extract users from projects if available
      if (projectsData.length > 0) {
        const allUsers = new Map();
        projectsData.forEach((project) => {
          if (project.teamMembers && Array.isArray(project.teamMembers)) {
            project.teamMembers.forEach((member) => {
              if (member && member.id && !allUsers.has(member.id)) {
                allUsers.set(member.id, member);
              }
            });
          }
          if (
            project.projectManager &&
            project.projectManager.id &&
            !allUsers.has(project.projectManager.id)
          ) {
            allUsers.set(project.projectManager.id, project.projectManager);
          }
        });
        usersData = Array.from(allUsers.values());
      }
    }

    // Transform users to consistent format
    const transformedUsers = usersData
      .filter((user) => user && user.id) // Filter out invalid users
      .map((user) => {
        // Handle Strapi v4 format (with attributes) or direct format
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
    setLoadingData(false);

    // Set initial project after projects are loaded
    if (initialProjectId) {
      const projectExists = projectsData.some(
        (p) => String(p.id) === String(initialProjectId),
      );
      if (projectExists) {
        setFormData((prev) => ({
          ...prev,
          projects: [String(initialProjectId)],
        }));
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    }
    // At least one assignee is required
    if (!formData.assignees || formData.assignees.length === 0) {
      newErrors.assignees = "At least one assignee is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Prepare task data for Strapi
      // Note: Backend expects 'projects' (plural) as an array, not 'project' (singular)
      const assigneeIds = formData.assignees
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));

      // First assignee becomes the main assignee, and ALL selected users (including first) go to collaborators
      const primaryAssignee = assigneeIds.length > 0 ? assigneeIds[0] : null;
      // Include all assignees (including the first one) in collaborators
      const collaborators = assigneeIds.length > 0 ? assigneeIds : [];

      // Convert project IDs to integers
      const projectIds = formData.projects
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));

      const taskData = {
        title: formData.title,
        description: formData.description || "",
        // Projects is optional - only include if provided and not empty
        // Backend expects projects as an array
        ...(projectIds.length > 0 && {
          projects: projectIds,
        }),
        // Primary assignee (first selected)
        assignee: primaryAssignee,
        // All selected users (including first assignee) as collaborators
        ...(collaborators.length > 0 && {
          collaborators: collaborators,
        }),
        scheduledDate: formData.scheduledDate
          ? new Date(formData.scheduledDate + "T00:00:00").toISOString()
          : null,
        priority: formData.priority,
        status: formData.status,
        progress: formData.progress,
        tags: tags.length > 0 ? tags : null,
        // Add createdBy - use user ID from auth context
        createdBy: user?.id || user?._id || user?.xtrawrkxUserId || 1,
      };


      const response = await taskService.createTask(taskData);

      // Fetch the created task with populated relations to ensure assignee and project are included
      if (response?.id || response?.data?.id) {
        const taskId = response.id || response.data?.id;
        try {
          const populatedTask = await taskService.getTaskById(taskId, [
            "project",
            "assignee",
            "createdBy",
            "collaborators",
          ]);

          // Handle Strapi response format - response.data is already returned from taskService
          if (onTaskCreated) {
            onTaskCreated(populatedTask || response);
          }
        } catch (fetchError) {
          console.error("Error fetching created task:", fetchError);
          // Still call onTaskCreated with the original response
          if (onTaskCreated) {
            onTaskCreated(response);
          }
        }
      } else {
        // Fallback if response doesn't have an ID
        if (onTaskCreated) {
          onTaskCreated(response);
        }
      }

      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      setErrors({ submit: error.message || "Failed to create task" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const priorityOptions = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
  ];

  const statusOptions = [
    { value: "SCHEDULED", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Done" },
    { value: "CANCELLED", label: "Cancelled" },
  ];

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const userOptions =
    users.length > 0
      ? users.map((user) => {
          const label =
            user.name ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email ||
            "Unknown User";
          return {
            value: String(user.id), // Ensure value is a string for select
            label: label,
          };
        })
      : [];

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white border border-gray-200 shadow-2xl rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Create New Task
            </h2>
            <p className="text-gray-600 mt-1">Add a new task to your project</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-200px)] flex-1"
        >
          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading form data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Task Title"
                    placeholder="Enter task title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    error={errors.title}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      placeholder="Describe the task requirements"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      className="block w-full rounded-xl border border-gray-300 shadow-sm px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Projects
                    </label>
                    <div className="space-y-2">
                      {/* Selected Projects */}
                      {formData.projects.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.projects.map((projectId) => {
                            const selectedProject = projects.find(
                              (p) => String(p.id) === String(projectId),
                            );
                            if (!selectedProject) return null;
                            const projectName =
                              selectedProject.name || "Unknown Project";
                            return (
                              <span
                                key={projectId}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                              >
                                {projectName}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      projects: prev.projects.filter(
                                        (id) => id !== projectId,
                                      ),
                                    }));
                                    if (errors.projects) {
                                      setErrors((prev) => ({
                                        ...prev,
                                        projects: "",
                                      }));
                                    }
                                  }}
                                  className="hover:bg-green-200 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {/* Project Select Dropdown */}
                      <select
                        value=""
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          if (
                            selectedId &&
                            !formData.projects.includes(selectedId)
                          ) {
                            setFormData((prev) => ({
                              ...prev,
                              projects: [...prev.projects, selectedId],
                            }));
                            if (errors.projects) {
                              setErrors((prev) => ({
                                ...prev,
                                projects: "",
                              }));
                            }
                          }
                          e.target.value = ""; // Reset select
                        }}
                        className="block w-full rounded-xl border border-gray-300 shadow-sm appearance-none px-3 py-2.5 pr-10 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-200"
                      >
                        <option value="">
                          {formData.projects.length === 0
                            ? "Select projects..."
                            : "Add another project..."}
                        </option>
                        {projectOptions
                          .filter(
                            (option) =>
                              !formData.projects.includes(option.value),
                          )
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                      {errors.projects && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.projects}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignees <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {/* Selected Assignees */}
                      {formData.assignees.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.assignees.map((assigneeId) => {
                            const selectedUser = users.find(
                              (u) => String(u.id) === String(assigneeId),
                            );
                            if (!selectedUser) return null;
                            const userName =
                              selectedUser.name ||
                              `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() ||
                              selectedUser.email ||
                              "Unknown User";
                            return (
                              <span
                                key={assigneeId}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                              >
                                {userName}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      assignees: prev.assignees.filter(
                                        (id) => id !== assigneeId,
                                      ),
                                    }));
                                    if (errors.assignees) {
                                      setErrors((prev) => ({
                                        ...prev,
                                        assignees: "",
                                      }));
                                    }
                                  }}
                                  className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {/* Assignee Select Dropdown */}
                      <select
                        value=""
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          if (
                            selectedId &&
                            !formData.assignees.includes(selectedId)
                          ) {
                            setFormData((prev) => ({
                              ...prev,
                              assignees: [...prev.assignees, selectedId],
                            }));
                            if (errors.assignees) {
                              setErrors((prev) => ({
                                ...prev,
                                assignees: "",
                              }));
                            }
                          }
                          e.target.value = ""; // Reset select
                        }}
                        className="block w-full rounded-xl border border-gray-300 shadow-sm appearance-none px-3 py-2.5 pr-10 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-colors duration-200"
                      >
                        <option value="">
                          {formData.assignees.length === 0
                            ? "Select assignees..."
                            : "Add another assignee..."}
                        </option>
                        {userOptions
                          .filter(
                            (option) =>
                              !formData.assignees.includes(option.value),
                          )
                          .map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                      {errors.assignees && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.assignees}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Task Details */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Task Details
                  </h3>
                </div>
                <div className="space-y-4">
                  <Input
                    label="Due Date"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      handleInputChange("scheduledDate", e.target.value)
                    }
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Priority"
                      value={formData.priority}
                      onChange={(value) => handleInputChange("priority", value)}
                      options={priorityOptions}
                    />

                    <Select
                      label="Status"
                      value={formData.status}
                      onChange={(value) => handleInputChange("status", value)}
                      options={statusOptions}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Progress (%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={(e) =>
                        handleInputChange("progress", parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span className="font-medium">{formData.progress}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-800 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || loadingData}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
