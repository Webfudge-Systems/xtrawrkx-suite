/**
 * Project discussion channels shared with PM dashboard (client-visible threads).
 * Stored on clientAccount with channelKey `project:{projectId}:client:{slug}`.
 */

export const PROJECT_DISCUSSION_CHANNELS = [
  {
    id: "general",
    slug: "general",
    name: "General Discussion",
  },
  {
    id: "updates",
    slug: "updates",
    name: "Project Updates",
  },
];

export function projectDiscussionChannelKey(projectId, slug) {
  const pid = String(projectId ?? "").trim();
  const s = String(slug ?? "general").trim();
  if (!pid) return "";
  return `project:${pid}:client:${s}`;
}

export function getProjectDiscussionChannels(projectId) {
  return PROJECT_DISCUSSION_CHANNELS.map((ch) => ({
    ...ch,
    channelKey: projectDiscussionChannelKey(projectId, ch.slug),
  }));
}
