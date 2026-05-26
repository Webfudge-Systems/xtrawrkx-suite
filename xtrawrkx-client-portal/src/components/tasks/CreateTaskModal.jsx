"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import ModernButton from "@/components/ui/ModernButton";
import {
  CP_STATUS_SELECT_OPTIONS,
  getEditableStatusOptions,
} from "@/lib/taskStatusConstants";

export default function CreateTaskModal({
  isOpen,
  onClose,
  onTaskCreate,
  projects = [],
  clientMembers = [],
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: "",
    dueDate: "",
    timeAllotted: "",
    priority: "medium",
    status: "ACCEPTED",
    autoAccept: true,
    assignmentScope: "internal",
    assigneeMemberId: "",
  });

  const [errors, setErrors] = useState({});

  const priorities = [
    { value: "low", label: "Low", color: "text-green-600" },
    { value: "medium", label: "Medium", color: "text-blue-600" },
    { value: "high", label: "High", color: "text-orange-600" },
    { value: "urgent", label: "Urgent", color: "text-red-600" },
  ];

  const statuses = getEditableStatusOptions(
    formData.autoAccept ? "Accepted" : formData.status,
    CP_STATUS_SELECT_OPTIONS,
  );

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.project) {
      newErrors.project = "Please select a project";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create task object
    const newTask = {
      id: `t${Date.now()}`,
      title: formData.title.trim(),
      description: formData.description.trim(),
      projectId: formData.project,
      dueDate: formData.dueDate,
      timeAllotted: formData.timeAllotted
        ? parseFloat(formData.timeAllotted)
        : null,
      priority: formData.priority,
      status: formData.autoAccept ? "ACCEPTED" : formData.status,
      autoAccept: !!formData.autoAccept,
      assignmentScope: formData.assignmentScope,
      assigneeMemberId: formData.assigneeMemberId || null,
      sharePreferenceSetAtCreation: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Call the callback function
    await onTaskCreate(newTask);

    // Reset form
    setFormData({
      title: "",
      description: "",
      project: "",
      dueDate: "",
      timeAllotted: "",
      priority: "medium",
      status: "ACCEPTED",
      autoAccept: true,
      assignmentScope: "internal",
      assigneeMemberId: "",
    });

    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      project: "",
      dueDate: "",
      timeAllotted: "",
      priority: "medium",
      status: "ACCEPTED",
      autoAccept: true,
      assignmentScope: "internal",
      assigneeMemberId: "",
    });
    setErrors({});
    onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-2xl max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white border border-gray-200 shadow-2xl rounded-3xl w-full max-h-[85vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Create New Task
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Add a new task to your project
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-200px)]"
              >
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200 ${
                      errors.title ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Enter task title..."
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200 resize-none ${
                      errors.description ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Describe the task in detail..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Project */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Project */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project *
                    </label>
                    <select
                      value={formData.project}
                      onChange={(e) =>
                        handleInputChange("project", e.target.value)
                      }
                      className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200 ${
                        errors.project ? "border-red-300" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {errors.project && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.project}
                      </p>
                    )}
                  </div>

                  <div />
                </div>

                {/* Due Date, Time Allotted, Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        handleInputChange("dueDate", e.target.value)
                      }
                      className={`w-full px-4 py-3 bg-white border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200 ${
                        errors.dueDate ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Allotted (hrs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 8"
                      value={formData.timeAllotted}
                      onChange={(e) =>
                        handleInputChange("timeAllotted", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        handleInputChange("priority", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        handleInputChange("status", e.target.value)
                      }
                      disabled={formData.autoAccept}
                      className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200 disabled:bg-gray-100"
                    >
                      {statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 px-4 py-3 bg-white">
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    Auto-accept for assignee
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="autoAccept"
                        checked={formData.autoAccept === true}
                        onChange={() => {
                          handleInputChange("autoAccept", true);
                          handleInputChange("status", "ACCEPTED");
                        }}
                      />
                      <span className="text-sm text-gray-700">
                        Auto-accept (default)
                      </span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="autoAccept"
                        checked={formData.autoAccept === false}
                        onChange={() => {
                          handleInputChange("autoAccept", false);
                          handleInputChange("status", "ASSIGNED");
                        }}
                      />
                      <span className="text-sm text-gray-700">
                        Require manual accept
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign To
                    </label>
                    <select
                      value={formData.assignmentScope}
                      onChange={(e) =>
                        handleInputChange("assignmentScope", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/80 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200"
                    >
                      <option value="internal">Internal Team</option>
                      <option value="client">Client Members</option>
                    </select>
                  </div>
                </div>

                {formData.assignmentScope === "client" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Member
                      </label>
                      <select
                        value={formData.assigneeMemberId}
                        onChange={(e) =>
                          handleInputChange("assigneeMemberId", e.target.value)
                        }
                        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200"
                      >
                        <option value="">Unassigned</option>
                        {clientMembers.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div />
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <ModernButton
                  type="secondary"
                  text="Cancel"
                  onClick={handleClose}
                  size="sm"
                />
                <ModernButton
                  type="primary"
                  text="Create Task"
                  icon={CheckCircle2}
                  onClick={handleSubmit}
                  size="sm"
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
