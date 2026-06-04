import { PROJECT_DISCUSSION_CHANNELS } from "./projectDiscussionChannels";

const THREAD_NAMES = Object.fromEntries(
  PROJECT_DISCUSSION_CHANNELS.map((c) => [c.slug, c.name])
);

/** @returns {{ type: 'support'|'community'|'project'|'other', projectId?: string, slug?: string, communityId?: string, raw?: string }} */
export function parsePortalChannelKey(channelKey) {
  const raw = channelKey != null ? String(channelKey).trim() : "";
  if (!raw) return { type: "support" };
  if (raw.startsWith("community:")) {
    return { type: "community", communityId: raw.slice("community:".length) };
  }
  const match = /^project:([^:]+):client:(.+)$/.exec(raw);
  if (match) {
    return { type: "project", projectId: match[1], slug: match[2] };
  }
  return { type: "other", raw };
}

/**
 * Human-readable label for a message thread (project name, program, or support).
 * @param {string} channelKey
 * @param {{ projectNamesById?: Record<string, string>, communityNamesById?: Record<string, string> }} lookups
 */
export function resolveMessageSourceLabel(channelKey, lookups = {}) {
  const { projectNamesById = {}, communityNamesById = {} } = lookups;
  const parsed = parsePortalChannelKey(channelKey);

  if (parsed.type === "support") {
    return "General Support";
  }
  if (parsed.type === "community") {
    const id = parsed.communityId || "";
    return communityNamesById[id] || "Program Discussion";
  }
  if (parsed.type === "project") {
    const pid = parsed.projectId || "";
    const projectName =
      projectNamesById[pid] ||
      projectNamesById[String(Number(pid))] ||
      "Project";
    const thread =
      THREAD_NAMES[parsed.slug] ||
      (parsed.slug
        ? parsed.slug.charAt(0).toUpperCase() + parsed.slug.slice(1)
        : "Discussion");
    return `${projectName} · ${thread}`;
  }
  return "Support";
}

export function messageSourceType(channelKey) {
  const { type } = parsePortalChannelKey(channelKey);
  if (type === "project") return "project";
  if (type === "community") return "community";
  return "support";
}
