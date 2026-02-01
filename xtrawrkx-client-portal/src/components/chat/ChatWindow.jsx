"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  X,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { useChat } from "@/components/providers/ChatProvider";

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

  // Handle file attachments
  const handleFileUpload = (files) => {
    // Implementation for file upload
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    // Implementation for emoji insertion
  };

  if (!conversation) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg h-96 flex flex-col">
        <div className="p-6 border-b border-gray-200/50">
          <h3 className="font-bold text-gray-900 text-lg">
            Select a conversation
          </h3>
        </div>
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white text-2xl">💬</span>
            </div>
            <p className="text-gray-600 font-medium text-lg">
              Choose a conversation to start messaging
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      ref={chatWindowRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg flex flex-col ${
        isMinimized ? "h-16" : "h-[600px]"
      } transition-all duration-300`}
    >
      {/* Chat Header */}
      <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-12 w-12 shadow-lg">
              <AvatarImage src={conversation.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-red-500 text-white font-semibold">
                {conversation.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
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
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-blue-100 transition-colors"
          >
            <Phone className="h-5 w-5 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-green-100 transition-colors"
          >
            <Video className="h-5 w-5 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 transition-colors"
          >
            <Info className="h-5 w-5 text-gray-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </Button>
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
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <MessageList messages={messages} />
            <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-6 border-t border-gray-200/50">
            <MessageInput
              onSendMessage={handleSendMessage}
              onFileUpload={handleFileUpload}
              onEmojiSelect={handleEmojiSelect}
              placeholder={`Message ${conversation.name}...`}
            />
          </div>
        </>
      )}
    </motion.div>
  );
}
