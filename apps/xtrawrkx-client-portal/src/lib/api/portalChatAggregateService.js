/**
 * Multi-location chat hub for the client portal Messages page (mirrors CRM ClientAccountChatHub).
 */
import {
  fetchChatMessages,
  sendPortalChatMessage,
} from "./portalChatService";
import {
  fetchClientTaskComments,
  addClientTaskComment,
  fetchClientTaskTimeline,
} from "./clientTaskActivityService";
import {
  fetchClientProjectComments,
  addClientProjectComment,
  fetchClientProjectTimeline,
} from "./clientProjectActivityService";

function flattenChatRow(row) {
  const attrs = row?.attributes || row;
  const id = row?.id ?? attrs?.id;
  const authorUser = attrs?.authorUser?.data?.attributes || attrs?.authorUser;
  const authorContact =
    attrs?.authorContact?.data?.attributes || attrs?.authorContact;
  const fromClient = attrs?.fromClient === true;

  let senderName = fromClient ? "You" : "Xtrawrkx Team";
  if (fromClient && authorContact) {
    const parts = [authorContact.firstName, authorContact.lastName].filter(
      Boolean
    );
    if (parts.length) senderName = parts.join(" ");
    else if (authorContact.email) senderName = authorContact.email.split("@")[0];
  } else if (!fromClient && authorUser) {
    senderName =
      [authorUser.firstName, authorUser.lastName].filter(Boolean).join(" ") ||
      authorUser.username ||
      authorUser.email?.split("@")[0] ||
      "Xtrawrkx Team";
  }

  return {
    id,
    message: attrs?.message || "",
    fromClient,
    channelKey: attrs?.channelKey || "",
    createdAt: attrs?.createdAt,
    senderName,
    authorUser,
    authorContact,
  };
}

/** Map portal chat-message row → EntityActivityPanel comment shape */
export function mapPortalChatToActivityComment(row) {
  const flat = flattenChatRow(row);
  const actor = flat.fromClient
    ? {
        id: flat.authorContact?.id
          ? `contact-${flat.authorContact.id}`
          : "client",
        username: flat.senderName || "You",
        email: flat.authorContact?.email || null,
      }
    : {
        id: flat.authorUser?.id ? `user-${flat.authorUser.id}` : "team",
        username: flat.senderName || "Xtrawrkx Team",
        email: flat.authorUser?.email || null,
      };

  return {
    id: `chat-${flat.id}`,
    action: "comment",
    createdAt: flat.createdAt,
    summary: flat.fromClient
      ? `${flat.senderName} sent a message`
      : `${flat.senderName} replied`,
    actor,
    meta: {
      comment: flat.message,
      chatMessageId: flat.id,
      fromClient: flat.fromClient,
      channelKey: flat.channelKey,
    },
  };
}

function annotateRow(row, source) {
  if (!row || !source) return row;
  const meta = row.meta && typeof row.meta === "object" ? row.meta : {};
  return {
    ...row,
    meta: {
      ...meta,
      aggregateSource: {
        type: source.entityType,
        id: source.entityId,
        label: source.label,
        section: source.section,
      },
    },
  };
}

function annotateRows(rows, source) {
  return (Array.isArray(rows) ? rows : []).map((row) =>
    annotateRow(row, source)
  );
}

/**
 * @returns {Array<{ key, label, section, entityType, entityId }>}
 */
export function buildPortalChatChannels({
  clientAccountId,
  accountName,
  tasks = [],
  projects = [],
  deals = [],
}) {
  const channels = [
    {
      key: "all",
      label: "All messages",
      section: "All",
      entityType: "client_account",
      entityId: clientAccountId,
    },
    {
      key: "account",
      label: accountName || "Account support",
      section: "Account",
      entityType: "client_account",
      entityId: clientAccountId,
    },
  ];

  for (const task of tasks) {
    if (task?.id == null) continue;
    channels.push({
      key: `task-${task.id}`,
      label: task.name || task.title || `Task ${task.id}`,
      section: "Tasks",
      entityType: "task",
      entityId: task.id,
    });
  }

  for (const project of projects) {
    if (project?.id == null) continue;
    channels.push({
      key: `project-${project.id}`,
      label: project.name || `Project ${project.id}`,
      section: "Projects",
      entityType: "project",
      entityId: project.id,
    });
  }

  for (const deal of deals) {
    if (deal?.id == null) continue;
    channels.push({
      key: `deal-${deal.id}`,
      label: deal.name || `Deal ${deal.id}`,
      section: "Deals",
      entityType: "deal",
      entityId: deal.id,
    });
  }

  return channels;
}

async function fetchChannelComments(channel, limit = 80) {
  if (!channel) return { data: [], total: 0 };

  if (channel.key === "all") {
    return fetchAllPortalChatsMerged(channel, limit);
  }

  if (channel.entityType === "client_account") {
    const rows = await fetchChatMessages(channel.entityId, "");
    const mapped = rows.map(mapPortalChatToActivityComment);
    const sliced =
      mapped.length > limit ? mapped.slice(-limit) : mapped;
    return {
      data: annotateRows(sliced, channel),
      total: mapped.length,
    };
  }

  if (channel.entityType === "task") {
    const res = await fetchClientTaskComments({
      taskId: channel.entityId,
      limit,
    });
    return {
      data: annotateRows(res.data, channel),
      total: res.total,
    };
  }

  if (channel.entityType === "project") {
    const res = await fetchClientProjectComments({
      projectId: channel.entityId,
      limit,
    });
    return {
      data: annotateRows(res.data, channel),
      total: res.total,
    };
  }

  return { data: [], total: 0 };
}

async function fetchAllPortalChatsMerged(rootChannel, limit = 120) {
  const channels = buildPortalChatChannels({
    clientAccountId: rootChannel.entityId,
    accountName: rootChannel.label,
    tasks: rootChannel._tasks || [],
    projects: rootChannel._projects || [],
    deals: rootChannel._deals || [],
  }).filter((c) => c.key !== "all");

  const parts = await Promise.all(
    channels.map(async (ch) => {
      try {
        const res = await fetchChannelComments(ch, 60);
        return res.data || [];
      } catch {
        return [];
      }
    })
  );

  const merged = parts.flat().sort((a, b) => {
    const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });

  const sliced = merged.length > limit ? merged.slice(-limit) : merged;
  return { data: sliced, total: merged.length };
}

export async function fetchPortalChatForChannel(
  channel,
  context = {},
  limit = 80
) {
  if (channel?.key === "all") {
    return fetchAllPortalChatsMerged(
      {
        ...channel,
        _tasks: context.tasks || [],
        _projects: context.projects || [],
        _deals: context.deals || [],
      },
      limit
    );
  }
  return fetchChannelComments(channel, limit);
}

export async function sendPortalChatForChannel(channel, comment) {
  const text = String(comment || "").trim();
  if (!text) throw new Error("Message is required");
  if (!channel || channel.key === "all") {
    throw new Error("Select a specific location to send a message");
  }

  if (channel.entityType === "client_account") {
    await sendPortalChatMessage(channel.entityId, text, "");
    const rows = await fetchChatMessages(channel.entityId, "");
    const last = rows[rows.length - 1];
    return {
      data: last
        ? annotateRow(mapPortalChatToActivityComment(last), channel)
        : null,
    };
  }

  if (channel.entityType === "task") {
    const res = await addClientTaskComment({
      taskId: channel.entityId,
      comment: text,
    });
    return { data: annotateRow(res?.data ?? res, channel) };
  }

  if (channel.entityType === "project") {
    const res = await addClientProjectComment({
      projectId: channel.entityId,
      comment: text,
    });
    return { data: annotateRow(res?.data ?? res, channel) };
  }

  throw new Error("Unsupported chat location");
}

export async function fetchPortalChannelTimeline(channel, limit = 60) {
  if (!channel || channel.key === "all") return { data: [], total: 0 };

  if (channel.entityType === "client_account") {
    const rows = await fetchChatMessages(channel.entityId, "");
    const data = annotateRows(
      rows.map(mapPortalChatToActivityComment),
      channel
    );
    const sliced = data.length > limit ? data.slice(-limit) : data;
    return { data: sliced, total: data.length };
  }

  if (channel.entityType === "task") {
    const res = await fetchClientTaskTimeline({
      taskId: channel.entityId,
      limit,
    });
    return {
      data: annotateRows(res.data, channel),
      total: res.total,
    };
  }

  if (channel.entityType === "project") {
    const res = await fetchClientProjectTimeline({
      projectId: channel.entityId,
      limit,
    });
    return {
      data: annotateRows(res.data, channel),
      total: res.total,
    };
  }

  return { data: [], total: 0 };
}
