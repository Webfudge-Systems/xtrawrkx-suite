"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Minimize2, Maximize2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { useChat } from "@/components/providers/ChatProvider";
import { EmptyState } from "@/components/ui/EmptyState";

export function ChatWindow({
  conversation,
  onClose,
  isMinimized = false,
  onMinimize,
  onMaximize,
  onSendMessage,
}) {
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);

  // Use chat context for messages and typing status
  const { getMessages, isUserTyping } = useChat();

  // Get messages for this conversation
  const messages = conversation ? getMessages(conversation.id) : [];
  const isTyping = conversation ? isUserTyping(conversation.id) : false;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle sending messages
  const handleSendMessage = async (messageText, attachments = []) => {
    if (!messageText.trim() && attachments.length === 0) return;

    // Use the provided onSendMessage function
    if (onSendMessage) {
      onSendMessage(messageText, attachments);
    }
  };

  if (!conversation) {
    return (
      <div className="flex h-[600px] flex-col rounded-2xl bg-white/95 backdrop-blur-xl border border-white/30 shadow-lg">
        <EmptyState
          icon={MessageCircle}
          title="Select a conversation"
          description="Choose a conversation to start messaging."
          className="h-full py-0"
        />
      </div>
    );
  }

  return (
    <motion.div
      ref={chatWindowRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex flex-col rounded-2xl bg-white/95 backdrop-blur-xl border border-white/30 shadow-lg ${
        isMinimized ? "h-16" : "h-[600px]"
      } transition-all duration-300`}
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar
              src={conversation.avatar || undefined}
              name={conversation.name}
              color="bg-gradient-to-br from-pink-500 to-red-500"
              size="lg"
              className="h-12 w-12 shadow-lg text-sm"
            />
            <div
              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white shadow-sm ${
                isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
            />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {conversation.name}
            </h3>
            <p className="text-sm text-gray-600 font-medium">
              {isOnline ? "Online" : "Last seen recently"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="hover:bg-gray-100 transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="h-5 w-5 text-gray-600" />
              ) : (
                <Minimize2 className="h-5 w-5 text-gray-600" />
              )}
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-red-100 transition-colors"
            >
              <X className="h-5 w-5 text-red-600" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-4">
            <MessageList messages={messages} />
            <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4 sm:p-6">
            <MessageInput
              onSendMessage={handleSendMessage}
              placeholder={`Message ${conversation.name}…`}
            />
          </div>
        </>
      )}
    </motion.div>
  );
}
