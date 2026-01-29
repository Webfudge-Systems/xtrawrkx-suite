"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  User,
  Calendar,
  FileText,
  Paperclip,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Flag,
  MessageSquare,
  Download,
  Image as ImageIcon,
  File,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

const TaskDetailModal = ({
  isOpen,
  onClose,
  task,
  isFullView = false,
  onToggleView,
  onOpenProject,
  onApprove,
  onReject,
  onComment,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
  const [newComment, setNewComment] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const commentsEndRef = useRef(null);

  // Reset active tab when task changes
  useEffect(() => {
    if (task?.id) {
      setActiveTab("details");
    }
  }, [task?.id]);

  // Scroll to bottom of comments when new comment is added
  useEffect(() => {
    if (activeTab === "comments" && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [task?.comments, activeTab]);

  if (!isOpen || !task) return null;

  // Ensure task has required properties with fallbacks
  const safeTask = {
    ...task,
    id: task.id,
    name: task.name || task.title || "Untitled Task",
    description: task.description || "No description provided",
    project: task.project || { name: "Unknown Project", id: null },
    assignee: task.assignee || { name: "Unassigned", id: null },
    scheduledDate: task.scheduledDate || task.dueDate || null,
    status: task.status || "To Do",
    priority: task.priority || "Medium",
    progress: task.progress || 0,
    comments: task.comments || [],
    attachments: task.attachments || task.files || [],
    requiresApproval:
      task.requiresApproval ||
      task.status === "Client Review" ||
      task.status?.toUpperCase() === "CLIENT_REVIEW",
    clientApproval: task.clientApproval || null, // 'approved', 'rejected', null
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
  };

  const getStatusColor = (status) => {
    const statusUpper = (status || "").toUpperCase();
    switch (statusUpper) {
      case "DONE":
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-400";
      case "IN PROGRESS":
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "INTERNAL REVIEW":
      case "IN_REVIEW":
        return "bg-purple-100 text-purple-800 border-purple-400";
      case "CLIENT REVIEW":
      case "CLIENT_REVIEW":
        return "bg-purple-100 text-purple-800 border-purple-400";
      case "APPROVED":
        return "bg-blue-100 text-blue-800 border-blue-400";
      case "TO DO":
      case "TODO":
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 border-blue-400";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-400";
    }
  };

  const getPriorityColor = (priority) => {
    const priorityLower = (priority || "").toLowerCase();
    switch (priorityLower) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    const comment = {
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      author: {
        name: "You",
        avatar: "U",
      },
    };

    if (onComment) {
      await onComment(task.id, comment);
    }

    setNewComment("");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      // TODO: Upload file via API
      // For now, just add to attachments
      const attachment = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
      };

      // Update task attachments
      if (onComment) {
        await onComment(task.id, {
          type: "attachment",
          attachment,
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleApprove = async () => {
    if (onApprove) {
      await onApprove(task.id);
    }
  };

  const handleReject = async () => {
    if (onReject) {
      await onReject(task.id);
    }
  };

  const handleOpenFullPage = () => {
    if (task.id) {
      router.push(`/tasks/${task.id}`);
    }
  };

  // Check if task requires client approval (status is Client Review only)
  const isActionRequired =
    (safeTask.status === "Client Review" ||
      safeTask.status?.toUpperCase() === "CLIENT_REVIEW") &&
    !safeTask.clientApproval;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative z-10 ${
              isFullView
                ? "w-full h-full max-w-7xl max-h-[95vh]"
                : "w-full max-w-4xl h-[90vh] max-h-[90vh]"
            } bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {isActionRequired && (
                    <div className="relative">
                      <AlertCircle className="w-6 h-6 text-xtrawrkx-500 animate-pulse" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-xtrawrkx-500 rounded-full border-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {safeTask.name}
                  </h2>
                  {safeTask.project && (
                    <button
                      onClick={() => {
                        if (onOpenProject && safeTask.project?.id) {
                          onOpenProject(safeTask.project.id);
                        }
                      }}
                      className="text-sm text-xtrawrkx-600 hover:text-xtrawrkx-700 hover:underline mt-1 flex items-center gap-1"
                    >
                      {safeTask.project.name}
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isActionRequired && (
                  <div className="px-3 py-1.5 bg-xtrawrkx-100 text-xtrawrkx-800 rounded-lg text-sm font-semibold border border-xtrawrkx-200">
                    Action Required
                  </div>
                )}
                <button
                  onClick={handleOpenFullPage}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Open in full page"
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
                {isFullView && onToggleView && (
                  <button
                    onClick={onToggleView}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Minimize"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Tabs */}
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === "details"
                      ? "bg-xtrawrkx-500 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab("comments")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    activeTab === "comments"
                      ? "bg-xtrawrkx-500 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Comments
                  {safeTask.comments?.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-white/30 text-white text-xs font-bold rounded-full">
                      {safeTask.comments.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("attachments")}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    activeTab === "attachments"
                      ? "bg-xtrawrkx-500 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Attachments
                  {safeTask.attachments?.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-white/30 text-white text-xs font-bold rounded-full">
                      {safeTask.attachments.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === "details" && (
                  <div className="space-y-6">
                    {/* Action Required Banner */}
                    {isActionRequired && (
                      <div className="p-4 bg-xtrawrkx-50 border border-xtrawrkx-200 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-xtrawrkx-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-xtrawrkx-900 mb-1">
                              Action Required
                            </h3>
                            <p className="text-sm text-xtrawrkx-700 mb-3">
                              This task is pending your approval. Please review
                              and approve or reject it.
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleApprove}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm flex items-center gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={handleReject}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm flex items-center gap-2"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Client Approval Status */}
                    {safeTask.clientApproval && (
                      <div
                        className={`p-4 rounded-xl border ${
                          safeTask.clientApproval === "approved"
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {safeTask.clientApproval === "approved" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span
                            className={`font-semibold ${
                              safeTask.clientApproval === "approved"
                                ? "text-green-800"
                                : "text-red-800"
                            }`}
                          >
                            {safeTask.clientApproval === "approved"
                              ? "Approved"
                              : "Rejected"}
                          </span>
                          {safeTask.approvedAt && (
                            <span className="text-sm text-gray-600 ml-2">
                              on {formatDate(safeTask.approvedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        Description
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {safeTask.description}
                      </p>
                    </div>

                    {/* Task Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-500 font-medium">
                            Priority
                          </span>
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-block ${getPriorityColor(
                            safeTask.priority
                          )}`}
                        >
                          {safeTask.priority}
                        </span>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-500 font-medium">
                            Status
                          </span>
                        </div>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-block ${getStatusColor(
                            safeTask.status
                          )}`}
                        >
                          {safeTask.status}
                        </span>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-500 font-medium">
                            Due Date
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(safeTask.scheduledDate)}
                        </span>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-xs text-gray-500 font-medium">
                            Assignee
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-xtrawrkx-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {safeTask.assignee?.name
                              ?.charAt(0)
                              ?.toUpperCase() || "U"}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {safeTask.assignee?.name || "Unassigned"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Progress
                        </h3>
                        <span className="text-sm font-medium text-gray-900">
                          {safeTask.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-xtrawrkx-500 h-2 rounded-full transition-all"
                          style={{ width: `${safeTask.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "comments" && (
                  <div className="space-y-4">
                    {/* Comments List */}
                    <div className="space-y-4">
                      {safeTask.comments && safeTask.comments.length > 0 ? (
                        safeTask.comments.map((comment, index) => (
                          <div
                            key={comment.id || index}
                            className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
                          >
                            <div className="w-8 h-8 bg-xtrawrkx-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {comment.author?.name?.charAt(0)?.toUpperCase() ||
                                "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-900">
                                  {comment.author?.name || "Unknown"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatDateTime(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No comments yet</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Be the first to comment
                          </p>
                        </div>
                      )}
                      <div ref={commentsEndRef} />
                    </div>

                    {/* Comment Input */}
                    <div className="mt-6 p-4 bg-white border border-gray-200 rounded-xl">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500 focus:border-transparent"
                        rows={3}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.shiftKey === false) {
                            e.preventDefault();
                            handleSendComment();
                          }
                        }}
                      />
                      <div className="flex items-center justify-between mt-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingFile}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {uploadingFile ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Paperclip className="w-4 h-4" />
                          )}
                          Attach File
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          onChange={handleFileUpload}
                          multiple
                        />
                        <button
                          onClick={handleSendComment}
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-xtrawrkx-500 text-white rounded-lg hover:bg-xtrawrkx-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium text-sm"
                        >
                          <Send className="w-4 h-4" />
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "attachments" && (
                  <div className="space-y-4">
                    {safeTask.attachments && safeTask.attachments.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                        {safeTask.attachments.map((attachment, index) => (
                          <div
                            key={attachment.id || index}
                            className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <div className="w-10 h-10 bg-xtrawrkx-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              {attachment.type?.startsWith("image/") ? (
                                <ImageIcon className="w-5 h-5 text-xtrawrkx-600" />
                              ) : (
                                <File className="w-5 h-5 text-xtrawrkx-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {attachment.size
                                  ? `${(attachment.size / 1024).toFixed(1)} KB`
                                  : "Unknown size"}{" "}
                                • {formatDate(attachment.uploadedAt)}
                              </p>
                            </div>
                            <a
                              href={attachment.url}
                              download={attachment.name}
                              className="p-2 text-gray-600 hover:text-xtrawrkx-600 hover:bg-xtrawrkx-50 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No attachments</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Files attached to this task will appear here
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Use portal to render modal at document body level
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};

export default TaskDetailModal;
