"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Phone,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChatWindow } from "./ChatWindow";
import { useChat } from "@/components/providers/ChatProvider";

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Use chat context for unread count and send message
  const { unreadCount, sendMessage, conversations, markAsRead } = useChat();

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    setIsOpen(true);
    setIsMinimized(false);
  };

  // Handle minimize/maximize
  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Handle close
  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setSelectedConversation(null);
  };

  // Handle quick chat with team
  const handleQuickChat = () => {
    const support = conversations.find((c) => c.id === "support");
    if (support) {
      markAsRead(support.id);
      handleConversationSelect(support);
    }
  };

  // Handle sending messages
  const handleSendMessage = (messageText, attachments = []) => {
    if (selectedConversation) {
      sendMessage(selectedConversation.id, messageText, attachments);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={handleQuickChat}
              className="relative bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-full h-16 w-16 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="h-7 w-7" />
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-lg"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.div>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px]"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-2xl h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200/50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Quick Chat
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">
                      Xtrawrkx Team
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
                    onClick={handleMinimize}
                    className="hover:bg-gray-100 transition-colors"
                  >
                    {isMinimized ? (
                      <Maximize2 className="h-5 w-5 text-gray-600" />
                    ) : (
                      <Minimize2 className="h-5 w-5 text-gray-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="hover:bg-red-100 transition-colors"
                  >
                    <X className="h-5 w-5 text-red-600" />
                  </Button>
                </div>
              </div>

              {/* Chat Content */}
              {!isMinimized && (
                <>
                  {/* Quick Conversations */}
                  {!selectedConversation && (
                    <div className="flex-1 p-6">
                      <h4 className="font-bold text-gray-900 mb-6 text-lg">
                        Start a conversation
                      </h4>
                      <div className="space-y-3">
                        {conversations.map((conversation) => (
                          <button
                            key={conversation.id}
                            onClick={() => {
                              markAsRead(conversation.id);
                              handleConversationSelect(conversation);
                            }}
                            className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-white/50 hover:shadow-md transition-all duration-200 text-left group"
                          >
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                <span className="text-sm font-bold text-white">
                                  {conversation.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              </div>
                              {conversation.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-3 border-white shadow-sm" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h5 className="font-semibold text-gray-900 truncate">
                                  {conversation.name}
                                </h5>
                                {conversation.unread > 0 && (
                                  <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full px-3 py-1 min-w-[24px] text-center font-semibold shadow-sm">
                                    {conversation.unread}
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate font-medium">
                                {conversation.role}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chat Window */}
                  {selectedConversation && (
                    <div className="flex-1 flex flex-col">
                      <ChatWindow
                        conversation={selectedConversation}
                        onClose={() => setSelectedConversation(null)}
                        isMinimized={false}
                        onMinimize={handleMinimize}
                        onMaximize={handleMinimize}
                        onSendMessage={handleSendMessage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
