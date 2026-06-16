import strapiClient from '../strapiClient';
import { fetchClientAccountComments } from './crmActivityService';

function flattenChatRow(row) {
  const attrs = row?.attributes || row;
  const id = row?.id ?? attrs?.id;
  const authorUser = attrs?.authorUser?.data?.attributes || attrs?.authorUser;
  const authorContact = attrs?.authorContact?.data?.attributes || attrs?.authorContact;
  const fromClient = attrs?.fromClient === true;

  let senderName = fromClient ? 'Client' : 'Xtrawrkx Team';
  if (fromClient && authorContact) {
    const parts = [authorContact.firstName, authorContact.lastName].filter(Boolean);
    if (parts.length) senderName = parts.join(' ');
    else if (authorContact.email) senderName = authorContact.email.split('@')[0];
  } else if (!fromClient && authorUser) {
    senderName =
      authorUser.username ||
      [authorUser.firstName, authorUser.lastName].filter(Boolean).join(' ') ||
      authorUser.email?.split('@')[0] ||
      'Xtrawrkx Team';
  }

  return {
    id,
    message: attrs?.message || '',
    fromClient,
    channelKey: attrs?.channelKey || '',
    createdAt: attrs?.createdAt,
    senderName,
    authorUser,
    authorContact,
  };
}

/** Map portal/CRM chat row → EntityActivityPanel comment shape */
export function mapChatRowToActivityComment(row) {
  const flat = flattenChatRow(row);
  const actor = flat.fromClient
    ? {
        id: flat.authorContact?.id ? `contact-${flat.authorContact.id}` : 'client',
        username: flat.senderName || 'Client',
        email: flat.authorContact?.email || null,
      }
    : {
        id: flat.authorUser?.id ? `user-${flat.authorUser.id}` : 'team',
        username: flat.senderName || 'Xtrawrkx Team',
        email: flat.authorUser?.email || null,
      };

  return {
    id: `chat-${flat.id}`,
    action: 'comment',
    createdAt: flat.createdAt,
    summary: flat.fromClient ? `${flat.senderName} sent a message` : `${flat.senderName} replied`,
    actor,
    meta: {
      comment: flat.message,
      chatMessageId: flat.id,
      fromClient: flat.fromClient,
      channelKey: flat.channelKey,
    },
  };
}

export async function fetchClientChatMessages(clientAccountId) {
  const res = await strapiClient.get('/chat-messages', { clientAccountId });
  const rows = Array.isArray(res?.data) ? res.data : [];
  return rows.map(flattenChatRow);
}

/**
 * Unified client-account chat thread for EntityActivityPanel (portal + CRM).
 * Merges chat-messages with legacy CRM comment activities, deduped by chatMessageId.
 */
export async function fetchClientAccountUnifiedChat({ clientAccountId, limit = 80 } = {}) {
  if (clientAccountId == null || String(clientAccountId).trim() === '') {
    return { data: [], total: 0 };
  }

  const [chatRes, crmRes] = await Promise.all([
    strapiClient.get('/chat-messages', { clientAccountId }),
    fetchClientAccountComments({ clientAccountId, limit }),
  ]);

  const chatRows = Array.isArray(chatRes?.data) ? chatRes.data : [];
  const chatActivity = chatRows.map(mapChatRowToActivityComment);
  const chatIds = new Set(
    chatActivity.map((r) => r.meta?.chatMessageId).filter((id) => id != null)
  );

  const legacyCrm = (crmRes?.data || []).filter((row) => {
    const linkedChatId = row?.meta?.chatMessageId;
    return linkedChatId == null || !chatIds.has(linkedChatId);
  });

  const merged = [...legacyCrm, ...chatActivity].sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

  const sliced = merged.length > limit ? merged.slice(-limit) : merged;
  return { data: sliced, total: merged.length };
}

export async function sendClientChatMessage(clientAccountId, message) {
  const res = await strapiClient.post('/chat-messages', {
    data: {
      message,
      entityType: 'clientAccount',
      entityId: String(clientAccountId),
      channelKey: '',
    },
  });
  const row = res?.data ?? res;
  return { data: mapChatRowToActivityComment(row) };
}

/** Alias for EntityActivityPanel addCommentFn */
export async function sendClientAccountUnifiedChat({ clientAccountId, comment } = {}) {
  const text = String(comment || '').trim();
  if (!text) throw new Error('Message is required');
  return sendClientChatMessage(clientAccountId, text);
}
