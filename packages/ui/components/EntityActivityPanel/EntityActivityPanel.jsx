'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChatMessageText } from '../ChatMessageText';
import { MentionComposer } from '../MentionComposer';
import { mergeMentionUsers } from '../../utils/chatMentions';
import {
  Activity,
  MessageSquare,
  Send,
  Smile,
  Search,
  X,
  Reply,
  Pin,
  ChevronDown,
  Sparkles,
  Hash,
  Paperclip,
} from 'lucide-react';
import { LoadingSpinner } from '../../feedback';
import { EmptyState } from '../EmptyState';
import { ActivitiesTimeline } from '../ActivitiesTimeline';
import { ChatMessageAttachments } from '../ChatMessageAttachments';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMsgTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDateLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (msgDate.getTime() === today.getTime()) return 'Today';
  if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const EMPTY_MENTION_USERS = [];

function extractComment(msg) {
  if (msg?.meta?.comment) return msg.meta.comment;
  return '';
}

function extractAttachments(msg) {
  const list = msg?.meta?.attachments;
  return Array.isArray(list) ? list : [];
}

function isNextConnectReason(meta) {
  if (meta == null) return false;
  if (typeof meta === 'string') {
    try {
      const parsed = JSON.parse(meta);
      return parsed?.commentKind === 'next_connect';
    } catch {
      return false;
    }
  }
  return meta.commentKind === 'next_connect';
}

function actorLabel(actor) {
  if (!actor || typeof actor !== 'object') return 'User';
  return (
    actor.username?.trim() ||
    actor.email?.split('@')[0]?.trim() ||
    `User ${actor.id}`
  );
}

function actorInitials(actor) {
  const name = actorLabel(actor);
  const parts = name.split(/[\s._-]/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'U';
}

/** Assign a stable gradient to a name deterministically */
const ACTOR_GRADIENTS = [
  'from-orange-400 to-pink-500',
  'from-violet-500 to-purple-600',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-indigo-400 to-violet-500',
  'from-cyan-400 to-sky-500',
];

function actorGradient(actor) {
  const key = actorLabel(actor);
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return ACTOR_GRADIENTS[Math.abs(hash) % ACTOR_GRADIENTS.length];
}

function groupMessagesByDate(messages) {
  const groups = [];
  let currentLabel = null;
  let currentGroup = null;
  for (const msg of messages) {
    const label = formatDateLabel(msg.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      currentGroup = { label, messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  }
  return groups;
}

// Quick emoji reactions palette
const EMOJI_PALETTE = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '✅', '💡'];

// ── Sub-tab pill ──────────────────────────────────────────────────────────────

function PanelTabBtn({ active, onClick, icon: Icon, label, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
        active
          ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-sm'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/80'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
      {badge != null && badge > 0 && (
        <span
          className={`ml-0.5 rounded-full px-1.5 py-px text-[10px] font-bold leading-none ${
            active ? 'bg-white/25 text-white' : 'bg-orange-100 text-orange-700'
          }`}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
}

// ── Date divider ──────────────────────────────────────────────────────────────

function DateDivider({ label }) {
  return (
    <div className="flex items-center gap-2 py-2 px-1 select-none" aria-hidden>
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-1">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

// ── Single chat message ───────────────────────────────────────────────────────

function ChatMessage({ msg, highlighted, onReact, onPin, apiBase }) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState({});
  const text = extractComment(msg);
  const attachments = extractAttachments(msg);
  const actor = msg.actor;
  const gradient = actorGradient(actor);
  const nextConnectReason = isNextConnectReason(msg.meta);

  const handleReact = (emoji) => {
    setReactions((prev) => {
      const current = prev[emoji] || 0;
      return { ...prev, [emoji]: current > 0 ? 0 : 1 };
    });
    setShowEmojiPicker(false);
    onReact?.(msg, emoji);
  };

  const reactionEntries = Object.entries(reactions).filter(([, count]) => count > 0);

  return (
    <div
      className={`group relative flex gap-2.5 rounded-xl px-2 py-1.5 transition-colors duration-100 ${
        highlighted ? 'bg-orange-50/80 ring-1 ring-orange-200/60' : 'hover:bg-gray-50/80'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        <div
          className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[10px] font-bold shadow-sm ring-2 ring-white`}
        >
          {actorInitials(actor)}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-gray-800 truncate max-w-[140px]">
            {actorLabel(actor)}
          </span>
          {nextConnectReason ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80">
              Next connect reason
            </span>
          ) : null}
          <span className="text-[10px] text-gray-400 tabular-nums whitespace-nowrap">
            {formatMsgTime(msg.createdAt)}
          </span>
        </div>
        {text ? (
          <p className="mt-0.5 text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
            <ChatMessageText text={text} />
          </p>
        ) : null}
        <ChatMessageAttachments attachments={attachments} apiBase={apiBase} />
        {/* Reactions row */}
        {reactionEntries.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {reactionEntries.map(([emoji]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="inline-flex items-center gap-0.5 rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-800 hover:bg-orange-100 transition-colors"
              >
                {emoji}
                <span className="ml-0.5 text-[10px] tabular-nums">1</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {showActions && (
        <div className="absolute right-2 top-1 flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white shadow-md p-0.5 z-10">
          {/* Emoji picker toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              title="React"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute right-0 bottom-8 z-20 flex flex-wrap gap-1 rounded-xl border border-gray-200 bg-white p-2 shadow-xl w-44">
                {EMOJI_PALETTE.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleReact(e)}
                    className="text-base rounded-lg hover:bg-gray-100 w-8 h-8 flex items-center justify-center transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onPin?.(msg)}
            className="p-1.5 rounded text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
            title="Pin"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded text-gray-400 hover:text-sky-500 hover:bg-sky-50 transition-colors"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Pinned message banner ─────────────────────────────────────────────────────

function PinnedMessageBanner({ message, onDismiss }) {
  if (!message) return null;
  const text = extractComment(message);
  return (
    <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border-b border-amber-100">
      <Pin className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
      <p className="flex-1 text-xs text-amber-800 line-clamp-1">
        <ChatMessageText
          text={text}
          linkClassName="text-amber-900 underline underline-offset-2 hover:text-amber-950 break-all"
        />
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-amber-400 hover:text-amber-600 transition-colors shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * EntityActivityPanel — right-side panel with "Activity" and "Chats" sub-tabs.
 *
 * Props:
 *  - entityType: 'lead_company' | 'deal' | 'contact' | 'client_account' | 'project' | 'task'
 *  - entityId: string | number
 *  - entityName: string
 *  - crmTimeline: object[]
 *  - crmTimelineLoading: boolean
 *  - crmTimelineError: string | null
 *  - entityHrefForRow?: (row) => string | null
 *  - activityCount?: number
 *  - fetchCommentsFn: async ({ entityId }) => { data: [] }   — fetches existing chat msgs
 *  - addCommentFn: async ({ entityId, comment, attachments? }) => { data: msg }
 *  - uploadFilesFn?: async (File[]) => attachment[] — enables chat file attach
 *  - apiBase?: string — resolve relative media URLs (S3/CDN or Strapi)
 *  - chatFooterBadgeText?: string — optional hint under empty chat (e.g. PM projects)
 *  - defaultSubTab?: 'activity' | 'chat' — which sub-tab opens first (e.g. task Comments tab → chat)
 *  - className?: string — merged onto root card
 *  - minHeightPx / maxHeightPx?: number — panel height bounds (default 520 / 720)
 *  - mentionUsers?: { id, name?, email?, username?, firstName?, lastName? }[] — @mention roster
 *  - fetchMentionUsers?: () => Promise<mentionUsers[]> — loads roster when chat opens (merged with mentionUsers)
 *  - composerAvatarFallback?: string — initials in composer (default "Y")
 */
export function EntityActivityPanel({
  entityType: _entityType,
  entityId,
  entityName,
  crmTimeline,
  crmTimelineLoading,
  crmTimelineError,
  entityHrefForRow,
  activityCount,
  fetchCommentsFn,
  addCommentFn,
  uploadFilesFn,
  apiBase = '',
  chatFooterBadgeText,
  mentionUsers: mentionUsersProp,
  fetchMentionUsers,
  composerAvatarFallback = 'Y',
  defaultSubTab = 'activity',
  className = '',
  minHeightPx = 520,
  maxHeightPx = 720,
}) {
  const [panelTab, setPanelTab] = useState(defaultSubTab);

  useEffect(() => {
    setPanelTab(defaultSubTab);
  }, [defaultSubTab]);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [chatLoaded, setChatLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const staticMentionUsers = mentionUsersProp ?? EMPTY_MENTION_USERS;

  const [resolvedMentionUsers, setResolvedMentionUsers] = useState(() =>
    mergeMentionUsers(staticMentionUsers),
  );

  const timelineCount = activityCount ?? crmTimeline?.length ?? 0;
  const canSendMessages = typeof addCommentFn === 'function';

  useEffect(() => {
    setResolvedMentionUsers((prev) => mergeMentionUsers(staticMentionUsers, prev));
  }, [staticMentionUsers]);

  useEffect(() => {
    if (panelTab !== 'chat' || !fetchMentionUsers) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const loaded = await fetchMentionUsers();
        if (!cancelled) {
          setResolvedMentionUsers(mergeMentionUsers(staticMentionUsers, loaded));
        }
      } catch {
        /* roster optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [panelTab, fetchMentionUsers, staticMentionUsers]);

  // ── Load chat messages ───────────────────────────────────────────────────

  const loadChat = useCallback(async () => {
    if (!entityId || !fetchCommentsFn) return;
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await fetchCommentsFn({ entityId });
      const msgs = Array.isArray(res?.data) ? res.data : [];
      // API returns newest first; reverse to show oldest first
      setChatMessages([...msgs].reverse());
      setChatLoaded(true);
    } catch (e) {
      setChatError(e?.message || 'Could not load messages');
    } finally {
      setChatLoading(false);
    }
  }, [entityId, fetchCommentsFn]);

  useEffect(() => {
    if (panelTab === 'chat' && !chatLoaded) {
      loadChat();
    }
  }, [panelTab, chatLoaded, loadChat]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (panelTab === 'chat') {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [chatMessages, panelTab]);

  // Scroll-down button
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distFromBottom > 120);
  };

  // ── Send message ─────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    const hasFiles = pendingFiles.length > 0;
    if ((!text && !hasFiles) || !entityId || !canSendMessages || sending) return;
    setSending(true);
    setSendError('');
    try {
      let attachments = [];
      if (hasFiles && uploadFilesFn) {
        attachments = await uploadFilesFn(pendingFiles);
      }
      const res = await addCommentFn({
        entityId,
        comment: text,
        attachments,
      });
      const newMsg = res?.data;
      if (newMsg) {
        setChatMessages((prev) => [...prev, newMsg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
      setDraft('');
      setPendingFiles([]);
    } catch (e) {
      setSendError(e?.message || 'Could not send message');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [draft, pendingFiles, entityId, addCommentFn, uploadFilesFn, canSendMessages, sending]);

  const handlePickFiles = () => {
    if (!uploadFilesFn || sending) return;
    fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    setPendingFiles((prev) => [...prev, ...picked].slice(0, 5));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Filtered / grouped messages ──────────────────────────────────────────

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chatMessages;
    return chatMessages.filter(
      (msg) =>
        extractComment(msg).toLowerCase().includes(q) ||
        actorLabel(msg.actor).toLowerCase().includes(q)
    );
  }, [chatMessages, searchQuery]);

  const messageGroups = useMemo(
    () => groupMessagesByDate(filteredMessages),
    [filteredMessages]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={`flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`.trim()}
      style={{ minHeight: `${minHeightPx}px`, maxHeight: `${maxHeightPx}px` }}
    >
      {/* ── Header / Sub-tabs ─────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white">
        <div className="flex items-center gap-1.5">
          <PanelTabBtn
            active={panelTab === 'activity'}
            onClick={() => setPanelTab('activity')}
            icon={Activity}
            label="Activity"
            badge={timelineCount || undefined}
          />
          <PanelTabBtn
            active={panelTab === 'chat'}
            onClick={() => setPanelTab('chat')}
            icon={MessageSquare}
            label="Chats"
            badge={chatMessages.length || undefined}
          />
        </div>
        <div className="flex items-center gap-1">
          {panelTab === 'chat' && (
            <button
              type="button"
              onClick={() => {
                setShowSearch((v) => !v);
                if (!showSearch) setTimeout(() => document.getElementById('chat-search-input')?.focus(), 80);
              }}
              className={`p-1.5 rounded-lg transition-colors text-sm ${
                showSearch
                  ? 'bg-orange-100 text-orange-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Search messages"
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          {entityName && (
            <span className="hidden sm:inline-block text-xs font-medium text-gray-400 ml-1 max-w-[120px] truncate">
              {entityName}
            </span>
          )}
        </div>
      </div>

      {/* ── ACTIVITY TAB ──────────────────────────────────────────────────── */}
      {panelTab === 'activity' && (
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Activity sub-header */}
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-semibold text-gray-700">Timeline</span>
              <span className="text-xs text-gray-400">
                ({timelineCount} event{timelineCount !== 1 ? 's' : ''})
              </span>
            </div>
            <button
              type="button"
              className="text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors"
              onClick={() => setPanelTab('chat')}
            >
              Open Chats →
            </button>
          </div>
          <ActivitiesTimeline
            items={crmTimeline}
            loading={crmTimelineLoading}
            error={crmTimelineError}
            entityHrefForRow={entityHrefForRow}
          />
        </div>
      )}

      {/* ── CHAT TAB ──────────────────────────────────────────────────────── */}
      {panelTab === 'chat' && (
        <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Search bar */}
          {showSearch && (
            <div className="shrink-0 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 focus-within:border-orange-300 focus-within:ring-1 focus-within:ring-orange-100/80">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  id="chat-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages…"
                  className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-1 text-[10px] text-gray-400 text-center">
                  {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
          )}

          {/* Pinned message */}
          <PinnedMessageBanner
            message={pinnedMessage}
            onDismiss={() => setPinnedMessage(null)}
          />

          {/* Chat status bar */}
          <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50/30">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-300" />
              <span className="text-[10px] font-medium text-gray-500">
                {chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Hash className="w-2.5 h-2.5" />
              <span>{entityName || 'Thread'}</span>
            </div>
          </div>

          {/* Messages area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
            onScroll={handleScroll}
          >
            {chatLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner message="Loading messages…" />
              </div>
            ) : chatError ? (
              <div className="mx-2 my-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{chatError}</p>
                <button
                  type="button"
                  onClick={loadChat}
                  className="mt-2 text-xs text-red-600 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 via-orange-50 to-pink-100 flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-7 h-7 text-orange-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">
                    {searchQuery ? 'No results found' : 'No messages yet'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Start the conversation — your team will see messages here'}
                  </p>
                </div>
                {!searchQuery && (
                  <div className="flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1">
                    <Sparkles className="w-3 h-3 text-orange-500" />
                    <span className="text-[10px] font-medium text-orange-700">
                      {chatFooterBadgeText ?? 'Linked to the quick-chat on tables'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              messageGroups.map((group) => (
                <div key={group.label}>
                  <DateDivider label={group.label} />
                  {group.messages.map((msg, i) => (
                    <ChatMessage
                      key={msg.id ?? `m-${i}`}
                      msg={msg}
                      highlighted={highlightedMsgId === (msg.id ?? `m-${i}`)}
                      apiBase={apiBase}
                      onReact={(m, emoji) => {}}
                      onPin={(m) => setPinnedMessage(m)}
                    />
                  ))}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll-to-bottom button */}
          {showScrollDown && (
            <div className="absolute bottom-20 right-4 z-10 animate-bounce-once">
              <button
                type="button"
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1 rounded-full border border-gray-200 bg-white shadow-md px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                New
              </button>
            </div>
          )}

          {/* ── Composer ──────────────────────────────────────────────────── */}
          <div className="shrink-0 border-t border-gray-100 bg-white px-3 pt-3 pb-4">
            {sendError && (
              <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5">
                <span className="text-xs text-red-700 flex-1">{sendError}</span>
                <button
                  type="button"
                  onClick={() => setSendError('')}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {canSendMessages ? (
              <>
                {pendingFiles.length > 0 ? (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {pendingFiles.map((file, idx) => (
                      <span
                        key={`${file.name}-${idx}`}
                        className="inline-flex max-w-full items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] text-gray-700"
                      >
                        <Paperclip className="w-3 h-3 shrink-0 text-gray-400" />
                        <span className="truncate max-w-[140px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="text-gray-400 hover:text-red-500"
                          aria-label="Remove file"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 transition-all duration-150 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100/80 focus-within:shadow-sm">
                  {uploadFilesFn ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileInput}
                      />
                      <button
                        type="button"
                        onClick={handlePickFiles}
                        disabled={sending || pendingFiles.length >= 5}
                        className="shrink-0 mb-0.5 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-orange-600 disabled:opacity-40"
                        title="Attach file"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                    </>
                  ) : null}
                  {/* Avatar of sender (decorative) */}
                  <div className="shrink-0 mb-0.5">
                    <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-[9px] font-bold shadow-sm">
                      {composerAvatarFallback.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                  <MentionComposer
                    textareaRef={textareaRef}
                    value={draft}
                    onChange={setDraft}
                    onKeyDown={handleKeyDown}
                    mentionUsers={resolvedMentionUsers}
                    disabled={sending}
                    placeholder="Write a message… (@ to mention, Ctrl+Enter to send)"
                    textareaClassName="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={(!draft.trim() && !pendingFiles.length) || sending}
                    className="shrink-0 mb-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm transition-all hover:bg-orange-600 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Send (Ctrl+Enter)"
                  >
                    {sending ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="text-[10px] text-gray-400">
                    <kbd className="rounded bg-gray-100 px-1 font-mono text-[9px] text-gray-500">
                      Ctrl+Enter
                    </kbd>{' '}
                    to send · type <span className="font-medium text-gray-500">@</span> to mention
                  </p>
                  {draft.length > 0 && (
                    <p
                      className={`text-[10px] tabular-nums ${
                        draft.length > 4500 ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      {draft.length}/5000
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">
                You have read-only access to this record.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
