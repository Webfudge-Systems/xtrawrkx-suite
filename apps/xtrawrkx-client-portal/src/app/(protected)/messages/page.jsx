"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  UserPlus,
  Phone,
  Zap,
} from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useChat } from "@/components/providers/ChatProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export default function MessagesPage() {
  const { conversations, unreadCount } = useChat();

  // Calculate online team members
  const onlineTeamMembers = conversations.filter(
    (conv) => conv.isOnline
  ).length;

  return (
    <div className="bg-white min-h-screen px-4 pt-4">
      <PageHeader
        title="Messages"
        subtitle="Chat with the Xtrawrkx team directly through the portal"
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex min-h-9 items-center gap-2 text-sm text-gray-800">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 shadow-sm ring-2 ring-green-500/30"
              aria-hidden
            />
            <span className="font-medium leading-5">
              {onlineTeamMembers} Team Members Online
            </span>
          </div>

          {unreadCount > 0 ? (
            <div className="inline-flex min-h-9 items-center rounded-full bg-pink-100 px-4 py-1 text-sm font-semibold leading-5 text-red-900 shadow-sm ring-1 ring-pink-200/70">
              {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
            </div>
          ) : null}
        </div>
      </PageHeader>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mt-6 mb-8 space-y-8"
      >
        {/* KPI feature cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
          <Card variant="outlined" hoverable className="group">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md transition-shadow group-hover:shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">
                  Real-time Chat
                </h3>
                <p className="text-sm leading-snug text-gray-600">
                  Instant messaging with the team
                </p>
              </div>
            </div>
          </Card>

          <Card variant="outlined" hoverable className="group">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md transition-shadow group-hover:shadow-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">
                  Team Access
                </h3>
                <p className="text-sm leading-snug text-gray-600">
                  Connect with project managers & developers
                </p>
              </div>
            </div>
          </Card>

          <Card variant="outlined" hoverable className="group">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md transition-shadow group-hover:shadow-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">
                  File Sharing
                </h3>
                <p className="text-sm leading-snug text-gray-600">
                  Share documents and images easily
                </p>
              </div>
            </div>
          </Card>

          <Card variant="outlined" hoverable className="group">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md transition-shadow group-hover:shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">
                  Quick Response
                </h3>
                <p className="text-sm leading-snug text-gray-600">
                  Get instant replies from our team
                </p>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>

      {/* Chat Interface */}
      <ChatInterface />
    </div>
  );
}
