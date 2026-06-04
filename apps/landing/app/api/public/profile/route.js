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

const clientAccountSearchPath = (email) =>
  `/client-accounts?filters[email][$eq]=${encodeURIComponent(
    email
  )}&pagination[pageSize]=1`;

const defaultProjectSearchPath = (clientAccountId) =>
  `/projects?filters[clientAccount][id][$eq]=${encodeURIComponent(
    String(clientAccountId)
  )}&pagination[pageSize]=1`;

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

const extractStrapiList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const pickRecordId = (record) => {
  if (!record || typeof record !== "object") return null;
  if (record.id != null && record.id !== "") return record.id;
  if (record.documentId != null && record.documentId !== "") return record.documentId;
  return null;
};

const pickRowAttributes = (row) => {
  if (!row || typeof row !== "object") return {};
  return row.attributes && typeof row.attributes === "object" ? row.attributes : row;
};

const normalizeOnboardingData = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return { ...value };
  }
  return {};
};

const uniqueStringList = (...items) => {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    const s = typeof item === "string" ? item.trim() : "";
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
};

const buildOnboardingData = (body, existingOnboarding = {}) => {
  const normalize = (value) => (typeof value === "string" ? value.trim() : "");
  return {
    ...normalizeOnboardingData(existingOnboarding),
    profileUid: body?.uid ?? existingOnboarding?.profileUid ?? null,
    firstName: body?.firstName ?? existingOnboarding?.firstName ?? null,
    lastName: body?.lastName ?? existingOnboarding?.lastName ?? null,
    displayName: body?.displayName ?? existingOnboarding?.displayName ?? null,
    signupCompany:
      normalize(body?.companyName) ||
      normalize(body?.company) ||
      normalize(existingOnboarding?.signupCompany) ||
      null,
    phone: normalize(body?.phone) || normalize(existingOnboarding?.phone) || null,
    companyEmail:
      normalize(body?.companyEmail) ||
      normalize(existingOnboarding?.companyEmail) ||
      null,
    companyPhone:
      normalize(body?.companyPhone) ||
      normalize(existingOnboarding?.companyPhone) ||
      null,
    companyType:
      normalize(body?.companyType) ||
      normalize(existingOnboarding?.companyType) ||
      null,
    companySubType:
      normalize(body?.companySubType) ||
      normalize(existingOnboarding?.companySubType) ||
      null,
    industry: normalize(body?.industry) || normalize(existingOnboarding?.industry) || null,
    website: normalize(body?.website) || normalize(existingOnboarding?.website) || null,
    companyDescription:
      normalize(body?.companyDescription) ||
      normalize(existingOnboarding?.companyDescription) ||
      null,
    jobTitle: normalize(body?.jobTitle) || normalize(existingOnboarding?.jobTitle) || null,
    addressLine1:
      normalize(body?.addressLine1) || normalize(existingOnboarding?.addressLine1) || null,
    addressLine2:
      normalize(body?.addressLine2) || normalize(existingOnboarding?.addressLine2) || null,
    city: normalize(body?.city) || normalize(existingOnboarding?.city) || null,
    state: normalize(body?.state) || normalize(existingOnboarding?.state) || null,
    country: normalize(body?.country) || normalize(existingOnboarding?.country) || null,
    postalCode:
      normalize(body?.postalCode) || normalize(existingOnboarding?.postalCode) || null,
    linkedin:
      normalize(body?.linkedin) || normalize(existingOnboarding?.linkedin) || null,
    xProfile:
      normalize(body?.xProfile) || normalize(existingOnboarding?.xProfile) || null,
    interests:
      normalize(body?.interests) || normalize(existingOnboarding?.interests) || null,
    lookingFor:
      normalize(body?.lookingFor) || normalize(existingOnboarding?.lookingFor) || null,
    bio: normalize(body?.bio) || normalize(existingOnboarding?.bio) || null,
    updatedFrom: "website_public_profile_sync",
  };
};

/**
 * When the website profile `company` changes, keep Strapi `client-account.companyName`
 * (and onboardingData.signupCompany) aligned so CRM + client portal show the same name.
 */
const syncWebsiteCompanyToStrapiClientAccount = async ({ body, attrs, existingId }) => {
  const incoming = String(body?.companyName || body?.company || "").trim();
  if (!incoming || !existingId) {
    return { attempted: false, ok: true, skipped: true, error: null };
  }

  const currentName = String(attrs.companyName || "").trim();
  const onboarding = buildOnboardingData(body, attrs.onboardingData);
  const signupCo = String(onboarding.signupCompany || "").trim();

  if (currentName === incoming && signupCo === incoming) {
    return { attempted: false, ok: true, skipped: true, error: null };
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const localPart = email.split("@")[0] || "user";

  const companyNameCandidates = uniqueStringList(
    incoming,
    `${incoming} (${localPart})`,
    `${incoming} · ${email}`
  );

  let lastErr = null;
  for (const companyName of companyNameCandidates) {
    const putRes = await tryRequest({
      paths: [`/client-accounts/${existingId}`],
      method: "PUT",
      body: {
        data: {
          companyName,
          onboardingData: {
            ...onboarding,
          },
        },
      },
    });

    if (putRes.ok) {
      return {
        attempted: true,
        ok: true,
        skipped: false,
        companyName,
        error: null,
      };
    }

    lastErr =
      putRes.data?.error?.message ||
      putRes.data?.error ||
      putRes.status ||
      "Update failed";

    const msg = JSON.stringify(putRes.data || {}).toLowerCase();
    const isUniqueConflict =
      putRes.status === 400 &&
      (msg.includes("unique") ||
        msg.includes("duplicate") ||
        msg.includes("already"));

    if (!isUniqueConflict) {
      return {
        attempted: true,
        ok: false,
        skipped: false,
        error: lastErr,
      };
    }
  }

  return {
    attempted: true,
    ok: false,
    skipped: false,
    error: lastErr || "Unique companyName constraint could not be satisfied.",
  };
};

/**
 * CRM list view shows companyName on line 1 and primary contact name on line 2.
 * Website signups only had client-account rows (no Contact), so line 2 was "No contact".
 */
const ensureWebsitePrimaryContact = async (body, clientAccountId) => {
  const email = String(body?.email || "").trim().toLowerCase();
  if (!email || !clientAccountId) {
    return { attempted: false, ok: false, error: "Missing email or client account id." };
  }

  const listPath = `/contacts?filters[clientAccount][id][$eq]=${encodeURIComponent(
    String(clientAccountId)
  )}&pagination[pageSize]=25`;

  const existing = await tryRequest({
    paths: [listPath],
    method: "GET",
  });

  if (!existing.ok) {
    return {
      attempted: true,
      ok: false,
      status: existing.status,
      error: existing.data?.error || "Unable to check contacts for client account.",
    };
  }

  const rows = extractStrapiList(existing.data);
  const normalized = rows.map((row) => {
    const attrs = pickRowAttributes(row);
    const id = pickRecordId(row);
    return { id, role: String(attrs.role || "").toUpperCase() };
  });

  const hasPrimary = normalized.some((r) => r.role === "PRIMARY_CONTACT");
  if (hasPrimary) {
    return { attempted: true, ok: true, status: 200, error: null };
  }

  const firstName =
    String(body?.firstName || "").trim() || email.split("@")[0] || "Member";
  // Avoid polluting CRM with placeholder last names like "User".
  // If we don't have a real lastName from the website profile, keep it empty.
  const lastName = String(body?.lastName || "").trim();
  const jobTitle = String(body?.jobTitle || "").trim();
  const phone = String(body?.phone || body?.companyPhone || "").trim();

  const createResult = await tryRequest({
    paths: ["/contacts"],
    method: "POST",
    body: {
      data: {
        firstName,
        lastName,
        email,
        role: "PRIMARY_CONTACT",
        title: jobTitle || "Website signup",
        phone: phone || null,
        clientAccount: clientAccountId,
        status: "ACTIVE",
      },
    },
  });

  if (!createResult.ok) {
    return {
      attempted: true,
      ok: false,
      status: createResult.status,
      error: createResult.data?.error || "Primary contact creation failed.",
    };
  }

  return { attempted: true, ok: true, status: createResult.status, error: null };
};

const ensureDefaultProjectForClientAccount = async ({ clientAccountId, body }) => {
  if (!clientAccountId) {
    return { attempted: false, ok: false, error: "Missing client account id." };
  }

  const existing = await tryRequest({
    paths: [defaultProjectSearchPath(clientAccountId)],
    method: "GET",
  });
  if (!existing.ok) {
    return {
      attempted: true,
      ok: false,
      status: existing.status,
      error: existing.data?.error || "Unable to check existing projects.",
    };
  }

  const existingRows = extractStrapiList(existing.data);
  if (existingRows.length > 0) {
    return { attempted: true, ok: true, skipped: true, status: 200 };
  }

  const company = String(body?.companyName || body?.company || "Client").trim();
  const firstName = String(body?.firstName || "").trim();
  const projectName = `${company} - Onboarding Project`;

  const createRes = await tryRequest({
    paths: ["/projects"],
    method: "POST",
    body: {
      data: {
        name: projectName,
        description: `Auto-created after website registration for ${firstName || company}.`,
        status: "PLANNING",
        progress: 0,
        clientAccount: clientAccountId,
      },
    },
  });

  if (!createRes.ok) {
    return {
      attempted: true,
      ok: false,
      status: createRes.status,
      error: createRes.data?.error || "Default project creation failed.",
    };
  }

  return { attempted: true, ok: true, skipped: false, status: createRes.status };
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

  // We only create/update Strapi client accounts when the website profile has a real company.
  // Otherwise we accidentally create user-based "companies" (e.g. companyName = username/email local-part).
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
    };
  }

  const existing = await tryRequest({
    paths: [clientAccountSearchPath(email)],
    method: "GET",
  });

  if (!existing.ok) {
    return {
      attempted: true,
      ok: false,
      status: existing.status,
      error:
        existing.data?.error ||
        "Unable to check existing client account before setup.",
      data: null,
    };
  }

  const existingRows = Array.isArray(existing.data?.data)
    ? existing.data.data
    : Array.isArray(existing.data)
    ? existing.data
    : [];
  if (existingRows.length > 0) {
    const first = existingRows[0];
    const attrs = first?.attributes || {};
    const existingId = pickRecordId(first);
    const primaryContactSync = await ensureWebsitePrimaryContact(body, existingId);
    const defaultProjectSync = await ensureDefaultProjectForClientAccount({
      clientAccountId: existingId,
      body,
    });

    let clientPasswordSync = null;
    const pwd = body?.initialClientPassword;
    if (existingId && pwd && String(pwd).length >= 6) {
      const pwdRes = await tryRequest({
        paths: [`/client-accounts/${existingId}`],
        method: "PUT",
        body: {
          data: {
            password: pwd,
          },
        },
      });
      clientPasswordSync = {
        attempted: true,
        ok: Boolean(pwdRes.ok),
        status: pwdRes.status,
        error: pwdRes.ok ? null : pwdRes.data?.error || "Password sync failed.",
      };
    }

    const companyNameSync = await syncWebsiteCompanyToStrapiClientAccount({
      body,
      attrs,
      existingId,
    });

    return {
      attempted: true,
      ok: true,
      status: 200,
      error: null,
      primaryContactSync,
      defaultProjectSync,
      clientPasswordSync,
      companyNameSync,
      data: {
        id: existingId,
        status: attrs.status || body?.status || "REGISTERED",
        source: attrs.source || body?.source || "ONBOARDING",
        raw: first,
      },
    };
  }

  const firstName = String(body?.firstName || "").trim();
  const lastName = String(body?.lastName || "").trim();
  const displayName = String(body?.displayName || "").trim();
  const uid = String(body?.uid || "").trim();
  const localName = email.split("@")[0] || "website-user";
  const personLine = [firstName, lastName].filter(Boolean).join(" ").trim() || displayName || localName;
  const displayCompany = companyTrimmed;
  const fallbackIndustry =
    String(body?.industry || body?.jobTitle || "").trim() || "General";

  const emailLocal = email.split("@")[0] || "user";
  // Prefer the exact company name from website profile.
  // Only add suffixes if we hit the unique `companyName` constraint in Strapi.
  const companyNameCandidates = uniqueStringList(
    companyTrimmed,
    `${companyTrimmed} (${emailLocal})`,
    uid ? `${companyTrimmed} #${uid.slice(-8)}` : null
  );

  const initialPwd = body?.initialClientPassword;
  const includePassword =
    initialPwd && typeof initialPwd === "string" && initialPwd.length >= 6;

  let createResult = null;
  let lastCreateError = null;
  for (const companyName of companyNameCandidates) {
    const accountPayload = {
      email,
      companyName,
      industry: fallbackIndustry,
      type: "CUSTOMER",
      status: "REGISTERED",
      source: "ONBOARDING",
      isActive: true,
      onboardingData: {
        ...buildOnboardingData(body),
        createdFrom: "website_public_signup",
      },
    };
    if (includePassword) {
      accountPayload.password = initialPwd;
    }

    createResult = await tryRequest({
      paths: ["/client-accounts"],
      method: "POST",
      body: {
        data: accountPayload,
      },
    });

    if (createResult.ok) {
      break;
    }

    lastCreateError = createResult.data?.error || createResult.status;
    const msg = JSON.stringify(createResult.data || {}).toLowerCase();
    const isUniqueConflict =
      createResult.status === 400 &&
      (msg.includes("unique") || msg.includes("already exists") || msg.includes("duplicate"));

    if (!isUniqueConflict) {
      break;
    }
  }

  if (!createResult?.ok) {
    return {
      attempted: true,
      ok: false,
      status: createResult?.status || 500,
      error:
        (typeof lastCreateError === "string" ? lastCreateError : null) ||
        createResult?.data?.error ||
        "Client account setup failed.",
      data: null,
      primaryContactSync: null,
    };
  }

  const created = createResult.data?.data || createResult.data;
  const attrs = created?.attributes || {};
  const newId = pickRecordId(created) ?? created?.id ?? null;
  const primaryContactSync = await ensureWebsitePrimaryContact(body, newId);
  const defaultProjectSync = await ensureDefaultProjectForClientAccount({
    clientAccountId: newId,
    body,
  });

  return {
    attempted: true,
    ok: true,
    status: createResult.status,
    error: null,
    primaryContactSync,
    defaultProjectSync,
    companyNameSync: null,
    clientPasswordSync: includePassword
      ? { attempted: true, ok: true, status: createResult.status, error: null }
      : { attempted: false, ok: true, status: null, error: null },
    data: {
      id: newId,
      status: attrs.status || "REGISTERED",
      source: attrs.source || "ONBOARDING",
      raw: created,
    },
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
