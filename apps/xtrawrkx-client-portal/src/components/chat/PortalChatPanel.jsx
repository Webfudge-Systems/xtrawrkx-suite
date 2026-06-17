"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MessageSquare,
  Search,
  X,
  Hash,
  Lock,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { EmptyState } from "@webfudge/ui";

function actorLabel(actor) {
  if (!actor || typeof actor !== "object") return "User";
  const fromName = [actor.firstName, actor.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    actor.name?.trim() ||
    fromName ||
    actor.username?.trim() ||
    actor.email?.split("@")[0]?.trim() ||
    "User"
  );
}

function resolveActor(row) {
  const actor = row?.actor;
  if (actor?.username || actor?.email || actor?.firstName || actor?.name) {
    return actor;
  }
  return row?.meta?.clientActor || actor;
}

function formatDateLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDate.getTime() === today.getTime()) return "Today";
  if (msgDate.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isClientMessage(row) {
  if (row?.meta?.fromClient === true) return true;
  if (row?.meta?.clientActor) return true;
  const actorId = String(row?.actor?.id ?? "");
  return actorId === "client" || actorId.startsWith("contact-");
}

/** Map CRM activity / chat row → portal bubble shape */
export function activityRowToBubble(row, accountName = "You") {
  const text = row?.meta?.comment ?? "";
  const fromClient = isClientMessage(row);
  const actor = resolveActor(row);
  const senderName = fromClient
    ? accountName || actorLabel(actor) || "You"
    : actorLabel(actor) || "Xtrawrkx Team";
  const aggregateSource = row?.meta?.aggregateSource;
  const sourceLabel = aggregateSource?.label
    ? `${aggregateSource.section} · ${aggregateSource.label}`
    : null;

  return {
    id: row.id ?? `msg-${row.createdAt}`,
    text,
    sender: fromClient ? "client" : "team",
    timestamp: row.createdAt ? new Date(row.createdAt) : new Date(),
    status: "sent",
    senderName,
    avatarUrl: null,
    clientAvatarUrl: null,
    sourceLabel,
    sourceType:
      aggregateSource?.section === "Projects"
        ? "project"
        : aggregateSource?.section === "Tasks"
          ? "other"
          : "support",
  };
}

function groupBubblesByDate(messages) {
  const groups = [];
  let currentLabel = null;
  let currentGroup = null;
  for (const msg of messages) {
    const label = formatDateLabel(msg.timestamp);
    if (label !== currentLabel) {
      currentLabel = label;
      currentGroup = { label, messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  }
  return groups;
}

function DateDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-3 select-none" aria-hidden>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      <span className="rounded-full bg-gray-100 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </div>
  );
}

export function PortalChatPanel({
  channelSection = "Account",
  channelLabel = "Support",
  accountName = "You",
  readOnly = false,
  footerText,
  fetchMessages,
  onSend,
  className = "",
  style,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const scrollRef = useRef(null);
  const endRef = useRef(null);

  const load = useCallback(async () => {
    if (!fetchMessages) return;
    try {
      const res = await fetchMessages();
      const rows = Array.isArray(res?.data) ? res.data : [];
      setMessages(rows.map((r) => activityRowToBubble(r, accountName)));
      setError("");
    } catch (e) {
      setError(e.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, accountName]);

  useEffect(() => {
    setLoading(true);
    load();
    const interval = setInterval(() => load(), 10000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, channelLabel]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        (m.text || "").toLowerCase().includes(q) ||
        (m.senderName || "").toLowerCase().includes(q) ||
        (m.sourceLabel || "").toLowerCase().includes(q)
    );
  }, [messages, searchQuery]);

  const groups = useMemo(() => groupBubblesByDate(filtered), [filtered]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollDown(!nearBottom);
  };

  const handleSend = async (text) => {
    if (!onSend || readOnly || sending) return;
    setSending(true);
    setError("");
    try {
      await onSend(text);
      await load();
    } catch (e) {
      setError(e.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-md ring-1 ring-black/[0.03] ${className}`.trim()}
      style={style}
    >
      {/* Header */}
      <div className="shrink-0 border-b border-gray-100 bg-gradient-to-r from-orange-50/60 via-white to-pink-50/40 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 shadow-sm">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {channelLabel}
                </p>
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <Hash className="h-3 w-3 shrink-0 text-orange-400" />
                  <span className="truncate">{channelSection}</span>
                  <span className="text-gray-300">·</span>
                  <span className="tabular-nums">
                    {messages.length} message{messages.length !== 1 ? "s" : ""}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSearch((v) => !v)}
            className={`rounded-lg p-2 transition-colors ${
              showSearch
                ? "bg-orange-100 text-orange-600"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
            title="Search messages"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        {showSearch ? (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-500/15">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this conversation…"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white px-4 py-3"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
          </div>
        ) : error && messages.length === 0 ? (
          <div className="mx-auto max-w-sm rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={load}
              className="mt-2 block w-full text-xs font-medium text-red-600 underline"
            >
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={searchQuery ? "No results found" : "No messages yet"}
            description={
              searchQuery
                ? "Try a different search term"
                : readOnly
                  ? "Messages from all locations will appear here."
                  : "Say hello — your Xtrawrkx team will reply here."
            }
            className="h-full py-8"
          />
        ) : (
          <div className="space-y-1">
            {groups.map((group) => (
              <div key={group.label}>
                <DateDivider label={group.label} />
                <MessageList messages={group.messages} showSenderNames />
              </div>
            ))}
          </div>
        )}
        <div ref={endRef} />

        {showScrollDown ? (
          <div className="sticky bottom-3 z-10 flex justify-end pt-2">
            <button
              type="button"
              onClick={() =>
                endRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-lg transition hover:bg-gray-50"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Latest
            </button>
          </div>
        ) : null}
      </div>

      {/* Composer / read-only */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
        {error && messages.length > 0 ? (
          <p className="mb-2 text-xs text-red-600">{error}</p>
        ) : null}

        {readOnly ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50/50 px-4 py-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Read-only inbox
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-800/90">
                Select a specific account, task, or project on the left to
                reply.
              </p>
            </div>
          </div>
        ) : (
          <>
            <MessageInput
              onSendMessage={handleSend}
              placeholder={`Message ${channelLabel}…`}
            />
            {footerText ? (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                <Sparkles className="h-3 w-3 text-orange-400" />
                <span>{footerText}</span>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function formatBubbleTime(iso) {
  if (!iso) return "";
  try {
    return format(new Date(iso), "h:mm a");
  } catch {
    return "";
  }
}
