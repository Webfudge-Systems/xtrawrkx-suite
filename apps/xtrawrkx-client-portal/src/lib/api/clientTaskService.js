/**
 * Client-portal task API — list, create, and client actions.
 */
import { strapiClient } from "../strapiClient";

function flattenTask(row) {
  if (!row) return null;
  if (row.attributes) {
    return { id: row.id ?? row.documentId, documentId: row.documentId, ...row.attributes };
  }
  return { ...row };
}

export async function listTasksForClient(clientAccountId) {
  const idRaw = clientAccountId == null ? "" : String(clientAccountId).trim();
  if (!idRaw) return [];

  const url = strapiClient.buildURL("/tasks/list-for-client", {
    clientAccountId: idRaw,
    pageSize: 200,
  });

  const res = await fetch(url, {
    method: "GET",
    headers: strapiClient.getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to load tasks");
  }

  const json = await res.json();
  const rows = Array.isArray(json?.data) ? json.data : [];
  return rows.map(flattenTask).filter(Boolean);
}

export async function createClientTask(payload) {
  const url = strapiClient.buildURL("/tasks/client-create", {});
  const res = await fetch(url, {
    method: "POST",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify({ data: payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to create task");
  }

  const json = await res.json();
  return flattenTask(json?.data);
}

/** Create a subtask under a parent task visible to the client. */
export async function createClientSubtask(parentTaskId, payload) {
  if (!parentTaskId) throw new Error("Parent task is required");
  return createClientTask({
    ...payload,
    parent: parentTaskId,
  });
}

export async function clientTaskAction(taskId, action, note) {
  const url = strapiClient.buildURL(`/tasks/${taskId}/client-action`, {});
  const res = await fetch(url, {
    method: "POST",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify({ action, note }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Action failed");
  }

  const json = await res.json();
  return flattenTask(json?.data);
}

export async function getClientTask(taskId) {
  const url = strapiClient.buildURL(`/tasks/${taskId}/client-view`, {});
  const res = await fetch(url, {
    method: "GET",
    headers: strapiClient.getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Task not found");
  }

  const json = await res.json();
  return flattenTask(json?.data);
}
