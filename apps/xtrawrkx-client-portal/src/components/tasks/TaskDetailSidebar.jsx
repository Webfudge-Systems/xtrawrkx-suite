"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  User,
  Calendar,
  BarChart3,
  FileText,
  Plus,
  Clock,
  Flag,
  MessageSquare,
} from "lucide-react";
import SubTasksSection from "./SubTasksSection";
import ModernButton from "@/components/ui/ModernButton";

const TaskDetailSidebar = ({
  isOpen,
  onClose,
  task,
  isFullView = false,
  onToggleView,
  onOpenProject,
  onSubtaskUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("subtasks");

  // Reset active tab when task changes
  useEffect(() => {
    if (task?.id) {
      setActiveTab("subtasks");
    }
  }, [task?.id]);

  if (!isOpen || !task) return null;

  // Ensure task has required properties with fallbacks
  const safeTask = {
    ...task,
    id: task.id,
    title: task.title || "Untitled Task",
    description: task.description || "No description provided",
    project: task.project || "Unknown Project",
    assignee: task.assignee || "Unassigned",
    dueDate: task.dueDate || "No due date",
    status: task.status || "todo",
    priority: task.priority || "medium",
    estimatedHours: task.estimatedHours || null,
    actualHours: task.actualHours || null,
    tags: task.tags || [],
    subtasks: task.subtasks || [],
    comments: task.comments || [],
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "in-progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "review":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "todo":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✓";
      case "in-progress":
        return "▶";
      case "review":
        return "👁";
      case "todo":
        return "○";
      default:
        return "○";
    }
  };

  const modalClasses = isFullView
    ? "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[80] p-4"
    : "fixed inset-y-0 right-0 bg-black/50 backdrop-blur-sm flex items-center justify-end z-[80]";

  const contentClasses = isFullView
    ? "bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90vh] border border-gray-200 flex flex-col"
    : "bg-white shadow-2xl w-[450px] h-screen max-h-screen border-l border-gray-200 flex flex-col";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={modalClasses}
        >
          <motion.div
            initial={{ x: isFullView ? 0 : 450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isFullView ? 0 : 450, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={contentClasses}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 truncate pr-4">
                  {safeTask.title}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {safeTask.project} • {safeTask.assignee}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Open Project Button */}
                <ModernButton
                  type="secondary"
                  text="Open Project"
                  icon={ExternalLink}
                  size="xs"
                  onClick={() => onOpenProject?.(safeTask.project)}
                />

                {/* Full/Half View Toggle */}
                <ModernButton
                  type="secondary"
                  text={isFullView ? "Half" : "Full"}
                  icon={isFullView ? Minimize2 : Maximize2}
                  size="xs"
                  onClick={onToggleView}
                />

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content - Full Height */}
            <div className="flex-1 flex flex-col h-full">
              {/* Task Details Section */}
              <div className="p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Status */}
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${getStatusColor(safeTask.status)}`}
                      >
                        <span className="text-lg">
                          {getStatusIcon(safeTask.status)}
                        </span>
                        {safeTask.status.charAt(0).toUpperCase() +
                          safeTask.status.slice(1).replace("-", " ")}
                      </span>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        Priority
                      </label>
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${getPriorityColor(safeTask.priority)}`}
                      >
                        <Flag className="w-4 h-4" />
                        {safeTask.priority.charAt(0).toUpperCase() +
                          safeTask.priority.slice(1)}
                      </span>
                    </div>

                    {/* Assignee */}
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        Assignee
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {safeTask.assignee}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Due Date */}
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        Due Date
                      </label>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {safeTask.dueDate}
                        </span>
                      </div>
                    </div>

                    {/* Time Tracking */}
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">
                        Time Tracking
                      </label>
                      <div className="space-y-2">
                        {safeTask.estimatedHours && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Est: {safeTask.estimatedHours}h</span>
                          </div>
                        )}
                        {safeTask.actualHours && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <BarChart3 className="w-4 h-4" />
                            <span>Actual: {safeTask.actualHours}h</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {safeTask.tags && safeTask.tags.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {safeTask.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-500 mb-2 block">
                    Description
                  </label>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {safeTask.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                  <button
                    onClick={() => setActiveTab("subtasks")}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "subtasks"
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-500 border-transparent hover:text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Sub-Tasks
                      {safeTask.subtasks && safeTask.subtasks.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {safeTask.subtasks.length}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "comments"
                        ? "text-blue-600 border-blue-600"
                        : "text-gray-500 border-transparent hover:text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comments
                      {safeTask.comments && safeTask.comments.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {safeTask.comments.length}
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-h-0">
                  {activeTab === "subtasks" ? (
                    <SubTasksSection
                      task={safeTask}
                      onSubtaskUpdate={onSubtaskUpdate}
                    />
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">No comments yet</p>
                      <p className="text-xs mt-1">Comments will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskDetailSidebar;
