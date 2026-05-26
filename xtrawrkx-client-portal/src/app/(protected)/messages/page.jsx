"use client";

import { motion } from "framer-motion";
import {
  MessageCircle,
  UserPlus,
  Phone,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useChat } from "@/components/providers/ChatProvider";

export default function MessagesPage() {
  const { conversations, unreadCount } = useChat();

  // Calculate online team members
  const onlineTeamMembers = conversations.filter(
    (conv) => conv.isOnline
  ).length;
  const totalTeamMembers = conversations.length;

  return (
    <div className="w-full bg-slate-50/90 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 space-y-8"
      >
        <div className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-md ring-1 ring-gray-900/[0.06] lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-gray-900">
              Messages
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-gray-600">
              Chat with the Xtrawrkx team directly through the portal
            </p>
          </div>

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
        </div>

        {/* KPI feature cards — same shell as topbar */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-4">
          <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-md ring-1 ring-gray-900/[0.06]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md transition-shadow group-hover:shadow-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">Real-time Chat</h3>
                <p className="text-sm leading-snug text-gray-600">
                  Instant messaging with the team
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-md ring-1 ring-gray-900/[0.06]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md transition-shadow group-hover:shadow-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">Team Access</h3>
                <p className="text-sm leading-snug text-gray-600">
                  Connect with project managers & developers
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-md ring-1 ring-gray-900/[0.06]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md transition-shadow group-hover:shadow-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">File Sharing</h3>
                <p className="text-sm leading-snug text-gray-600">
                  Share documents and images easily
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-md ring-1 ring-gray-900/[0.06]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md transition-shadow group-hover:shadow-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900">Quick Response</h3>
                <p className="text-sm leading-snug text-gray-600">
                  Get instant replies from our team
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Xtrawrkx Support Team — same shell as topbar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md ring-1 ring-gray-900/[0.06] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5 sm:gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md sm:h-16 sm:w-16">
                <Shield className="h-7 w-7 text-white sm:h-8 sm:w-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
                  Xtrawrkx Support Team
                </h3>
                <p className="mt-1 max-w-2xl text-base text-gray-600">
                  {
                    "Our team is here to help you 24/7. Average response time: < 5 minutes"
                  }
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end lg:text-right">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-md ring-1 ring-gray-900/[0.04]">
                <Clock className="h-4 w-4 shrink-0 text-gray-500" />
                Available Now
              </div>
              <p className="text-sm text-gray-500">
                {onlineTeamMembers}/{totalTeamMembers} team members online
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Chat Interface */}
      <ChatInterface />
    </div>
  );
}
