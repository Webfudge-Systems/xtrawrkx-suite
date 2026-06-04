'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MessageSquare,
  Search,
  Send,
  RefreshCw,
  FolderOpen,
  CheckSquare,
  Loader2,
} from 'lucide-react'
import { Avatar, Badge, Button, Card, ChatMessageText, EmptyState, Input, LoadingSpinner, MentionComposer } from '@webfudge/ui'
import { fetchChatMentionUsers } from '../lib/api/chatMentionUsers'
import { fetchPmThreadsCommentsFeed } from '../lib/api/pmInboxService'
import { fetchProjectComments, addProjectComment } from '../lib/api/projectActivityService'
import { fetchTaskComments, addTaskComment } from '../lib/api/taskActivityService'

const ENTITY_CONFIG = {
  project: {
    label: 'Project',
    icon: FolderOpen,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    badgeVariant: 'orange',
    href: (id) => `/projects/${id}`,
    fetchComments: ({ entityId, limit }) => fetchProjectComments({ projectId: entityId, limit }),
    addComment: ({ entityId, comment }) => addProjectComment({ projectId: entityId, comment }),
  },
  task: {
    label: 'Task',
    icon: CheckSquare,
    color: 'text-sky-600',
    bg: 'bg-sky-50',
    badgeVariant: 'info',
    href: (id) => `/tasks/${id}`,
    fetchComments: ({ entityId, limit }) => fetchTaskComments({ taskId: entityId, limit }),
    addComment: ({ entityId, comment }) => addTaskComment({ taskId: entityId, comment }),
  },
}

function formatRelTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function extractComment(msg) {
  return msg?.meta?.comment || ''
}

function parseEntityName(summary) {
  if (!summary) return null
  const m = summary.match(/commented on (?:project|task) "([^"]+)"/i)
  if (m) return m[1]
  const fallback = summary.match(/"([^"]+)"/)
  return fallback ? fallback[1] : summary
}

function actorLabel(actor) {
  if (!actor || typeof actor !== 'object') return 'User'
  return (
    actor.username?.trim() ||
    actor.email?.split('@')[0]?.trim() ||
    `User ${actor.id}`
  )
}

function actorInitials(actor) {
  const name = actorLabel(actor)
  const parts = name.split(/[\s._-]+/)
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || 'U'
}

function groupIntoThreads(comments) {
  const map = new Map()
  for (const c of comments) {
    const st = String(c.subjectType || '').toLowerCase()
    if (st !== 'project' && st !== 'task') continue
    const key = `${st}:${c.subjectId}`
    if (!map.has(key)) {
      map.set(key, {
        key,
        subjectType: st,
        subjectId: c.subjectId,
        entityName: parseEntityName(c.summary),
        latestActivity: c,
        latestComment: extractComment(c),
        count: 0,
        participants: new Map(),
      })
    }
    const thread = map.get(key)
    thread.count += 1
    if (new Date(c.createdAt) > new Date(thread.latestActivity.createdAt)) {
      thread.latestActivity = c
      thread.latestComment = extractComment(c)
    }
    if (c.actor?.id) {
      thread.participants.set(c.actor.id, c.actor)
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latestActivity.createdAt) - new Date(a.latestActivity.createdAt)
  )
}

function ThreadListItem({ thread, active, onClick }) {
  const config = ENTITY_CONFIG[thread.subjectType]
  if (!config) return null
  const Icon = config.icon
  const participants = Array.from(thread.participants.values()).slice(0, 3)
  const preview = thread.latestComment?.trim()

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border border-l-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
        thread.subjectType === 'project' ? 'border-l-orange-400' : 'border-l-sky-400'
      } ${
        active
          ? 'border-orange-200 bg-orange-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col gap-2 px-3.5 py-3">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${config.bg}`} aria-hidden>
            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
            {thread.entityName || `${config.label} #${thread.subjectId}`}
          </span>
          <time
            dateTime={thread.latestActivity?.createdAt}
            className="shrink-0 text-[11px] font-medium tabular-nums text-gray-400"
          >
            {formatRelTime(thread.latestActivity?.createdAt)}
          </time>
        </div>
        <div className="flex min-w-0 items-start gap-2">
          <Badge variant={config.badgeVariant || 'default'} size="sm" className="mt-px shrink-0 uppercase tracking-wide">
            {config.label}
          </Badge>
          {preview ? (
            <p className="line-clamp-1 min-w-0 flex-1 text-xs italic leading-relaxed text-gray-500">&ldquo;{preview}&rdquo;</p>
          ) : (
            <p className="text-xs italic text-gray-300">No preview</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="-space-x-1 flex" aria-label="Participants">
            {participants.map((actor, i) => (
              <Avatar
                key={actor.id ?? i}
                size="xs"
                alt={actorLabel(actor)}
                fallback={actorInitials(actor)}
                title={actorLabel(actor)}
                className="bg-orange-500 text-[10px] font-semibold ring-2 ring-white"
              />
            ))}
          </div>
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
              active ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <MessageSquare className="h-3 w-3" />
            {thread.count}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function PmInboxThreadsTab() {
  const [allComments, setAllComments] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState(null)
  const [listSearch, setListSearch] = useState('')
  const [selectedThread, setSelectedThread] = useState(null)
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const messagesEndRef = useRef(null)
  const composerRef = useRef(null)
  const [mentionUsers, setMentionUsers] = useState([])

  useEffect(() => {
    let cancelled = false
    fetchChatMentionUsers()
      .then((users) => {
        if (!cancelled) setMentionUsers(Array.isArray(users) ? users : [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const loadThreadList = useCallback(async (silent = false) => {
    if (!silent) setListLoading(true)
    else setRefreshing(true)
    setListError(null)
    try {
      const res = await fetchPmThreadsCommentsFeed({ limit: 100, start: 0 })
      setAllComments(Array.isArray(res?.data) ? res.data : [])
    } catch (e) {
      setListError(e?.message || 'Could not load threads')
    } finally {
      setListLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadThreadList()
  }, [loadThreadList])

  const threads = useMemo(() => {
    const grouped = groupIntoThreads(allComments)
    const q = listSearch.trim().toLowerCase()
    if (!q) return grouped
    return grouped.filter(
      (t) =>
        (t.entityName || '').toLowerCase().includes(q) ||
        (t.latestComment || '').toLowerCase().includes(q) ||
        Array.from(t.participants.values()).some((a) => actorLabel(a).toLowerCase().includes(q))
    )
  }, [allComments, listSearch])

  const loadChat = useCallback(async (thread) => {
    if (!thread) return
    const config = ENTITY_CONFIG[thread.subjectType]
    if (!config) return
    setChatLoading(true)
    setChatError(null)
    setChatMessages([])
    setDraft('')
    setSendError('')
    try {
      const res = await config.fetchComments({ entityId: thread.subjectId, limit: 100 })
      const msgs = Array.isArray(res?.data) ? res.data : []
      setChatMessages([...msgs].reverse())
    } catch (e) {
      setChatError(e?.message || 'Could not load messages')
    } finally {
      setChatLoading(false)
    }
  }, [])

  const handleSelectThread = useCallback(
    (thread) => {
      setSelectedThread(thread)
      loadChat(thread)
    },
    [loadChat]
  )

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    }
  }, [chatMessages])

  const handleSend = useCallback(async () => {
    const text = draft.trim()
    if (!text || !selectedThread || sending) return
    const config = ENTITY_CONFIG[selectedThread.subjectType]
    if (!config) return
    setSending(true)
    setSendError('')
    try {
      await config.addComment({ entityId: selectedThread.subjectId, comment: text })
      setDraft('')
      const res = await config.fetchComments({ entityId: selectedThread.subjectId, limit: 100 })
      const msgs = Array.isArray(res?.data) ? res.data : []
      setChatMessages([...msgs].reverse())
      await loadThreadList(true)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
    } catch (e) {
      setSendError(e?.message || 'Could not send')
    } finally {
      setSending(false)
    }
  }, [draft, selectedThread, sending, loadThreadList])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card variant="elevated" padding={false} className="overflow-hidden rounded-xl border border-gray-100 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/90 px-3 py-3">
            <div className="min-w-0 flex-1 px-1">
              <Input
                icon={Search}
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search projects & tasks…"
                className="rounded-lg border-gray-200 text-sm"
                containerClassName="mb-0"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              disabled={listLoading || refreshing}
              onClick={() => loadThreadList(true)}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="max-h-[min(560px,calc(100vh-280px))] space-y-2 overflow-y-auto p-3">
            {listLoading ? (
              <div className="flex h-48 items-center justify-center">
                <LoadingSpinner size="md" message="Loading threads…" />
              </div>
            ) : listError ? (
              <EmptyState icon={MessageSquare} title="Could not load threads" description={listError} className="py-10" />
            ) : threads.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No PM threads yet"
                description="Comment on a project or task — threads show up here for your organization."
                className="py-10"
              />
            ) : (
              threads.map((t) => (
                <ThreadListItem
                  key={t.key}
                  thread={t}
                  active={selectedThread?.key === t.key}
                  onClick={() => handleSelectThread(t)}
                />
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card variant="elevated" padding={false} className="flex min-h-[min(560px,calc(100vh-280px))] flex-col overflow-hidden rounded-xl border border-gray-100 shadow-md">
          {!selectedThread ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
              <EmptyState
                icon={MessageSquare}
                title="Select a thread"
                description="Choose a project or task comment thread on the left. Open the record via the link below when you need full context."
                className="max-w-md py-6"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gradient-to-r from-orange-50/90 to-white px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">
                    {selectedThread.entityName || `${ENTITY_CONFIG[selectedThread.subjectType]?.label || 'Record'} #${selectedThread.subjectId}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ENTITY_CONFIG[selectedThread.subjectType]?.label} · {threads.find((x) => x.key === selectedThread.key)?.count || 0}{' '}
                    comments
                  </p>
                </div>
                <Link
                  href={ENTITY_CONFIG[selectedThread.subjectType].href(selectedThread.subjectId)}
                  className="shrink-0 text-sm font-medium text-orange-600 hover:underline"
                >
                  Open record →
                </Link>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gray-50/40 p-4">
                {chatLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <LoadingSpinner size="md" message="Loading messages…" />
                  </div>
                ) : chatError ? (
                  <p className="text-sm text-red-600">{chatError}</p>
                ) : chatMessages.length === 0 ? (
                  <EmptyState icon={MessageSquare} title="No messages" description="Send the first comment." className="py-8" />
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={msg.id || i} className="flex gap-3">
                      <Avatar
                        fallback={actorInitials(msg.actor)}
                        size="sm"
                        className="shrink-0 bg-gradient-to-br from-orange-400 to-pink-500 text-white"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-xs font-semibold text-gray-800">{actorLabel(msg.actor)}</span>
                          <span className="text-[10px] text-gray-400">{formatRelTime(msg.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">
                          <ChatMessageText text={extractComment(msg)} />
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex-shrink-0 border-t border-gray-100 bg-white p-4">
                {sendError ? <p className="mb-2 text-xs text-red-600">{sendError}</p> : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-h-[44px] flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
                    <MentionComposer
                      textareaRef={composerRef}
                      value={draft}
                      onChange={setDraft}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      mentionUsers={mentionUsers}
                      disabled={sending}
                      placeholder="Write a comment… (@ to mention, Ctrl+Enter to send)"
                      textareaClassName="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                      minHeightPx={44}
                      maxHeightPx={120}
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-[42px] shrink-0 rounded-xl px-5"
                    onClick={handleSend}
                    disabled={sending || !draft.trim()}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    <span className="ml-2">Send</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
