"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  MessageCircle,
  MoreVertical,
  Star,
  Archive,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ChatWindow } from "./ChatWindow";
import { useChat } from "@/components/providers/ChatProvider";
import ModernButton from "@/components/ui/ModernButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export function ChatInterface() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setShowNewMessageModal] = useState(false);

  // Use chat context instead of local state
  const { conversations, sendMessage, markAsRead, updateConversation } =
    useChat();

  // Filter conversations based on search
  const filteredConversations = conversations.filter(
    (conv) =>
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.lastMessageSource || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  // Sort conversations: pinned first, then by unread count, then by time
  const sortedConversations = filteredConversations.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.unread > 0 && b.unread === 0) return -1;
    if (a.unread === 0 && b.unread > 0) return 1;
    const tb = b.sortKey ?? b.lastMessageAt ?? 0;
    const ta = a.sortKey ?? a.lastMessageAt ?? 0;
    return tb - ta;
  });

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);

    // Mark messages as read using context
    markAsRead(conversation.id);
  };

  // Handle new message
  const handleNewMessage = () => {
    setShowNewMessageModal(true);
  };

  // Handle conversation actions
  const handleConversationAction = (conversationId, action) => {
    switch (action) {
      case "pin":
        updateConversation(conversationId, {
          isPinned: !conversations.find((c) => c.id === conversationId)
            ?.isPinned,
        });
        break;
      case "archive":
        // Implementation for archiving
        break;
      case "delete":
        // Implementation for deletion
        break;
      default:
        break;
    }
  };

  // Handle sending messages
  const handleSendMessage = (messageText, attachments = []) => {
    if (selectedConversation) {
      sendMessage(selectedConversation.id, messageText, attachments);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <div className="min-h-0 lg:col-span-1">
        <Card glass={true} padding={false} className="flex h-full min-h-0 flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Conversations
              </h2>
              <ModernButton
                type="primary"
                size="sm"
                text="New"
                icon={Plus}
                onClick={handleNewMessage}
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E9AAF]"
                aria-hidden
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white py-3 pl-12 pr-5 text-sm text-gray-800 shadow-sm transition-colors duration-200 placeholder:text-[#8E9AAF] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500/25 focus:ring-offset-0"
              />
            </div>
          </div>

          {/* Conversations — scroll inside panel; rows are uniform cards */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            {sortedConversations.length === 0 ? (
              <EmptyState
                icon={MessageCircle}
                title="No conversations found"
                description="Start a chat with our team."
                className="h-full py-0"
              />
            ) : (
              <div className="flex flex-col gap-2 p-3 pb-4">
                {sortedConversations.map((conversation) => (
                  <ConversationItem
                    key={conversation.id}
                    conversation={conversation}
                    isSelected={selectedConversation?.id === conversation.id}
                    onSelect={() => handleConversationSelect(conversation)}
                    onAction={(action) =>
                      handleConversationAction(conversation.id, action)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2">
        <ChatWindow
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}

function ConversationItem({ conversation, isSelected, onSelect, onAction }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      className={`group relative cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 ${
        isSelected
          ? "border-pink-200 bg-gradient-to-r from-pink-50/90 to-red-50/70 shadow-md ring-1 ring-pink-500/20"
          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar
            src={conversation.avatar || undefined}
            name={conversation.name}
            color="bg-gradient-to-br from-pink-500 to-red-500"
            size="lg"
            className="h-14 w-14 shadow-lg text-sm"
          />
          {conversation.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-sm" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900 truncate">
                {conversation.name}
              </h4>
              {conversation.isPinned && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-medium">
                {conversation.time}
              </span>
              {conversation.unread > 0 && (
                <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full px-3 py-1 min-w-[24px] text-center font-semibold shadow-sm">
                  {conversation.unread}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-600 truncate font-medium">
              {conversation.role}
            </p>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction("pin");
                }}
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-yellow-100"
              >
                <Star
                  className={`h-4 w-4 ${conversation.isPinned ? "text-yellow-500 fill-current" : "text-gray-400"}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-100"
              >
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>

          {conversation.lastMessageSource &&
          conversation.lastMessageSource !== "General Support" ? (
            <p className="mt-1.5 truncate text-xs font-semibold text-sky-700">
              {conversation.lastMessageSource}
            </p>
          ) : null}
          <p className="text-sm text-gray-500 truncate mt-1.5">
            {conversation.lastMessage}
          </p>
        </div>
      </div>

      {/* Action Menu */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-3 top-3 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg py-2 z-10"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction("archive");
                setShowActions(false);
              }}
              className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/80 w-full transition-colors"
            >
              <Archive className="h-4 w-4" />
              <span>Archive</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction("delete");
                setShowActions(false);
              }}
              className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50/80 w-full transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
