"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit,
  Plus,
  Share,
  List,
  Paperclip,
  Image,
  X,
  GitBranch,
  Home,
} from "lucide-react";
import { Card } from "../../../components/ui";
import subtaskService from "../../../lib/subtaskService";
import commentService from "../../../lib/commentService";
import {
  transformSubtask,
  transformComment,
} from "../../../lib/dataTransformers";
import PageHeader from "../../../components/shared/PageHeader";

export default function SubtaskDetailPage({ params: paramsProp }) {
  const router = useRouter();
  const paramsFromHook = useParams();
  const [params, setParams] = useState(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState(new Set());
  const [subtask, setSubtask] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const resolveParams = async () => {
      if (paramsProp instanceof Promise) {
        const resolved = await paramsProp;
        setParams(resolved);
      } else if (paramsProp) {
        setParams(paramsProp);
      } else if (paramsFromHook) {
        setParams(paramsFromHook);
      }
    };
    resolveParams();
  }, [paramsProp, paramsFromHook]);

  // Load subtask data from API
  useEffect(() => {
    if (!params?.id) return;

    const loadSubtask = async () => {
      try {
        setLoading(true);
        setError(null);

        const subtaskIdParam = params.id;
        if (!subtaskIdParam) {
          throw new Error("Subtask ID is required");
        }

        const subtaskId = parseInt(subtaskIdParam, 10);
        if (isNaN(subtaskId)) {
          throw new Error("Invalid subtask ID");
        }

        // Fetch subtask with all relations
        const strapiSubtask = await subtaskService.getSubtaskById(subtaskId, [
          "task",
          "task.project",
          "assignee",
          "parentSubtask",
          "childSubtasks",
          "childSubtasks.assignee",
        ]);

        // Transform to frontend format
        const transformedSubtask = transformSubtask(strapiSubtask);
        setSubtask(transformedSubtask);

        // Fetch comments for this subtask
        const commentsResponse =
          await commentService.getSubtaskComments(subtaskId);
        const transformedComments =
          commentsResponse.data?.map(transformComment) || [];
        setComments(transformedComments);
      } catch (error) {
        console.error("Error loading subtask:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadSubtask();
  }, [params?.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "In Review":
        return "bg-green-100 text-green-700 border-green-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Done":
        return "bg-green-100 text-green-700 border-green-200";
      case "To Do":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Backlog":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getAssigneeAvatar = (assignee) => {
    if (assignee) {
      return {
        initials: assignee.initials,
        color: assignee.color,
      };
    }
    return {
      initials: "??",
      color: "bg-gray-500",
    };
  };

  const getAssigneeName = (assignee) => {
    if (!assignee) return "Unassigned";
    return assignee.name || "Unknown Assignee";
  };

  const handleSubtaskStatusChange = async (subtaskId, newStatus) => {
    try {
      await subtaskService.updateSubtaskStatus(subtaskId, newStatus);

      // Update local state
      const updateSubtasks = (subtasks) => {
        return subtasks.map((subtask) => {
          if (subtask.id === subtaskId) {
            return { ...subtask, status: newStatus };
          }
          if (subtask.childSubtasks && subtask.childSubtasks.length > 0) {
            return {
              ...subtask,
              childSubtasks: updateSubtasks(subtask.childSubtasks),
            };
          }
          return subtask;
        });
      };

      setSubtask((prev) => ({
        ...prev,
        childSubtasks: updateSubtasks(prev.childSubtasks || []),
      }));
    } catch (error) {
      console.error("Error updating subtask status:", error);
    }
  };

  const handleAddSubtask = async () => {
    try {
      const newSubtaskData = {
        title: "New Subtask",
        status: "SCHEDULED",
        priority: "MEDIUM",
        progress: 0,
        task: subtask.task.id,
        parentSubtask: subtask.id,
        assignee: subtask.assigneeId,
      };

      const createdSubtask = await subtaskService.createSubtask(newSubtaskData);
      const transformedSubtask = transformSubtask(createdSubtask);

      setSubtask((prev) => ({
        ...prev,
        childSubtasks: [...(prev.childSubtasks || []), transformedSubtask],
      }));
    } catch (error) {
      console.error("Error creating subtask:", error);
    }
  };

  const toggleSubtaskExpansion = (subtaskId) => {
    setExpandedSubtasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(subtaskId)) {
        newSet.delete(subtaskId);
      } else {
        newSet.add(subtaskId);
      }
      return newSet;
    });
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const createdComment = await commentService.createSubtaskComment(
        subtask.id,
        newComment,
        1, // TODO: Get current user ID from auth context
      );

      const transformedComment = transformComment(createdComment);
      setComments((prev) => [...prev, transformedComment]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const renderSubtaskRow = (childSubtask, level = 0) => {
    const hasNestedSubtasks =
      childSubtask.childSubtasks && childSubtask.childSubtasks.length > 0;
    const isExpanded = expandedSubtasks.has(childSubtask.id);
    const assigneeAvatar = getAssigneeAvatar(childSubtask.assignee);

    return (
      <React.Fragment key={childSubtask.id}>
        <tr className="hover:bg-white/40 hover:backdrop-blur-sm transition-all duration-200">
          <td className="px-4 py-3">
            <input
              type="checkbox"
              checked={childSubtask.status === "Done"}
              onChange={(e) => {
                e.stopPropagation();
                handleSubtaskStatusChange(
                  childSubtask.id,
                  e.target.checked ? "Done" : "To Do",
                );
              }}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
            />
          </td>
          <td
            className="px-4 py-3"
            style={{ paddingLeft: `${16 + level * 24}px` }}
          >
            <div className="flex items-center space-x-2">
              {hasNestedSubtasks ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubtaskExpansion(childSubtask.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              ) : (
                <div className="w-6 h-6" />
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/subtasks/${childSubtask.id}`)}
                  className={`text-sm font-medium transition-all duration-200 hover:text-blue-600 ${
                    childSubtask.status === "Done"
                      ? "text-gray-500 line-through"
                      : "text-gray-900"
                  }`}
                >
                  {childSubtask.name}
                </button>
                {hasNestedSubtasks && (
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-0.5">
                    <span className="text-xs text-gray-600 font-medium">
                      {childSubtask.childSubtasks.length}
                    </span>
                    <GitBranch className="h-3 w-3 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          </td>
          <td className="px-4 py-3">
            <select
              value={childSubtask.status}
              onChange={(e) =>
                handleSubtaskStatusChange(childSubtask.id, e.target.value)
              }
              className={`text-sm px-3 py-1 rounded border ${getStatusColor(childSubtask.status)}`}
            >
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-6 h-6 ${assigneeAvatar.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}
              >
                {assigneeAvatar.initials}
              </div>
              <span className="text-sm text-gray-700">
                {getAssigneeName(childSubtask.assignee)}
              </span>
            </div>
          </td>
          <td className="px-4 py-3">
            <span className="text-sm text-gray-600">
              {childSubtask.dueDate || "No due date"}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${childSubtask.progress || 0}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-600 font-medium min-w-[3rem]">
                {childSubtask.progress || 0}%
              </span>
            </div>
          </td>
          <td className="px-4 py-3">
            <button
              onClick={() => router.push(`/subtasks/${childSubtask.id}/edit`)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
              title="Edit subtask"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
          </td>
        </tr>
        {/* Render nested subtasks if expanded */}
        {hasNestedSubtasks &&
          isExpanded &&
          childSubtask.childSubtasks.map((nestedSubtask) =>
            renderSubtaskRow(nestedSubtask, level + 1),
          )}
      </React.Fragment>
    );
  };

  // Build breadcrumb navigation
  const buildBreadcrumbs = () => {
    const breadcrumbs = [];

    if (subtask?.task?.project) {
      breadcrumbs.push({
        label: subtask.task.project.name,
        href: `/projects/${subtask.task.project.slug}`,
        icon: subtask.task.project.icon,
        color: subtask.task.project.color,
      });
    }

    if (subtask?.task) {
      breadcrumbs.push({
        label: subtask.task.name,
        href: `/tasks/${subtask.task.id}`,
      });
    }

    // Add parent subtasks to breadcrumb
    let currentParent = subtask?.parentSubtask;
    const parentBreadcrumbs = [];
    while (currentParent) {
      parentBreadcrumbs.unshift({
        label: currentParent.name,
        href: `/subtasks/${currentParent.id}`,
      });
      currentParent = currentParent.parentSubtask;
    }

    breadcrumbs.push(...parentBreadcrumbs);

    return breadcrumbs;
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading subtask...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !subtask) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {error ? "Error Loading Subtask" : "Subtask Not Found"}
              </h1>
              <p className="text-gray-600 mb-6">
                {error || "The subtask you're looking for doesn't exist."}
              </p>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const assigneeAvatar = getAssigneeAvatar(subtask.assignee);
  const breadcrumbs = buildBreadcrumbs();

  // Convert breadcrumbs to PageHeader format
  const pageHeaderBreadcrumbs = [
    { label: "Dashboard", href: "/" },
    ...breadcrumbs.map((crumb) => ({ label: crumb.label, href: crumb.href })),
    { label: subtask.name, href: `/subtasks/${subtask.id}` },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-auto w-full relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/10 to-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-blue-500/8 to-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-bl from-green-400/8 to-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="p-6 relative z-10">
        <PageHeader
          title={subtask.name}
          subtitle={subtask.description || "Subtask details and information"}
          breadcrumb={pageHeaderBreadcrumbs}
          showSearch={false}
          showActions={true}
          actions={[
            {
              icon: User,
              onClick: () => console.log("Assign subtask"),
            },
            {
              icon: Share,
              onClick: () => console.log("Share subtask"),
            },
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative z-10">
        <div className="w-full mx-auto px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Subtask Details */}
            <div className="lg:col-span-3 space-y-6">
              {/* Overview Section */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Subtask Overview
                  </h2>
                  <button
                    onClick={() => router.push(`/subtasks/${subtask.id}/edit`)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-white/60 backdrop-blur-sm rounded-lg transition-all duration-300 border border-white/30"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Assignee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assignee
                    </label>
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 ${assigneeAvatar.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}
                      >
                        {assigneeAvatar.initials}
                      </div>
                      <span className="text-gray-900">
                        {getAssigneeName(subtask.assignee)}
                      </span>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded ml-auto">
                        <Plus className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        {subtask.dueDate || "No due date"}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <div className="relative">
                      <button
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor(subtask.status)}`}
                      >
                        {subtask.status}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Progress
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {subtask.progress}%
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${subtask.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <p className="text-gray-700 leading-relaxed">
                      {subtask.description || "No description provided."}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Child Sub-Tasks Section */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Child Subtasks
                  </h2>
                  <button
                    onClick={handleAddSubtask}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl rounded-lg transition-all duration-300 hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    Add Subtask
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {subtask.childSubtasks && subtask.childSubtasks.length > 0 ? (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/30 bg-white/40 backdrop-blur-sm">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtask Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Assignee
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/30 backdrop-blur-sm divide-y divide-white/20">
                        {subtask.childSubtasks.map((childSubtask) =>
                          renderSubtaskRow(childSubtask),
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No child subtasks available</p>
                      <p className="text-sm">
                        Click &quot;Add Subtask&quot; above to add one
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Right Column - Comments */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-white/80 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Comments
                  </h2>
                  <select className="text-sm text-gray-600 bg-white border border-gray-300 rounded px-3 py-1">
                    <option>All Activity</option>
                    <option>Comments Only</option>
                    <option>Actions Only</option>
                  </select>
                </div>

                {/* Comments Feed */}
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {comments && comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div
                          className={`w-8 h-8 ${comment.hasProfilePic ? "bg-blue-500" : "bg-gray-300"} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                        >
                          {comment.user?.initials || "??"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {comment.author}
                            </span>
                            <span className="text-sm text-gray-500">
                              {comment.timestamp}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No comments yet</p>
                      <p className="text-sm">
                        Be the first to comment on this subtask
                      </p>
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <div className="mt-6 space-y-3">
                  <div className="flex gap-3">
                    <div
                      className={`w-8 h-8 ${assigneeAvatar.color} rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}
                    >
                      {assigneeAvatar.initials}
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Write a comment"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleAddComment()
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <List className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Image className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <button
                      onClick={handleAddComment}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl rounded-lg transition-all duration-300 hover:scale-[1.02]"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
