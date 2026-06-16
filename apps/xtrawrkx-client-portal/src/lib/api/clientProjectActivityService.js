/**
 * Client-portal project discussion / activity (timeline + comments).
 */
import { strapiClient } from "../strapiClient";

export async function fetchClientProjectTimeline({ projectId, limit = 80, type } = {}) {
  if (projectId == null || String(projectId).trim() === "") {
    return { data: [], total: 0 };
  }

  const params = { limit };
  if (type) params.type = type;

  const idRaw = String(projectId).trim();
  const url = strapiClient.buildURL(`/projects/${encodeURIComponent(idRaw)}/client-timeline`, params);
  const res = await fetch(url, {
    method: "GET",
    headers: strapiClient.getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to load project activity");
  }

  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  const total = typeof json?.meta?.total === "number" ? json.meta.total : data.length;
  return { data, total };
}

export async function fetchClientProjectComments({ projectId, limit = 80 } = {}) {
  return fetchClientProjectTimeline({ projectId, limit, type: "comment" });
}

export async function addClientProjectComment({ projectId, comment } = {}) {
  const text = String(comment || "").trim();
  if (!text) throw new Error("Comment is required");

  const idRaw = String(projectId).trim();
  const url = strapiClient.buildURL(`/projects/${encodeURIComponent(idRaw)}/client-comment`, {});
  const res = await fetch(url, {
    method: "POST",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify({ comment: text }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to post comment");
  }

  const json = await res.json();
  return { data: json?.data ?? json };
}

export async function fetchClientProjectCommentCounts({ projectIds } = {}) {
  const ids = Array.isArray(projectIds)
    ? projectIds.map((v) => String(v).trim()).filter(Boolean)
    : [];
  if (!ids.length) return {};

  const url = strapiClient.buildURL("/projects/client-comment-counts", {
    projectIds: ids.join(","),
  });
  const res = await fetch(url, {
    method: "GET",
    headers: strapiClient.getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to load comment counts");
  }

  const json = await res.json();
  return json?.data && typeof json.data === "object" ? json.data : {};
}
