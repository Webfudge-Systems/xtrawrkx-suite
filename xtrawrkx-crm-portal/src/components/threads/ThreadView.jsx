"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Edit,
  Trash2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Reply,
  Smile,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { Button } from "../ui";
import { useAuth } from "../../contexts/AuthContext";
import chatService from "../../lib/api/chatService";
import commentService from "../../lib/api/commentService";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

export default function ThreadView({ thread, onThreadUpdate, onBack }) {
  const { user } = useAuth();
  const [replyText, setReplyText] = useState("");
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef(null);
  const replyInputRef = useRef(null);

  const threadData = thread.attributes || thread;
  const isEntityChat = thread.type === "entityChat";

  // For entity chats, use all comments directly
  let allMessages = [];

  if (isEntityChat && thread.allComments) {
    // Filter to only root comments (no parent)
    const rootComments = thread.allComments.filter((comment) => {
      const commentData = comment.attributes || comment;
      return !commentData.parentComment && !commentData.parentCommentId;
    });

    // Transform root comments and their replies into message format
    allMessages = rootComments
      .map((comment) => {
        const commentData = comment.attributes || comment;
        const user = commentData.user?.data?.attributes || commentData.user;

        // Get replies for this comment
        const replies = thread.allComments
          .filter((reply) => {
            const replyData = reply.attributes || reply;
            const parentId =
              replyData.parentComment?.data?.id ||
              replyData.parentComment?.id ||
              replyData.parentCommentId;
            const commentId = comment.id || commentData.id;
            return (
              parentId &&
              (parentId === commentId || String(parentId) === String(commentId))
            );
          })
          .map((reply) => {
            const replyData = reply.attributes || reply;
            const replyUser =
              replyData.user?.data?.attributes || replyData.user;

            return {
              id: reply.id || replyData.id,
              attributes: {
                message: replyData.content,
                content: replyData.content,
                createdAt: replyData.createdAt,
                createdBy: replyUser,
                isEdited: false,
                isReply: true,
              },
            };
          })
          .sort(
            (a, b) =>
              new Date(a.attributes?.createdAt || a.createdAt) -
              new Date(b.attributes?.createdAt || b.createdAt),
          );

        return {
          id: comment.id || commentData.id,
          attributes: {
            message: commentData.content,
            content: commentData.content,
            createdAt: commentData.createdAt,
            createdBy: user,
            isEdited: false,
            replies: replies,
          },
        };
      })
      .sort(
        (a, b) =>
          new Date(a.attributes?.createdAt || a.createdAt) -
          new Date(b.attributes?.createdAt || b.createdAt),
      );
  } else {
    // Legacy format for other thread types
    const isCommentThread = thread.type === "comment";
    const replies = threadData.replies?.data || threadData.replies || [];

    // Transform replies to unified format
    const transformedReplies = replies.map((reply) => {
      const replyData = reply.attributes || reply;
      if (isCommentThread) {
        // Comment reply format
        return {
          id: reply.id || replyData.id,
          attributes: {
            message: replyData.content,
            content: replyData.content,
            createdAt: replyData.createdAt,
            createdBy: replyData.user?.data || replyData.user,
            isEdited: false,
          },
        };
      } else {
        // Chat message reply format
        return reply;
      }
    });

    // Create root message
    const rootMessage = {
      id: thread.id,
      attributes: {
        message: threadData.message || threadData.content,
        content: threadData.content || threadData.message,
        createdAt: threadData.createdAt,
        createdBy: threadData.createdBy?.data || threadData.createdBy,
        isEdited: false,
      },
    };

    allMessages = [rootMessage, ...transformedReplies].sort(
      (a, b) =>
        new Date(a.attributes?.createdAt || a.createdAt) -
        new Date(b.attributes?.createdAt || b.createdAt),
    );
  }

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMessageMenu && !event.target.closest(".message-menu-container")) {
        setShowMessageMenu(null);
      }
    };

    if (showMessageMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMessageMenu]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    const messageText = replyText.trim();
    setReplyText("");

    try {
      const userId = user?.documentId || user?.id || user?.data?.id;
      if (!userId) {
        alert("Unable to identify user. Please refresh the page.");
        return;
      }

      if (isEntityChat) {
        // Reply to entity chat (create new comment)
        const entityType = thread.entityType;
        const entityId = thread.entityId;

        if (entityType === "leadCompany") {
          await commentService.createLeadCompanyComment(
            entityId,
            messageText,
            userId,
          );
        } else if (entityType === "clientAccount") {
          await commentService.createClientAccountComment(
            entityId,
            messageText,
            userId,
          );
        } else if (entityType === "contact") {
          await commentService.createContactComment(
            entityId,
            messageText,
            userId,
          );
        } else if (entityType === "deal") {
          await commentService.createDealComment(entityId, messageText, userId);
        }
      } else if (thread.type === "comment") {
        // Reply to comment thread
        const rootCommentId =
          thread.originalId || thread.id?.replace("comment-", "");
        await commentService.replyToComment(rootCommentId, messageText, userId);
      } else {
        // Reply to chat thread (legacy)
        const entityType = threadData.leadCompany
          ? "leadCompany"
          : threadData.clientAccount
            ? "clientAccount"
            : null;
        const entityId =
          threadData.leadCompany?.data?.id ||
          threadData.clientAccount?.data?.id ||
          threadData.leadCompany?.id ||
          threadData.clientAccount?.id;
        await chatService.replyToThread(
          thread.originalId || thread.id?.replace("chat-", ""),
          messageText,
          userId,
          entityType,
          entityId,
        );
      }

      // Refresh thread
      if (onThreadUpdate) {
        onThreadUpdate();
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply");
      setReplyText(messageText);
    }
  };

  const handleEditMessage = (message) => {
    const messageData = message.attributes || message;
    setEditingMessageId(message.id);
    setEditMessageText(messageData.message || messageData.content || "");
  };

  const handleSaveEdit = async (messageId) => {
    if (!editMessageText.trim()) return;

    try {
      if (isEntityChat || thread.type === "comment") {
        await commentService.updateComment(messageId, {
          content: editMessageText,
        });
      } else {
        await chatService.updateMessage(messageId, editMessageText);
      }
      setEditingMessageId(null);
      setEditMessageText("");
      if (onThreadUpdate) {
        onThreadUpdate();
      }
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      if (isEntityChat || thread.type === "comment") {
        await commentService.deleteComment(messageId);
      } else {
        await chatService.deleteMessage(messageId);
      }
      if (onThreadUpdate) {
        onThreadUpdate();
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  const handleReply = async (parentCommentId) => {
    const replyContent = replyTexts[parentCommentId]?.trim();
    if (!replyContent || !user) return;

    try {
      setSubmitting(true);
      const userId = user?.documentId || user?.id || user?.data?.id;

      if (!userId) {
        alert("Unable to identify user. Please refresh the page.");
        return;
      }

      await commentService.replyToComment(
        parentCommentId,
        replyContent,
        userId,
      );

      // Refresh thread
      if (onThreadUpdate) {
        onThreadUpdate();
      }

      // Clear reply state
      setReplyTexts((prev) => ({ ...prev, [parentCommentId]: "" }));
      setReplyingTo(null);
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("Failed to add reply. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatMessageText = (text) => {
    if (!text) return "";

    // URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 underline break-all"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const formatMessageDate = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);

    if (isToday(messageDate)) {
      return "Today";
    } else if (isYesterday(messageDate)) {
      return "Yesterday";
    } else {
      return format(messageDate, "MMMM d, yyyy");
    }
  };

  // Get user initials and color (similar to CommentsTab)
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
    const userId = commentUser.id || commentUser.documentId || 0;
    const colorIndex = userId % colors.length;

    return { initials, color: colors[colorIndex] };
  };

  // Get time ago format (similar to CommentsTab)
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

  const getThreadContext = () => {
    if (threadData.leadCompany) {
      const leadCompany =
        threadData.leadCompany.data?.attributes || threadData.leadCompany;
      return `# ${leadCompany.companyName || "Lead Company"}`;
    }
    if (threadData.clientAccount) {
      const clientAccount =
        threadData.clientAccount.data?.attributes || threadData.clientAccount;
      return `# ${clientAccount.companyName || "Client Account"}`;
    }
    if (threadData.contact) {
      const contact = threadData.contact.data?.attributes || threadData.contact;
      const firstName = contact.firstName || "";
      const lastName = contact.lastName || "";
      const name =
        `${firstName} ${lastName}`.trim() || contact.email || "Contact";
      return `# ${name}`;
    }
    if (threadData.deal) {
      const deal = threadData.deal.data?.attributes || threadData.deal;
      return `# ${deal.name || "Deal"}`;
    }
    return "Unknown";
  };

  // Link to open company/account/contact/deal details page
  const getEntityDetailsLink = () => {
    const entityId =
      thread.entityId ||
      threadData.leadCompany?.id ||
      threadData.leadCompany?.documentId ||
      threadData.leadCompany?.data?.id ||
      threadData.clientAccount?.id ||
      threadData.clientAccount?.documentId ||
      threadData.clientAccount?.data?.id ||
      threadData.contact?.id ||
      threadData.contact?.documentId ||
      threadData.contact?.data?.id ||
      threadData.deal?.id ||
      threadData.deal?.documentId ||
      threadData.deal?.data?.id;
    if (!entityId) return null;
    if (threadData.leadCompany || thread.entityType === "leadCompany") {
      return {
        href: `/sales/lead-companies/${entityId}`,
        label: "View company",
      };
    }
    if (threadData.clientAccount || thread.entityType === "clientAccount") {
      return { href: `/clients/accounts/${entityId}`, label: "View company" };
    }
    if (threadData.contact || thread.entityType === "contact") {
      return { href: `/sales/contacts/${entityId}`, label: "View contact" };
    }
    if (threadData.deal || thread.entityType === "deal") {
      return { href: `/sales/deals/${entityId}`, label: "View deal" };
    }
    return null;
  };

  const entityDetailsLink = getEntityDetailsLink();

  const getParticipants = () => {
    const participants = new Set();

    allMessages.forEach((message) => {
      const messageData = message.attributes || message;
      if (messageData.createdBy) {
        const creator =
          messageData.createdBy.data?.attributes || messageData.createdBy;
        if (creator) {
          const name =
            `${creator.firstName || ""} ${creator.lastName || ""}`.trim() ||
            creator.email ||
            "Unknown";
          participants.add(name);
        }
      }
    });

    return Array.from(participants);
  };

  const participants = getParticipants();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {getThreadContext()}
            </h2>
            <p className="text-sm text-gray-500">
              {participants.join(" and ")}
            </p>
          </div>
          {entityDetailsLink && (
            <Link
              href={entityDetailsLink.href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              {entityDetailsLink.label}
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-6 bg-white">
        {allMessages.map((message, index) => {
          const messageData = message.attributes || message;
          const creator =
            messageData.createdBy?.data?.attributes || messageData.createdBy;
          const isCurrentUser =
            creator?.id === user?.id ||
            creator?.documentId === user?.documentId;
          const isEditing = editingMessageId === message.id;
          const userDisplay = getUserDisplay(creator);
          const timestamp = getTimeAgo(messageData.createdAt);
          const userName = creator
            ? `${creator.firstName || ""} ${creator.lastName || ""}`.trim() ||
              creator.email ||
              "Unknown"
            : "Unknown";

          return (
            <div key={message.id} className="flex gap-3">
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
                      {userName}
                    </span>
                    <span className="text-xs text-gray-500">{timestamp}</span>
                  </div>
                  {/* Delete Button */}
                  {isCurrentUser && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMessage(message.id);
                      }}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  )}
                </div>

                {/* Comment Content */}
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editMessageText}
                      onChange={(e) => setEditMessageText(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setEditingMessageId(null);
                          setEditMessageText("");
                        }}
                        className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveEdit(message.id)}
                        className="text-xs px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-lg p-3 mb-2">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {formatMessageText(
                          messageData.message || messageData.content,
                        )}
                      </p>
                    </div>

                    {/* Reply Button */}
                    <button
                      onClick={() => {
                        setReplyingTo(
                          replyingTo === message.id ? null : message.id,
                        );
                        if (replyingTo !== message.id) {
                          setReplyTexts((prev) => ({
                            ...prev,
                            [message.id]: "",
                          }));
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors"
                    >
                      <Reply className="w-3 h-3" />
                      <span>
                        {replyingTo === message.id ? "Cancel" : "Reply"}
                      </span>
                    </button>

                    {/* Reply Input */}
                    {replyingTo === message.id && (
                      <div className="mb-4 ml-4 border-l-2 border-blue-200 pl-4">
                        <div className="bg-white border border-gray-200 rounded-lg p-2">
                          <textarea
                            value={replyTexts[message.id] || ""}
                            onChange={(e) =>
                              setReplyTexts((prev) => ({
                                ...prev,
                                [message.id]: e.target.value,
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
                                handleReply(message.id);
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
                                  setReplyTexts((prev) => ({
                                    ...prev,
                                    [message.id]: "",
                                  }));
                                }}
                                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReply(message.id)}
                                disabled={
                                  !replyTexts[message.id]?.trim() || submitting
                                }
                                className={`px-4 py-1 rounded text-xs font-medium transition-colors ${
                                  replyTexts[message.id]?.trim() && !submitting
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

                    {messageData.isEdited && (
                      <span className="text-xs text-gray-400 italic mt-1 block">
                        (edited)
                      </span>
                    )}

                    {/* Replies Thread */}
                    {messageData.replies && messageData.replies.length > 0 && (
                      <div className="ml-4 mt-2 space-y-3 border-l-2 border-gray-200 pl-4">
                        {messageData.replies.map((reply) => {
                          const replyData = reply.attributes || reply;
                          const replyCreator =
                            replyData.createdBy?.data?.attributes ||
                            replyData.createdBy;
                          const replyUserDisplay = getUserDisplay(replyCreator);
                          const replyTimestamp = getTimeAgo(
                            replyData.createdAt,
                          );
                          const replyUserName = replyCreator
                            ? `${replyCreator.firstName || ""} ${replyCreator.lastName || ""}`.trim() ||
                              replyCreator.email ||
                              "Unknown"
                            : "Unknown";
                          const isReplyCurrentUser =
                            replyCreator?.id === user?.id ||
                            replyCreator?.documentId === user?.documentId;

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
                                      {replyUserName}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {replyTimestamp}
                                    </span>
                                  </div>
                                  {/* Delete Reply Button */}
                                  {isReplyCurrentUser && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteMessage(reply.id);
                                      }}
                                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                                      title="Delete reply"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span className="hidden sm:inline">
                                        Delete
                                      </span>
                                    </button>
                                  )}
                                </div>
                                <div className="bg-gray-50 rounded-lg p-2">
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {formatMessageText(replyData.content)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Box */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {/* Formatting Toolbar */}
        {showFormattingToolbar && (
          <div className="mb-2 flex items-center gap-1 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <button className="p-1.5 hover:bg-gray-200 rounded" title="Bold">
              <Bold className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-200 rounded" title="Italic">
              <Italic className="w-4 h-4 text-gray-600" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-200 rounded"
              title="Underline"
            >
              <Underline className="w-4 h-4 text-gray-600" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-200 rounded"
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4 text-gray-600" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button className="p-1.5 hover:bg-gray-200 rounded" title="Emoji">
              <Smile className="w-4 h-4 text-gray-600" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-200 rounded"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}

        {/* Reply Input */}
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={replyInputRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (replyText.trim()) {
                      handleSendReply();
                    }
                  }
                }}
                onFocus={() => {
                  setShowFormattingToolbar(true);
                }}
                onBlur={() => {
                  // Keep toolbar visible if there's text
                  if (!replyText.trim()) {
                    setShowFormattingToolbar(false);
                  }
                }}
                placeholder="Reply..."
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none transition-all duration-200"
                rows={showFormattingToolbar ? 6 : 2}
              />
            </div>
            <Button
              size="sm"
              onClick={handleSendReply}
              disabled={!replyText.trim()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
