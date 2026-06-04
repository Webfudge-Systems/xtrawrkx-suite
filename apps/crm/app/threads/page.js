'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Search,
  X,
  Send,
  RefreshCw,
  Building2,
  Briefcase,
  User,
  Users,
  ChevronRight,
  Smile,
  Pin,
  Hash,
} from 'lucide-react';
import { Card, EmptyState, LoadingSpinner, Badge, Avatar, ChatMessageText, MentionComposer } from '@webfudge/ui';
import { fetchChatMentionUsers } from '../../lib/chatMentionUsers';
import CRMPageHeader from '../../components/CRMPageHeader';
import {
  fetchGlobalCommentsFeed,
  fetchLeadCompanyComments,
  fetchDealComments,
  fetchContactComments,
  fetchClientAccountComments,
  addLeadCompanyComment,
  addDealComment,
  addContactComment,
  addClientAccountComment,
} from '../../lib/api/crmActivityService';

// ── Constants ────────────────────────────────────────────────────────────────

const ENTITY_CONFIG = {
  lead_company: {
    label: 'Lead',
    icon: Building2,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    ring: 'ring-violet-200',
    badgeVariant: 'purple',
    href: (id) => `/sales/lead-companies/${id}`,
    fetchComments: ({ entityId, limit }) => fetchLeadCompanyComments({ leadCompanyId: entityId, limit }),
    addComment: ({ entityId, comment }) => addLeadCompanyComment({ leadCompanyId: entityId, comment }),
  },
  deal: {
    label: 'Deal',
    icon: Briefcase,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-200',
    badgeVariant: 'success',
    href: (id) => `/sales/deals/${id}`,
    fetchComments: ({ entityId, limit }) => fetchDealComments({ dealId: entityId, limit }),
    addComment: ({ entityId, comment }) => addDealComment({ dealId: entityId, comment }),
  },
  contact: {
    label: 'Contact',
    icon: User,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    ring: 'ring-sky-200',
    badgeVariant: 'info',
    href: (id) => `/sales/contacts/${id}`,
    fetchComments: ({ entityId, limit }) => fetchContactComments({ contactId: entityId, limit }),
    addComment: ({ entityId, comment }) => addContactComment({ contactId: entityId, comment }),
  },
  client_account: {
    label: 'Client',
    icon: Users,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    ring: 'ring-orange-200',
    badgeVariant: 'orange',
    href: (id) => `/clients/accounts/${id}`,
    fetchComments: ({ entityId, limit }) => fetchClientAccountComments({ clientAccountId: entityId, limit }),
    addComment: ({ entityId, comment }) => addClientAccountComment({ clientAccountId: entityId, comment }),
  },
};

const EMOJI_PALETTE = ['👍', '❤️', '😂', '🎉', '🔥', '👀', '✅', '💡'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRelTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

function extractComment(msg) {
  return msg?.meta?.comment || '';
}

/** Parse entity name from the summary string */
function parseEntityName(summary) {
  if (!summary) return null;
  // "User commented on deal "Deal Name""
  // "User commented on contact "Contact Name""
  // "User commented on "Lead Name""  (lead companies)
  const match = summary.match(/commented on (?:deal |contact |client account )?"([^"]+)"/i);
  if (match) return match[1];
  // Fallback: extract anything between quotes
  const fallback = summary.match(/"([^"]+)"/);
  return fallback ? fallback[1] : summary;
}

/**
 * Group flat comment activities into thread objects keyed by subjectType+subjectId.
 * Returns sorted by most recent comment.
 */
function groupIntoThreads(comments) {
  const map = new Map();
  for (const c of comments) {
    const key = `${c.subjectType}:${c.subjectId}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        subjectType: c.subjectType,
        subjectId: c.subjectId,
        entityName: parseEntityName(c.summary),
        latestActivity: c,
        latestComment: extractComment(c),
        count: 0,
        participants: new Map(),
      });
    }
    const thread = map.get(key);
    thread.count += 1;
    // Keep most recent as "latest"
    if (new Date(c.createdAt) > new Date(thread.latestActivity.createdAt)) {
      thread.latestActivity = c;
      thread.latestComment = extractComment(c);
    }
    if (c.actor?.id) {
      thread.participants.set(c.actor.id, c.actor);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.latestActivity.createdAt) - new Date(a.latestActivity.createdAt)
  );
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

// ── Sub-components ────────────────────────────────────────────────────────────

function DateDivider({ label }) {
  return (
    <div className="flex items-center gap-2 py-3 px-1 select-none" aria-hidden>
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-1">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function ChatMessage({ msg, highlighted, onPin }) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState({});
  const text = extractComment(msg);
  const actor = msg.actor;
  const gradient = actorGradient(actor);

  const handleReact = (emoji) => {
    setReactions((prev) => ({ ...prev, [emoji]: prev[emoji] ? 0 : 1 }));
    setShowEmojiPicker(false);
  };

  const reactionEntries = Object.entries(reactions).filter(([, c]) => c > 0);

  return (
    <div
      className={`group relative flex gap-3 rounded-xl px-3 py-2 transition-colors duration-100 ${highlighted ? 'bg-orange-50/80 ring-1 ring-orange-200/60' : 'hover:bg-gray-50/60'
        }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
    >
      <div className="shrink-0 mt-0.5">
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[11px] font-bold shadow-sm ring-2 ring-white`}
        >
          {actorInitials(actor)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-800 truncate max-w-[160px]">
            {actorLabel(actor)}
          </span>
          <span className="text-[10px] text-gray-400 tabular-nums whitespace-nowrap">
            {formatRelTime(msg.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
          <ChatMessageText text={text} />
        </p>
        {reactionEntries.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {reactionEntries.map(([emoji]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReact(emoji)}
                className="inline-flex items-center gap-0.5 rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-800 hover:bg-orange-100 transition-colors"
              >
                {emoji} <span className="ml-0.5 text-[10px] tabular-nums">1</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {showActions && (
        <div className="absolute right-2 top-1.5 flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white shadow-md p-0.5 z-10">
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
            title="Pin message"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function ThreadListItem({ thread, active, onClick }) {
  const config = ENTITY_CONFIG[thread.subjectType] || ENTITY_CONFIG.deal;
  const Icon = config.icon;
  const participants = Array.from(thread.participants.values()).slice(0, 3);

  // Derive a border-left accent color per entity type
  const accentBorder = {
    lead_company: 'border-l-violet-400',
    deal: 'border-l-emerald-400',
    contact: 'border-l-sky-400',
    client_account: 'border-l-orange-400',
  }[thread.subjectType] ?? 'border-l-gray-300';

  const preview = thread.latestComment?.trim();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border border-l-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-2 ${accentBorder} ${active
        ? 'bg-orange-50 border-orange-200 shadow-sm'
        : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm'
        }`}
    >
      <div className="px-3.5 py-3 flex flex-col gap-2">
        {/* Row 1: Icon + Name + Time */}
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.bg}`} aria-hidden>
            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
          </div>
          <span className="flex-1 min-w-0 text-sm font-semibold text-gray-900 truncate">
            {thread.entityName || `${config.label} #${thread.subjectId}`}
          </span>
          <time
            dateTime={thread.latestActivity?.createdAt}
            className="shrink-0 text-[11px] tabular-nums text-gray-400 font-medium"
          >
            {formatRelTime(thread.latestActivity?.createdAt)}
          </time>
        </div>

        {/* Row 2: Type badge + Comment preview */}
        <div className="flex items-start gap-2 min-w-0">
          <Badge variant={config.badgeVariant || 'default'} size="sm" className="shrink-0 uppercase tracking-wide mt-px">
            {config.label}
          </Badge>
          {preview ? (
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-1 min-w-0 flex-1 italic">
              &ldquo;{preview}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-gray-300 italic">No comments yet</p>
          )}
        </div>

        {/* Row 3: Participants + message count */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex -space-x-1" aria-label="Participants">
            {participants.map((actor, i) => (
              <Avatar
                key={actor.id ?? i}
                size="xs"
                alt={actorLabel(actor)}
                fallback={actorInitials(actor)}
                title={actorLabel(actor)}
                className="ring-2 ring-white bg-orange-500 text-[10px] font-semibold"
              />
            ))}
          </div>
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${active ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
            }`}>
            <MessageSquare className="w-3 h-3" />
            {thread.count}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ThreadsPage() {
  // Thread list state
  const [allComments, setAllComments] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [listSearch, setListSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedThread, setSelectedThread] = useState(null);

  // Chat panel state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [chatSearch, setChatSearch] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [mentionUsers, setMentionUsers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchChatMentionUsers()
      .then((users) => {
        if (!cancelled) setMentionUsers(Array.isArray(users) ? users : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Load thread list ───────────────────────────────────────────────────────

  const loadThreadList = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true);
    else setRefreshing(true);
    setListError(null);
    try {
      const res = await fetchGlobalCommentsFeed({ limit: 100 });
      setAllComments(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setListError(e?.message || 'Could not load threads');
    } finally {
      setListLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadThreadList();
  }, [loadThreadList]);

  // ── Derived thread list ───────────────────────────────────────────────────

  const threads = useMemo(() => {
    const grouped = groupIntoThreads(allComments);
    let filtered = grouped;

    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.subjectType === filterType);
    }

    const q = listSearch.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (t) =>
          (t.entityName || '').toLowerCase().includes(q) ||
          (t.latestComment || '').toLowerCase().includes(q) ||
          Array.from(t.participants.values()).some((a) =>
            actorLabel(a).toLowerCase().includes(q)
          )
      );
    }

    return filtered;
  }, [allComments, filterType, listSearch]);

  // ── Load chat for selected thread ─────────────────────────────────────────

  const loadChat = useCallback(async (thread) => {
    if (!thread) return;
    const config = ENTITY_CONFIG[thread.subjectType];
    if (!config) return;
    setChatLoading(true);
    setChatError(null);
    setChatMessages([]);
    setPinnedMessage(null);
    setDraft('');
    setSendError('');
    setChatSearch('');
    setShowChatSearch(false);
    try {
      const res = await config.fetchComments({ entityId: thread.subjectId, limit: 100 });
      const msgs = Array.isArray(res?.data) ? res.data : [];
      // API returns newest first; reverse for chronological display
      setChatMessages([...msgs].reverse());
    } catch (e) {
      setChatError(e?.message || 'Could not load messages');
    } finally {
      setChatLoading(false);
    }
  }, []);

  const handleSelectThread = useCallback(
    (thread) => {
      setSelectedThread(thread);
      loadChat(thread);
    },
    [loadChat]
  );

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [chatMessages]);

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || !selectedThread || sending) return;
    const config = ENTITY_CONFIG[selectedThread.subjectType];
    if (!config) return;

    setSending(true);
    setSendError('');
    try {
      const res = await config.addComment({ entityId: selectedThread.subjectId, comment: text });
      const newMsg = res?.data;
      if (newMsg) {
        setChatMessages((prev) => [...prev, newMsg]);
        // Update thread list count
        setAllComments((prev) => [newMsg, ...prev]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
      setDraft('');
    } catch (e) {
      setSendError(e?.message || 'Could not send message');
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [draft, selectedThread, sending]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Filtered chat messages ────────────────────────────────────────────────

  const filteredChatMessages = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return chatMessages;
    return chatMessages.filter(
      (msg) =>
        extractComment(msg).toLowerCase().includes(q) ||
        actorLabel(msg.actor).toLowerCase().includes(q)
    );
  }, [chatMessages, chatSearch]);

  const messageGroups = useMemo(() => groupMessagesByDate(filteredChatMessages), [filteredChatMessages]);

  // ── Selected thread config ────────────────────────────────────────────────

  const selectedConfig = selectedThread ? ENTITY_CONFIG[selectedThread.subjectType] : null;
  const SelectedIcon = selectedConfig?.icon;
  const entityHref = selectedThread && selectedConfig
    ? selectedConfig.href(selectedThread.subjectId)
    : null;

  const typeFilterOptions = [
    { value: 'all', label: 'All', icon: MessageSquare },
    { value: 'lead_company', label: 'Leads', icon: Building2 },
    { value: 'deal', label: 'Deals', icon: Briefcase },
    { value: 'contact', label: 'Contacts', icon: User },
    { value: 'client_account', label: 'Clients', icon: Users },
  ];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-4">
      <CRMPageHeader
        title="Threads"
        subtitle="All active comment threads across your CRM"
        breadcrumb={[
          { label: 'Workspace', href: '/workspace' },
          { label: 'Threads', href: '/threads' },
        ]}
        actions={
          <button
            type="button"
            onClick={() => loadThreadList(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4" style={{ minHeight: '78vh' }}>
        {/* ── Thread List ─────────────────────────────────────────────────── */}
        <Card className="flex flex-col border border-gray-200 overflow-hidden !p-3" style={{ maxHeight: '80vh' }}>
          {/* List header */}
          <div className="shrink-0 px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                Conversations
              </h2>
              {!listLoading ? (
                <Badge variant="orange" size="sm" className="ml-auto font-semibold tabular-nums">
                  {threads.length}
                </Badge>
              ) : null}
            </div>

            {/* Search */}
            <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-1 focus-within:ring-orange-100 transition-all">
              <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search threads…"
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
              />
              {listSearch && (
                <button type="button" onClick={() => setListSearch('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Type filter pills */}
            <div className="mt-2.5 flex gap-1 flex-wrap">
              {typeFilterOptions.map(({ value, label, icon: Ic }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilterType(value)}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 ${filterType === value
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  <Ic className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 space-y-2.5 overflow-y-auto px-1 py-2 sm:px-2">
            {listLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <LoadingSpinner message="Loading threads…" />
              </div>
            ) : listError ? (
              <div className="mx-2 my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{listError}</p>
                <button
                  type="button"
                  onClick={() => loadThreadList()}
                  className="mt-2 text-xs text-red-600 underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            ) : threads.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={MessageSquare}
                  title="No threads found"
                  description={
                    listSearch || filterType !== 'all'
                      ? 'Try adjusting your search or filter.'
                      : 'Comments left on deals, leads, contacts, and clients will appear here.'
                  }
                />
              </div>
            ) : (
              threads.map((thread) => (
                <ThreadListItem
                  key={thread.key}
                  thread={thread}
                  active={selectedThread?.key === thread.key}
                  onClick={() => handleSelectThread(thread)}
                />
              ))
            )}
          </div>
        </Card>

        {/* ── Chat Panel ──────────────────────────────────────────────────── */}
        <Card
          className="flex flex-col border border-gray-200 overflow-hidden !p-3"
          style={{ maxHeight: '78vh' }}
        >
          {!selectedThread ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 via-orange-50 to-pink-100 flex items-center justify-center shadow-inner">
                <MessageSquare className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <p className="text-base font-semibold text-gray-700">Select a thread</p>
                <p className="text-sm text-gray-400 mt-1">
                  Choose a conversation from the list to view and reply.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="shrink-0 flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 pb-3 pt-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  {selectedConfig && (
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selectedConfig.bg}`}
                      aria-hidden
                    >
                      {SelectedIcon ? (
                        <SelectedIcon className={`h-4 w-4 shrink-0 ${selectedConfig.color}`} />
                      ) : null}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold leading-snug text-gray-900">
                      {selectedThread.entityName || `${selectedConfig?.label} #${selectedThread.subjectId}`}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {selectedConfig?.badgeVariant ? (
                        <Badge variant={selectedConfig.badgeVariant} size="sm" className="uppercase tracking-wide">
                          {selectedConfig.label}
                        </Badge>
                      ) : null}
                      <span className="text-sm font-medium text-gray-500">
                        {chatMessages.length} message{chatMessages.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChatSearch((v) => !v);
                      if (!showChatSearch) setTimeout(() => document.getElementById('thread-chat-search')?.focus(), 80);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${showChatSearch
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    title="Search messages"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  {entityHref && (
                    <Link
                      href={entityHref}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-brand-primary hover:bg-orange-50 transition-colors"
                    >
                      Open record
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Chat search bar */}
              {showChatSearch && (
                <div className="shrink-0 px-3 py-2 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 focus-within:border-orange-300 focus-within:ring-1 focus-within:ring-orange-100/80">
                    <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <input
                      id="thread-chat-search"
                      type="text"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      placeholder="Search messages…"
                      className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
                    />
                    {chatSearch && (
                      <button type="button" onClick={() => setChatSearch('')} className="text-gray-400 hover:text-gray-600">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {chatSearch && (
                    <p className="mt-1 text-[10px] text-gray-400 text-center">
                      {filteredChatMessages.length} result{filteredChatMessages.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}

              {/* Pinned message banner */}
              {pinnedMessage && (
                <div className="shrink-0 flex items-start gap-2 px-3 py-2 bg-amber-50 border-b border-amber-100">
                  <Pin className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                  <p className="flex-1 text-xs text-amber-800 line-clamp-1">
                    <ChatMessageText
                      text={extractComment(pinnedMessage)}
                      linkClassName="text-amber-900 underline underline-offset-2 hover:text-amber-950 break-all"
                    />
                  </p>
                  <button type="button" onClick={() => setPinnedMessage(null)} className="text-amber-400 hover:text-amber-600 transition-colors shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                {chatLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <LoadingSpinner message="Loading messages…" />
                  </div>
                ) : chatError ? (
                  <div className="mx-2 my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">{chatError}</p>
                    <button
                      type="button"
                      onClick={() => loadChat(selectedThread)}
                      className="mt-2 text-xs text-red-600 underline hover:no-underline"
                    >
                      Try again
                    </button>
                  </div>
                ) : filteredChatMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 via-orange-50 to-pink-100 flex items-center justify-center shadow-inner">
                      <Hash className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700">
                        {chatSearch ? 'No results found' : 'No messages yet'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {chatSearch
                          ? 'Try a different search term'
                          : 'Be the first to comment on this record'}
                      </p>
                    </div>
                  </div>
                ) : (
                  messageGroups.map((group) => (
                    <div key={group.label}>
                      <DateDivider label={group.label} />
                      {group.messages.map((msg, i) => (
                        <ChatMessage
                          key={msg.id ?? `m-${i}`}
                          msg={msg}
                          highlighted={false}
                          onPin={(m) => setPinnedMessage(m)}
                        />
                      ))}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="shrink-0 border-t border-gray-100 bg-white px-4 pt-3 pb-4">
                {sendError && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5">
                    <span className="text-xs text-red-700 flex-1">{sendError}</span>
                    <button type="button" onClick={() => setSendError('')} className="text-red-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-end gap-2.5 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 transition-all duration-150 focus-within:border-orange-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-100/80 focus-within:shadow-sm">
                  <div className="shrink-0 mb-0.5">
                    <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                      Y
                    </div>
                  </div>
                  <MentionComposer
                    textareaRef={textareaRef}
                    value={draft}
                    onChange={setDraft}
                    onKeyDown={handleKeyDown}
                    mentionUsers={mentionUsers}
                    disabled={sending}
                    placeholder={`Reply in ${selectedThread.entityName || selectedConfig?.label || 'thread'}… (@ to mention, Ctrl+Enter to send)`}
                    textareaClassName="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
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
                    <kbd className="rounded bg-gray-100 px-1 font-mono text-[9px] text-gray-500">Ctrl+Enter</kbd>{' '}
                    to send · type <span className="font-medium text-gray-500">@</span> to mention
                  </p>
                  {draft.length > 0 && (
                    <p className={`text-[10px] tabular-nums ${draft.length > 4500 ? 'text-red-500' : 'text-gray-400'}`}>
                      {draft.length}/5000
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
