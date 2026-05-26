/**
 * Client-portal chat backed by Strapi chat-messages (per client account + optional channelKey).
 */

import { strapiClient } from "../strapiClient";
import { formatDistanceToNow } from "date-fns";

export function readLastReadTs(accountId, channelKey) {
  if (typeof window === "undefined") return 0;
  const key = `portal_chat_read:${String(accountId)}:${channelKey}`;
  const raw = localStorage.getItem(key);
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

export function writeLastReadNow(accountId, channelKey) {
  if (typeof window === "undefined") return;
  const key = `portal_chat_read:${String(accountId)}:${channelKey}`;
  localStorage.setItem(key, new Date().toISOString());
}

/** Cursor for the unified “Xtrawrkx Support” inbox (support + program channels). */
export function readLastReadTsSupportInbox(accountId) {
  if (typeof window === "undefined") return 0;
  const k = `portal_chat_read_support_inbox:${String(accountId)}`;
  const raw = localStorage.getItem(k);
  if (!raw) return readLastReadTs(accountId, "");
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : readLastReadTs(accountId, "");
}

export function writeLastReadNowSupportInbox(accountId) {
  if (typeof window === "undefined") return;
  const k = `portal_chat_read_support_inbox:${String(accountId)}`;
  localStorage.setItem(k, new Date().toISOString());
}

function normalizeChatListPayload(res) {
  if (!res) return [];
  const d = res.data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object" && Array.isArray(d.data)) return d.data;
  return [];
}

function flattenStrapiEntity(row) {
  if (!row) return null;
  if (row.attributes) {
    return { id: row.id ?? row.documentId, ...row.attributes };
  }
  return { ...row };
}

function flattenStrapiRelation(rel) {
  if (rel == null) return null;
  if (rel.data != null) {
    const inner = Array.isArray(rel.data) ? rel.data[0] : rel.data;
    if (!inner) return null;
    const attrs = inner.attributes || inner;
    return { id: inner.id ?? attrs.id, documentId: inner.documentId, ...attrs };
  }
  if (typeof rel === "object" && (rel.id != null || rel.documentId != null)) {
    return rel;
  }
  return null;
}

function relationId(rel) {
  if (rel == null) return null;
  const flat = flattenStrapiRelation(rel);
  if (flat) return flat.id ?? flat.documentId ?? null;
  if (typeof rel === "object") return rel.id ?? rel.documentId ?? null;
  return rel;
}

function extractMediaUrl(media) {
  if (!media) return null;
  if (typeof media === "string") return media;
  const direct = media.url || media.formats?.thumbnail?.url;
  if (direct) return direct;
  if (media.data != null) {
    const inner = Array.isArray(media.data) ? media.data[0] : media.data;
    if (!inner) return null;
    const a = inner.attributes || inner;
    return a.url || a.formats?.thumbnail?.url || null;
  }
  return null;
}

function toAbsoluteMediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (strapiClient.baseURL || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

function authorClientIsCurrentPortalUser(authorAccId, myClientAccountId) {
  if (authorAccId == null || myClientAccountId == null) return false;
  const left = String(authorAccId).trim();
  const candidates = new Set([String(myClientAccountId).trim()]);
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("client_account");
      if (raw) {
        const a = JSON.parse(raw);
        if (a.id != null && a.id !== "") candidates.add(String(a.id).trim());
        if (a.documentId) candidates.add(String(a.documentId).trim());
      }
    } catch {
      /* ignore */
    }
  }
  if (candidates.has(left)) return true;
  const nL = Number(left);
  if (Number.isFinite(nL)) {
    for (const c of candidates) {
      const nC = Number(c);
      if (Number.isFinite(nC) && nL === nC) return true;
    }
  }
  return false;
}

export function mapStrapiChatToBubble(raw, myClientAccountId) {
  const m = flattenStrapiEntity(raw);
  if (!m) return null;

  const fromClient = m.fromClient === true;
  const authorAccId = relationId(m.authorClientAccount);
  const isMine =
    fromClient &&
    authorClientIsCurrentPortalUser(authorAccId, myClientAccountId);

  const authorUser = flattenStrapiRelation(m.authorUser);
  const teamName = authorUser
    ? `${authorUser.firstName || ""} ${authorUser.lastName || ""}`.trim() ||
      "Xtrawrkx Team"
    : "Xtrawrkx Team";
  const teamAvatarUrl = authorUser
    ? toAbsoluteMediaUrl(extractMediaUrl(authorUser.avatar))
    : null;

  const acc = flattenStrapiRelation(m.authorClientAccount);
  const clientLabel = acc?.companyName?.trim() || "You";

  const chRaw = m.channelKey != null ? String(m.channelKey) : "";
  const channelTag = chRaw.startsWith("community:") ? "Program" : "Support";

  return {
    id: m.id ?? m.documentId ?? `row-${Math.random()}`,
    text: m.message || "",
    sender: isMine ? "client" : "team",
    timestamp: m.createdAt ? new Date(m.createdAt) : new Date(),
    status: "sent",
    senderName: isMine ? clientLabel : teamName,
    avatarUrl: isMine ? null : teamAvatarUrl,
    clientAvatarUrl: null,
    channelTag,
  };
}

export async function fetchChatMessages(clientAccountId, channelKey = "") {
  const idRaw =
    clientAccountId == null ? "" : String(clientAccountId).trim();
  if (!idRaw) {
    return [];
  }
  const params = {};
  if (channelKey !== undefined && channelKey !== null && channelKey !== "") {
    params.channelKey = String(channelKey);
  }
  const res = await strapiClient.get(
    `/chat-messages/clientAccount/${encodeURIComponent(idRaw)}`,
    params
  );
  return normalizeChatListPayload(res);
}

/** All channels for this client account (support + program); same feed CRM uses with allChannels. */
export async function fetchAllChannelsChatMessages(clientAccountId) {
  const idRaw =
    clientAccountId == null ? "" : String(clientAccountId).trim();
  if (!idRaw) return [];
  const res = await strapiClient.get(
    `/chat-messages/clientAccount/${encodeURIComponent(idRaw)}`,
    { allChannels: "true" }
  );
  const list = normalizeChatListPayload(res);
  return [...list].sort((a, b) => rowSortTime(a) - rowSortTime(b));
}

function rowSortTime(raw) {
  const m = raw?.attributes ? { ...raw.attributes, id: raw.id } : raw;
  const t = m?.createdAt ? new Date(m.createdAt).getTime() : 0;
  return t;
}

function stableRowId(raw) {
  const m = raw?.attributes ? { ...raw.attributes, id: raw.id } : raw;
  return String(m?.id ?? m?.documentId ?? raw?.id ?? raw?.documentId ?? "");
}

/**
 * Community Discussions: show the same support thread (Messages / CRM) plus this program's channel.
 */
export async function fetchCommunityDiscussionMergedRows(
  clientAccountId,
  communityCatalogId
) {
  const idRaw =
    clientAccountId == null ? "" : String(clientAccountId).trim();
  if (!idRaw) return [];
  const communityKey = `community:${communityCatalogId}`;
  const [supportRows, communityRows] = await Promise.all([
    fetchChatMessages(idRaw, ""),
    fetchChatMessages(idRaw, communityKey),
  ]);
  const byId = new Map();
  for (const r of supportRows) {
    const id = stableRowId(r);
    if (id) byId.set(id, r);
  }
  for (const r of communityRows) {
    const id = stableRowId(r);
    if (id) byId.set(id, r);
  }
  return Array.from(byId.values()).sort(
    (a, b) => rowSortTime(a) - rowSortTime(b)
  );
}

export async function sendPortalChatMessage(
  clientAccountId,
  messageText,
  channelKey = ""
) {
  const idRaw =
    clientAccountId == null ? "" : String(clientAccountId).trim();
  if (!idRaw) {
    throw new Error("Invalid account");
  }
  const body = {
    data: {
      message: messageText,
      entityType: "clientAccount",
      entityId: idRaw,
      channelKey: channelKey != null ? String(channelKey) : "",
      isThreadStarter: false,
    },
  };
  return strapiClient.post("/chat-messages", body);
}

export function previewTime(iso) {
  if (!iso) return "";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}
