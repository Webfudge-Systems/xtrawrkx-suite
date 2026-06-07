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

const profileGetPaths = (email) => [
  `/public-user-profiles/by-email?email=${encodeURIComponent(email)}`,
  `/user-profiles/by-email?email=${encodeURIComponent(email)}`,
  `/users/profile?email=${encodeURIComponent(email)}`,
];

const profileSyncPaths = () => [
  "/public-user-profiles/sync",
  "/user-profiles/sync",
  "/users/sync-profile",
];

const websiteSignupPath = "/client-accounts/website-signup";

const landingSignupSecret = () =>
  process.env.LANDING_SIGNUP_SECRET ||
  process.env.WEBSITE_SIGNUP_SECRET ||
  "";

const tryRequest = async ({ paths, method, body }) => {
  const baseUrl = buildBaseUrl();
  let lastError = null;

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    if (response.status === 404) {
      lastError = { status: 404, error: "Endpoint not found" };
      continue;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data,
      };
    }

    return {
      ok: true,
      status: response.status,
      data,
    };
  }

  return {
    ok: false,
    status: lastError?.status || 404,
    data: {
      error:
        "No compatible Strapi profile endpoint was found. Configure the expected endpoint path if it differs.",
    },
  };
};

const pickRecordId = (record) => {
  if (!record || typeof record !== "object") return null;
  if (record.id != null && record.id !== "") return record.id;
  if (record.documentId != null && record.documentId !== "") return record.documentId;
  return null;
};

const ensureClientAccount = async (body) => {
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email) {
    return {
      attempted: false,
      ok: false,
      status: 400,
      error: "Email is required for client account setup.",
      data: null,
    };
  }

  const companyTrimmed = String(body?.companyName || body?.company || "").trim();
  if (!companyTrimmed) {
    return {
      attempted: false,
      ok: true,
      status: 200,
      error: null,
      data: null,
      skipped: true,
      reason: "Missing company name on website profile.",
      primaryContactSync: null,
      companyNameSync: null,
      clientPasswordSync: null,
      defaultProjectSync: null,
    };
  }

  const baseUrl = buildBaseUrl();
  const secret = landingSignupSecret();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (secret) {
    headers["x-landing-signup-secret"] = secret;
  }

  const response = await fetch(`${baseUrl}${websiteSignupPath}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      attempted: true,
      ok: false,
      status: response.status,
      error:
        data?.error ||
        data?.clientAccountSync?.error ||
        "Client account setup failed.",
      data: null,
      primaryContactSync: data?.primaryContactSync || null,
      defaultProjectSync: data?.defaultProjectSync || null,
      clientPasswordSync: data?.clientPasswordSync || null,
      companyNameSync: data?.clientAccountSync?.companyNameSync || null,
    };
  }

  const account = data?.clientAccount || data?.data || null;
  return {
    attempted: true,
    ok: true,
    status: response.status,
    error: null,
    primaryContactSync: data?.primaryContactSync || null,
    defaultProjectSync: data?.defaultProjectSync || null,
    clientPasswordSync: data?.clientPasswordSync || null,
    companyNameSync: data?.clientAccountSync?.companyNameSync || null,
    data: account
      ? {
          id: pickRecordId(account) ?? account.id ?? null,
          status: account.status || "ACTIVE",
          source: account.source || "WEBSITE",
          organizationId: account.organizationId ?? null,
          raw: account,
        }
      : null,
  };
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to fetch the profile." },
        { status: 400 }
      );
    }

    const result = await tryRequest({
      paths: profileGetPaths(email),
      method: "GET",
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.data?.error || "Unable to fetch Strapi profile." },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to fetch Strapi profile." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (!body?.email) {
      return NextResponse.json(
        { error: "Email is required to sync the profile." },
        { status: 400 }
      );
    }

    const result = await tryRequest({
      paths: profileSyncPaths(),
      method: "POST",
      body,
    });

    const shouldEnsureClientAccount = body?.ensureClientAccount !== false;
    let clientAccountResult = null;

    if (shouldEnsureClientAccount) {
      clientAccountResult = await ensureClientAccount(body);
    }

    return NextResponse.json(
      {
        ...(result.ok ? result.data : {}),
        profileSync: {
          attempted: true,
          ok: Boolean(result.ok),
          error: result.ok
            ? null
            : result.data?.error || "Unable to sync Strapi profile.",
          status: result.status,
        },
        clientAccount: clientAccountResult?.ok ? clientAccountResult.data : null,
        clientAccountSync: {
          attempted: Boolean(clientAccountResult?.attempted),
          ok: Boolean(clientAccountResult?.ok),
          error: clientAccountResult?.ok
            ? null
            : clientAccountResult?.error ||
              (shouldEnsureClientAccount
                ? "Client account setup failed."
                : null),
          status: clientAccountResult?.status || null,
          companyNameSync: clientAccountResult?.companyNameSync ?? null,
        },
        primaryContactSync: clientAccountResult?.primaryContactSync || null,
        defaultProjectSync: clientAccountResult?.defaultProjectSync || null,
        clientPasswordSync: clientAccountResult?.clientPasswordSync || null,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Unable to sync Strapi profile." },
      { status: 500 }
    );
  }
}
