import { NextResponse } from "next/server";
import { CMS_CONFIG } from "@/src/config/cms";

const STRAPI_API_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  process.env.STRAPI_API_URL ||
  (process.env.NODE_ENV !== "production"
    ? "http://localhost:1337/api"
    : CMS_CONFIG.STRAPI_API_URL || "http://localhost:1337/api");

const buildBaseUrl = () =>
  STRAPI_API_URL.endsWith("/") ? STRAPI_API_URL.slice(0, -1) : STRAPI_API_URL;

const COMMUNITY_LABELS = {
  XEN: "XEN",
  XEVFIN: "XEV.FiN",
  XEVTG: "XEVTG",
  XDD: "xD&D",
};

/** Matches xtrawrkx-client-portal `communitiesCatalog` numeric ids */
const COMMUNITY_PORTAL_PAGE_ID = {
  XEN: 1,
  XEVFIN: 2,
  XEVTG: 3,
  XDD: 4,
};

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

/**
 * Strapi `client-account.find` returns a bare array; default REST uses `{ data: [...] }`.
 * Match `profile/route.js` `extractStrapiList` so lookups succeed either way.
 */
function extractStrapiList(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function parseIntegerDbId(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isInteger(value)) return value;
  const s = String(value).trim();
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) ? n : null;
}

/**
 * Strapi 5 REST may return numeric `id`, only `documentId`, or nest fields under
 * `attributes`. Treat an account as present if we have either identifier.
 */
function firstClientAccountRow(payload) {
  const rows = extractStrapiList(payload);
  if (!rows?.length) return null;
  const row = rows[0];
  if (!row || typeof row !== "object") return null;

  const attrs =
    row.attributes && typeof row.attributes === "object" ? row.attributes : {};

  const numericId =
    parseIntegerDbId(row.id) ?? parseIntegerDbId(attrs.id);

  let documentId =
    row.documentId != null && String(row.documentId).trim() !== ""
      ? String(row.documentId).trim()
      : attrs.documentId != null && String(attrs.documentId).trim() !== ""
        ? String(attrs.documentId).trim()
        : null;

  if (!documentId && numericId == null && row.id != null) {
    const sid = String(row.id).trim();
    if (sid && !/^\d+$/.test(sid)) {
      documentId = sid;
    }
  }

  if (numericId == null && !documentId) {
    return null;
  }

  const email = attrs.email ?? row.email ?? null;
  const status = attrs.status ?? row.status ?? null;
  const source = attrs.source ?? row.source ?? null;

  return {
    id: numericId ?? documentId,
    numericId,
    documentId,
    email,
    status,
    source,
    ...attrs,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to fetch community status." },
        { status: 400 }
      );
    }

    const baseUrl = buildBaseUrl();
    const emailRaw = String(email).trim();
    const emailNorm = emailRaw.toLowerCase();
    const emailCandidates = [...new Set([emailNorm, emailRaw].filter(Boolean))];

    let accountJson = null;
    let accountRes = null;

    for (const candidate of emailCandidates) {
      const accountUrl = `${baseUrl}/client-accounts?filters[email][$eq]=${encodeURIComponent(
        candidate
      )}&pagination[pageSize]=1`;
      const result = await fetchJson(accountUrl);
      accountRes = result.response;
      accountJson = result.data;

      if (!accountRes.ok) {
        return NextResponse.json(
          {
            error:
              accountJson?.error?.message ||
              accountJson?.error ||
              "Unable to load client account.",
          },
          { status: accountRes.status }
        );
      }

      if (firstClientAccountRow(accountJson)) {
        break;
      }
    }

    const clientRow = firstClientAccountRow(accountJson);

    if (!clientRow) {
      return NextResponse.json(
        {
          hasClientAccount: false,
          clientAccount: null,
          hasCommunity: false,
          memberships: [],
          communityName: "",
          communitySlug: "",
          membershipId: "",
        },
        { status: 200 }
      );
    }

    const accountId = clientRow.numericId ?? clientRow.id;
    const accountDocumentId = clientRow.documentId || null;
    const status = clientRow.status || null;
    const source = clientRow.source || null;

    const clientKey =
      accountDocumentId != null && String(accountDocumentId).trim() !== ""
        ? String(accountDocumentId).trim()
        : accountId != null && String(accountId).trim() !== ""
          ? String(accountId).trim()
          : "";

    if (!clientKey) {
      return NextResponse.json(
        {
          hasClientAccount: false,
          clientAccount: null,
          hasCommunity: false,
          memberships: [],
          communityName: "",
          communitySlug: "",
          membershipId: "",
        },
        { status: 200 }
      );
    }

    const memUrl = `${baseUrl}/community-memberships/list-for-client?clientAccountId=${encodeURIComponent(
      clientKey
    )}&status=ACTIVE&pageSize=50`;

    const { response: memRes, data: memJson } = await fetchJson(memUrl);

    const membershipRows = memRes.ok && Array.isArray(memJson?.data)
      ? memJson.data
      : [];

    const memberships = membershipRows.map((row) => {
      const a = row.attributes || {};
      const code = a.community || "";
      const portalId = COMMUNITY_PORTAL_PAGE_ID[code] ?? null;
      return {
        id: row.id,
        community: code,
        label: COMMUNITY_LABELS[code] || code,
        portalId,
        status: a.status || "ACTIVE",
        joinedAt: a.joinedAt || null,
      };
    });

    const hasCommunity = memberships.length > 0;
    const primary = memberships[0];
    const communityName = memberships
      .map((m) => m.label || m.community)
      .filter(Boolean)
      .join(", ");

    return NextResponse.json(
      {
        hasClientAccount: true,
        clientAccount: {
          id: clientRow.numericId ?? accountId,
          documentId: accountDocumentId,
          status,
          source,
          email: clientRow.email || emailRaw || emailNorm,
        },
        hasCommunity,
        memberships,
        communityName,
        communitySlug: primary?.community
          ? String(primary.community).toLowerCase()
          : "",
        membershipId: primary?.id != null ? String(primary.id) : "",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to fetch community status." },
      { status: 500 }
    );
  }
}
