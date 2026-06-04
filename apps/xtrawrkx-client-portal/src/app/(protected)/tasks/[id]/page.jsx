"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  FileText,
  MoreVertical,
  Edit,
  Share,
  MessageCircle,
  Paperclip,
  CheckCircle2,
  Circle,
  AlertCircle,
  Send,
} from "lucide-react";
import Link from "next/link";
import ModernButton from "@/components/ui/ModernButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

// Mock task data
const taskData = {
  id: "t4",
  title: "Implement user authentication",
  description:
    "Set up OAuth2 and JWT token management for the event organization website. This includes implementing secure login/logout functionality, password reset, and user session management.",
  status: "in-progress",
  priority: "urgent",
  project: "Event Organization Website",
  assignee: {
    name: "Gabrial Matula",
    role: "Web Developer",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    email: "gabrial@company.com",
  },
  dueDate: "2024-02-10",
  estimatedHours: 12,
  actualHours: 8,
  tags: ["backend", "security", "authentication"],
  createdAt: "2024-01-15",
  updatedAt: "2024-02-05",
  comments: [
    {
      id: 1,
      user: "Gabrial Matula",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face",
      content:
        "Started working on the OAuth2 implementation. The basic structure is in place.",
      time: "2 hours ago",
    },
    {
      id: 2,
      user: "Sarah Johnson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b47e?w=32&h=32&fit=crop&crop=face",
      content:
        "Great! Let me know if you need any design assets for the login forms.",
      time: "1 hour ago",
    },
  ],
  attachments: [
    {
      id: 1,
      name: "auth-requirements.pdf",
      size: "2.4 MB",
      type: "pdf",
      uploadedBy: "Gabrial Matula",
      uploadedAt: "2024-02-03",
    },
    {
      id: 2,
      name: "jwt-implementation-guide.docx",
      size: "1.8 MB",
      type: "docx",
      uploadedBy: "Sarah Johnson",
      uploadedAt: "2024-02-04",
    },
  ],
};

export default function TaskDetailsPage() {
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "review":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && taskData.status !== "completed";
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Add comment logic here
      setNewComment("");
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="w-full space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link href="/tasks">
              <ModernButton
                type="secondary"
                icon={ArrowLeft}
                text="Back to Tasks"
                size="sm"
              />
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(taskData.status)}
                  <span
                    className={`px-3 py-1 rounded-xl text-sm font-medium border ${getStatusColor(taskData.status)}`}
                  >
                    {taskData.status.charAt(0).toUpperCase() +
                      taskData.status.slice(1)}
                  </span>
                </div>
                <div className="ml-auto">
                  <span
                    className={`px-3 py-1 rounded-xl text-sm font-medium ${getPriorityColor(taskData.priority)}`}
                  >
                    {taskData.priority}
                  </span>
                </div>
              </div>

              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                {taskData.title}
              </h1>
              <p className="text-gray-700 leading-relaxed mb-6">
                {taskData.description}
              </p>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-600">Due Date</span>
                  </div>
                  <p
                    className={`text-lg font-bold ${isOverdue(taskData.dueDate) ? "text-red-600" : "text-gray-900"}`}
                  >
                    {new Date(taskData.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-gray-600">Estimated</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {taskData.estimatedHours}h
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-gray-600">Actual</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {taskData.actualHours}h
                  </p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-gray-600">Project</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {taskData.project}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ModernButton
                type="secondary"
                icon={Edit}
                text="Edit Task"
                size="sm"
              />
              <ModernButton
                type="secondary"
                icon={Share}
                text="Share"
                size="sm"
              />
              <ModernButton type="primary" text="Mark Complete" size="sm" />
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            {[
              { key: "overview", label: "Overview" },
              { key: "comments", label: "Comments" },
              { key: "attachments", label: "Attachments" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Task Details */}
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Task Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Created</span>
                      <span className="font-medium">
                        {new Date(taskData.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="font-medium">
                        {new Date(taskData.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className="font-medium capitalize">
                        {taskData.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Priority</span>
                      <span className="font-medium capitalize">
                        {taskData.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {taskData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Assignee */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Assignee
                </h3>
                <div className="flex items-center gap-4 p-4 bg-white/50 rounded-xl">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={taskData.assignee.avatar} />
                    <AvatarFallback className="text-lg">
                      {taskData.assignee.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-gray-900 mb-1">
                      {taskData.assignee.name}
                    </h4>
                    <p className="text-gray-600 mb-2">
                      {taskData.assignee.role}
                    </p>
                    <p className="text-sm text-gray-500">
                      {taskData.assignee.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ModernButton type="secondary" text="Contact" size="sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-6">
              {/* Comments List */}
              <div className="space-y-4">
                {taskData.comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.avatar} />
                        <AvatarFallback>
                          {comment.user.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">
                            {comment.user}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {comment.time}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Add Comment
                </h3>
                <div className="space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all duration-200"
                    rows={4}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <ModernButton
                      type="primary"
                      icon={Send}
                      text="Post Comment"
                      size="sm"
                      onClick={handleAddComment}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="space-y-4">
              {taskData.attachments.map((attachment, index) => (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {attachment.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {attachment.size} • Uploaded by {attachment.uploadedBy}{" "}
                        • {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ModernButton
                        type="secondary"
                        text="Download"
                        size="sm"
                      />
                      <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
