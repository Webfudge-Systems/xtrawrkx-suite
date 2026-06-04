'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@webfudge/auth'
import {
  Card,
  EmptyState,
  Button,
  Avatar,
  LoadingSpinner,
  Input,
  KPICard,
  ChatMessageText,
  MentionComposer,
} from '@webfudge/ui'
import {
  MessageSquare,
  Send,
  Search,
  User,
  Users,
  RefreshCw,
  Mail,
  AlertCircle,
} from 'lucide-react'
import PMPageHeader from '../../components/PMPageHeader'
import PMRowActions from '../../components/PMRowActions'
import messageService, { memberDisplayName } from '../../lib/api/messageService'
import { fetchChatMentionUsers } from '../../lib/api/chatMentionUsers'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getCurrentUserId(user) {
  if (!user) return null
  const u = user.attributes || user
  return u.id ?? user.id ?? u.documentId ?? user.documentId ?? null
}

function getListDisplayName(u) {
  if (!u) return 'User'
  return (
    u.name ||
    memberDisplayName(u) ||
    (u.email ? u.email.split('@')[0] : '') ||
    u.username ||
    'User'
  ).trim()
}

function getListUserInitials(u) {
  const name = getListDisplayName(u)
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }
  if (name.length >= 2) return name.slice(0, 2).toUpperCase()
  return (name.charAt(0) || '?').toUpperCase()
}

function MessagesPageContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const messagesEndRef = useRef(null)
  const composerRef = useRef(null)

  const [users, setUsers] = useState([])
  const [mentionUsers, setMentionUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [orgError, setOrgError] = useState(null)
  const [messagesError, setMessagesError] = useState(null)
  const [sendError, setSendError] = useState(null)

  const currentUserId = getCurrentUserId(user)

  useEffect(() => {
    let cancelled = false
    fetchChatMentionUsers()
      .then((list) => {
        if (!cancelled) setMentionUsers(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const dmMentionUsers = useMemo(() => {
    const roster = [...mentionUsers, ...users]
    const seen = new Set()
    return roster.filter((u) => {
      if (!u?.id) return false
      const key = String(u.id)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [mentionUsers, users])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setOrgError(null)
      const { contacts, error } = await messageService.fetchMessageContacts({
        excludeUserId: currentUserId,
      })
      if (error === 'no_org') {
        setOrgError('no_org')
        setUsers([])
        return
      }
      setUsers(contacts)
    } catch (e) {
      console.error('Failed to load contacts:', e)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [currentUserId])

  const loadMessages = useCallback(async () => {
    if (!selectedUser || currentUserId == null) return
    try {
      setLoadingMessages(true)
      setMessagesError(null)
      const list = await messageService.fetchConversation(selectedUser.id)
      setMessages(Array.isArray(list) ? list : [])
    } catch (e) {
      console.error('Failed to load messages:', e)
      setMessages([])
      const raw = e?.message || 'Could not load messages'
      setMessagesError(
        /internal server error/i.test(raw)
          ? 'Could not load messages. Restart the API if you just deployed a fix.'
          : raw
      )
    } finally {
      setLoadingMessages(false)
    }
  }, [selectedUser, currentUserId])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    if (selectedUser) {
      loadMessages()
      const interval = setInterval(loadMessages, 8000)
      return () => clearInterval(interval)
    }
  }, [selectedUser, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const withParam = searchParams.get('with')
  useEffect(() => {
    if (!withParam || users.length === 0) return
    const match = users.find((u) => String(u.id) === String(withParam))
    if (match) setSelectedUser(match)
  }, [withParam, users])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || currentUserId == null) return
    try {
      setSending(true)
      setSendError(null)
      await messageService.sendDirectMessage(selectedUser.id, newMessage)
      setNewMessage('')
      await loadMessages()
    } catch (e) {
      console.error('Failed to send message:', e)
      setSendError(e?.message || 'Could not send message')
    } finally {
      setSending(false)
    }
  }

  const refreshAll = useCallback(() => {
    loadUsers()
    if (selectedUser) loadMessages()
  }, [loadUsers, loadMessages, selectedUser])

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.firstName || '').toLowerCase().includes(q) ||
      (u.lastName || '').toLowerCase().includes(q)
    )
  })

  const listAvatarClass =
    'bg-gradient-to-br from-orange-500 to-pink-500 text-white border-0 shadow-sm ring-0 font-semibold'

  return (
    <div className="min-h-full space-y-6 bg-gray-50/80 p-4 md:p-6">
      <PMPageHeader
        title="Messages"
        subtitle="Direct messages with people in your workspace — updates every few seconds while a chat is open."
        breadcrumb={[
          { label: 'Dashboard', href: '/' },
          { label: 'Messages', href: '/message' },
        ]}
        showProfile
      >
        <PMRowActions
          items={[
            { label: 'Refresh', icon: RefreshCw, onClick: refreshAll },
          ]}
          label="Messages actions"
        />
      </PMPageHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          compact
          title="People you can message"
          value={loading ? '…' : users.length}
          icon={Users}
          colorScheme="orange"
        />
        <KPICard
          compact
          title="Messages in this chat"
          value={selectedUser ? messages.length : '—'}
          icon={MessageSquare}
          colorScheme="orange"
        />
        <KPICard
          compact
          title="You"
          value={user?.email || user?.attributes?.email || 'Signed in'}
          icon={Mail}
          colorScheme="orange"
        />
      </div>

      <div className="flex min-h-[min(640px,calc(100vh-320px))] flex-col gap-6 lg:flex-row lg:items-stretch">
        <Card
          variant="elevated"
          padding={false}
          className="flex w-full flex-col overflow-hidden rounded-xl border border-gray-100 shadow-md lg:w-[min(100%,380px)] lg:min-w-[300px] lg:max-w-md"
        >
          <div className="border-b border-gray-100 bg-white px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Contacts</h2>
            <p className="text-xs text-gray-500">Organization directory + assignable users</p>
          </div>
          <div className="border-b border-gray-100 p-3">
            <Input
              icon={Search}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="rounded-lg border-gray-200 text-sm"
              containerClassName="mb-0"
            />
          </div>

          <div className="min-h-[280px] flex-1 overflow-y-auto bg-gray-50/30">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <LoadingSpinner size="sm" message="Loading contacts..." />
              </div>
            ) : orgError === 'no_org' ? (
              <div className="p-6">
                <EmptyState
                  icon={User}
                  title="No organization selected"
                  description="Pick an organization in the workspace header so we can load teammates and enable direct messages."
                  className="py-10"
                />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Users}
                  title={searchQuery ? 'No matching contacts' : 'No one to message yet'}
                  description={
                    searchQuery
                      ? 'Try a different search or clear the filter.'
                      : 'Invite teammates to your organization, or ensure your account can list users (admin may need to enable GET /users).'
                  }
                  className="py-10"
                />
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const active = selectedUser?.id === u.id
                  const subtitle = u.email && u.email !== getListDisplayName(u) ? u.email : null
                  return (
                    <li key={u.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(u)
                          setSendError(null)
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                          active
                            ? 'bg-orange-50 border-l-[3px] border-l-orange-500'
                            : 'border-l-[3px] border-l-transparent hover:bg-white'
                        }`}
                      >
                        <Avatar
                          fallback={getListUserInitials(u)}
                          alt={getListDisplayName(u)}
                          size="md"
                          className={listAvatarClass}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{getListDisplayName(u)}</p>
                          <p className="truncate text-xs text-gray-500">{subtitle || 'Team member'}</p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card
          variant="elevated"
          padding={false}
          className="flex min-h-[420px] min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 shadow-md"
        >
          {!selectedUser ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
              <EmptyState
                icon={MessageSquare}
                title="Select a conversation"
                description="Choose someone from the list to read and send direct messages. You can also open /message?with=USER_ID to jump to a peer."
                className="max-w-md py-6"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-shrink-0 items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-orange-50/90 to-white px-5 py-4">
                <Avatar
                  fallback={getListUserInitials(selectedUser)}
                  alt={getListDisplayName(selectedUser)}
                  size="md"
                  className={listAvatarClass}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{getListDisplayName(selectedUser)}</p>
                  <p className="truncate text-xs text-gray-500">
                    {selectedUser.email || 'Direct message · organization-scoped'}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-800 sm:inline-flex">
                  Live sync ~8s
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-gradient-to-b from-gray-50/80 to-white p-4 md:p-5">
                {messagesError ? (
                  <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50/80 px-3 py-2 text-sm text-red-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>{messagesError}</span>
                  </div>
                ) : null}
                {loadingMessages ? (
                  <div className="flex h-40 items-center justify-center">
                    <LoadingSpinner size="md" message="Loading messages..." />
                  </div>
                ) : messages.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="Start the conversation"
                    description={`Say hello to ${getListDisplayName(selectedUser)} — messages are private between the two of you.`}
                    className="py-10"
                  />
                ) : (
                  messages.map((msg, i) => {
                    const isOwn = String(msg.senderId) === String(currentUserId)
                    const peerLabel = isOwn
                      ? 'You'
                      : memberDisplayName(msg.sender) || getListDisplayName(selectedUser)
                    const initialsSource = isOwn ? 'You' : peerLabel
                    const initials =
                      initialsSource.length >= 2
                        ? initialsSource.slice(0, 2).toUpperCase()
                        : (initialsSource.charAt(0) || '?').toUpperCase()
                    return (
                      <div
                        key={msg.id || `m-${i}`}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar
                          fallback={initials}
                          size="sm"
                          className={
                            isOwn
                              ? 'bg-gray-200 text-gray-800'
                              : 'bg-gradient-to-br from-orange-500 to-pink-500 text-white'
                          }
                        />
                        <div className={`flex max-w-[min(100%,28rem)] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                              isOwn
                                ? 'rounded-tr-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                                : 'rounded-tl-sm border border-gray-100 bg-white text-gray-800'
                            }`}
                          >
                            <ChatMessageText
                              text={msg.content}
                              linkClassName={
                                isOwn
                                  ? 'break-all text-white underline decoration-white/50 underline-offset-2 hover:text-white'
                                  : 'break-all text-blue-600 underline decoration-blue-600/40 underline-offset-2 hover:text-blue-700'
                              }
                              mentionClassName={
                                isOwn
                                  ? 'font-semibold text-white bg-white/20 rounded px-0.5'
                                  : 'font-semibold text-orange-700 bg-orange-50/90 rounded px-0.5'
                              }
                            />
                          </div>
                          <span className="mt-1.5 text-[11px] text-gray-400">{timeAgo(msg.createdAt)}</span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex flex-shrink-0 flex-col gap-2 border-t border-gray-100 bg-white p-4">
                {sendError ? (
                  <p className="text-xs text-red-600">{sendError}</p>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="min-h-[44px] flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
                    <MentionComposer
                      textareaRef={composerRef}
                      value={newMessage}
                      onChange={setNewMessage}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      mentionUsers={dmMentionUsers}
                      disabled={sending}
                      placeholder={`Message ${getListDisplayName(selectedUser)}… (@ to mention)`}
                      textareaClassName="w-full resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                      minHeightPx={44}
                      maxHeightPx={120}
                    />
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-[42px] shrink-0 rounded-xl px-5 sm:self-end"
                    onClick={handleSendMessage}
                    disabled={sending || !newMessage.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send
                  </Button>
                </div>
                <p className="text-[11px] text-gray-400">Enter to send · type @ to mention · Shift+Enter for a new line</p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-gray-50 p-8">
          <LoadingSpinner message="Loading messages…" />
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  )
}
