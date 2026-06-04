"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Search } from "lucide-react";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import {
  buildProjectChannelSummaries,
  fetchProjectDiscussionMessages,
  mapStrapiChatToBubble,
  sendProjectDiscussionMessage,
  writeLastReadNow,
} from "@/lib/api/portalChatService";
import { getProjectDiscussionChannels as getChannels } from "@/lib/projectDiscussionChannels";

export default function ProjectDiscussionBoard({
  projectId,
  clientAccountId,
  projectName,
}) {
  const accountId =
    clientAccountId != null ? String(clientAccountId).trim() : "";
  const pid = projectId != null ? String(projectId).trim() : "";

  const channelDefs = useMemo(
    () => (pid ? getChannels(pid) : []),
    [pid]
  );

  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const loadChannels = useCallback(async () => {
    if (!accountId || !pid) return;
    const byKey = {};
    await Promise.all(
      channelDefs.map(async (ch) => {
        byKey[ch.channelKey] = await fetchProjectDiscussionMessages(
          accountId,
          ch.channelKey
        );
      })
    );
    const summaries = buildProjectChannelSummaries(channelDefs, byKey);
    setChannels(summaries);
    setSelectedChannel((prev) => {
      if (prev && summaries.some((s) => s.id === prev.id)) {
        return summaries.find((s) => s.id === prev.id) || summaries[0];
      }
      return summaries[0] || null;
    });
  }, [accountId, pid, channelDefs]);

  const loadMessages = useCallback(async () => {
    if (!accountId || !selectedChannel?.channelKey) {
      setMessages([]);
      return;
    }
    try {
      const rows = await fetchProjectDiscussionMessages(
        accountId,
        selectedChannel.channelKey
      );
      setMessages(
        rows.map((r) => mapStrapiChatToBubble(r, accountId)).filter(Boolean)
      );
      writeLastReadNow(accountId, selectedChannel.channelKey);
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load messages");
    }
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
        await loadChannels();
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load channels");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accountId, pid, loadChannels]);

  useEffect(() => {
    if (!selectedChannel) return undefined;
    loadMessages();
    const id = setInterval(() => {
      loadMessages();
      loadChannels();
    }, 5000);
    return () => clearInterval(id);
  }, [selectedChannel, loadMessages, loadChannels]);

  const handleSend = async (text) => {
    const t = String(text || "").trim();
    if (!t || !accountId || !selectedChannel?.channelKey || sending) return;
    setSending(true);
    setError("");
    try {
      await sendProjectDiscussionMessage(
        accountId,
        selectedChannel.channelKey,
        t
      );
      await loadMessages();
      await loadChannels();
    } catch (e) {
      setError(e.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const filteredChannels = channels.filter((ch) =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!accountId || !pid) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">
        Sign in to use project discussion.
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
              Client channel{projectName ? ` · ${projectName}` : ""} — synced
              with your PM team
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search channel or message"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-xtrawrkx-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {loading && !channels.length ? (
              <p className="text-sm text-gray-500">Loading channels…</p>
            ) : (
              filteredChannels.map((channel) => (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setSelectedChannel(channel)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedChannel?.id === channel.id
                      ? "bg-xtrawrkx-50 border border-xtrawrkx-200"
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
            <div className="p-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedChannel.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Messages here are visible to your Xtrawrkx project team in PM.
              </p>
            </div>
            {error ? (
              <p className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">
                {error}
              </p>
            ) : null}
            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {loading && !messages.length ? (
                <p className="text-sm text-gray-500">Loading messages…</p>
              ) : (
                <MessageList messages={messages} />
              )}
            </div>
            <div className="border-t border-gray-200 p-4 shrink-0">
              <MessageInput
                onSendMessage={(msg) => {
                  void handleSend(msg);
                }}
                placeholder={sending ? "Sending…" : "Write a message"}
              />
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
