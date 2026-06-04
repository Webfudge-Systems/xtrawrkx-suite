'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@webfudge/auth'
import notificationService from './api/notificationService'

function getCurrentUserId(user) {
  if (!user) return null
  const u = user.attributes || user
  return u.id ?? user.id ?? u.documentId ?? user.documentId ?? null
}

function notificationData(n) {
  const attrs = n?.attributes || n
  return attrs?.data || n?.data || {}
}

function isUnread(n) {
  const attrs = n?.attributes || n
  return !(attrs?.isRead || attrs?.read || n?.isRead)
}

/**
 * Polls unread notification counts for Inbox vs Message sidebar badges.
 */
export function usePmSidebarBadges(pollMs = 30000) {
  const { user } = useAuth()
  const [inboxCount, setInboxCount] = useState(0)
  const [messageCount, setMessageCount] = useState(0)

  const refresh = useCallback(async () => {
    const userId = getCurrentUserId(user)
    if (!userId) {
      setInboxCount(0)
      setMessageCount(0)
      return
    }
    try {
      const list = await notificationService.getNotifications(userId, { pageSize: 100 })
      const rows = Array.isArray(list) ? list : []
      let inbox = 0
      let message = 0
      for (const n of rows) {
        if (!isUnread(n)) continue
        const data = notificationData(n)
        if (data.subjectType === 'direct_message') {
          message += 1
        } else {
          inbox += 1
        }
      }
      setInboxCount(inbox)
      setMessageCount(message)
    } catch {
      setInboxCount(0)
      setMessageCount(0)
    }
  }, [user])

  useEffect(() => {
    void refresh()
    const id = setInterval(refresh, pollMs)
    return () => clearInterval(id)
  }, [refresh, pollMs])

  return { inboxCount, messageCount, refresh }
}
