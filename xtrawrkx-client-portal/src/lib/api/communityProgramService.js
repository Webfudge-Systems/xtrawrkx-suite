/**
 * Community applications and memberships in Strapi.
 *
 * Apply flow: submission only (SUBMITTED) — POC approves in CRM to activate membership.
 */

import { strapiClient } from "../strapiClient";

export const PENDING_SUBMISSION_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "PENDING_INFO",
];

export function isPendingSubmissionStatus(status) {
  return PENDING_SUBMISSION_STATUSES.includes(
    String(status || "").trim().toUpperCase()
  );
}

function apiBase() {
  return `${strapiClient.baseURL}${strapiClient.apiPath}`;
}

/** Read stored account from localStorage; prefer documentId, fall back to id. */
function resolveClientAccountId(explicitClientAccountId) {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("client_account");
      if (raw) {
        const acc = JSON.parse(raw);
        if (acc.documentId && String(acc.documentId).trim()) {
          return String(acc.documentId).trim();
        }
        if (acc.id && String(acc.id).trim()) {
          return String(acc.id).trim();
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (explicitClientAccountId != null && String(explicitClientAccountId).trim()) {
    return String(explicitClientAccountId).trim();
  }
  return null;
}

async function parseError(res) {
  const body = await res.json().catch(() => ({}));
  return (
    body?.error?.message ||
    body?.message ||
    body?.error ||
    `Request failed (${res.status})`
  );
}

/**
 * POST /api/community-submissions/join
 */
export async function submitCommunityJoinApplication({
  clientAccountId,
  communityEnum,
  requirements,
}) {
  const resolvedId = resolveClientAccountId(clientAccountId);

  const url = `${apiBase()}/community-submissions/join`;
  const res = await fetch(url, {
    method: "POST",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify({
      clientAccountId: resolvedId,
      communityEnum,
      requirements,
      submissionId: `WEB-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

/**
 * POST /api/community-memberships/ensure
 * Internal / CRM use — not called on client apply.
 */
export async function ensureCommunityMembership({
  clientAccountId,
  communityEnum,
  membershipData,
}) {
  const resolvedId = resolveClientAccountId(clientAccountId);

  const url = `${apiBase()}/community-memberships/ensure`;
  const res = await fetch(url, {
    method: "POST",
    headers: strapiClient.getHeaders(),
    body: JSON.stringify({
      clientAccountId: resolvedId,
      communityEnum,
      membershipData: membershipData || null,
    }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  return res.json();
}

/**
 * Submit application only — membership activates after POC approval in CRM.
 */
export async function joinCommunityWithRequirements(payload) {
  const { clientAccountId, communityEnum, requirements } = payload;
  return submitCommunityJoinApplication({
    clientAccountId,
    communityEnum,
    requirements,
  });
}

/**
 * GET /api/community-submissions/list-for-client
 */
export async function listSubmissionsForClient(clientAccountId) {
  const resolvedId = resolveClientAccountId(clientAccountId);
  if (!resolvedId) {
    return [];
  }

  const params = new URLSearchParams({
    clientAccountId: resolvedId,
    pageSize: "50",
  });
  const url = `${apiBase()}/community-submissions/list-for-client?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: strapiClient.getHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const json = await res.json().catch(() => ({}));
  const rows = Array.isArray(json?.data) ? json.data : [];

  return rows.map((row) => {
    const a = row.attributes || row || {};
    return {
      id: row.id || row.documentId,
      community: a.community,
      status: a.status,
      submissionId: a.submissionId,
      createdAt: a.createdAt,
    };
  });
}

/**
 * List ACTIVE memberships for a client account.
 */
export async function listActiveMembershipsForClient(clientAccountId) {
  const resolvedId = resolveClientAccountId(clientAccountId);
  if (!resolvedId) {
    return [];
  }

  const params = new URLSearchParams({
    clientAccountId: resolvedId,
    status: "ACTIVE",
    pageSize: "50",
  });
  const url = `${apiBase()}/community-memberships/list-for-client?${params.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: strapiClient.getHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }

  const json = await res.json().catch(() => ({}));
  const rows = Array.isArray(json?.data) ? json.data : [];

  return rows.map((row) => {
    const a = row.attributes || row || {};
    return {
      id: row.id || row.documentId,
      community: a.community,
      joinedAt: a.joinedAt,
    };
  });
}
