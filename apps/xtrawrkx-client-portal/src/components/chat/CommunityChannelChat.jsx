"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import {
  fetchCommunityDiscussionMergedRows,
  sendPortalChatMessage,
  mapStrapiChatToBubble,
  writeLastReadNow,
} from "@/lib/api/portalChatService";

export function CommunityChannelChat({
  clientAccountId,
  communityCatalogId,
  title,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const accountId =
    clientAccountId != null ? String(clientAccountId).trim() : "";
  const channelKey = `community:${communityCatalogId}`;

  const load = useCallback(async () => {
    if (!accountId) return;
    try {
      const rows = await fetchCommunityDiscussionMergedRows(
        accountId,
        communityCatalogId
      );
      setMessages(
        rows
          .map((r) => mapStrapiChatToBubble(r, accountId))
          .filter(Boolean)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [accountId, communityCatalogId]);

  useEffect(() => {
    setLoading(true);
    load();
    if (!accountId) return undefined;
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load, accountId]);

  useEffect(() => {
    if (!accountId) return;
    writeLastReadNow(accountId, channelKey);
    writeLastReadNow(accountId, "");
  }, [accountId, channelKey, messages]);

  const handleSend = async (messageText) => {
    const t = String(messageText || "").trim();
    if (!t || !accountId) return;
    try {
      await sendPortalChatMessage(accountId, t, channelKey);
      await load();
    } catch (e) {
      console.error(e);
    }
  };

  if (!accountId) {
    return (
      <p className="text-sm text-gray-500">
        Sign in to participate in the discussion.
      </p>
    );
  }

  return (
    <div className="flex min-h-[420px] max-h-[560px] flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="font-semibold text-gray-900">
          {title || "Discussion"}
        </h3>
        <p className="text-xs text-gray-500">
          Includes your <strong className="font-medium">Xtrawrkx Support</strong>{" "}
          thread and this program&apos;s chat. Your replies here go to this
          program; use <strong className="font-medium">Messages</strong> for
          support-only.
        </p>
      </div>
      <div className="min-h-[280px] flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
      <div className="border-t border-gray-200 p-4">
        <p className="mb-2 text-xs text-gray-500">
          Reply in this program — visible here, in CRM for this account, and in
          Messages for the same threads.
        </p>
        <MessageInput
          onSendMessage={(msg) => {
            void handleSend(msg);
          }}
          placeholder="Write a message…"
        />
      </div>
    </div>
  );
}
