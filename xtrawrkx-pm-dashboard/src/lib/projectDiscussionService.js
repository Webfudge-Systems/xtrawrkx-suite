import apiClient from "./apiClient";
import { formatDistanceToNow } from "date-fns";
import { getProjectDiscussionChannels } from "./projectDiscussionChannels";

function normalizeList(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (d?.data && Array.isArray(d.data)) return d.data;
  return [];
}

function flattenRow(raw) {
  if (!raw) return null;
  if (raw.attributes) return { id: raw.id, ...raw.attributes };
  return { ...raw };
}

export async function fetchProjectChannelMessages(clientAccountId, channelKey) {
  const id = String(clientAccountId ?? "").trim();
  if (!id) return [];
  const res = await apiClient.get(
    `/api/chat-messages/clientAccount/${encodeURIComponent(id)}`,
    { channelKey: String(channelKey) }
  );
  return normalizeList(res);
}

export async function sendProjectChannelMessage(
  clientAccountId,
  channelKey,
  messageText,
  userId
) {
  const id = String(clientAccountId ?? "").trim();
  if (!id || !userId) {
    throw new Error("Missing account or user");
  }
  return apiClient.post("/api/chat-messages", {
    data: {
      message: messageText,
      entityType: "clientAccount",
      entityId: id,
      channelKey: String(channelKey),
      createdBy: userId,
      isThreadStarter: false,
    },
  });
}

export function mapPmDiscussionMessage(raw) {
  const m = flattenRow(raw);
  if (!m) return null;
  const fromClient = m.fromClient === true;
  const authorUser = m.authorUser?.data
    ? { ...m.authorUser.data.attributes, id: m.authorUser.data.id }
    : m.authorUser;
  const authorClient = m.authorClientAccount?.data
    ? {
        ...m.authorClientAccount.data.attributes,
        id: m.authorClientAccount.data.id,
      }
    : m.authorClientAccount;

  const teamName = authorUser
    ? `${authorUser.firstName || ""} ${authorUser.lastName || ""}`.trim() ||
      "Team"
    : "Team";
  const clientName = authorClient?.companyName?.trim() || "Client";

  return {
    id: m.id,
    content: m.message || "",
    timestamp: m.createdAt || new Date().toISOString(),
    isTeam: !fromClient,
    senderName: fromClient ? clientName : teamName,
    senderInitials: fromClient
      ? clientName.charAt(0).toUpperCase()
      : (teamName.charAt(0) || "T").toUpperCase(),
  };
}

export function previewTime(iso) {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "—";
  }
}

export async function loadChannelSummaries(clientAccountId, projectId) {
  const defs = getProjectDiscussionChannels(projectId);
  const summaries = [];
  for (const ch of defs) {
    const rows = await fetchProjectChannelMessages(
      clientAccountId,
      ch.channelKey
    );
    const sorted = [...rows].sort(
      (a, b) =>
        new Date(flattenRow(a)?.createdAt || 0) -
        new Date(flattenRow(b)?.createdAt || 0)
    );
    const last = sorted[sorted.length - 1];
    const flat = flattenRow(last);
    summaries.push({
      ...ch,
      lastMessage: flat?.message?.trim() || "No messages yet",
      lastActivity: flat?.createdAt ? previewTime(flat.createdAt) : "—",
    });
  }
  return summaries;
}

export { getProjectDiscussionChannels };
