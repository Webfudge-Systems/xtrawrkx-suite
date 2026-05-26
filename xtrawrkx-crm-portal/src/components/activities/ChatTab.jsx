"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  ChevronDown,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import chatService from "../../lib/api/chatService";
import { useAuth } from "../../contexts/AuthContext";

const ChatTab = ({ entityType, entityId }) => {
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [showMessageMenu, setShowMessageMenu] = useState(null);

  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const chatEndRef = useRef(null);
  const filterDropdownRef = useRef(null);
  const chatMessagesRef = useRef([]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      scrollToBottom();
    }
  }, [chatMessages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMessageMenu && !event.target.closest(".message-menu-container")) {
        setShowMessageMenu(null);
      }
      if (
        showFilterDropdown &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target)
      ) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMessageMenu, showFilterDropdown]);

  useEffect(() => {
    if (entityId) {
      pollingIntervalRef.current = setInterval(() => {
        fetchChatMessages(true);
      }, 3000);
      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [entityId, entityType]);

  useEffect(() => {
    if (entityId) {
      fetchChatMessages();
    }
  }, [entityId, entityType]);

  function getTimeAgo(timestamp) {
    if (!timestamp) return "just now";
    try {
      const now = new Date();
      const t = new Date(timestamp);
      const diffInMinutes = Math.floor((now - t) / (1000 * 60));
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

  const messageAuthorName = (message) => {
    const cb = message.authorUser || message.createdBy;
    if (!cb) return "Unknown";
    const n = `${cb.firstName || ""} ${cb.lastName || ""}`.trim();
    return n || cb.name || "Unknown";
  };

  const normalizeChatRows = (response) => {
    if (!response) return [];
    const d = response.data;
    if (Array.isArray(d)) return d;
    if (d && typeof d === "object" && Array.isArray(d.data)) return d.data;
    return [];
  };

  const mapRawMessagesToRows = (rawList) => {
    return rawList
      .map((msg) => {
        const message = msg.attributes || msg;
        const authorRel =
          message.authorUser?.data?.attributes ||
          message.authorUser ||
          message.createdBy?.data?.attributes ||
          message.createdBy;
        const authorClientRaw =
          message.authorClientAccount?.data?.attributes ||
          message.authorClientAccount;
        let authorDisplay = authorRel;
        if (!authorDisplay && authorClientRaw) {
          const acc = authorClientRaw.attributes || authorClientRaw;
          authorDisplay = {
            id: `author-client-${acc.id ?? acc.documentId ?? "client"}`,
            firstName: acc.companyName || "Client",
            lastName: "",
          };
        }
        const fromClient =
          message.fromClient === true ||
          !!(
            authorClientRaw ||
            String(authorDisplay?.id || "").startsWith("author-client")
          );
        const rowId = msg.id ?? msg.documentId ?? message.id;
        const chKey =
          message.channelKey != null && message.channelKey !== undefined
            ? String(message.channelKey)
            : "";
        return {
          id: rowId,
          message: message.message,
          description: message.message,
          createdAt: message.createdAt,
          authorUser: authorDisplay,
          createdBy: authorDisplay,
          fromClient,
          channelKey: chKey,
          isEdited: message.isEdited || false,
          editedAt: message.editedAt,
        };
      })
      .filter((row) => row.id != null)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  const fetchChatMessages = async (silent = false) => {
    try {
      if (!silent) {
        setLoadingChat(true);
      }

      const response = await chatService.getMessages(entityType, entityId, {
        allChannels: entityType === "clientAccount",
      });
      const messages = normalizeChatRows(response);

      const transformed = mapRawMessagesToRows(messages);

      if (silent) {
        if (
          transformed.length === 0 &&
          chatMessagesRef.current.length > 0
        ) {
          return;
        }
        setChatMessages(transformed);
        if (transformed.length > 0) {
          lastMessageIdRef.current = transformed[transformed.length - 1].id;
        }
        setTimeout(scrollToBottom, 100);
        return;
      }

      const lastMessage = transformed[transformed.length - 1];
      if (lastMessage && lastMessage.id !== lastMessageIdRef.current) {
        setChatMessages(transformed);
        lastMessageIdRef.current = lastMessage.id;
        const container = messagesContainerRef.current;
        if (container) {
          const isNearBottom =
            container.scrollHeight -
              container.scrollTop -
              container.clientHeight <
            100;
          if (isNearBottom) {
            setTimeout(scrollToBottom, 100);
          }
        }
      } else if (!silent) {
        setChatMessages(transformed);
        if (transformed.length > 0) {
          lastMessageIdRef.current = transformed[transformed.length - 1].id;
        }
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      if (!silent) {
        setChatMessages([]);
      }
    } finally {
      if (!silent) {
        setLoadingChat(false);
      }
    }
  };

  const filterOptions = [
    { value: "all", label: "All Activity", count: chatMessages.length },
    {
      value: "messages",
      label: "Messages",
      count: chatMessages.length,
    },
  ];

  const filteredChatMessages = chatMessages.filter(() => {
    if (activeFilter === "all") return true;
    if (activeFilter === "messages") return true;
    return true;
  });

  /** Links on light bubbles (incoming white + WhatsApp-style outgoing green). */
  const formatMessageText = (text) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    const linkClass =
      "break-all font-medium text-blue-700 underline decoration-blue-700/50 underline-offset-2 hover:text-blue-900";
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    const userId = user?.documentId || user?.id || user?.data?.id;
    if (!userId) {
      alert(
        "Unable to identify user. Please refresh the page and try again."
      );
      setNewMessage(messageText);
      return;
    }

    try {
      setSubmitting(true);
      const res = await chatService.createMessage(
        entityType,
        entityId,
        messageText,
        userId
      );
      const created = res?.data;
      if (created) {
        const rows = mapRawMessagesToRows([created]);
        if (rows.length) {
          setChatMessages((prev) => {
            const map = new Map(prev.map((m) => [String(m.id), m]));
            rows.forEach((m) => map.set(String(m.id), m));
            return Array.from(map.values()).sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
          });
          lastMessageIdRef.current = rows[rows.length - 1].id;
        }
      }
      await fetchChatMessages(true);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      const msg =
        error?.message && String(error.message).length < 240
          ? error.message
          : "Failed to send message";
      alert(msg);
      setNewMessage(messageText);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessageId(message.id);
    setEditMessageText(message.message || message.description || "");
  };

  const handleSaveEdit = async (messageId) => {
    if (!editMessageText.trim()) return;
    try {
      await chatService.updateMessage(messageId, editMessageText);
      setEditingMessageId(null);
      setEditMessageText("");
      fetchChatMessages();
    } catch (error) {
      console.error("Error editing message:", error);
      alert("Failed to edit message");
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageText("");
  };

  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    try {
      await chatService.deleteMessage(messageId);
      fetchChatMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  const currentUserDisplay = getUserDisplay(user);
  const uid = user?.documentId || user?.id || user?.data?.id;

  const isOwnMessage = (message) => {
    const author = message.authorUser || message.createdBy;
    if (!uid || !author) return false;
    const bid = author.id ?? author.documentId;
    if (String(bid).startsWith("author-client")) return false;
    return (
      String(bid) === String(uid) || Number(bid) === Number(uid)
    );
  };

  return (
    <div className="flex flex-col h-[600px] bg-white">
      {/* Filter header — matches CommentsTab */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
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
                    type="button"
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

      {/* Message feed — WhatsApp-style wallpaper + left/right bubbles */}
      <div
        ref={messagesContainerRef}
        className="min-h-0 flex-1 overflow-y-auto bg-[#efeae2] px-2 py-3 sm:px-4"
      >
        {loadingChat ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2 animate-pulse" />
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : filteredChatMessages.length > 0 ? (
          <div className="mx-auto w-full max-w-2xl space-y-2">
            {filteredChatMessages.map((message) => {
              const author = message.authorUser || message.createdBy;
              const userDisplay = getUserDisplay(author);
              const timestamp = getTimeAgo(message.createdAt);
              const isEditing = editingMessageId === message.id;
              const own = isOwnMessage(message);
              const fromClient = message.fromClient;
              const staffSelf = !fromClient && own;
              const isOutgoing = staffSelf;
              const avatarClass = fromClient ? "bg-emerald-600" : "bg-slate-500";
              const initials = userDisplay.initials;
              const isProgram =
                message.channelKey &&
                String(message.channelKey).startsWith("community:");
              const channelHint = isProgram ? "Program chat" : "Support inbox";

              const bubbleBase =
                "w-fit max-w-full px-2.5 py-1.5 text-sm leading-snug shadow-sm";
              const bubbleIncoming = `${bubbleBase} rounded-2xl rounded-bl-md border border-gray-200/90 bg-white text-gray-900`;
              const bubbleOutgoing = `${bubbleBase} rounded-2xl rounded-br-md bg-[#d9fdd3] text-gray-900`;

              const metaMenu =
                own && !isEditing ? (
                  <div className="relative message-menu-container inline-flex">
                    <button
                      type="button"
                      onClick={() =>
                        setShowMessageMenu(
                          showMessageMenu === message.id ? null : message.id
                        )
                      }
                      className="-m-0.5 rounded p-0.5 text-gray-400 hover:bg-black/5 hover:text-gray-600"
                      title="Message actions"
                      aria-label="Message actions"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                    {showMessageMenu === message.id && (
                      <div
                        className={`absolute top-5 z-50 min-w-[112px] rounded-md border border-gray-200 bg-white py-0.5 shadow-md ${
                          isOutgoing ? "right-0" : "left-0"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            handleEditMessage(message);
                            setShowMessageMenu(null);
                          }}
                          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteMessage(message.id);
                            setShowMessageMenu(null);
                          }}
                          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ) : null;

              const bubbleBody = isEditing ? (
                <div className="space-y-2 text-gray-900">
                  <textarea
                    value={editMessageText}
                    onChange={(e) => setEditMessageText(e.target.value)}
                    className="w-full min-h-[60px] resize-none rounded-lg border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="rounded-md px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(message.id)}
                      className="rounded-md bg-blue-600 px-2.5 py-1 text-xs text-white hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words text-gray-900">
                  {formatMessageText(
                    message.message || message.description
                  )}
                </div>
              );

              return (
                <div
                  key={message.id}
                  className={`flex w-full ${isOutgoing ? "justify-end" : "justify-start"}`}
                >
                  {!isOutgoing ? (
                    <div className="flex max-w-[min(92%,26rem)] gap-2">
                      <div
                        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white ${avatarClass}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="mb-0.5 flex flex-wrap items-baseline justify-start gap-x-1.5 gap-y-0.5 text-xs">
                          <span className="font-medium text-gray-800">
                            {messageAuthorName(message)}
                          </span>
                          <span className="text-gray-500">{timestamp}</span>
                          {entityType === "clientAccount" && (
                            <span className="text-[11px] text-gray-500">
                              · {channelHint}
                            </span>
                          )}
                          {metaMenu}
                        </div>
                        <div className={bubbleIncoming}>{bubbleBody}</div>
                        {message.isEdited && !isEditing && (
                          <p className="mt-0.5 text-[11px] italic text-gray-500">
                            Edited
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex max-w-[min(92%,26rem)] flex-col items-end">
                      <div className="mb-0.5 flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5 text-xs text-gray-600">
                        <span>{timestamp}</span>
                        {entityType === "clientAccount" && (
                          <span className="text-[11px] text-gray-500">
                            · {channelHint}
                          </span>
                        )}
                        {metaMenu}
                      </div>
                      <div className={bubbleOutgoing}>{bubbleBody}</div>
                      {message.isEdited && !isEditing && (
                        <p className="mt-0.5 text-right text-[11px] italic text-gray-500">
                          Edited
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No messages yet</p>
              <p className="text-gray-400 text-xs">
                Start the conversation by sending a message
              </p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Composer — WhatsApp-like bar */}
      <div className="sticky bottom-0 z-10 flex-shrink-0 border-t border-gray-200/80 bg-[#f0f2f5] p-3 sm:p-4">
        <div className="flex gap-3 items-end">
          <div
            className={`w-8 h-8 ${currentUserDisplay.color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1`}
          >
            {currentUserDisplay.initials}
          </div>
          <div className="flex-1 flex gap-2 items-end min-w-0">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a message to the client…"
              disabled={submitting || !user}
              className="min-h-[48px] max-h-32 flex-1 resize-none rounded-3xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 disabled:opacity-60"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!submitting && newMessage.trim() && user) {
                    handleSendMessage();
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (!newMessage.trim() || submitting || !user) return;
                handleSendMessage();
              }}
              disabled={!newMessage.trim() || submitting || !user}
              className={`flex-shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                newMessage.trim() && !submitting && user
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              {submitting ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-400 pl-11">
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
};

export default ChatTab;
