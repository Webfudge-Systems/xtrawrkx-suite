import { CMS_CONFIG } from "@/src/config/cms";

const STRAPI_API_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL ||
  process.env.STRAPI_API_URL ||
  (process.env.NODE_ENV !== "production"
    ? "http://localhost:1337/api"
    : CMS_CONFIG.STRAPI_API_URL || "http://localhost:1337/api");

function buildBaseUrl() {
  return STRAPI_API_URL.endsWith("/") ? STRAPI_API_URL.slice(0, -1) : STRAPI_API_URL;
}

function landingSignupSecret() {
  return process.env.LANDING_SIGNUP_SECRET || process.env.WEBSITE_SIGNUP_SECRET || "";
}

export async function syncPortalPasswordToStrapi(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { ok: false, skipped: true, error: "Missing email or password." };
  }

  const secret = landingSignupSecret();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (secret) {
    headers["x-landing-signup-secret"] = secret;
  }

  try {
    const response = await fetch(`${buildBaseUrl()}/auth/client/sync-password`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email: normalizedEmail, password }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Strapi portal password sync failed:", data?.error?.message || response.status);
      return { ok: false, skipped: false, error: data?.error?.message || "Sync failed." };
    }

    return { ok: true, ...data };
  } catch (error) {
    console.error("Strapi portal password sync error:", error);
    return { ok: false, skipped: false, error: error.message };
  }
}
