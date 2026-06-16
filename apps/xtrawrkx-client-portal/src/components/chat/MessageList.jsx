"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

const URL_SPLIT = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

function MessageBody({ text, isClient }) {
  if (text == null || text === "") {
    return null;
  }
  const parts = text.split(URL_SPLIT);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (/^https?:\/\//i.test(part) || /^www\./i.test(part)) {
          const href = part.startsWith("www.") ? `https://${part}` : part;
          return (
            <a
              key={`${i}-${part.slice(0, 24)}`}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                isClient
                  ? "font-medium text-white underline decoration-white/70 underline-offset-2 hover:decoration-white"
                  : "font-medium text-pink-600 underline decoration-pink-300 underline-offset-2 hover:text-pink-700"
              }
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export function MessageList({ messages, showSenderNames = false }) {
  if (!messages || messages.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No messages yet"
        description="Start the conversation!"
        className="h-full py-0"
      />
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isLast={index === messages.length - 1}
          showSenderNames={showSenderNames}
        />
      ))}
    </div>
  );
}

function sourceBadgeClass(sourceType, isClient) {
  if (sourceType === "project") {
    return isClient
      ? "bg-white/20 text-white"
      : "bg-sky-100 text-sky-900";
  }
  if (sourceType === "community") {
    return isClient
      ? "bg-white/20 text-white"
      : "bg-violet-100 text-violet-800";
  }
  return isClient
    ? "bg-white/20 text-white"
    : "bg-amber-100 text-amber-900";
}

function MessageItem({ message, isLast, showSenderNames = false }) {
  const isClient = message.sender === "client";
  const isTeam = message.sender === "team";
  const sourceLabel =
    message.sourceLabel ||
    (message.channelTag === "Project"
      ? "Project"
      : message.channelTag === "Program"
        ? "Program Discussion"
        : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isClient ? "justify-end" : "justify-start"} ${isLast ? "" : "mb-3"}`}
    >
      <div
        className={`flex max-w-[78%] flex-col ${isClient ? "items-end" : "items-start"}`}
      >
        {showSenderNames && isTeam ? (
          <p className="mb-1 px-1 text-xs font-semibold text-gray-600">
            {message.senderName || "Xtrawrkx Team"}
          </p>
        ) : null}
        <div
          className={`flex items-end space-x-2 ${isClient ? "flex-row-reverse space-x-reverse" : ""}`}
        >
        {isTeam && (
          <Avatar
            src={message.avatarUrl || undefined}
            name={message.senderName || "Xtrawrkx"}
            color="bg-gradient-to-br from-orange-400 to-pink-500"
            size="sm"
            className="h-8 w-8 shrink-0 shadow-sm"
          />
        )}

        {/* Message bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${
            isClient
              ? "bg-gradient-to-br from-orange-500 via-pink-500 to-red-500 text-white"
              : "border border-gray-100 bg-white text-gray-900"
          }`}
        >
          <MessageBody text={message.text} isClient={isClient} />

          {/* Message timestamp */}
          <div
            className={`mt-1 flex flex-wrap items-center gap-x-1.5 text-xs ${
              isClient ? "text-pink-100" : "text-gray-500"
            }`}
          >
            <span>
              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
            </span>
            {sourceLabel && sourceLabel !== "General Support" ? (
              <span
                className={`max-w-[12rem] truncate rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${sourceBadgeClass(
                  message.sourceType,
                  isClient
                )}`}
                title={sourceLabel}
              >
                {sourceLabel}
              </span>
            ) : null}
          </div>

          {/* Message status indicator for client messages */}
          {isClient && (
            <div className="absolute -bottom-1 -right-1">
              <MessageStatus status={message.status} />
            </div>
          )}
        </div>

        {isClient && (
          <Avatar
            src={message.clientAvatarUrl || undefined}
            name={message.senderName || "You"}
            initials="ME"
            color="bg-gradient-to-br from-orange-500 to-pink-500"
            size="sm"
            className="h-8 w-8 shrink-0 shadow-sm"
          />
        )}
        </div>
      </div>
    </motion.div>
  );
}

function MessageStatus({ status }) {
  const getStatusIcon = () => {
    switch (status) {
      case "sending":
        return (
          <div className="w-3 h-3 border border-pink-200 border-t-pink-500 rounded-full animate-spin" />
        );
      case "sent":
        return (
          <div className="w-3 h-3 bg-pink-200 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
          </div>
        );
      case "delivered":
        return (
          <div className="w-3 h-3 bg-pink-200 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
          </div>
        );
      case "read":
        return (
          <div className="w-3 h-3 bg-pink-200 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
          </div>
        );
      default:
        return null;
    }
  };

  return getStatusIcon();
}
