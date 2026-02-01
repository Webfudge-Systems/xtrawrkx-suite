"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  ChevronDown,
  Plus,
  Bold,
  Italic,
  AtSign,
  Smile,
  Paperclip,
  Reply,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import commentService from "../../lib/api/commentService";
import { transformComment } from "../../lib/utils/transformComment";
import { useAuth } from "../../contexts/AuthContext";
import strapiClient from "../../lib/strapiClient";
import { createPortal } from "react-dom";

const CommentsTab = ({ entityType, entityId }) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [showFormatting, setShowFormatting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({
    type: null,
    id: null,
    parentId: null,
  });

  // Mention functionality
  const [users, setUsers] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentions, setMentions] = useState([]);
  const textareaRef = useRef(null);
  const mentionDropdownRef = useRef(null);
  const commentsScrollRef = useRef(null);

  // Load users for mentions
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersResponse = await strapiClient.getXtrawrkxUsers({
          "pagination[pageSize]": 100,
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
      }
    };

    loadUsers();
  }, []);

  // Close mention dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(event.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target)
      ) {
        setShowMentionDropdown(false);
      }
    };

    if (showMentionDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMentionDropdown]);

  // Scroll to bottom when comments change
  useEffect(() => {
    if (commentsScrollRef.current && !loading) {
      setTimeout(() => {
        if (commentsScrollRef.current) {
          commentsScrollRef.current.scrollTop =
            commentsScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [comments, loading]);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      if (!entityId) {
        console.warn("CommentsTab: No entityId provided", {
          entityType,
          entityId,
        });
        return;
      }

      try {
        setLoading(true);
        let response;

        if (entityType === "leadCompany") {
          response = await commentService.getLeadCompanyComments(entityId, {
            populate: ["user", "replies", "replies.user", "mentions"],
          });
        } else if (entityType === "clientAccount") {
          response = await commentService.getClientAccountComments(entityId, {
            populate: ["user", "replies", "replies.user", "mentions"],
          });
        } else if (entityType === "deal") {
          response = await commentService.getDealComments(entityId, {
            populate: ["user", "replies", "replies.user", "mentions"],
          });
        } else if (entityType === "contact") {
          response = await commentService.getContactComments(entityId, {
            populate: ["user", "replies", "replies.user", "mentions"],
          });
        } else {
          console.warn("Unsupported entity type:", entityType);
          setComments([]);
          return;
        }

        // Handle different response structures
        let commentsData = [];
        if (Array.isArray(response.data)) {
          commentsData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          commentsData = response.data.data;
        } else if (Array.isArray(response)) {
          commentsData = response;
        }

        // Filter to only root comments (no parent)
        const rootComments = commentsData.filter(
          (comment) =>
            !comment.parentComment && !comment.attributes?.parentComment,
        );
        const transformedComments = rootComments
          .map(transformComment)
          .filter(Boolean);

        setComments(transformedComments);
      } catch (error) {
        console.error("Error loading comments:", error);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [entityId, entityType]);

  // Helper function to get time ago
  function getTimeAgo(timestamp) {
    if (!timestamp) return "just now";

    try {
      const now = new Date();
      const commentTime = new Date(timestamp);
      const diffInMinutes = Math.floor((now - commentTime) / (1000 * 60));

      if (diffInMinutes < 1) return "just now";
      if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
      if (diffInMinutes < 1440)
        return `${Math.floor(diffInMinutes / 60)} hour${
          Math.floor(diffInMinutes / 60) > 1 ? "s" : ""
        } ago`;
      return `${Math.floor(diffInMinutes / 1440)} day${
        Math.floor(diffInMinutes / 1440) > 1 ? "s" : ""
      } ago`;
    } catch {
      return timestamp;
    }
  }

  // Get user initials and color
  const getUserDisplay = (commentUser) => {
    if (!commentUser) {
      return { initials: "U", color: "bg-gray-500" };
    }

    const firstName =
      commentUser.firstName || commentUser.name?.split(" ")[0] || "";
    const lastName =
      commentUser.lastName || commentUser.name?.split(" ")[1] || "";
    const initials =
      (firstName.charAt(0) + (lastName?.charAt(0) || "")).toUpperCase() || "U";

    // Generate color based on user ID
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const colorIndex = (commentUser.id || 0) % colors.length;

    return { initials, color: colors[colorIndex] };
  };

  const filterOptions = [
    { value: "all", label: "All Activity", count: comments.length },
    {
      value: "comments",
      label: "Comments",
      count: comments.length,
    },
  ];

  const filteredComments = comments.filter(() => {
    if (activeFilter === "all") return true;
    if (activeFilter === "comments") return true;
    return true;
  });

  // Filter users based on mention query
  const filteredUsersForMention = users
    .filter((user) => {
      if (!mentionQuery || mentionQuery.trim() === "") {
        // Show all users when just @ is typed
        return true;
      }
      const query = mentionQuery.toLowerCase().trim();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query)
      );
    })
    .slice(0, 10); // Limit to 10 users for better performance

  // Handle @ mention in textarea
  const handleCommentChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    // Find @ symbol before cursor
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // Get text after @ symbol
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      // Check if there's a space or newline after @ (meaning it's not an active mention)
      // Also check if there's already a space before @ (to handle cases like "hello @")
      const hasSpaceAfter =
        textAfterAt.includes(" ") || textAfterAt.includes("\n");
      const textBeforeAt = textBeforeCursor.substring(0, lastAtIndex);
      const hasSpaceBefore =
        lastAtIndex > 0 && textBeforeAt[textBeforeAt.length - 1] !== " ";

      if (!hasSpaceAfter) {
        // Show mention dropdown
        const query = textAfterAt.toLowerCase();
        setMentionQuery(query);
        setShowMentionDropdown(true);
        setSelectedMentionIndex(0);

        // Center the dropdown on the page like other modals
        setMentionPosition({
          top: window.innerHeight / 2,
          left: window.innerWidth / 2,
        });
      } else {
        setShowMentionDropdown(false);
        setMentionQuery("");
      }
    } else {
      setShowMentionDropdown(false);
      setMentionQuery("");
    }

    setNewComment(value);
  };

  // Insert mention into text
  const insertMention = (selectedUser) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const value = textarea.value;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterCursor = value.substring(cursorPosition);
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      // Replace @query with @username
      const newText =
        value.substring(0, lastAtIndex) +
        `@${selectedUser.name} ` +
        textAfterCursor;

      setNewComment(newText);

      // Add user to mentions array if not already present
      const userIdToAdd = selectedUser.id || selectedUser.documentId;
      if (
        userIdToAdd &&
        !mentions.find(
          (m) =>
            m === userIdToAdd ||
            m === parseInt(userIdToAdd) ||
            String(m) === String(userIdToAdd),
        )
      ) {
        setMentions([...mentions, userIdToAdd]);
      }

      // Close dropdown and reset
      setShowMentionDropdown(false);
      setMentionQuery("");
      setSelectedMentionIndex(0);

      // Set cursor position after the mention
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastAtIndex + selectedUser.name.length + 2;
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 10);
    }
  };

  // Handle keyboard navigation in mention dropdown
  const handleMentionKeyDown = (e) => {
    if (!showMentionDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedMentionIndex((prev) =>
        Math.min(prev + 1, filteredUsersForMention.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (filteredUsersForMention[selectedMentionIndex]) {
        insertMention(filteredUsersForMention[selectedMentionIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowMentionDropdown(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !entityId || !user) {
      console.warn("Cannot add comment: missing data", {
        hasComment: !!newComment.trim(),
        entityId,
        hasUser: !!user,
      });
      return;
    }

    const userId = user?.documentId || user?.id || user?.data?.id;

    if (!userId) {
      console.error("User ID not found in user object:", user);
      alert("Unable to identify user. Please refresh the page and try again.");
      return;
    }

    try {
      setSubmitting(true);

      let createdComment;
      try {
        if (entityType === "leadCompany") {
          createdComment = await commentService.createLeadCompanyComment(
            entityId,
            newComment.trim(),
            userId,
            mentions,
          );
        } else if (entityType === "clientAccount") {
          createdComment = await commentService.createClientAccountComment(
            entityId,
            newComment.trim(),
            userId,
            mentions,
          );
        } else if (entityType === "deal") {
          createdComment = await commentService.createDealComment(
            entityId,
            newComment.trim(),
            userId,
            mentions,
          );
        } else if (entityType === "contact") {
          createdComment = await commentService.createContactComment(
            entityId,
            newComment.trim(),
            userId,
            mentions,
          );
        } else {
          throw new Error(`Unsupported entity type: ${entityType}`);
        }
      } catch (createError) {
        console.error("Error creating comment:", createError);
        const errorMessage =
          createError.response?.data?.error?.message ||
          createError.response?.data?.message ||
          createError.message ||
          "Failed to create comment. Please check the console for details.";
        alert(`Error: ${errorMessage}`);
        setSubmitting(false);
        return;
      }

      // Clear mentions and close dropdown after comment is created
      setMentions([]);
      setShowMentionDropdown(false);
      setMentionQuery("");

      // Reload comments
      let response;
      try {
        if (entityType === "leadCompany") {
          response = await commentService.getLeadCompanyComments(entityId, {
            populate: ["user", "replies", "replies.user", "mentions"],
          });
        } else if (entityType === "clientAccount") {
          response = await commentService.getClientAccountComments(entityId, {
            populate: ["user", "replies", "replies.user", "mentions"],
          });
        } else if (entityType === "deal") {
          response = await commentService.getDealComments(entityId, {
            populate: ["user", "replies", "replies.user", "mentions"],
          });
        } else if (entityType === "contact") {
          response = await commentService.getContactComments(entityId, {
            populate: ["user", "replies", "replies.user", "mentions"],
          });
        }
      } catch (reloadError) {
        console.error("Error reloading comments:", reloadError);
      }

      // Handle different response structures
      let commentsData = [];
      if (Array.isArray(response?.data)) {
        commentsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        commentsData = response.data.data;
      } else if (Array.isArray(response)) {
        commentsData = response;
      }

      const rootComments = commentsData.filter(
        (comment) =>
          !comment.parentComment && !comment.attributes?.parentComment,
      );
      const transformedComments = rootComments
        .map(transformComment)
        .filter(Boolean);

      setComments(transformedComments);
      setNewComment("");
      setShowMentionDropdown(false);
      setMentionQuery("");

      // Scroll to bottom after adding comment
      setTimeout(() => {
        if (commentsScrollRef.current) {
          commentsScrollRef.current.scrollTop =
            commentsScrollRef.current.scrollHeight;
        }
      }, 150);
    } catch (error) {
      console.error("Error adding comment:", error);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to add comment. Please try again.";
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId) => {
    const replyContent = replyText[parentCommentId]?.trim();
    if (!replyContent || !user || !entityId) return;

    try {
      setSubmitting(true);
      const userId = user?.documentId || user?.id || user?.data?.id;

      await commentService.replyToComment(
        parentCommentId,
        replyContent,
        userId,
      );

      // Reload comments
      let response;
      if (entityType === "leadCompany") {
        response = await commentService.getLeadCompanyComments(entityId, {
          populate: ["user", "replies", "replies.user"],
        });
      } else if (entityType === "clientAccount") {
        response = await commentService.getClientAccountComments(entityId, {
          populate: ["user", "replies", "replies.user"],
        });
      } else if (entityType === "deal") {
        response = await commentService.getDealComments(entityId, {
          populate: ["user", "replies", "replies.user"],
        });
      } else if (entityType === "contact") {
        response = await commentService.getContactComments(entityId, {
          populate: ["user", "replies", "replies.user"],
        });
      }

      // Handle different response structures
      let commentsData = [];
      if (Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        commentsData = response.data.data;
      } else if (Array.isArray(response)) {
        commentsData = response;
      }

      const rootComments = commentsData.filter(
        (comment) =>
          !comment.parentComment && !comment.attributes?.parentComment,
      );
      const transformedComments = rootComments
        .map(transformComment)
        .filter(Boolean);

      setComments(transformedComments);
      setReplyText((prev) => ({ ...prev, [parentCommentId]: "" }));
      setReplyingTo(null);

      // Scroll to bottom after adding reply
      setTimeout(() => {
        if (commentsScrollRef.current) {
          commentsScrollRef.current.scrollTop =
            commentsScrollRef.current.scrollHeight;
        }
      }, 150);
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("Failed to add reply. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reload comments helper function
  const reloadComments = async () => {
    if (!entityId) return;

    try {
      let response;
      if (entityType === "leadCompany") {
        response = await commentService.getLeadCompanyComments(entityId, {
          populate: ["user", "replies", "replies.user"],
        });
      } else if (entityType === "clientAccount") {
        response = await commentService.getClientAccountComments(entityId, {
          populate: ["user", "replies", "replies.user"],
        });
      } else if (entityType === "deal") {
        response = await commentService.getDealComments(entityId, {
          populate: ["user", "replies", "replies.user"],
        });
      } else if (entityType === "contact") {
        response = await commentService.getContactComments(entityId, {
          populate: ["user", "replies", "replies.user"],
        });
      }

      // Handle different response structures
      let commentsData = [];
      if (Array.isArray(response?.data)) {
        commentsData = response.data;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        commentsData = response.data.data;
      } else if (Array.isArray(response)) {
        commentsData = response;
      }

      const rootComments = commentsData.filter(
        (comment) =>
          !comment.parentComment && !comment.attributes?.parentComment,
      );
      const transformedComments = rootComments
        .map(transformComment)
        .filter(Boolean);

      setComments(transformedComments);
    } catch (error) {
      console.error("Error reloading comments:", error);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (type, id, parentId = null) => {
    setDeleteTarget({ type, id, parentId });
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteTarget({ type: null, id: null, parentId: null });
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    openDeleteModal("comment", commentId);
  };

  // Handle delete reply
  const handleDeleteReply = async (replyId, parentCommentId) => {
    openDeleteModal("reply", replyId, parentCommentId);
  };

  // Confirm and execute delete
  const confirmDelete = async () => {
    if (!deleteTarget.id) return;

    try {
      setDeletingCommentId(deleteTarget.id);
      await commentService.deleteComment(deleteTarget.id);
      await reloadComments();
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete. Please try again.");
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Render comment content with highlighted mentions
  const renderCommentContent = (content, mentions) => {
    if (!content) return null;

    // Create a map of user IDs to user names for quick lookup
    const mentionMap = new Map();
    if (mentions && Array.isArray(mentions)) {
      mentions.forEach((mentionId) => {
        const mentionedUser = users.find(
          (u) => u.id === mentionId || u.id === parseInt(mentionId),
        );
        if (mentionedUser) {
          mentionMap.set(mentionId.toString(), mentionedUser.name);
          mentionMap.set(parseInt(mentionId).toString(), mentionedUser.name);
        }
      });
    }

    // Split content by @mentions and create JSX elements
    const parts = [];
    let lastIndex = 0;
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>,
        );
      }

      const mentionText = match[1];
      // Check if this mention matches any user in the mentions array
      const isMentioned = Array.from(mentionMap.values()).some(
        (name) => name.toLowerCase() === mentionText.toLowerCase(),
      );

      if (isMentioned) {
        // Highlight the mention
        parts.push(
          <span
            key={`mention-${match.index}`}
            className="font-semibold text-blue-600 bg-blue-50 px-1 rounded"
          >
            {match[0]}
          </span>,
        );
      } else {
        // Regular @mention that's not in the mentions array
        parts.push(
          <span key={`mention-${match.index}`} className="text-blue-500">
            {match[0]}
          </span>,
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>,
      );
    }

    return parts.length > 0 ? parts : content;
  };

  const currentUserDisplay = getUserDisplay(user);

  return (
    <div className="flex flex-col h-[600px] bg-white">
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span>
                {filterOptions.find((f) => f.value === activeFilter)?.label}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setActiveFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      activeFilter === option.value
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="text-xs text-gray-500">
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments Feed - Scrollable */}
      <div
        ref={commentsScrollRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-4 min-h-0"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
              <p className="text-gray-500 text-sm">Loading comments...</p>
            </div>
          </div>
        ) : filteredComments.length > 0 ? (
          <div className="space-y-6">
            {filteredComments.map((comment) => {
              const userDisplay = getUserDisplay(comment.user);
              const timestamp = getTimeAgo(
                comment.createdAt || comment.timestamp,
              );
              const isReplying = replyingTo === comment.id;

              return (
                <div key={comment.id} className="flex gap-3">
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 ${userDisplay.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                  >
                    {userDisplay.initials}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user?.name ||
                            comment.author ||
                            "Unknown User"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {timestamp}
                        </span>
                      </div>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteComment(comment.id);
                        }}
                        disabled={deletingCommentId === comment.id}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete comment"
                      >
                        {deletingCommentId === comment.id ? (
                          <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>

                    {/* Comment Content */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-2">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {renderCommentContent(
                          comment.content,
                          comment.mentions,
                        )}
                      </p>
                    </div>

                    {/* Reply Button */}
                    <button
                      onClick={() => {
                        setReplyingTo(isReplying ? null : comment.id);
                        if (!isReplying) {
                          setReplyText((prev) => ({
                            ...prev,
                            [comment.id]: "",
                          }));
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors"
                    >
                      <Reply className="w-3 h-3" />
                      <span>{isReplying ? "Cancel" : "Reply"}</span>
                    </button>

                    {/* Reply Input */}
                    {isReplying && (
                      <div className="mb-4 ml-4 border-l-2 border-blue-200 pl-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-2">
                          <textarea
                            value={replyText[comment.id] || ""}
                            onChange={(e) =>
                              setReplyText((prev) => ({
                                ...prev,
                                [comment.id]: e.target.value,
                              }))
                            }
                            placeholder="Write a reply..."
                            className="w-full min-h-[60px] p-2 border-none outline-none resize-none text-sm"
                            rows={2}
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                (e.metaKey || e.ctrlKey)
                              ) {
                                e.preventDefault();
                                handleReply(comment.id);
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                              Press Ctrl+Enter to reply
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText((prev) => ({
                                    ...prev,
                                    [comment.id]: "",
                                  }));
                                }}
                                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReply(comment.id)}
                                disabled={
                                  !replyText[comment.id]?.trim() || submitting
                                }
                                className={`px-4 py-1 rounded text-xs font-medium transition-colors ${
                                  replyText[comment.id]?.trim() && !submitting
                                    ? "bg-blue-500 text-white hover:bg-blue-600"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                }`}
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies Thread */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-4 mt-2 space-y-3 border-l-2 border-gray-200 pl-4">
                        {comment.replies.map((reply) => {
                          const replyUserDisplay = getUserDisplay(reply.user);
                          const replyTimestamp = getTimeAgo(
                            reply.createdAt || reply.timestamp,
                          );
                          return (
                            <div key={reply.id} className="flex gap-2">
                              <div
                                className={`w-6 h-6 ${replyUserDisplay.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                              >
                                {replyUserDisplay.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-900">
                                      {reply.user?.name ||
                                        reply.author ||
                                        "Unknown"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {replyTimestamp}
                                    </span>
                                  </div>
                                  {/* Delete Reply Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteReply(reply.id, comment.id);
                                    }}
                                    disabled={deletingCommentId === reply.id}
                                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete reply"
                                  >
                                    {deletingCommentId === reply.id ? (
                                      <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3 h-3" />
                                    )}
                                    <span className="hidden sm:inline">
                                      Delete
                                    </span>
                                  </button>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2">
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {renderCommentContent(
                                      reply.content,
                                      reply.mentions,
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No comments yet</p>
              <p className="text-gray-400 text-xs">
                Start the conversation by adding a comment
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Comment Input - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white sticky bottom-0 z-10">
        <div className="flex gap-3">
          <div
            className={`w-8 h-8 ${currentUserDisplay.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
          >
            {currentUserDisplay.initials}
          </div>
          <div className="flex-1">
            {/* Main Input Box */}
            <div className="border border-gray-300 rounded-lg bg-white shadow-sm">
              {/* Formatting Toolbar */}
              {showFormatting && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
                  <button
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (textareaRef.current) {
                        const textarea = textareaRef.current;
                        const currentValue = newComment;
                        const cursorPos =
                          textarea.selectionStart || currentValue.length;
                        const newValue =
                          currentValue.substring(0, cursorPos) +
                          "@" +
                          currentValue.substring(cursorPos);
                        setNewComment(newValue);
                        // Focus and set cursor after @
                        setTimeout(() => {
                          if (textareaRef.current) {
                            textarea.focus();
                            const newCursorPos = cursorPos + 1;
                            textarea.setSelectionRange(
                              newCursorPos,
                              newCursorPos,
                            );
                            // Manually trigger the mention dropdown logic
                            const textBeforeCursor = newValue.substring(
                              0,
                              newCursorPos,
                            );
                            const lastAtIndex =
                              textBeforeCursor.lastIndexOf("@");
                            if (lastAtIndex !== -1) {
                              const textAfterAt = textBeforeCursor.substring(
                                lastAtIndex + 1,
                              );
                              if (
                                !textAfterAt.includes(" ") &&
                                !textAfterAt.includes("\n")
                              ) {
                                setMentionQuery("");
                                setShowMentionDropdown(true);
                                setSelectedMentionIndex(0);
                                // Center the dropdown on the page like other modals
                                setMentionPosition({
                                  top: window.innerHeight / 2,
                                  left: window.innerWidth / 2,
                                });
                              }
                            }
                          }
                        }, 10);
                      }
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors"
                    title="Mention someone (@)"
                  >
                    <AtSign className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                    title="Emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  <button
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                    title="Attach"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={handleCommentChange}
                  onFocus={() => setShowFormatting(true)}
                  placeholder="Type @ to mention someone, / for menu"
                  disabled={submitting || !user}
                  className="w-full min-h-[80px] p-3 border-none outline-none resize-none text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
                  rows={3}
                  onKeyDown={(e) => {
                    // Handle mention dropdown navigation first
                    if (showMentionDropdown) {
                      handleMentionKeyDown(e);
                      return;
                    }

                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      if (!submitting && newComment.trim()) {
                        handleAddComment();
                      }
                    }
                    if (e.key === "/" && !newComment) {
                      e.preventDefault();
                      setShowFormatting(true);
                    }
                  }}
                />

                {/* Mention Dropdown - Centered Modal */}
                {showMentionDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0"
                      onClick={() => {
                        setShowMentionDropdown(false);
                        setMentionQuery("");
                      }}
                    />
                    {/* Modal */}
                    <div
                      ref={mentionDropdownRef}
                      className="fixed z-[10000] bg-white border border-gray-200 rounded-xl shadow-2xl max-h-[60vh] overflow-y-auto w-full max-w-md"
                      style={{
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      {filteredUsersForMention.length > 0 ? (
                        <div className="p-1">
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                            Mention someone
                          </div>
                          {filteredUsersForMention.map((user, index) => (
                            <button
                              key={user.id}
                              onClick={() => insertMention(user)}
                              onMouseEnter={() =>
                                setSelectedMentionIndex(index)
                              }
                              className={`w-full text-left px-3 py-2 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                                index === selectedMentionIndex
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                            >
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {user.name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {user.email}
                                </div>
                              </div>
                              {index === selectedMentionIndex && (
                                <div className="text-blue-500">
                                  <AtSign className="w-4 h-4" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-500">
                            No users found
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Try typing a name or email
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Footer with actions */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFormatting(!showFormatting)}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-500"
                    title="Formatting options"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-400">
                    {mentions.length > 0
                      ? `${mentions.length} ${
                          mentions.length === 1 ? "person" : "people"
                        } will be notified`
                      : newComment.trim()
                        ? "Type @ to mention someone"
                        : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!newComment.trim() || submitting || !user) {
                      return;
                    }
                    handleAddComment();
                  }}
                  disabled={!newComment.trim() || submitting || !user}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    newComment.trim() && !submitting && user
                      ? "bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                  title={
                    !user
                      ? "Please log in to add comments"
                      : !newComment.trim()
                        ? "Enter a comment"
                        : submitting
                          ? "Submitting..."
                          : "Add comment"
                  }
                >
                  {submitting ? "Submitting..." : "Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {typeof window !== "undefined" &&
        showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Delete{" "}
                      {deleteTarget.type === "comment" ? "Comment" : "Reply"}?
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      This action cannot be undone.
                    </p>
                  </div>
                  <button
                    onClick={closeDeleteModal}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <p className="text-sm text-gray-700">
                    Are you sure you want to delete this{" "}
                    {deleteTarget.type === "comment" ? "comment" : "reply"}?
                    This action cannot be undone and will permanently remove it.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={closeDeleteModal}
                    disabled={deletingCommentId === deleteTarget.id}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deletingCommentId === deleteTarget.id}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {deletingCommentId === deleteTarget.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default CommentsTab;
