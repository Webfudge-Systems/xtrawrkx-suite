"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { strapiClient } from "@/lib/strapiClient";
import {
  fetchChatMessages,
  fetchAllChannelsChatMessages,
  fetchClientProjectNameMap,
  sendPortalChatMessage,
  mapStrapiChatToBubble,
  readLastReadTs,
  readLastReadTsSupportInbox,
  writeLastReadNow,
  writeLastReadNowSupportInbox,
  previewTime,
} from "@/lib/api/portalChatService";
import {
  messageSourceType,
  resolveMessageSourceLabel,
} from "@/lib/portalChannelLabels";

const ChatContext = createContext();

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping] = useState({});
  const [onlineUsers] = useState(new Set());
  const [accountId, setAccountId] = useState(null);
  const pollRef = useRef(null);
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const channelLookupsRef = useRef({ projectNamesById: {} });

  const bootstrapConversations = useCallback(async () => {
    const rawId = strapiClient.getCurrentAccountId();
    if (rawId == null || rawId === "") {
      setAccountId(null);
      setConversations([]);
      channelLookupsRef.current = { projectNamesById: {} };
      return;
    }
    setAccountId(rawId);
    channelLookupsRef.current = {
      projectNamesById: await fetchClientProjectNameMap(rawId),
    };

    const list = [
      {
        id: "support",
        channelKey: "",
        name: "Xtrawrkx Support",
        role: "Customer Support",
        lastMessage: "",
        lastMessageAt: 0,
        time: "",
        unread: 0,
        avatar: undefined,
        isOnline: false,
        isPinned: true,
        sortKey: Date.now(),
      },
    ];

    setConversations(list);
    setMessages((prev) => {
      const next = { ...prev };
      list.forEach((c) => {
        if (!(c.id in next)) next[c.id] = [];
      });
      return next;
    });
  }, []);

  const refreshChannel = useCallback(
    async (conv, silent) => {
      if (!accountId || !conv) return;
      try {
        const rows =
          conv.id === "support"
            ? await fetchAllChannelsChatMessages(accountId)
            : await fetchChatMessages(accountId, conv.channelKey ?? "");
        const bubbles = rows
          .map((r) =>
            mapStrapiChatToBubble(r, accountId, channelLookupsRef.current)
          )
          .filter(Boolean);
        setMessages((prev) => {
          const prevList = prev[conv.id] || [];
          if (silent && bubbles.length === 0 && prevList.length > 0) {
            return prev;
          }
          return { ...prev, [conv.id]: bubbles };
        });

        const last = rows.length ? rows[rows.length - 1] : null;
        const lastRaw = last?.attributes
          ? { ...last.attributes, id: last.id }
          : last;
        const lastText = lastRaw?.message || "";
        const lastChKey =
          lastRaw?.channelKey != null ? String(lastRaw.channelKey) : "";
        const lastMessageSource = resolveMessageSourceLabel(
          lastChKey,
          channelLookupsRef.current
        );
        const lastAt = lastRaw?.createdAt
          ? new Date(lastRaw.createdAt).getTime()
          : 0;
        const preview = previewTime(lastRaw?.createdAt);

        const lastRead =
          conv.id === "support"
            ? readLastReadTsSupportInbox(accountId)
            : readLastReadTs(accountId, conv.channelKey ?? "");
        const unreadFromTeam = rows.reduce((acc, row) => {
          const raw = row?.attributes ? { ...row.attributes, id: row.id } : row;
          if (!raw?.createdAt) return acc;
          const fromClient = raw.fromClient === true;
          if (fromClient) return acc;
          const t = new Date(raw.createdAt).getTime();
          if (t > lastRead) return acc + 1;
          return acc;
        }, 0);

        setConversations((prev) =>
          prev.map((c) =>
            c.id === conv.id
              ? {
                  ...c,
                  lastMessage: lastText,
                  lastMessageAt: lastAt,
                  lastMessageSource,
                  time: preview || c.time,
                  unread: unreadFromTeam,
                  sortKey: lastAt || c.sortKey,
                }
              : c
          )
        );
      } catch (e) {
        if (!silent) console.error("Chat refresh failed", e);
      }
    },
    [accountId]
  );

  useEffect(() => {
    bootstrapConversations();
  }, [bootstrapConversations]);

  useEffect(() => {
    if (!accountId) return undefined;

    const tick = async () => {
      const list = conversationsRef.current;
      if (!list.length) return;
      await Promise.all(list.map((c) => refreshChannel(c, true)));
    };

    tick();
    pollRef.current = setInterval(tick, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [accountId, refreshChannel]);

  const sendMessage = useCallback(
    async (conversationId, messageText) => {
      if (!messageText?.trim() || !accountId) return;
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv) return;

      const text = messageText.trim();
      let clientLabel = "You";
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("client_account");
          if (raw) {
            const a = JSON.parse(raw);
            const name =
              a.companyName || a.attributes?.companyName || a.company?.name;
            if (name && String(name).trim()) clientLabel = String(name).trim();
          }
        } catch {
          /* ignore */
        }
      }
      const ck = conv.channelKey != null ? String(conv.channelKey) : "";
      const sourceType = messageSourceType(ck);
      const sourceLabel = resolveMessageSourceLabel(
        ck,
        channelLookupsRef.current
      );
      const optimistic = {
        id: `tmp-${Date.now()}`,
        text,
        sender: "client",
        senderName: clientLabel,
        timestamp: new Date(),
        status: "sending",
        avatarUrl: null,
        clientAvatarUrl: null,
        channelKey: ck,
        sourceType,
        sourceLabel,
        channelTag:
          sourceType === "project"
            ? "Project"
            : sourceType === "community"
              ? "Program"
              : "Support",
      };
      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), optimistic],
      }));

      try {
        const res = await sendPortalChatMessage(
          accountId,
          text,
          conv.channelKey ?? ""
        );
        const created = res?.data;
        setMessages((prev) => {
          const withoutTmp = (prev[conversationId] || []).filter(
            (m) => m.id !== optimistic.id
          );
          if (created) {
            const bubble = mapStrapiChatToBubble(
              created,
              accountId,
              channelLookupsRef.current
            );
            if (bubble) {
              return {
                ...prev,
                [conversationId]: [...withoutTmp, bubble],
              };
            }
          }
          return {
            ...prev,
            [conversationId]: [
              ...withoutTmp,
              { ...optimistic, id: optimistic.id, status: "sent" },
            ],
          };
        });
        await refreshChannel(conv, true);
      } catch (e) {
        console.error(e);
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter(
            (m) => m.id !== optimistic.id
          ),
        }));
      }
    },
    [accountId, conversations, refreshChannel]
  );

  const markAsRead = useCallback(
    (conversationId) => {
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv || !accountId) return;
      writeLastReadNow(accountId, conv.channelKey ?? "");
      if (conv.id === "support") writeLastReadNowSupportInbox(accountId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c))
      );
      refreshChannel(conv, true);
    },
    [accountId, conversations, refreshChannel]
  );

  const getMessages = useCallback(
    (conversationId) => messages[conversationId] || [],
    [messages]
  );

  const getUnreadCount = useCallback(
    (conversationId) => {
      const c = conversations.find((x) => x.id === conversationId);
      return c?.unread || 0;
    },
    [conversations]
  );

  const isUserTyping = useCallback(
    (conversationId) => isTyping[conversationId] || false,
    [isTyping]
  );

  const updateConversation = useCallback((conversationId, updates) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, ...updates } : c))
    );
  }, []);

  const addConversation = useCallback((conversation) => {
    setConversations((prev) => [...prev, conversation]);
    setMessages((prev) => ({
      ...prev,
      [conversation.id]: [],
    }));
  }, []);

  const removeConversation = useCallback((conversationId) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMessages((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }, []);

  useEffect(() => {
    const total = conversations.reduce((s, c) => s + (c.unread || 0), 0);
    setUnreadCount(total);
  }, [conversations]);

  const value = {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    isTyping,
    onlineUsers,
    accountId,
    setActiveConversation,
    sendMessage,
    markAsRead,
    getMessages,
    getUnreadCount,
    isUserTyping,
    updateConversation,
    addConversation,
    removeConversation,
    refreshChannel,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
