/**
 * Client-portal project API — list, detail, and create.
 */
import { strapiClient } from "../strapiClient";
import { transformClientProject } from "./clientProjectTransform";

function flattenProject(row) {
  if (!row) return null;
  if (row.attributes) {
    return { id: row.id ?? row.documentId, documentId: row.documentId, ...row.attributes };
  }
  return { ...row };
}

export async function listProjectsForClient(clientAccountId) {
  const idRaw = clientAccountId == null ? "" : String(clientAccountId).trim();
  if (!idRaw) return [];

  const url = strapiClient.buildURL("/projects/list-for-client", {
    clientAccountId: idRaw,
    pageSize: 200,
  });

  const res = await fetch(url, {
    method: "GET",
    headers: strapiClient.getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to load projects");
  }

  const json = await res.json();
  const rows = Array.isArray(json?.data) ? json.data : [];
  return rows.map(flattenProject).filter(Boolean).map(transformClientProject).filter(Boolean);
}

export async function getProjectForClient(projectIdOrSlug) {
  const idRaw = projectIdOrSlug == null ? "" : String(projectIdOrSlug).trim();
  if (!idRaw) throw new Error("Project id is required");

  const url = strapiClient.buildURL(`/projects/get-for-client/${encodeURIComponent(idRaw)}`, {});
  const res = await fetch(url, {
    method: "GET",
    headers: strapiClient.getHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to load project");
  }

  const json = await res.json();
  return transformClientProject(json?.data);
}

export async function createClientProject(payload) {
  const url = strapiClient.buildURL("/projects/client-create", {});
  const res = await fetch(url, {
    method: "POST",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify({ data: payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Failed to create project");
  }

  const json = await res.json();
  return transformClientProject(json?.data);
}
