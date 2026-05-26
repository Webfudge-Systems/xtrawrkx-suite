"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import {
  fetchProjectChannelMessages,
  loadChannelSummaries,
  mapPmDiscussionMessage,
  sendProjectChannelMessage,
} from "../../lib/projectDiscussionService";
import { getProjectDiscussionChannels } from "../../lib/projectDiscussionChannels";

function getPmUserId() {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      localStorage.getItem("xtrawrkx-user") ||
      localStorage.getItem("auth_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u.id ?? u.documentId ?? null;
  } catch {
    return null;
  }
}

export default function ProjectDiscussionBoard({
  projectId,
  clientAccountId,
  projectName,
}) {
  const pid = projectId != null ? String(projectId).trim() : "";
  const accountId =
    clientAccountId != null ? String(clientAccountId).trim() : "";

  const channelDefs = useMemo(
    () => (pid ? getProjectDiscussionChannels(pid) : []),
    [pid]
  );

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const refreshChannels = useCallback(async () => {
    if (!accountId || !pid) return;
    const summaries = await loadChannelSummaries(accountId, pid);
    setChannels(summaries);
    setSelectedChannel((prev) => {
      if (prev && summaries.some((s) => s.id === prev.id)) {
        return summaries.find((s) => s.id === prev.id) || summaries[0];
      }
      return summaries[0] || null;
    });
  }, [accountId, pid]);

  const loadMessages = useCallback(async () => {
    if (!accountId || !selectedChannel?.channelKey) {
      setMessages([]);
      return;
    }
    const rows = await fetchProjectChannelMessages(
      accountId,
      selectedChannel.channelKey
    );
    setMessages(
      rows.map(mapPmDiscussionMessage).filter(Boolean)
    );
  }, [accountId, selectedChannel?.channelKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!accountId || !pid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        await refreshChannels();
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load discussion");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId, pid, refreshChannels]);

  useEffect(() => {
    if (!selectedChannel) return undefined;
    loadMessages().catch((e) => setError(e.message));
    const id = setInterval(() => {
      loadMessages().catch(() => {});
      refreshChannels().catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [selectedChannel, loadMessages, refreshChannels]);

  const handleSend = async () => {
    const t = newMessage.trim();
    if (!t || !accountId || !selectedChannel?.channelKey || sending) return;
    const userId = getPmUserId();
    if (!userId) {
      setError("You must be logged in to send messages");
      return;
    }
    setSending(true);
    setError("");
    try {
      await sendProjectChannelMessage(
        accountId,
        selectedChannel.channelKey,
        t,
        userId
      );
      setNewMessage("");
      await loadMessages();
      await refreshChannels();
    } catch (e) {
      setError(e.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!accountId) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        Link a client account to this project to use the client discussion
        channel.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      <div className="lg:col-span-1 rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl p-4">
        <div className="space-y-4 h-full flex flex-col">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Channel</h3>
            <p className="text-xs text-gray-500 mb-3">
              Client channel
              {projectName ? ` · ${projectName}` : ""} — visible in client
              portal
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search channel or message"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {loading && !channels.length ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setSelectedChannel(channel)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedChannel?.id === channel.id
                      ? "bg-gray-100 border border-gray-200"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {channel.name}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {channel.lastActivity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {channel.lastMessage}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-white/70 to-white/40 backdrop-blur-xl border border-white/30 shadow-xl flex flex-col min-h-0">
        {selectedChannel ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedChannel.name}
                </h3>
                <p className="text-xs text-gray-500">
                  Replies are shared with the client on their project page.
                </p>
              </div>
            </div>
            {error ? (
              <p className="px-4 py-2 text-sm text-red-600 bg-red-50">{error}</p>
            ) : null}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {loading && !messages.length ? (
                <p className="text-sm text-gray-500">Loading messages…</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No messages yet. Start the client conversation.
                </p>
              ) : (
                messages.map((message) => {
                  const messageDate = new Date(message.timestamp);
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isTeam ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex gap-3 max-w-[70%] ${
                          message.isTeam ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                            message.isTeam ? "bg-blue-500" : "bg-gray-500"
                          }`}
                        >
                          {message.senderInitials}
                        </div>
                        <div
                          className={`flex flex-col ${
                            message.isTeam ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              message.isTeam
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <span>
                              {messageDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                            <span>{message.senderName}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-4 border-t border-gray-200 shrink-0">
              <div className="flex items-end gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {getPmUserId() ? "You" : "?"}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write a message to the client channel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {sending ? "Sending…" : "Send Message"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Select a channel to start the discussion
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
