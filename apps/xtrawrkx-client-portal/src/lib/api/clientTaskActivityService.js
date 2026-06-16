/**
 * Client-portal task discussion / activity (timeline + comments).
 */
import { strapiClient } from "../strapiClient";

export async function fetchClientTaskTimeline({ taskId, limit = 80, type } = {}) {
  if (taskId == null || String(taskId).trim() === "") {
    return { data: [], total: 0 };
  }

  const params = { limit };
  if (type) params.type = type;

  const url = strapiClient.buildURL(`/tasks/${taskId}/client-timeline`, params);
  const res = await fetch(url, {
    method: "GET",
    headers: strapiClient.getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to load task activity");
  }

  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  const total = typeof json?.meta?.total === "number" ? json.meta.total : data.length;
  return { data, total };
}

export async function fetchClientTaskComments({ taskId, limit = 80 } = {}) {
  return fetchClientTaskTimeline({ taskId, limit, type: "comment" });
}

export async function addClientTaskComment({ taskId, comment } = {}) {
  const text = String(comment || "").trim();
  if (!text) throw new Error("Comment is required");

  const url = strapiClient.buildURL(`/tasks/${taskId}/client-comment`, {});
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
  const row = json?.data ?? json;
  return { data: row };
}
